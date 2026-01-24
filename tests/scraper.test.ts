import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseTrendingHtml, validateRepos } from '../src/scraper';
import { TrendingRepoSchema } from '../src/types';
import { parseNumber } from '../src/utils';

describe('scraper', () => {
  let mockHtml: string;

  beforeAll(() => {
    const mockPath = path.join(__dirname, 'mock_data.html');
    mockHtml = fs.readFileSync(mockPath, 'utf-8');
  });

  describe('parseTrendingHtml', () => {
    it('should parse exactly 10 repos from mock HTML', () => {
      const repos = parseTrendingHtml(mockHtml, 10);
      expect(repos).toHaveLength(10);
    });

    it('should have first repo with rank = 1', () => {
      const repos = parseTrendingHtml(mockHtml, 10);
      expect(repos[0].rank).toBe(1);
    });

    it('should have sequential ranks', () => {
      const repos = parseTrendingHtml(mockHtml, 10);
      repos.forEach((repo, index) => {
        expect(repo.rank).toBe(index + 1);
      });
    });

    it('should have non-empty owner and name for all repos', () => {
      const repos = parseTrendingHtml(mockHtml, 10);
      repos.forEach((repo) => {
        expect(repo.owner).not.toBe('');
        expect(repo.name).not.toBe('');
      });
    });

    it('should have valid GitHub URLs for all repos', () => {
      const repos = parseTrendingHtml(mockHtml, 10);
      repos.forEach((repo) => {
        expect(repo.url).toMatch(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/);
      });
    });

    it('should parse stars and forks as strings without commas', () => {
      const repos = parseTrendingHtml(mockHtml, 10);
      repos.forEach((repo) => {
        expect(repo.stars).not.toContain(',');
        expect(repo.forks).not.toContain(',');
      });
    });
  });

  describe('validateRepos', () => {
    it('should pass Zod validation for all parsed repos', () => {
      const repos = parseTrendingHtml(mockHtml, 10);
      expect(() => validateRepos(repos)).not.toThrow();
    });

    it('should validate each repo against TrendingRepoSchema', () => {
      const repos = parseTrendingHtml(mockHtml, 10);
      repos.forEach((repo) => {
        const result = TrendingRepoSchema.safeParse(repo);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('parseNumber utility', () => {
    it('should parse regular numbers', () => {
      expect(parseNumber('123')).toBe(123);
      expect(parseNumber('1,234')).toBe(1234);
    });

    it('should parse numbers with k suffix', () => {
      expect(parseNumber('12.5k')).toBe(12500);
      expect(parseNumber('1K')).toBe(1000);
    });

    it('should handle whitespace', () => {
      expect(parseNumber('  123  ')).toBe(123);
    });

    it('should return 0 for invalid input', () => {
      expect(parseNumber('')).toBe(0);
      expect(parseNumber('abc')).toBe(0);
    });
  });
});
