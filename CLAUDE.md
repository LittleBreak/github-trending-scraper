# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Github Trending Scraper is an automated pipeline that scrapes GitHub Trending repositories, renders them as visual card images, and generates Xiaohongshu (小红书) social media content using LLM.

**Pipeline**: GitHub Trending HTML → Scraper (Cheerio) → JSON → Renderer (Playwright) → PNG cards → LLM (Gemini) → Post text

## Commands

```bash
# Run full pipeline (scrape + render + generate post)
pnpm start

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run single test file
pnpm vitest tests/scraper.test.ts

# Run tests matching pattern
pnpm vitest -t "should parse"
```

## Architecture

### Core Modules

- **src/scraper.ts** - Fetches and parses GitHub Trending HTML using Cheerio. Key function: `fetchTrending(options?)` returns `TrendingRepo[]`. Supports language filtering and time range (daily/weekly/monthly).
- **src/renderer/card-renderer.ts** - Converts repo data to PNG cards using Playwright. Uses `CardRenderer` class with `init()`/`close()` lifecycle. Screenshots the `#card` element at 2x scale.
- **src/llm/gemini-generator.ts** - Generates Xiaohongshu-style posts using Google Gemini API. Requires `GEMINI_API_KEY` env var.
- **src/llm/prompts.ts** - System and user prompt builders. System prompt loaded from `src/llm/system-prompt.md`.
- **src/types.ts** - TypeScript interfaces + Zod schemas for runtime validation
- **src/utils.ts** - JSON file I/O helpers (`saveToJson`, `loadFromJson`)

### Data Flow

1. `fetchTrending()` → HTTP request → Cheerio parse → `TrendingRepo[]`
2. `validateRepos()` → Zod schema validation
3. `saveToJson()` → `output/current_trending.json`
4. `CardRenderer.renderAll()` → Playwright screenshot → `output/cards/top{rank}.png`
5. `generateXiaohongshuPost()` → Gemini API → `output/post.txt`

### Templates

HTML templates in `src/renderer/templates/` (numbered 1-18). Default template is `9.html`.

Placeholders: `{{rank}}`, `{{name}}`, `{{owner}}`, `{{description}}`, `{{stars}}`, `{{forks}}`, `{{language}}`, `{{todayStars}}`, `{{firstName}}`

## Environment Variables

- `GEMINI_API_KEY` - Required for LLM post generation
- `HTTPS_PROXY`/`HTTP_PROXY` - Optional proxy for Gemini API calls

## Testing

Tests use Vitest with mock HTML data (`tests/mock_data.html`) to avoid network requests. Renderer tests manage browser lifecycle in `beforeAll`/`afterAll` hooks.

## Automation

GitHub Actions workflow (`.github/workflows/weekly-fetch.yml`) runs every Monday at 00:00 UTC, executes the pipeline, and auto-commits results to `output/`.

## Key Data Types

```typescript
interface TrendingRepo {
  rank: number
  owner: string
  name: string
  url: string
  description: string
  language: string
  stars: string
  forks: string
  todayStars: string
}

interface TrendingOptions {
  language?: string   // e.g., 'typescript', 'python'
  since?: 'daily' | 'weekly' | 'monthly'
  limit?: number      // default 10
}
```
