import { z } from 'zod';

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
