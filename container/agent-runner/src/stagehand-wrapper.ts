/**
 * Stagehand Wrapper for NanoClaw
 * Provides AI-powered browser automation with cost tracking and limits
 */
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

export interface StagehandConfig {
  enabled: boolean;
  maxActionsPerSession: number;
  costLimit: number; // USD
  fallbackToAgentBrowser: boolean;
  llmProvider?: string;
  llmModel?: string;
  llmApiKey?: string;
}

export interface StagehandSession {
  stagehand: Stagehand;
  actionsUsed: number;
  estimatedCost: number;
  startTime: number;
}

// Cost estimates per action (in USD)
const COST_PER_ACTION: Record<string, number> = {
  'claude-3-5-sonnet': 0.015,
  'gpt-4-turbo': 0.03,
  'gpt-4': 0.03,
  'gpt-3.5-turbo': 0.005,
  'default': 0.02,
};

let currentSession: StagehandSession | null = null;

/**
 * Get cost estimate for a model
 */
function getCostPerAction(model?: string): number {
  if (!model) return COST_PER_ACTION.default;
  
  for (const [key, cost] of Object.entries(COST_PER_ACTION)) {
    if (model.includes(key)) return cost;
  }
  
  return COST_PER_ACTION.default;
}

/**
 * Initialize Stagehand session
 */
export async function initStagehand(config: StagehandConfig): Promise<StagehandSession> {
  if (currentSession) {
    return currentSession;
  }

  const stagehand = new Stagehand({
    env: 'LOCAL',
    verbose: 1,
    debugDom: false,
    enableCaching: true,
    // LLM configuration
    ...(config.llmProvider && {
      modelName: config.llmModel || 'gpt-4-turbo',
      modelClientOptions: {
        apiKey: config.llmApiKey,
      },
    }),
  });

  await stagehand.init();

  currentSession = {
    stagehand,
    actionsUsed: 0,
    estimatedCost: 0,
    startTime: Date.now(),
  };

  return currentSession;
}

/**
 * Check if action is allowed based on limits
 */
function checkLimits(config: StagehandConfig, session: StagehandSession): {
  allowed: boolean;
  reason?: string;
} {
  if (session.actionsUsed >= config.maxActionsPerSession) {
    return {
      allowed: false,
      reason: `Max actions limit reached (${config.maxActionsPerSession})`,
    };
  }

  if (session.estimatedCost >= config.costLimit) {
    return {
      allowed: false,
      reason: `Cost limit reached ($${config.costLimit})`,
    };
  }

  return { allowed: true };
}

/**
 * Track action usage and cost
 */
function trackAction(session: StagehandSession, model?: string): void {
  session.actionsUsed++;
  session.estimatedCost += getCostPerAction(model);
}

/**
 * Execute a natural language action
 */
export async function act(
  action: string,
  config: StagehandConfig,
): Promise<{ success: boolean; error?: string }> {
  if (!config.enabled) {
    return {
      success: false,
      error: 'Stagehand is disabled. Use agent-browser instead.',
    };
  }

  try {
    const session = await initStagehand(config);
    const limits = checkLimits(config, session);

    if (!limits.allowed) {
      if (config.fallbackToAgentBrowser) {
        return {
          success: false,
          error: `${limits.reason}. Fallback to agent-browser.`,
        };
      }
      return { success: false, error: limits.reason };
    }

    await session.stagehand.page.act(action);
    trackAction(session, config.llmModel);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Extract structured data from page
 */
export async function extract<T>(
  instruction: string,
  schema: z.ZodSchema<T>,
  config: StagehandConfig,
): Promise<{ success: boolean; data?: T; error?: string }> {
  if (!config.enabled) {
    return {
      success: false,
      error: 'Stagehand is disabled. Use agent-browser instead.',
    };
  }

  try {
    const session = await initStagehand(config);
    const limits = checkLimits(config, session);

    if (!limits.allowed) {
      return { success: false, error: limits.reason };
    }

    const data = await session.stagehand.page.extract(instruction, schema);
    trackAction(session, config.llmModel);

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Observe available actions on page
 */
export async function observe(
  instruction?: string,
  config?: StagehandConfig,
): Promise<{ success: boolean; actions?: string[]; error?: string }> {
  if (!config?.enabled) {
    return {
      success: false,
      error: 'Stagehand is disabled. Use agent-browser instead.',
    };
  }

  try {
    const session = await initStagehand(config);
    const limits = checkLimits(config, session);

    if (!limits.allowed) {
      return { success: false, error: limits.reason };
    }

    const result = await session.stagehand.page.observe(instruction);
    trackAction(session, config.llmModel);

    return { success: true, actions: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Navigate to URL
 */
export async function goto(
  url: string,
  config: StagehandConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await initStagehand(config);
    await session.stagehand.page.goto(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get session statistics
 */
export function getSessionStats(): {
  actionsUsed: number;
  estimatedCost: number;
  duration: number;
} | null {
  if (!currentSession) return null;

  return {
    actionsUsed: currentSession.actionsUsed,
    estimatedCost: currentSession.estimatedCost,
    duration: Date.now() - currentSession.startTime,
  };
}

/**
 * Close Stagehand session
 */
export async function closeStagehand(): Promise<void> {
  if (currentSession) {
    await currentSession.stagehand.close();
    currentSession = null;
  }
}

/**
 * Get current page for direct Playwright access
 */
export function getPage() {
  return currentSession?.stagehand.page;
}
