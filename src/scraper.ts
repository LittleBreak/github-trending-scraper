import axios from 'axios';
import * as cheerio from 'cheerio';
import type { TrendingRepo, TrendingOptions } from './types';
import { TrendingRepoSchema } from './types';

const GITHUB_TRENDING_URL = 'https://github.com/trending';

export function buildTrendingUrl(options?: TrendingOptions): string {
  let url = GITHUB_TRENDING_URL;

  if (options?.language) {
    url += `/${encodeURIComponent(options.language.toLowerCase())}`;
  }

  if (options?.since) {
    url += `?since=${options.since}`;
  }

  return url;
}

export async function fetchTrending(options?: TrendingOptions): Promise<TrendingRepo[]> {
  const url = buildTrendingUrl(options);
  const limit = options?.limit ?? 10;

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });

  return parseTrendingHtml(response.data, limit);
}

export function parseTrendingHtml(html: string, limit: number = 10): TrendingRepo[] {
  const $ = cheerio.load(html);
  const repos: TrendingRepo[] = [];

  $('article.Box-row').each((index, element) => {
    if (index >= limit) return false;

    const $article = $(element);

    // Extract owner and name from href like "/owner/name"
    const titleLink = $article.find('h2 a').attr('href') || '';
    const parts = titleLink.split('/').filter(Boolean);
    const owner = parts[0] || '';
    const name = parts[1] || '';

    // Full URL
    const url = titleLink ? `https://github.com${titleLink}` : '';

    // Description
    const description = $article.find('p').first().text().trim() || '';

    // Language
    const language = $article.find('[itemprop="programmingLanguage"]').text().trim() || '';

    // Stars count
    const starsText = $article.find('a[href$="/stargazers"]').text().trim() || '0';

    // Forks count
    const forksText = $article.find('a[href$="/forks"]').text().trim() || '0';

    // Today's stars
    const todayStarsText = $article.find('span.d-inline-block.float-sm-right').text().trim() || '0 stars today';

    const repo: TrendingRepo = {
      rank: index + 1,
      owner,
      name,
      url,
      description,
      language,
      stars: starsText.replace(/,/g, ''),
      forks: forksText.replace(/,/g, ''),
      todayStars: todayStarsText.replace(' stars today', '').replace(/,/g, '').trim(),
    };

    repos.push(repo);
  });

  return repos;
}

export function validateRepos(repos: TrendingRepo[]): TrendingRepo[] {
  return repos.map((repo) => TrendingRepoSchema.parse(repo));
}
