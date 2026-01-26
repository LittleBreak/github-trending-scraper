export interface GeminiGeneratorConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
}

export interface GeneratePostOptions {
  maxRepos?: number;
}
