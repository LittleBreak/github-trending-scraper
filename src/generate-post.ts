import 'dotenv/config';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import * as fs from 'fs';
import * as path from 'path';
import { loadFromJson } from './utils';
import { generateXiaohongshuPost } from './llm';

// Setup proxy for fetch if available
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}

const INPUT_FILE = path.join(process.cwd(), 'output', 'current_trending.json');
const OUTPUT_FILE = path.join(process.cwd(), 'output', 'post.txt');

export async function generatePost() {
  console.log('Loading trending data...');
  
  const repos = loadFromJson(INPUT_FILE);
  console.log(`Loaded ${repos.length} repositories`);

  console.log('Generating Xiaohongshu post...');
  const content = await generateXiaohongshuPost(repos, { maxRepos: 10 });

  fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
  console.log(`Post saved to ${OUTPUT_FILE}`);
  console.log(`the Post content is : ${content}`);


  console.log('\n--- Generated Post ---');
  console.log(content.slice(0, 500) + '...');
}

// main().catch((error) => {
//   console.error('Error generating post:', error);
//   process.exit(1);
// });
