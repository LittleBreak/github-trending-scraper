import { GoogleGenAI } from '@google/genai';
import type { TrendingRepo } from '../types';
import type { GeminiGeneratorConfig, GeneratePostOptions } from './types';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

const DEFAULT_MODEL = 'gemini-3-flash-preview';
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
  ): Promise<string> {
    const maxRepos = options.maxRepos ?? 10;
    const selectedRepos = repos.slice(0, maxRepos);

    const systemPrompt = await buildSystemPrompt();
    const userPrompt = buildUserPrompt(selectedRepos);

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'system',
          parts: [{ text: `${systemPrompt}\n\n` }],
        },
        {
          role: 'user',
          parts: [{ text: `${userPrompt}` }],
        },
      ],
      config: {
        temperature: this.temperature,
        maxOutputTokens: DEFAULT_MAX_TOKENS,
      },
    });

    return response.text || '';
  }
}

export async function generateXiaohongshuPost(
  repos: TrendingRepo[],
  options: GeneratePostOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const generator = new GeminiGenerator({ apiKey });
  return generator.generatePost(repos, options);
}
