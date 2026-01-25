import * as path from 'path';
import { fetchTrending, validateRepos } from './scraper';
import { saveToJson } from './utils';
import { renderCards } from './renderer/index.js';

async function main() {
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
  } catch (error) {
    console.error('Failed to fetch trending repos:', error);
    process.exit(1);
  }
}

main();
