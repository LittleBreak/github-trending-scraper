# 自动发布到小红书 — 集成计划

## 背景

当前项目已具备完整的内容生成 Pipeline：GitHub Trending 抓取 → 卡片渲染 → 文案生成。本计划旨在借助 [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) 实现最后一步：**自动发布到小红书**。

## 可行性分析

### xiaohongshu-mcp 简介

- **原理**：Go 编写的 MCP Server，通过 `go-rod` 库控制 Chrome 浏览器自动化操作小红书网页端
- **传输协议**：Streamable HTTP，监听 `http://localhost:18060/mcp`
- **认证方式**：手机扫码登录，cookie 持久化到本地文件
- **部署方式**：Docker / 预编译二进制 / 源码编译

### 核心能力

| 工具 | 说明 |
|------|------|
| `publish_content` | 发布图文笔记（标题、正文、图片、标签、定时发布、可见性、原创标记） |
| `publish_with_video` | 发布视频笔记 |
| `get_login_qrcode` | 获取登录二维码（Base64） |
| `check_login_status` | 检查登录状态 |
| `delete_cookies` | 清除 session，强制重新登录 |
| `search_feeds` | 按关键词搜索笔记 |
| `list_feeds` | 获取首页推荐 |
| `get_feed_detail` | 获取笔记详情（含互动数据和评论） |
| `user_profile` | 获取用户资料 |
| `post_comment_to_feed` | 评论笔记 |
| `reply_comment_in_feed` | 回复评论 |
| `like_feed` | 点赞/取消点赞 |
| `favorite_feed` | 收藏/取消收藏 |

### 与当前项目的契合度

当前项目输出：

```
output/
├── current_trending.json   # 结构化数据
├── cards/
│   ├── top1.png            # 卡片图片（可直接作为小红书配图）
│   ├── top2.png
│   └── ...top10.png
└── post.txt                # 小红书风格文案（含标题、正文、标签）
```

`publish_content` 接口参数：

- `title` — 标题（最多 20 字）
- `content` — 正文（最多 1000 字）
- `images` — 本地图片绝对路径数组
- `tags` — 标签数组
- `is_original` — 原创标记
- `schedule_at` — 定时发布时间
- `visibility` — 可见性设置

**结论：输出格式与发布接口完全吻合，可行性高。**

### 限制与风险

| 项目 | 说明 |
|------|------|
| 标题长度 | 最多 20 字，需从 post.txt 中提取并裁剪 |
| 正文长度 | 最多 1000 字，需截断处理 |
| 登录方式 | 手机扫码，cookie 会过期需重新登录 |
| 稳定性 | 基于浏览器自动化，小红书改版可能导致失败 |
| 发布频率 | 建议每日不超过 50 条 |
| Chrome 进程 | 已知泄漏问题（Issue #470），需定期清理 |
| 账号风险 | 项目称稳定运行超一年无封号，主要风险是违反内容政策 |

---

## 实施计划

### Phase 1: 部署 xiaohongshu-mcp 服务

**目标**：在本地通过 Docker 运行 MCP Server

1. 在项目根目录创建 `docker-compose.yml`：

```yaml
services:
  xiaohongshu-mcp:
    image: xpzouying/xiaohongshu-mcp
    container_name: xiaohongshu-mcp
    restart: unless-stopped
    init: true
    tty: true
    volumes:
      - ./data/xhs-cookies:/app/data        # cookie 持久化
      - ./output/cards:/app/images           # 挂载卡片图片目录
    environment:
      - ROD_BROWSER_BIN=/usr/bin/google-chrome
      - COOKIES_PATH=/app/data/cookies.json
    ports:
      - "18060:18060"
```

2. 启动服务：

```bash
docker compose up -d
```

3. 验证服务可用：

```bash
curl -X POST http://localhost:18060/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

### Phase 2: 扫码登录

1. 首次使用时通过 MCP 调用 `get_login_qrcode` 获取二维码
2. 用小红书 App 扫码完成登录
3. Cookie 自动持久化到 `./data/xhs-cookies/cookies.json`
4. 后续运行自动复用 cookie，过期后需重新扫码

### Phase 3: 新增发布模块

**新文件**：`src/publisher.ts`

#### 3.1 解析 post.txt

从生成的文案中提取：
- **标题**：第一行文本（去除 emoji 后截断到 20 字）
- **正文**：标题之后的内容（截断到 1000 字）
- **标签**：提取所有 `#xxx` 格式的标签

```typescript
interface PublishContent {
  title: string       // 最多 20 字
  content: string     // 最多 1000 字
  tags: string[]      // 标签列表
  images: string[]    // 图片绝对路径数组
}

function parsePostFile(postText: string): PublishContent
```

#### 3.2 调用 MCP Server

通过 HTTP 请求调用 `publish_content` 工具：

```typescript
async function publishToXiaohongshu(content: PublishContent): Promise<void> {
  // 1. 检查登录状态 (check_login_status)
  // 2. 若未登录，提示用户扫码
  // 3. 调用 publish_content 发布
  // 4. 返回发布结果
}
```

图片路径映射：
- 宿主机 `./output/cards/top1.png` → 容器内 `/app/images/top1.png`

#### 3.3 错误处理

- 登录过期：检测后提示重新扫码
- 发布失败：重试 + 日志记录
- 服务不可用：跳过发布，不影响其他 pipeline 步骤

### Phase 4: 集成到主 Pipeline

修改 `src/index.ts`，在 pipeline 末尾新增发布步骤：

```
fetchTrending → validateRepos → saveToJson → renderCards → generatePost → publishToXiaohongshu
```

通过环境变量控制：

```bash
# .env
ENABLE_PUBLISH=false          # 是否启用自动发布（默认关闭）
XHS_MCP_URL=http://localhost:18060/mcp  # MCP Server 地址
```

### Phase 5: 更新 GitHub Actions（可选）

在 `.github/workflows/weekly-fetch.yml` 中增加：

1. 启动 xiaohongshu-mcp Docker 容器（需要 Docker-in-Docker 或 service container）
2. 从 GitHub Secrets 恢复 cookie 文件
3. 设置 `ENABLE_PUBLISH=true`
4. 执行完整 pipeline

> 注意：CI 环境下 cookie 过期后无法扫码，需要手动更新 Secret。建议 CI 发布作为辅助，以本地手动触发为主。

---

## 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `docker-compose.yml` | xiaohongshu-mcp 服务编排 |
| 新增 | `src/publisher.ts` | 发布模块（解析文案 + 调用 MCP） |
| 修改 | `src/index.ts` | Pipeline 末尾添加发布步骤 |
| 修改 | `.env` | 新增 `ENABLE_PUBLISH`、`XHS_MCP_URL` |
| 修改 | `src/types.ts` | 新增 `PublishContent` 类型定义（如需要） |
| 修改 | `.github/workflows/weekly-fetch.yml` | 可选：添加发布步骤 |

## 参考链接

- [xiaohongshu-mcp GitHub](https://github.com/xpzouying/xiaohongshu-mcp)
- [MCP 协议规范](https://modelcontextprotocol.io/)
