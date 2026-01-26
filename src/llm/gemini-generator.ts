import { GoogleGenAI } from '@google/genai';
import type { TrendingRepo } from '../types';
import type { GeminiGeneratorConfig, GeneratedPost, GeneratePostOptions } from './types';
import { GeneratedPostSchema } from './types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2048;

export class GeminiGenerator {
  private client: GoogleGenAI;
  private model: string;
  private temperature: number;

  constructor(config: GeminiGeneratorConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || DEFAULT_MODEL;
    this.temperature = config.temperature ?? DEFAULT_TEMPERATURE;
  }

  async generatePost(
    repos: TrendingRepo[],
    options: GeneratePostOptions = {}
  ): Promise<GeneratedPost> {
    const maxRepos = options.maxRepos ?? 10;
    const selectedRepos = repos.slice(0, maxRepos);

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(selectedRepos);

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      config: {
        temperature: this.temperature,
        maxOutputTokens: DEFAULT_MAX_TOKENS,
      },
    });

    const text = response.text || '';
    const post = this.parseResponse(text);
    return post;
  }

  private parseResponse(text: string): GeneratedPost {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = GeneratedPostSchema.parse(parsed);
    return validated;
  }
}

export async function generateXiaohongshuPost(
  repos: TrendingRepo[],
  options: GeneratePostOptions = {}
): Promise<GeneratedPost> {
  const apiKey = process.env.GEMINI_API_KEY;
  console.warn('%c 日志输出  >>>', 'color: red', apiKey);
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const generator = new GeminiGenerator({ apiKey });
  return generator.generatePost(repos, options);
}
