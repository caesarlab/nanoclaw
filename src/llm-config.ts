/**
 * LLM Configuration Management
 * Handles default LLM settings and per-group overrides
 */
import { readEnvFile } from './env.js';
import { LLMConfig, LLMProvider, RegisteredGroup } from './types.js';

// Read LLM config from .env
const envConfig = readEnvFile([
  'LLM_PROVIDER',
  'LLM_MODEL',
  'LLM_BASE_URL',
  'LLM_TEMPERATURE',
  'LLM_MAX_TOKENS',
  'LLM_TOP_P',
  'LLM_MAX_RETRIES',
  'LLM_RETRY_DELAY',
  'LLM_FALLBACK_PROVIDER',
  'LLM_FALLBACK_MODEL',
  'OPENAI_API_KEY',
  'OPENROUTER_API_KEY',
]);

// Default LLM configuration
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: (process.env.LLM_PROVIDER || envConfig.LLM_PROVIDER || 'claude') as LLMProvider,
  model: process.env.LLM_MODEL || envConfig.LLM_MODEL,
  baseURL: process.env.LLM_BASE_URL || envConfig.LLM_BASE_URL,
  temperature: parseFloat(process.env.LLM_TEMPERATURE || envConfig.LLM_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || envConfig.LLM_MAX_TOKENS || '4096', 10),
  topP: parseFloat(process.env.LLM_TOP_P || envConfig.LLM_TOP_P || '1.0'),
  maxRetries: parseInt(process.env.LLM_MAX_RETRIES || envConfig.LLM_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.LLM_RETRY_DELAY || envConfig.LLM_RETRY_DELAY || '1000', 10),
  fallbackProvider: (process.env.LLM_FALLBACK_PROVIDER || envConfig.LLM_FALLBACK_PROVIDER) as LLMProvider | undefined,
  fallbackModel: process.env.LLM_FALLBACK_MODEL || envConfig.LLM_FALLBACK_MODEL,
};

// Provider-specific defaults
export const PROVIDER_DEFAULTS: Record<LLMProvider, Partial<LLMConfig>> = {
  claude: {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 8192,
  },
  openai: {
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 4096,
    baseURL: 'https://api.openai.com/v1',
  },
};

/**
 * Get effective LLM configuration for a group
 * Merges: hardcoded defaults → provider defaults → global env → group override
 */
export function getEffectiveLLMConfig(group: RegisteredGroup): LLMConfig {
  const provider = group.llmConfig?.provider || DEFAULT_LLM_CONFIG.provider;
  const providerDefaults = PROVIDER_DEFAULTS[provider] || {};

  return {
    ...DEFAULT_LLM_CONFIG,
    ...providerDefaults,
    ...group.llmConfig,
    provider,
  };
}

/**
 * Get API key for a provider
 * Checks group override first, then environment variables
 */
export function getAPIKey(config: LLMConfig): string | undefined {
  if (config.apiKey) {
    return config.apiKey;
  }

  // Check environment based on provider and baseURL
  if (config.provider === 'openai') {
    // Check for OpenRouter
    if (config.baseURL?.includes('openrouter.ai')) {
      return process.env.OPENROUTER_API_KEY || envConfig.OPENROUTER_API_KEY;
    }
    // Default to OpenAI key
    return process.env.OPENAI_API_KEY || envConfig.OPENAI_API_KEY;
  }

  // Claude uses ANTHROPIC_API_KEY (handled by SDK)
  return undefined;
}

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(config: LLMConfig): { valid: boolean; error?: string } {
  if (!config.provider) {
    return { valid: false, error: 'LLM provider is required' };
  }

  if (!['claude', 'openai'].includes(config.provider)) {
    return { valid: false, error: `Invalid LLM provider: ${config.provider}` };
  }

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
    return { valid: false, error: 'Temperature must be between 0 and 1' };
  }

  if (config.topP !== undefined && (config.topP < 0 || config.topP > 1)) {
    return { valid: false, error: 'topP must be between 0 and 1' };
  }

  if (config.maxTokens !== undefined && config.maxTokens < 1) {
    return { valid: false, error: 'maxTokens must be positive' };
  }

  return { valid: true };
}
