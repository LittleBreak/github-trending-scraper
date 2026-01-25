import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { CardRenderer } from '../src/renderer/card-renderer';
import type { TrendingRepo } from '../src/types';

const TEMPLATES_DIR = path.join(__dirname, '..', 'src', 'renderer', 'templates');
const PREVIEW_OUTPUT_DIR = path.join(__dirname, '..', 'output', 'template-previews');

const mockRepo: TrendingRepo = {
  rank: 1,
  owner: 'anthropics',
  name: 'claude-code',
  url: 'https://github.com/anthropics/claude-code',
  description: 'Claude Code is an agentic coding tool that lives in your terminal, understands your codebase, and helps you code faster.',
  language: 'TypeScript',
  stars: '28,456',
  forks: '2,345',
  todayStars: '+1,234 stars today',
};

describe('Template Preview Generator', () => {
  const templateFiles: string[] = [];
  const renderers: Map<string, CardRenderer> = new Map();

  beforeAll(async () => {
    // Get all template files
    const files = fs.readdirSync(TEMPLATES_DIR);
    templateFiles.push(...files.filter(f => f.endsWith('.html')));

    // Create output directory
    if (!fs.existsSync(PREVIEW_OUTPUT_DIR)) {
      fs.mkdirSync(PREVIEW_OUTPUT_DIR, { recursive: true });
    }

    // Initialize a renderer for each template
    for (const templateFile of templateFiles) {
      const templatePath = path.join(TEMPLATES_DIR, templateFile);
      const renderer = new CardRenderer(templatePath);
      await renderer.init();
      renderers.set(templateFile, renderer);
    }
  }, 60000);

  afterAll(async () => {
    // Close all renderers
    for (const renderer of renderers.values()) {
      await renderer.close();
    }
    console.log(`\n✅ All template previews generated at: ${PREVIEW_OUTPUT_DIR}`);
  });

  it('should have templates to test', () => {
    expect(templateFiles.length).toBeGreaterThan(0);
    console.log(`Found ${templateFiles.length} templates to test`);
  });

  it.each([
    'bento-grid.html',
    'blueprint.html',
    'brutalism.html',
    'circuit-board.html',
    'claymorphism.html',
    'cyberpunk.html',
    'data-dash.html',
    'default.html',
    'glassmorphism.html',
    'magazine.html',
    'manga-style.html',
    'neumorphic.html',
    'retro-pixel.html',
    'swiss-style.html',
    'terminal.html',
    'variant-1.html',
    'variant-2.html',
    'zen-minimalist.html',
  ])('should render %s template', async (templateFile) => {
    const renderer = renderers.get(templateFile);
    expect(renderer).toBeDefined();

    const templateName = templateFile.replace('.html', '');
    const outputPath = path.join(PREVIEW_OUTPUT_DIR, `${templateName}.png`);

    await renderer!.renderCard(mockRepo, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);
    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(0);

    console.log(`  ✓ ${templateName}.png`);
  }, 15000);
});
