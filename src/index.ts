import * as path from 'path';
import { fetchTrending, validateRepos } from './scraper';
import { saveToJson } from './utils';

async function main() {
  try {
    console.log('Fetching GitHub Trending repositories...');
    const repos = await fetchTrending(10);

    console.log('Validating data...');
    const validatedRepos = validateRepos(repos);

    const outputPath = path.join(process.cwd(), 'data', 'current_trending.json');
    saveToJson(validatedRepos, outputPath);

    console.log(`Fetched ${validatedRepos.length} trending repos`);
    console.log(`Data saved to: ${outputPath}`);
  } catch (error) {
    console.error('Failed to fetch trending repos:', error);
    process.exit(1);
  }
}

main();
