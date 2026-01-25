# Red Book Content Factory

An automated pipeline that scrapes GitHub Trending repositories and transforms them into visual card images optimized for Xiaohongshu (小红书) social media content.

## Core Function

The project automates the entire workflow from data collection to content generation:

1. **Scrape** - Fetches GitHub Trending page and extracts repository data
2. **Validate** - Validates data integrity using Zod schemas
3. **Render** - Generates visually appealing PNG cards using Playwright

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js + TypeScript |
| Scraper | Axios + Cheerio |
| Renderer | Playwright (Chromium) |
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
│   └── renderer/
│       ├── index.ts          # Renderer exports
│       ├── card-renderer.ts  # Card rendering logic
│       └── templates/        # HTML card templates
├── data/                     # Scraped JSON data
├── output/cards/             # Generated PNG cards
├── tests/                    # Test files
└── .github/workflows/        # GitHub Actions automation
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Run full pipeline (scrape + render)
pnpm start

# Run renderer only (uses existing data)
pnpm render

# Run tests
pnpm test
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
   JSON Storage (data/current_trending.json)
        ↓
   Playwright Renderer
        ↓
   PNG Cards (1080x1440px, 3:4 ratio)
```

## Output

Each card displays:
- Repository rank
- Owner and name
- Description
- Primary language (with color indicator)
- Star and fork counts
- Today's star growth

Cards are saved to `output/cards/` with naming format: `top{rank}.png`

## Automation

A GitHub Actions workflow runs every Monday at 00:00 UTC to:
1. Fetch the latest trending repositories
2. Generate new card images
3. Auto-commit the results to the repository

Manual trigger is also available via `workflow_dispatch`.

## License

ISC
