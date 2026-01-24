import * as fs from 'fs';
import * as path from 'path';
import type { TrendingRepo } from './types';

export function parseNumber(str: string): number {
  const cleaned = str.trim().replace(/,/g, '');
  const match = cleaned.match(/^([\d.]+)(k)?$/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  return match[2] ? Math.round(num * 1000) : num;
}

export function saveToJson(data: TrendingRepo[], filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function loadFromJson(filePath: string): TrendingRepo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as TrendingRepo[];
}
