import { z } from 'zod';

export interface GeminiGeneratorConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
}

export interface GeneratedPost {
  title: string;
  content: string;
  tags: string[];
}

export const GeneratedPostSchema = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
});

export type GeneratedPostValidated = z.infer<typeof GeneratedPostSchema>;

export interface GeneratePostOptions {
  maxRepos?: number;
}
