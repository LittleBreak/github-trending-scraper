import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { CardRenderer, getLanguageColor } from '../src/renderer/card-renderer';
import type { TrendingRepo } from '../src/types';

const TEMP_DIR = path.join(__dirname, 'temp_cards');

const createMockRepo = (overrides: Partial<TrendingRepo> = {}): TrendingRepo => ({
  rank: 1,
  owner: 'test-owner',
  name: 'test-repo',
  url: 'https://github.com/test-owner/test-repo',
  description: 'A test repository for testing purposes',
  language: 'TypeScript',
  stars: '1234',
  forks: '567',
  todayStars: '+89 stars today',
  ...overrides,
});

describe('renderer', () => {
  let renderer: CardRenderer;

  beforeAll(async () => {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
    renderer = new CardRenderer();
    await renderer.init();
  });

  afterAll(async () => {
    await renderer.close();
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  });

  describe('getLanguageColor', () => {
    it('should return correct color for TypeScript', () => {
      expect(getLanguageColor('TypeScript')).toBe('#3178c6');
    });

    it('should return correct color for JavaScript', () => {
      expect(getLanguageColor('JavaScript')).toBe('#f1e05a');
    });

    it('should return correct color for Python', () => {
      expect(getLanguageColor('Python')).toBe('#3572A5');
    });

    it('should return correct color for Rust', () => {
      expect(getLanguageColor('Rust')).toBe('#dea584');
    });

    it('should return correct color for Go', () => {
      expect(getLanguageColor('Go')).toBe('#00ADD8');
    });

    it('should return default color for unknown language', () => {
      expect(getLanguageColor('UnknownLanguage')).toBe('#8b8b8b');
    });

    it('should return default color for empty string', () => {
      expect(getLanguageColor('')).toBe('#8b8b8b');
    });
  });

  describe('CardRenderer', () => {
    describe('renderCard', () => {
      it('should render a single card to PNG file', async () => {
        const mockRepo = createMockRepo();
        const outputPath = path.join(TEMP_DIR, 'single_test.png');

        const result = await renderer.renderCard(mockRepo, outputPath);

        expect(result).toBe(outputPath);
        expect(fs.existsSync(outputPath)).toBe(true);

        const stats = fs.statSync(outputPath);
        expect(stats.size).toBeGreaterThan(0);
      });

      it('should handle repo with missing description', async () => {
        const mockRepo = createMockRepo({ description: '' });
        const outputPath = path.join(TEMP_DIR, 'no_desc_test.png');

        const result = await renderer.renderCard(mockRepo, outputPath);

        expect(result).toBe(outputPath);
        expect(fs.existsSync(outputPath)).toBe(true);

        const stats = fs.statSync(outputPath);
        expect(stats.size).toBeGreaterThan(0);
      });

      it('should handle repo with special characters in name', async () => {
        const mockRepo = createMockRepo({
          name: 'test-repo_with.special<chars>',
          description: 'Description with "quotes" and <brackets>',
        });
        const outputPath = path.join(TEMP_DIR, 'special_chars_test.png');

        const result = await renderer.renderCard(mockRepo, outputPath);

        expect(result).toBe(outputPath);
        expect(fs.existsSync(outputPath)).toBe(true);
      });

      it('should create output directory if it does not exist', async () => {
        const mockRepo = createMockRepo();
        const nestedDir = path.join(TEMP_DIR, 'nested', 'subdir');
        const outputPath = path.join(nestedDir, 'nested_test.png');

        const result = await renderer.renderCard(mockRepo, outputPath);

        expect(result).toBe(outputPath);
        expect(fs.existsSync(outputPath)).toBe(true);
      });
    });

    describe('renderAll', () => {
      it('should render multiple cards to PNG files', { timeout: 30000 }, async () => {
        const mockRepos: TrendingRepo[] = [
          createMockRepo({ rank: 1, name: 'repo-one' }),
          createMockRepo({ rank: 2, name: 'repo-two' }),
          createMockRepo({ rank: 3, name: 'repo-three' }),
        ];
        const batchDir = path.join(TEMP_DIR, 'batch');

        const results = await renderer.renderAll(mockRepos, batchDir);

        expect(results).toHaveLength(3);
        expect(results[0]).toBe(path.join(batchDir, 'top1.png'));
        expect(results[1]).toBe(path.join(batchDir, 'top2.png'));
        expect(results[2]).toBe(path.join(batchDir, 'top3.png'));

        results.forEach((filePath) => {
          expect(fs.existsSync(filePath)).toBe(true);
          const stats = fs.statSync(filePath);
          expect(stats.size).toBeGreaterThan(0);
        });
      });

      it('should handle empty repos array', async () => {
        const emptyDir = path.join(TEMP_DIR, 'empty');

        const results = await renderer.renderAll([], emptyDir);

        expect(results).toHaveLength(0);
      });
    });
  });

  describe('error handling', () => {
    it('should throw error if browser is not initialized', async () => {
      const uninitializedRenderer = new CardRenderer();
      const mockRepo = createMockRepo();
      const outputPath = path.join(TEMP_DIR, 'error_test.png');

      await expect(
        uninitializedRenderer.renderCard(mockRepo, outputPath)
      ).rejects.toThrow('Browser not initialized');
    });
  });
});
