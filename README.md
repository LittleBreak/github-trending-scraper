# Github Trending Scraper

An automated pipeline that scrapes GitHub Trending repositories, renders them as visual card images, and generates Xiaohongshu (小红书) social media content using LLM.

## Core Function

The project automates the entire workflow from data collection to content generation:

1. **Scrape** - Fetches GitHub Trending page and extracts repository data
2. **Validate** - Validates data integrity using Zod schemas
3. **Render** - Generates visually appealing PNG cards using Playwright
4. **Generate** - Creates Xiaohongshu-style post text using Google Gemini API

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js + TypeScript |
| Scraper | Axios + Cheerio |
| Renderer | Playwright (Chromium) |
| LLM | Google Gemini API |
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
│   └── llm/
│       ├── gemini-generator.ts  # Gemini API integration
│       ├── prompts.ts           # Prompt builders
│       └── system-prompt.md     # System prompt template
├── output/                   # Generated output files
│   ├── current_trending.json # Scraped data
│   ├── cards/                # Generated PNG cards
│   └── post.txt              # Generated post text
├── tests/                    # Test files
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

## Automation

A GitHub Actions workflow runs every Monday at 00:00 UTC to:
1. Fetch the latest trending repositories
2. Generate new card images
3. Generate Xiaohongshu post text
4. Auto-commit the results to the repository

Manual trigger is also available via `workflow_dispatch`.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=LittleBreak/github-trending-scraper&type=date&legend=top-left)](https://www.star-history.com/#LittleBreak/github-trending-scraper&type=date&legend=top-left)


## Share

如果大家对具体生成的小红书文章感兴趣，可以去关注我的小红书账号，看下实际效果～

小红书文章: [GitHub 本月最火 Top10，AI Coding 霸榜！](https://www.xiaohongshu.com/discovery/item/6976204a000000000b0100ff?source=webshare&xhsshare=pc_web&xsec_token=ABtsM9pwf4mv56dzPNo_fvi4-O2uqnQyr-QIzO1kLWDnk=&xsec_source=pc_share)

另外我也开放共享了卡片模板的 Stitch 项目，大家可以直接访问并做任意编辑，没任何限制,lol

stitch: [github trend card stitch card project](https://stitch.withgoogle.com/projects/12543921965028912020)

## License

MIT License