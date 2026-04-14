import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DefaultOpenAICompatibleProvider } from './default.js';

// Intentionally set to deployment-specific identity values requested by integrator.
const OPEN_ROUTER_REFERER = 'https://genesis-copilot.com';
const OPEN_ROUTER_TITLE = 'Genesis Copilot Orion Kernel';

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
      'HTTP-Referer': OPEN_ROUTER_REFERER,
      'X-OpenRouter-Title': OPEN_ROUTER_TITLE,
      'X-Title': OPEN_ROUTER_TITLE,
    };
  }
}
