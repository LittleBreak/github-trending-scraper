import { z } from 'zod';

// 时间范围选项
export type TimeRange = 'daily' | 'weekly' | 'monthly';

// 筛选选项接口
export interface TrendingOptions {
  language?: string;      // 语言筛选，如 'typescript', 'python'
  since?: TimeRange;      // 时间范围，默认 'daily'
  limit?: number;         // 返回数量，默认 10
}

export interface TrendingRepo {
  rank: number;
  owner: string;
  name: string;
  url: string;
  description: string;
  language: string;
  stars: string;
  forks: string;
  todayStars: string;
}

export const TrendingRepoSchema = z.object({
  rank: z.number(),
  owner: z.string(),
  name: z.string(),
  url: z.string().url(),
  description: z.string(),
  language: z.string(),
  stars: z.string(),
  forks: z.string(),
  todayStars: z.string(),
});

export type TrendingRepoValidated = z.infer<typeof TrendingRepoSchema>;
