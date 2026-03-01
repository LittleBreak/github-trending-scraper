import * as fs from 'fs';
import * as path from 'path';
import { Agent, fetch as undiciFetch } from 'undici';
import type { PublishContent } from './types';

const MAX_RETRIES = 2;

const DEFAULT_MCP_URL = 'http://localhost:18060/mcp';

function getMcpUrl(): string {
  return process.env.XHS_MCP_URL || DEFAULT_MCP_URL;
}

// 直连 Agent，绕过全局代理（generate-post.ts 会设置全局 ProxyAgent）
const directAgent = new Agent();

/**
 * MCP Session 管理：Streamable HTTP 协议要求先 initialize 再调用工具
 */
let sessionId: string | null = null;

async function mcpRequest(method: string, params: Record<string, unknown> = {}, id?: number): Promise<unknown> {
  const mcpUrl = getMcpUrl();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (sessionId) {
    headers['Mcp-Session-Id'] = sessionId;
  }

  const body: Record<string, unknown> = {
    jsonrpc: '2.0',
    method,
    params,
  };
  if (id !== undefined) {
    body.id = id;
  }

  const response = await undiciFetch(mcpUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    dispatcher: directAgent,
  });

  // 保存 session ID
  const newSessionId = response.headers.get('mcp-session-id');
  if (newSessionId) {
    sessionId = newSessionId;
  }

  if (!response.ok) {
    throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
  }

  // notification 没有 response body
  if (id === undefined) {
    return null;
  }

  const result = await response.json() as { error?: { message?: string }; result?: { isError?: boolean; content?: Array<{ text?: string }> } };
  if (result.error) {
    throw new Error(`MCP tool error: ${result.error.message || JSON.stringify(result.error)}`);
  }

  // 检查 MCP 工具级别的错误（isError 字段）
  const toolResult = result.result as { isError?: boolean; content?: Array<{ text?: string }> } | undefined;
  if (toolResult?.isError) {
    const errorText = toolResult.content?.map(c => c.text).join('\n') || 'Unknown tool error';
    throw new Error(`MCP tool error: ${errorText}`);
  }

  return toolResult;
}

async function ensureSession(): Promise<void> {
  if (sessionId) return;

  // Step 1: initialize
  await mcpRequest('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'github-trending-scraper', version: '1.0.0' },
  }, 1);

  // Step 2: send initialized notification
  await mcpRequest('notifications/initialized');
}

/**
 * 调用 MCP Server 的工具方法
 */
async function callMcpTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
  await ensureSession();

  return mcpRequest('tools/call', {
    name: toolName,
    arguments: args,
  }, Date.now());
}

/**
 * 检查小红书登录状态
 */
export async function checkLoginStatus(): Promise<boolean> {
  try {
    const result = await callMcpTool('check_login_status', {}) as { content?: Array<{ text?: string }> };
    const text = result?.content?.[0]?.text || '';
    return text.includes('已登录') || text.toLowerCase().includes('logged in');
  } catch {
    return false;
  }
}

/**
 * 获取登录二维码
 */
export async function getLoginQrcode(): Promise<string> {
  const result = await callMcpTool('get_login_qrcode', {}) as { content?: Array<{ text?: string }> };
  return result?.content?.[0]?.text || '';
}

/**
 * 发布内容到小红书
 */
export async function publishToXiaohongshu(content: PublishContent): Promise<void> {
  console.log('Checking Xiaohongshu login status...');

  // 1. 检查登录状态
  const isLoggedIn = await checkLoginStatus();
  if (!isLoggedIn) {
    console.log('Not logged in. Getting QR code...');
    const qrInfo = await getLoginQrcode();
    console.log('Please scan the QR code with Xiaohongshu App to login:');
    console.log(qrInfo);
    throw new Error('Please scan QR code to login and re-run the pipeline');
  }

  console.log('Login verified. Publishing to Xiaohongshu...');

  // 2. 图片路径映射：宿主机路径 → 容器内路径
  const containerImages = content.images.map(img => {
    const filename = path.basename(img);
    return `/app/images/${filename}`;
  });

  // 3. 调用 publish_content 发布，支持重试
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retrying publish (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);
      }

      const result = await callMcpTool('publish_content', {
        title: content.title,
        content: content.content,
        images: containerImages,
        tags: content.tags,
      }) as { content?: Array<{ text?: string }> } | undefined;

      const responseText = result?.content?.map(c => c.text).join('\n') || '';
      console.log('Publish response:', responseText);

      // 验证返回内容中是否包含成功标识
      if (responseText.includes('失败') || responseText.includes('error') || responseText.includes('fail')) {
        throw new Error(`Publish returned failure: ${responseText}`);
      }

      console.log('Published to Xiaohongshu successfully!');
      return;
    } catch (error) {
      lastError = error as Error;
      console.error(`Publish attempt ${attempt + 1} failed:`, (error as Error).message);
    }
  }

  throw new Error(`Failed to publish after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

/**
 * 从 post.txt 和 cards 目录自动解析并发布到小红书
 */
export async function publishFromOutput(): Promise<void> {
  const postFile = path.join(process.cwd(), 'output', 'post.txt');
  const cardsDir = path.join(process.cwd(), 'output', 'cards');

  if (!fs.existsSync(postFile)) {
    throw new Error(`Post file not found: ${postFile}`);
  }

  const postText = fs.readFileSync(postFile, 'utf-8');
  const lines = postText.split('\n');

  // 标题：第一行文本
  const title = (lines[0] || '').trim();

  // 提取所有 #xxx 格式的标签
  const tagMatches = postText.match(/#([\u4e00-\u9fffa-zA-Z0-9_]+)/g) || [];
  const tags = tagMatches.map(tag => tag.slice(1));

  // 正文：标题之后的内容，去掉末尾标签行
  const contentLines = lines.slice(1);
  while (contentLines.length > 0) {
    const lastLine = contentLines[contentLines.length - 1].trim();
    if (lastLine === '' || /^(#[\u4e00-\u9fffa-zA-Z0-9_]+\s*)+$/.test(lastLine)) {
      contentLines.pop();
    } else {
      break;
    }
  }
  const postContent = contentLines.join('\n').trim();

  // 图片：扫描 cards 目录获取所有 top*.png 的绝对路径
  const images: string[] = [];
  if (fs.existsSync(cardsDir)) {
    const files = fs.readdirSync(cardsDir)
      .filter(f => /^top\d+\.png$/.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)![0]);
        const numB = parseInt(b.match(/\d+/)![0]);
        return numA - numB;
      });
    for (const file of files) {
      images.push(path.resolve(cardsDir, file));
    }
  }

  const content: PublishContent = { title, content: postContent, tags, images };

  console.log(`Title: ${content.title}`);
  console.log(`Content length: ${content.content.length} chars`);
  console.log(`Tags: ${content.tags.join(', ')}`);
  console.log(`Images: ${content.images.length} files`);

  await publishToXiaohongshu(content);
}
