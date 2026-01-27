# 从 GitHub Trending 到社交媒体：一套 AI 驱动的内容自动化流水线

> 一套从 GitHub Trending 数据采集到图文内容全自动生成的端到端流水线

## 1、起因

我在刷小红书、即刻等社交平台时，总能看到「GitHub 每周充电」「开源项目推荐」之类的技术分享帖——精美的项目卡片配上一段简洁的文案，阅读量和互动都不错。所以我就在想：这些内容的素材来源无非是 GitHub Trending，卡片和文案的结构也相对固定，能不能借助 AI 把整个流程跑起来，定时自动生成图片和文案，直接拿来发布？

## 2、项目简介

github-trending-scraper 是一个自动化内容生产流水线，它能够：

1. **抓取** GitHub Trending 页面的热门开源项目数据
2. **校验** 数据结构的完整性与合法性
3. **渲染** 精美的项目卡片图片（内置18套模板）
4. **生成** 便于社交媒体分享的文案

只需一条命令 `pnpm start`，即可完成从数据采集到内容产出的全部流程，并通过 GitHub Actions 实现每月定时执行与发布。

### 2.1 卡片模板一览

以下是项目内置的 18 套卡片模板渲染效果：

<p>
<img src="./card-previews/1.png" width="300" height="400" alt="模板 1" />
<img src="./card-previews/2.png" width="300" height="400" alt="模板 2" />
<img src="./card-previews/3.png" width="300" height="400" alt="模板 3" />
<img src="./card-previews/4.png" width="300" height="400" alt="模板 4" />
<img src="./card-previews/5.png" width="300" height="400" alt="模板 5" />
<img src="./card-previews/6.png" width="300" height="400" alt="模板 6" />
<img src="./card-previews/7.png" width="300" height="400" alt="模板 7" />
<img src="./card-previews/8.png" width="300" height="400" alt="模板 8" />
<img src="./card-previews/9.png" width="300" height="400" alt="模板 9" />
<img src="./card-previews/10.png" width="300" height="400" alt="模板 10" />
<img src="./card-previews/11.png" width="300" height="400" alt="模板 11" />
<img src="./card-previews/12.png" width="300" height="400" alt="模板 12" />
<img src="./card-previews/13.png" width="300" height="400" alt="模板 13" />
<img src="./card-previews/14.png" width="300" height="400" alt="模板 14" />
<img src="./card-previews/15.png" width="300" height="400" alt="模板 15" />
<img src="./card-previews/16.png" width="300" height="400" alt="模板 16" />
<img src="./card-previews/17.png" width="300" height="400" alt="模板 17" />
<img src="./card-previews/18.png" width="300" height="400" alt="模板 18" />
</p>

## 3、核心能力

| 能力 | 说明 |
|------|------|
| GitHub Trending 爬虫 | 支持按语言、时间维度（日/周/月）筛选，默认抓取 Top 10 |
| 数据校验 | 基于 Zod Schema 的运行时类型校验，确保数据质量 |
| 卡片渲染 | 18 套精心设计的 HTML 模板，通过 Playwright 截图生成 2x 高清 PNG |
| AI 文案生成 | 接入 Google Gemini API，流式输出技术文案 |
| 定时自动化 | GitHub Actions 每月 1 号自动执行，打包产物并创建 Release |

## 4、技术选型与考量

### 4.1 运行时与语言

| 技术 | 选择 | 理由 |
|------|------|------|
| 语言 | TypeScript | 完整的类型系统，编译期捕获错误，提升代码可维护性 |
| 运行时 | Node.js (ES2022) | 丰富的 npm 生态，异步 I/O 天然适合爬虫与网络请求场景 |
| 包管理 | pnpm | 更快的安装速度，节省磁盘空间的硬链接机制 |

### 4.2 数据采集层

| 技术 | 选择 | 理由 |
|------|------|------|
| HTTP 客户端 | Axios | 成熟稳定，支持拦截器、超时控制、自动 JSON 解析 |
| HTML 解析 | Cheerio | 轻量级 jQuery 式 API，无需启动浏览器，解析速度快 |
| 数据校验 | Zod | TypeScript-first 的运行时校验库，Schema 即类型 |

**为什么不用 Puppeteer/Playwright 来爬取？**
GitHub Trending 页面是服务端渲染的静态 HTML，不涉及 JavaScript 动态加载。使用 Cheerio 解析 HTML 字符串即可，无需启动完整浏览器，资源消耗极低。

### 4.3 渲染层

| 技术 | 选择 | 理由 |
|------|------|------|
| 浏览器引擎 | Playwright (Chromium) | 跨平台一致性好，API 现代化，截图质量高 |
| 模板方案 | 原生 HTML + CSS | 设计自由度高，不依赖额外模板引擎，所见即所得 |

**为什么选择 Playwright 而非 Canvas/SVG？**
使用 HTML/CSS 模板配合浏览器截图，设计师可以直接用前端技术栈制作模板，修改样式只需调整 CSS，无需理解 Canvas API 或 SVG 规范。18 套不同风格的模板充分证明了这一方案的灵活性。

### 4.4 AI 内容生成层

| 技术 | 选择 | 理由 |
|------|------|------|
| LLM | Google Gemini (gemini-3-flash-preview) | 速度快、成本低，中文能力优秀 |
| 输出方式 | 流式生成 (Streaming) | 实时反馈，用户体验好；长文本生成不会超时 |
| Prompt 管理 | 独立 Markdown 文件 | 与代码解耦，非技术人员也能调整文案风格 |

### 4.5 测试与 CI/CD

| 技术 | 选择 | 理由 |
|------|------|------|
| 测试框架 | Vitest | 原生 ESM 支持，与 TypeScript 无缝集成，运行速度快 |
| CI/CD | GitHub Actions | 与代码仓库深度整合，支持定时触发和手动触发 |

## 5、架构设计

### 5.1 整体流水线

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  GitHub      │    │   Cheerio    │    │     Zod      │
│  Trending    │───▶│   HTML 解析   │───▶│  Schema 校验  │
│  (HTTP GET)  │    │              │    │              │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                              ┌─────▼──────┐      ┌──────▼───────┐
                              │ Playwright │      │  Gemini LLM  │
                              │ 卡片渲染    │      │  文案生成     │
                              └─────┬──────┘      └──────┬───────┘
                                    │                     │
                              ┌─────▼──────┐      ┌──────▼───────┐
                              │  PNG 图片   │      │  文案   │
                              │  (18模板)   │      │  (post.txt)  │
                              └────────────┘      └──────────────┘
```
### 5.2 自动化流程

GitHub Actions 工作流实现全自动运行：

```
每月 1 号 12:00 (北京时间)
       │
       ▼
  拉取代码 → 安装依赖 → 执行 pnpm start
       │
       ▼
  生成 JSON + PNG 卡片 + 文案
       │
       ▼
  打包为 ZIP → 创建 GitHub Release（带版本号 vYYYY.MM）
```

支持 `workflow_dispatch` 手动触发，方便临时运行。

## 6、模板是怎么来的：用 Google Stitch 批量生成卡片模板

项目内置的 18 套卡片模板，全部由 AI 生成——使用的工具是 Google Labs 推出的 **Stitch**。

### 6.1 什么是 Google Stitch

Stitch 是 Google Labs 推出的 AI 辅助 UI/UX 设计工具，核心能力是 **Text-to-UI**：输入一段自然语言描述，即可自动生成包含布局、配色、组件和交互逻辑的完整界面设计。除了文字输入，还支持草图识别和截图参考等多模态输入方式。最关键的一点：Stitch 生成的不是图片，而是**可运行的 HTML/CSS 代码**，这正好满足了本项目「HTML 模板 + Playwright 截图」的渲染方案。

### 6.2 模板生成链路

```
需求描述（Prompt）
    │
    ▼
Google Stitch（Text-to-UI）
    │
    ▼
生成可运行的 HTML/CSS 代码
    │
    ▼
AI微调样式 + 插入占位符（{{rank}}、{{name}} 等）
    │
    ▼
保存为项目模板（src/renderer/templates/1~18.html）
```

具体流程：

1. **向 Stitch 描述卡片需求**：包括用途（GitHub 项目展示卡片）、尺寸（3:4 竖版，适配社交媒体）、需要展示的信息字段（项目名、描述、Star 数等），以及期望的视觉风格（如赛博朋克、毛玻璃、极简等）
2. **Stitch 生成 HTML/CSS**：AI 自动输出完整的前端代码，包含布局结构和视觉样式
3. **AI微调与模板化**：将生成代码中的具体数据替换为占位符（`{{rank}}`、`{{name}}`、`{{stars}}` 等），并对细节样式做适当调整
4. **集成到项目**：将最终模板放入 `src/renderer/templates/` 目录，供 Playwright 渲染引擎使用

### 6.3 模板效果展示

以下是通过 Stitch 生成的部分模板预览：

![模板预览 - Cyberpunk / Bento Grid / Terminal / Neumorphic / Data Dash](./template-1.png)

![模板预览 - Swiss Style / Glassmorphism / Blueprint / Magazine / Retro Pixel](./template-2.png)

![模板预览 - Brutalism / Claymorphism / Circuit Board / Zen Minimalist / Manga](./template-3.png)

18 套模板涵盖了赛博朋克、毛玻璃、蓝图、杂志、像素风、漫画风等多种视觉风格。

## 7、项目总结

1. **端到端自动化**：一条命令完成「数据采集 → 校验 → 可视化 → AI 文案」全流程
2. **18 套精美模板**：涵盖多种视觉风格（毛玻璃、暗色、渐变等），适配小红书 3:4 图片比例
3. **Zod 运行时校验**：在 TypeScript 编译期类型检查之外，增加运行时数据保障
4. **流式 AI 生成**：基于 AsyncGenerator 的流式输出，实时反馈生成进度
5. **Prompt 工程分离**：System Prompt 独立为 Markdown 文件，便于非技术人员迭代
6. **CI/CD 全自动**：GitHub Actions 定时执行 + 自动打包发布，零人工干预
7. **轻量爬虫设计**：Cheerio 解析静态 HTML，无需启动浏览器，资源高效
8. **高清卡片渲染**：2x 设备像素比 + Playwright 截图，确保图片清晰锐利
