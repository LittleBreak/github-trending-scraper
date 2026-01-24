### 1. 整体架构设计

我们将这个模块命名为 `GithubTrendingScraper`。

#### 数据流向图

```mermaid
graph LR
    A[定时触发 (GitHub Actions)] --> B[Fetcher (请求网页)]
    B --> C[Parser (HTML解析)]
    C --> D{数据清洗 & 校验}
    D -->|提取成功| E[AI Translator (可选 - 翻译简介)]
    E --> F[JSON Store (持久化存储)]
    D -->|提取失败| G[Error Reporter (通知)]

```

### 2. 技术栈选择

* **运行时**: Node.js (推荐 v20+)
* **语言**: TypeScript (强类型约束，防止抓取的数据结构混乱)
* **请求库**: `axios` 或 `got` (或者直接用 Node 18+ 原生的 `fetch`)
* **解析库**: `cheerio` (服务端最快最轻量的类 jQuery 解析库，比 Puppeteer 快得多)
* **校验库**: `zod` (这是 TypeScript 的神仙伴侣，用于运行时校验抓取的数据是否符合预期)
* **测试框架**: `Vitest` 或 `Jest` (用于践行你的 TDD 理念)

---

### 3. 详细实现流程

#### Phase 1: 类型定义 (TypeScript Interface)

先定义我们要的数据结构，这是 TS 开发的第一步。

```typescript
// types.ts
export interface TrendingRepo {
  rank: number;
  owner: string;
  name: string;
  url: string;
  description: string;
  language: string;
  stars: string; // 比如 "12.5k"，后续可转 number
  forks: string;
  todayStars: string; // "100 stars today"
}

```

#### Phase 2: 核心解析逻辑 (Parser)

这里是关键。我们需要分析 `https://github.com/trending` 的 DOM 结构。

* **容器**: `<article class="Box-row">`
* **标题**: `h2.h3.lh-condensed a` (href 属性是链接，text 是 owner/name)
* **描述**: `p.col-9`
* **语言**: `span[itemprop="programmingLanguage"]`
* **Stars**: 父级容器底部的 SVG 图标旁边的文本

**代码示例 (基于 Cheerio):**

```typescript
// scraper.ts
import * as cheerio from 'cheerio';
import axios from 'axios';
import { TrendingRepo } from './types';

const URL = 'https://github.com/trending';

export async function fetchTrending(): Promise<TrendingRepo[]> {
  // 1. 获取 HTML
  const { data: html } = await axios.get(URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...' // 伪装 User-Agent
    }
  });

  // 2. 加载 HTML
  const $ = cheerio.load(html);
  const repos: TrendingRepo[] = [];

  // 3. 遍历 DOM
  $('article.Box-row').each((index, element) => {
    if (index >= 10) return; // 只取 Top 10

    const row = $(element);
    
    // 提取相对链接，如 "/owner/repo"
    const relativeUrl = row.find('h2 a').attr('href') || '';
    const [_, owner, name] = relativeUrl.split('/');

    const repo: TrendingRepo = {
      rank: index + 1,
      owner: owner?.trim() || 'Unknown',
      name: name?.trim() || 'Unknown',
      url: `https://github.com${relativeUrl}`,
      description: row.find('p').text().trim(),
      language: row.find('[itemprop="programmingLanguage"]').text().trim(),
      // 这里的 selector 比较 trick，通常在底部信息的第一个链接里
      stars: row.find('a[href$="/stargazers"]').text().trim(),
      forks: row.find('a[href$="/forks"]').text().trim(),
      todayStars: row.find('span.d-inline-block.float-sm-right').text().trim(),
    };

    repos.push(repo);
  });

  return repos;
}

```

#### Phase 3: 引入 TDD (测试驱动开发)

既然你在学习 TDD，这个环节非常重要。由于网络请求不稳定，我们在测试时应该 **Mock** 掉 HTML 请求。

**测试思路 (Vitest 示例):**

1. **准备**: 保存一份 `github-trending.html` 文件在本地作为 Mock 数据。
2. **测试用例**:
* 应当返回 10 个条目。
* 第一名的 owner 应当不为空。
* Rank 1 的描述应当匹配 Mock 数据中的文本。



```typescript
// scraper.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchTrending } from './scraper';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('GitHub Trending Scraper', () => {
  it('should parse top 10 repos correctly', async () => {
    // 读取本地的 HTML 样本
    const mockHtml = fs.readFileSync(path.resolve(__dirname, 'mock_trending.html'), 'utf-8');
    
    // 拦截 axios 请求，返回本地 HTML
    vi.mocked(axios.get).mockResolvedValue({ data: mockHtml });

    const repos = await fetchTrending();

    expect(repos).toHaveLength(10);
    expect(repos[0].rank).toBe(1);
    expect(repos[0].name).toBeDefined();
    // 针对具体 Mock 数据的断言
    // expect(repos[0].name).toBe('expected-repo-name'); 
  });
});

```

#### Phase 4: 数据增强 (针对小红书优化)

这是让你的内容产生差异化的关键点。GitHub 的 `description` 通常是英文，而且很简短。为了发小红书，你需要中文且吸引人的文案。

**利用 AI API (OpenAI / Gemini / Claude):**

* **Input**: Repo Name + Original Description
* **Prompt**: "你是一个技术博主。请将以下 GitHub 项目介绍翻译成中文，并用一句话概括它的核心亮点，语气要吸引人，适合发小红书。项目：{name}, 描述：{desc}"
* **Output**: 更新 JSON 中的 `description_cn` 字段。

---

### 4. 自动化部署方案

为了实现“每周自动提取”，你不需要购买服务器，直接使用 **GitHub Actions**。

**workflow 文件 (`.github/workflows/weekly-fetch.yml`):**

```yaml
name: Weekly Trending Fetch

on:
  schedule:
    # 每周一早上 8 点 (UTC 时间需换算，这里是 UTC 0:00)
    - cron: '0 0 * * 1'
  workflow_dispatch: # 允许手动触发测试

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Run Scraper
        run: npm start # 执行你的 TS 脚本
        env:
            OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} # 如果用了 AI 增强
            
      - name: Commit Data # 将生成的 data.json 存回仓库
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/current_trending.json
          git commit -m "Update trending data"
          git push

```
