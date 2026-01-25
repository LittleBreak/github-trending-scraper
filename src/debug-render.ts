/**
 * 调试文件：用于单独测试 renderCard 方法
 * 运行方式: npx tsx src/debug-render.ts
 */

import * as path from 'path';
import { CardRenderer } from './renderer/card-renderer.js';
import type { TrendingRepo } from './types.js';

// 准备测试数据
const mockRepo: TrendingRepo = {
  rank: 1,
  owner: 'microsoft',
  name: 'vscode',
  url: 'https://github.com/microsoft/vscode',
  description: 'Visual Studio Code - Open Source IDE built with Electron',
  language: 'TypeScript',
  stars: '165,432',
  forks: '29,876',
  todayStars: '256 stars today',
};

async function debugRenderCard() {
  const renderer = new CardRenderer();

  try {
    console.log('🚀 初始化浏览器...');
    await renderer.init();

    const outputPath = path.join(process.cwd(), 'output', 'debug', 'debug-card.png');
    console.log(`📸 渲染卡片到: ${outputPath}`);

    // 在这里打断点调试 renderCard
    const result = await renderer.renderCard(mockRepo, outputPath);

    console.log(`✅ 渲染完成: ${result}`);
  } catch (error) {
    console.error('❌ 渲染失败:', error);
  } finally {
    console.log('🔚 关闭浏览器...');
    await renderer.close();
  }
}

// 执行调试
debugRenderCard();
