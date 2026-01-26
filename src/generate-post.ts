import 'dotenv/config';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import * as path from 'path';
import { loadFromJson, saveToMarkdown } from './utils';
import { generateXiaohongshuPost } from './llm';

// Setup proxy for fetch if available
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}

const INPUT_FILE = path.join(process.cwd(), 'output', 'current_trending.json');
const OUTPUT_FILE = path.join(process.cwd(), 'output', 'post.md');

async function main() {
  console.log('Loading trending data...');
  const repos = loadFromJson(INPUT_FILE);
  console.log(`Loaded ${repos.length} repositories`);

  console.log('Generating Xiaohongshu post...');
  const post = await generateXiaohongshuPost(repos, { maxRepos: 10 });

  const markdown = formatPostAsMarkdown(post);
  saveToMarkdown(markdown, OUTPUT_FILE);
  console.log(`Post saved to ${OUTPUT_FILE}`);

  console.log('\n--- Generated Post ---');
  console.log(`Title: ${post.title}`);
  console.log(`Tags: ${post.tags.join(', ')}`);
  console.log('\nContent preview:');
  console.log(post.content.slice(0, 500) + '...');
}

function formatPostAsMarkdown(post: { title: string; content: string; tags: string[] }): string {
  const lines = [
    `# ${post.title}`,
    '',
    post.content,
    '',
    '---',
    '',
    `**Tags:** ${post.tags.join(' ')}`,
  ];
  return lines.join('\n');
}

main().catch((error) => {
  console.error('Error generating post:', error);
  process.exit(1);
});
