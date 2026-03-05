#!/usr/bin/env node
/**
 * Stagehand CLI Wrapper for NanoClaw
 * Provides command-line interface to Stagehand browser automation
 */
import { z } from 'zod';
import {
  act,
  extract,
  observe,
  goto,
  getSessionStats,
  closeStagehand,
  type StagehandConfig,
} from './stagehand-wrapper.js';

// Load config from environment
const config: StagehandConfig = {
  enabled: process.env.STAGEHAND_ENABLED === 'true',
  maxActionsPerSession: parseInt(
    process.env.STAGEHAND_MAX_ACTIONS_PER_SESSION || '10',
    10,
  ),
  costLimit: parseFloat(process.env.STAGEHAND_COST_LIMIT || '0.50'),
  fallbackToAgentBrowser:
    process.env.STAGEHAND_FALLBACK_TO_AGENT_BROWSER !== 'false',
  llmProvider: process.env.LLM_PROVIDER,
  llmModel: process.env.LLM_MODEL,
  llmApiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error('Usage: stagehand <command> [args]');
    console.error('Commands:');
    console.error('  goto <url>                    Navigate to URL');
    console.error('  act "<action>"                Perform natural language action');
    console.error('  extract "<instruction>"       Extract data from page');
    console.error('  observe ["<instruction>"]     Discover available actions');
    console.error('  stats                         Show session statistics');
    console.error('  close                         Close browser session');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'goto': {
        const url = args[1];
        if (!url) {
          console.error('Error: URL required');
          process.exit(1);
        }
        const result = await goto(url, config);
        if (result.success) {
          console.log(`Navigated to: ${url}`);
        } else {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        break;
      }

      case 'act': {
        const action = args[1];
        if (!action) {
          console.error('Error: Action required');
          process.exit(1);
        }
        const result = await act(action, config);
        if (result.success) {
          console.log(`Action completed: ${action}`);
        } else {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        break;
      }

      case 'extract': {
        const instruction = args[1];
        const schemaArg = args.find((arg) => arg.startsWith('--schema='));

        if (!instruction) {
          console.error('Error: Instruction required');
          process.exit(1);
        }

        let schema: z.ZodSchema = z.string();
        if (schemaArg) {
          try {
            const schemaJson = JSON.parse(schemaArg.replace('--schema=', ''));
            schema = zodSchemaFromJson(schemaJson);
          } catch (error) {
            console.error('Error: Invalid schema JSON');
            process.exit(1);
          }
        }

        const result = await extract(instruction, schema, config);
        if (result.success) {
          console.log(JSON.stringify(result.data, null, 2));
        } else {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        break;
      }

      case 'observe': {
        const instruction = args[1];
        const result = await observe(instruction, config);
        if (result.success) {
          console.log('Available actions:');
          result.actions?.forEach((action, i) => {
            console.log(`  ${i + 1}. ${action}`);
          });
        } else {
          console.error(`Error: ${result.error}`);
          process.exit(1);
        }
        break;
      }

      case 'stats': {
        const stats = getSessionStats();
        if (stats) {
          console.log('Session Statistics:');
          console.log(`  Actions used: ${stats.actionsUsed}/${config.maxActionsPerSession}`);
          console.log(`  Estimated cost: $${stats.estimatedCost.toFixed(3)}/$${config.costLimit}`);
          console.log(`  Duration: ${Math.round(stats.duration / 1000)}s`);
        } else {
          console.log('No active session');
        }
        break;
      }

      case 'close': {
        await closeStagehand();
        console.log('Browser session closed');
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Convert JSON schema to Zod schema (simplified)
 */
function zodSchemaFromJson(json: any): z.ZodSchema {
  if (json.type === 'string') return z.string();
  if (json.type === 'number') return z.number();
  if (json.type === 'boolean') return z.boolean();
  if (json.type === 'array') {
    const items = json.items ? zodSchemaFromJson(json.items) : z.any();
    return z.array(items);
  }
  if (json.type === 'object' && json.properties) {
    const shape: Record<string, z.ZodSchema> = {};
    for (const [key, value] of Object.entries(json.properties)) {
      shape[key] = zodSchemaFromJson(value);
    }
    return z.object(shape);
  }
  return z.any();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
