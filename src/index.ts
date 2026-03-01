import 'dotenv/config';
import * as path from 'path';
import { fetchTrending, validateRepos } from './scraper';
import { saveToJson } from './utils';
import { renderCards } from './renderer/index.js';
import { generatePost } from './generate-post';
import { publishFromOutput } from './publisher';
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
    const templateName = process.env.TEMPLATE;
    const templatePath = templateName
      ? path.join(__dirname, 'renderer', 'templates', `${templateName}.html`)
      : undefined;
    const cardPaths = await renderCards(validatedRepos, undefined, templatePath);
    console.log(`Generated ${cardPaths.length} cards`);
    cardPaths.forEach((cardPath) => console.log(`  - ${cardPath}`));

    await generatePost();

    // 发布到小红书（通过环境变量控制，默认关闭）
    if (process.env.ENABLE_PUBLISH === 'true') {
      console.log('Publishing to Xiaohongshu...');
      try {
        await publishFromOutput();
      } catch (error) {
        console.error('Failed to publish to Xiaohongshu:', (error as Error).message);
        console.log('Skipping publish step, other outputs are still available.');
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total execution time: ${elapsed}s`);
  } catch (error) {
    console.error('Failed to fetch trending repos:', error);
    process.exit(1);
  }
}

main();
