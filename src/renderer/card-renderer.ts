import * as fs from 'fs';
import * as path from 'path';
import { chromium, Browser } from 'playwright';
import type { TrendingRepo } from '../types.js';

export class CardRenderer {
  private browser: Browser | null = null;
  private template: string;
  private templatePath: string;

  constructor(templatePath?: string) {
    this.templatePath = templatePath || path.join(__dirname, 'templates', '9.html');
    this.template = fs.readFileSync(this.templatePath, 'utf-8');
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async renderCard(repo: TrendingRepo, outputPath: string): Promise<string> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const html = this.template
      .replace(/\{\{rank\}\}/g, String(repo.rank))
      .replace(/\{\{name\}\}/g, this.escapeHtml(repo.name))
      .replace(/\{\{owner\}\}/g, this.escapeHtml(repo.owner))
      .replace(/\{\{description\}\}/g, this.escapeHtml(repo.description || 'No description'))
      .replace(/\{\{language\}\}/g, this.escapeHtml(repo.language || 'Unknown'))
      .replace(/\{\{stars\}\}/g, this.escapeHtml(repo.stars))
      .replace(/\{\{forks\}\}/g, this.escapeHtml(repo.forks))
      .replace(/\{\{firstName\}\}/g, this.escapeHtml(repo.name.charAt(0).toUpperCase()))
      .replace(/\{\{todayStars\}\}/g, this.escapeHtml(repo.todayStars));

    const context = await this.browser.newContext({
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const card = await page.$('#card');
      if (!card) {
        throw new Error('Card element not found in template');
      }

      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      await card.screenshot({ path: outputPath, type: 'png' });

      return outputPath;
    } finally {
      await page.close();
      await context.close();
    }
  }

  async renderAll(repos: TrendingRepo[], outputDir: string): Promise<string[]> {
    const outputPaths: string[] = [];

    for (const repo of repos) {
      const filename = `top${repo.rank}.png`;
      const outputPath = path.join(outputDir, filename);
      await this.renderCard(repo, outputPath);
      outputPaths.push(outputPath);
    }

    return outputPaths;
  }

  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
  }
}

export async function renderCards(repos: TrendingRepo[], outputDir?: string): Promise<string[]> {
  const renderer = new CardRenderer();
  await renderer.init();

  try {
    const dir = outputDir || path.join(process.cwd(), 'output', 'cards');
    return await renderer.renderAll(repos, dir);
  } finally {
    await renderer.close();
  }
}
