import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DefaultOpenAICompatibleProvider } from './default.js';

export const API_BASE_URL = 'https://openrouter.ai';
export const PROVIDER_ID = 'openrouter';
export const EXTENSION_NAME = 'Genesis Copilot Orion Kernel';

export class OpenRouterOpenAICompatibleProvider extends DefaultOpenAICompatibleProvider {
  constructor(
    contentGeneratorConfig: ContentGeneratorConfig,
    cliConfig: Config,
  ) {
    super(contentGeneratorConfig, cliConfig);
  }

  static isOpenRouterProvider(
    contentGeneratorConfig: ContentGeneratorConfig,
  ): boolean {
    const baseURL = contentGeneratorConfig.baseUrl || '';
    return baseURL.includes('openrouter.ai');
  }

  override buildHeaders(): Record<string, string | undefined> {
    // Get base headers from parent class
    const baseHeaders = super.buildHeaders();

    // Add OpenRouter-specific headers
    return {
      ...baseHeaders,
      ...(this.contentGeneratorConfig.apiKey
        ? { Authorization: `Bearer ${this.contentGeneratorConfig.apiKey}` }
        : {}),
      'Content-Type': 'application/json',
      'HTTP-Referer': API_BASE_URL,
      'X-Title': EXTENSION_NAME,
      'X-Orion-Version': '1.0.0',
    };
  }
}
