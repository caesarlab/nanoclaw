/**
 * OpenAI-compatible API Adapter
 * Provides Claude Agent SDK-like interface for OpenAI-compatible APIs
 */
import fs, { type Dirent } from 'fs';
import path from 'path';

export interface OpenAIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: Message;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Make a request to OpenAI-compatible API with retry logic
 */
async function makeRequest(
  config: OpenAIConfig,
  messages: Message[],
  tools?: Tool[],
  maxRetries = 3,
  retryDelay = 1000,
): Promise<ChatCompletionResponse> {
  const url = `${config.baseURL}/chat/completions`;
  
  const body = {
    model: config.model,
    messages,
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxTokens ?? 4096,
    top_p: config.topP ?? 1.0,
    ...(tools && tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
  };

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      return await response.json() as ChatCompletionResponse;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Define available tools for OpenAI API
 */
export function getAvailableTools(): Tool[] {
  return [
    {
      type: 'function',
      function: {
        name: 'bash',
        description: 'Execute a bash command in the container. The command runs in a sandboxed environment.',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The bash command to execute',
            },
          },
          required: ['command'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Read the contents of a file',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file to read',
            },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'write_file',
        description: 'Write content to a file',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file to write',
            },
            content: {
              type: 'string',
              description: 'Content to write to the file',
            },
          },
          required: ['path', 'content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_directory',
        description: 'List contents of a directory',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the directory',
            },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web for information',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
    },
  ];
}

/**
 * Execute a tool call
 */
export async function executeTool(toolName: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (toolName) {
      case 'bash': {
        const { execSync } = await import('child_process');
        const command = args.command as string;
        const result = execSync(command, {
          encoding: 'utf-8',
          cwd: '/workspace/group',
          timeout: 30000,
          maxBuffer: 10 * 1024 * 1024,
        });
        return result;
      }

      case 'read_file': {
        const filePath = args.path as string;
        const fullPath = path.resolve('/workspace/group', filePath);
        return fs.readFileSync(fullPath, 'utf-8');
      }

      case 'write_file': {
        const filePath = args.path as string;
        const content = args.content as string;
        const fullPath = path.resolve('/workspace/group', filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content, 'utf-8');
        return `File written successfully: ${filePath}`;
      }

      case 'list_directory': {
        const dirPath = args.path as string;
        const fullPath = path.resolve('/workspace/group', dirPath);
        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        return entries
          .map((e: Dirent) => `${e.isDirectory() ? '[DIR]' : '[FILE]'} ${e.name}`)
          .join('\n');
      }

      case 'web_search': {
        // Placeholder - would need actual web search implementation
        return `Web search not yet implemented for: ${args.query}`;
      }

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    return `Error executing ${toolName}: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Run a conversation with OpenAI-compatible API
 */
export async function runOpenAIConversation(
  config: OpenAIConfig,
  initialPrompt: string,
  systemPrompt?: string,
  maxIterations = 10,
): Promise<string> {
  const messages: Message[] = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: initialPrompt,
  });

  const tools = getAvailableTools();
  let iterations = 0;
  let finalResponse = '';

  while (iterations < maxIterations) {
    iterations++;

    const response = await makeRequest(config, messages, tools);
    const choice = response.choices[0];
    const assistantMessage = choice.message;

    messages.push(assistantMessage);

    // If no tool calls, we're done
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      finalResponse = assistantMessage.content;
      break;
    }

    // Execute tool calls
    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);
      
      const toolResult = await executeTool(toolName, toolArgs);

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolName,
        content: toolResult,
      });
    }
  }

  return finalResponse || 'No response generated';
}
