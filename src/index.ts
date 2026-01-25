import * as path from 'path';
import { fetchTrending, validateRepos } from './scraper';
import { saveToJson } from './utils';
import { renderCards } from './renderer/index.js';

async function main() {
  const startTime = Date.now();
  try {
    console.log('Fetching GitHub Trending repositories...');
    const repos = await fetchTrending({ limit: 10, since: 'monthly' });

    console.log('Validating data...');
    const validatedRepos = validateRepos(repos);

    const outputPath = path.join(process.cwd(), 'output', 'current_trending.json');
    saveToJson(validatedRepos, outputPath);

    console.log(`Fetched ${validatedRepos.length} trending repos`);
    console.log(`Data saved to: ${outputPath}`);

    console.log('Rendering cards...');
    const cardPaths = await renderCards(validatedRepos);
    console.log(`Generated ${cardPaths.length} cards`);
    cardPaths.forEach((cardPath) => console.log(`  - ${cardPath}`));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total execution time: ${elapsed}s`);
  } catch (error) {
    console.error('Failed to fetch trending repos:', error);
    process.exit(1);
  }
}

main();
