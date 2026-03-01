# Github Trending Scraper

An automated pipeline that scrapes GitHub Trending repositories, renders them as visual card images, and generates Xiaohongshu (小红书) social media content using LLM.

## Core Function

The project automates the entire workflow from data collection to content generation:

1. **Scrape** - Fetches GitHub Trending page and extracts repository data
2. **Validate** - Validates data integrity using Zod schemas
3. **Render** - Generates visually appealing PNG cards using Playwright
4. **Generate** - Creates Xiaohongshu-style post text using Google Gemini API
5. **Publish** - Automatically publishes to Xiaohongshu via [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp) (optional)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js + TypeScript |
| Scraper | Axios + Cheerio |
| Renderer | Playwright (Chromium) |
| LLM | Google Gemini API |
| Publisher | xiaohongshu-mcp (Docker) |
| Validation | Zod |
| Testing | Vitest |
| Package Manager | pnpm |

## Project Structure

```
├── src/
│   ├── index.ts              # Main entry point
│   ├── scraper.ts            # GitHub Trending scraper
│   ├── types.ts              # TypeScript interfaces + Zod schemas
│   ├── utils.ts              # Utility functions
│   ├── renderer/
│   │   ├── index.ts          # Renderer exports
│   │   ├── card-renderer.ts  # Card rendering logic
│   │   └── templates/        # HTML card templates
│   ├── publisher.ts             # Xiaohongshu publish module
│   └── llm/
│       ├── gemini-generator.ts  # Gemini API integration
│       ├── prompts.ts           # Prompt builders
│       └── system-prompt.md     # System prompt template
├── output/                   # Generated output files
│   ├── current_trending.json # Scraped data
│   ├── cards/                # Generated PNG cards
│   └── post.txt              # Generated post text
├── tests/                    # Test files
├── docker-compose.yml        # xiaohongshu-mcp service
└── .github/workflows/        # GitHub Actions automation
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Run full pipeline (scrape + render + generate post)
# Uses a random card template by default
pnpm start

# Specify a card template by number (templates 1-18 available)
TEMPLATE=5 pnpm start

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Data Flow

```
GitHub Trending HTML
        ↓
   Cheerio Parser
        ↓
   TrendingRepo[]
        ↓
   Zod Validation
        ↓
   JSON Storage (output/current_trending.json)
        ↓
   Playwright Renderer
        ↓
   PNG Cards (3:4 ratio)
        ↓
   Gemini API
        ↓
   Post Text (output/post.txt)
        ↓
   xiaohongshu-mcp (optional)
        ↓
   Published to Xiaohongshu
```

## Output

**Cards** - Each card displays:
- Repository rank
- Owner and name
- Description
- Primary language (with color indicator)
- Star and fork counts
- Today's star growth

Cards are saved to `output/cards/` with naming format: `top{rank}.png`

**Post** - Xiaohongshu-style post text saved to `output/post.txt`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for post generation |
| `HTTPS_PROXY` / `HTTP_PROXY` | No | Proxy for Gemini API calls |
| `TEMPLATE` | No | Card template number (1-18). Random if not set |
| `ENABLE_PUBLISH` | No | Set to `true` to enable auto-publish to Xiaohongshu. Default `false` |
| `XHS_MCP_URL` | No | xiaohongshu-mcp server URL. Default `http://localhost:18060/mcp` |

## Publish to Xiaohongshu (Optional)

The pipeline supports auto-publishing to Xiaohongshu via [xiaohongshu-mcp](https://github.com/xpzouying/xiaohongshu-mcp). This step is disabled by default.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Step 1: Start the MCP service

```bash
docker compose up -d
```

> **Apple Silicon (M1/M2/M3) note**: `docker-compose.yml` 已配置 `platform: linux/amd64`，通过 Rosetta 模拟运行，无需额外设置。

Verify the service is running:

```bash
curl --noproxy localhost -X POST http://localhost:18060/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'
```

> **Proxy note**: 如果本机配置了 HTTP/SOCKS 代理（如 `all_proxy`），curl 验证时需加 `--noproxy localhost`。Publisher 模块内部已使用 undici 直连 Agent 绕过全局代理，无需手动配置。

### Step 2: First-time login

On the first run, the pipeline will detect that you're not logged in and display a QR code. Scan it with the Xiaohongshu App to complete login. Cookies are persisted to `data/xhs-cookies/cookies.json` and reused automatically on subsequent runs.

### Step 3: Run the full pipeline with publish

```bash
ENABLE_PUBLISH=true pnpm start
```

Or set `ENABLE_PUBLISH=true` in your `.env` file, then simply run `pnpm start`.

### Full pipeline flow

```
pnpm start
  ├── fetchTrending()        → Scrape GitHub Trending
  ├── validateRepos()        → Zod validation
  ├── saveToJson()           → output/current_trending.json
  ├── renderCards()          → output/cards/top1~10.png
  ├── generatePost()         → output/post.txt
  └── publishFromOutput()    → Parse post.txt + cards → MCP → Xiaohongshu
       ├── Check login status
       ├── Prompt QR code scan if not logged in
       └── Publish with retry (up to 3 attempts)
```

> Publish failures are caught gracefully and will not affect other pipeline outputs.

### Stop the service

```bash
docker compose down
```

## Automation

A GitHub Actions workflow runs on the 1st of each month at 12:00 Beijing time (04:00 UTC) to:
1. Fetch the latest trending repositories
2. Generate new card images
3. Generate Xiaohongshu post text
4. Package outputs as a Release zip

Manual trigger is also available via `workflow_dispatch`.

### GitHub Actions Configuration

The workflow requires the following **Secrets** and **Variables** to be configured in your repository settings (**Settings → Secrets and variables → Actions**):

**Secrets:**

| Secret | Required | Description |
|--------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for post generation |
| `XHS_COOKIES` | No | Xiaohongshu `cookies.json` content for auto-publish. Must be kept up-to-date as cookies expire |

**Variables:**

| Variable | Required | Description |
|----------|----------|-------------|
| `ENABLE_PUBLISH` | No | Set to `true` to enable auto-publish to Xiaohongshu. Default `false` |
| `TEMPLATE` | No | Card template number (1-18). Random if not set |

> **Note**: The publish step depends on Docker (available on `ubuntu-latest`) and valid Xiaohongshu cookies. Cookies may expire or be invalidated by Xiaohongshu's risk control due to data center IP addresses. If publish is not needed, leave `ENABLE_PUBLISH` unset — the scrape, render, and post generation steps will run without any extra configuration.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=LittleBreak/github-trending-scraper&type=date&legend=top-left)](https://www.star-history.com/#LittleBreak/github-trending-scraper&type=date&legend=top-left)


## Share

如果大家对具体生成的小红书文章感兴趣，可以去关注我的小红书账号，看下实际效果～

小红书文章: [GitHub 本月最火 Top10，AI Coding 霸榜！](https://www.xiaohongshu.com/discovery/item/6976204a000000000b0100ff?source=webshare&xhsshare=pc_web&xsec_token=ABtsM9pwf4mv56dzPNo_fvi4-O2uqnQyr-QIzO1kLWDnk=&xsec_source=pc_share)

另外我也开放共享了卡片模板的 Stitch 项目，大家可以直接访问并做任意编辑，没任何限制,lol

stitch: [github trend card stitch card project](https://stitch.withgoogle.com/projects/12543921965028912020)

## License

MIT License