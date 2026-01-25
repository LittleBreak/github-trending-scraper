# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Red Book Content Factory is an automated pipeline that scrapes GitHub Trending repositories, renders them as visual card images, and generates Xiaohongshu (小红书) social media content.

**Pipeline**: GitHub Trending HTML → Scraper (Cheerio) → JSON → Renderer (Playwright) → PNG cards + text content

## Commands

```bash
# Run full pipeline (scrape + render)
pnpm start

# Run renderer only (uses existing output/current_trending.json)
pnpm render

# Run tests
pnpm test

# Run tests in watch mode (TDD)
pnpm test:watch
```

## Architecture

### Core Modules

- **src/scraper.ts** - Fetches and parses GitHub Trending HTML using Cheerio. Key function: `fetchTrending(options?)` returns validated `TrendingRepo[]`
- **src/renderer/card-renderer.ts** - Converts repo data to PNG cards using Playwright. Manages browser lifecycle, template substitution, and screenshot generation at 1080x1440px (3:4 ratio for Xiaohongshu)
- **src/types.ts** - TypeScript interfaces + Zod schemas for runtime validation
- **src/utils.ts** - Parsing utilities (`parseNumber` for "12.5k" → 12500) and JSON file I/O

### Data Flow

1. `fetchTrending()` → HTTP request with User-Agent → Cheerio parse
2. `validateRepos()` → Zod schema validation
3. `saveToJson()` → `output/current_trending.json`
4. `CardRenderer.render()` → Template substitution → Playwright screenshot
5. Output: `output/cards/{rank}-{owner}-{name}.png`

### Templates

- **src/renderer/templates/card.html** - Primary dark theme template
- **src/ux-template/** - 17 alternative design variants (glassmorphism, cyberpunk, terminal, etc.)

Templates use `{{variable}}` placeholders: `{{name}}`, `{{owner}}`, `{{description}}`, `{{stars}}`, `{{forks}}`, `{{language}}`, `{{languageColor}}`, `{{rank}}`

## Testing

Tests use Vitest with mock HTML data (`tests/mock_data.html`) to avoid network requests. Renderer tests manage browser lifecycle in `beforeAll`/`afterAll` hooks.

```bash
# Run single test file
pnpm vitest tests/scraper.test.ts

# Run tests matching pattern
pnpm vitest -t "should parse"
```

## Automation

GitHub Actions workflow (`.github/workflows/weekly-fetch.yml`) runs every Monday at 00:00 UTC, executes the pipeline, and auto-commits results.

## Key Data Types

```typescript
interface TrendingRepo {
  rank: number
  owner: string
  name: string
  url: string
  description: string
  language: string
  stars: string      // e.g., "12,345"
  forks: string
  todayStars: string // e.g., "500 stars today"
}
```
