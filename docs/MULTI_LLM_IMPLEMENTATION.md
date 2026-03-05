# Multi-LLM Implementation Summary

## Overview

NanoClaw now supports multiple LLM providers beyond Claude, including OpenAI and any OpenAI-compatible API (OpenRouter, Together AI, Groq, etc.). This implementation maintains full backward compatibility with Claude while adding flexible per-group LLM configuration.

## Changes Made

### 1. Type Definitions (`src/types.ts`)

Added new interfaces for LLM configuration:

```typescript
export type LLMProvider = 'claude' | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  apiKey?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  maxRetries?: number;
  retryDelay?: number;
  fallbackProvider?: LLMProvider;
  fallbackModel?: string;
}

export interface RegisteredGroup {
  // ... existing fields
  llmConfig?: LLMConfig; // New field
}
```

### 2. Database Schema (`src/db.ts`)

- Added `llm_config` column to `registered_groups` table
- Updated `getRegisteredGroup()`, `setRegisteredGroup()`, and `getAllRegisteredGroups()` to handle LLM config
- Added migration to add column to existing databases

### 3. LLM Configuration Management (`src/llm-config.ts`)

New file that handles:
- Reading LLM config from environment variables
- Provider-specific defaults (Claude, OpenAI)
- Per-group configuration resolution
- API key resolution (supports OPENAI_API_KEY, OPENROUTER_API_KEY, etc.)
- Configuration validation

Key functions:
- `getEffectiveLLMConfig(group)` - Resolves final config for a group
- `getAPIKey(config)` - Gets appropriate API key based on provider/baseURL
- `validateLLMConfig(config)` - Validates configuration

### 4. Container Input (`src/container-runner.ts`)

Extended `ContainerInput` interface to include `llmConfig`:

```typescript
export interface ContainerInput {
  // ... existing fields
  llmConfig?: {
    provider: string;
    model?: string;
    apiKey?: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    maxRetries?: number;
    retryDelay?: number;
    fallbackProvider?: string;
    fallbackModel?: string;
  };
}
```

### 5. Main Process Updates

**`src/index.ts`:**
- Import `getEffectiveLLMConfig` and `getAPIKey`
- Resolve LLM config for each group before spawning container
- Pass LLM config to `runContainerAgent()`

**`src/task-scheduler.ts`:**
- Same changes as index.ts for scheduled tasks

### 6. OpenAI Adapter (`container/agent-runner/src/openai-adapter.ts`)

New file implementing OpenAI-compatible API support:

- `makeRequest()` - HTTP client with retry logic and exponential backoff
- `getAvailableTools()` - Tool definitions in OpenAI format
- `executeTool()` - Tool execution (bash, file ops, web search)
- `runOpenAIConversation()` - Main conversation loop with tool calling

Supported tools:
- `bash` - Execute shell commands
- `read_file` - Read file contents
- `write_file` - Write to files
- `list_directory` - List directory contents
- `web_search` - Web search (placeholder)

### 7. Agent Runner Updates (`container/agent-runner/src/index.ts`)

Modified to support both Claude and OpenAI:

- Extended `ContainerInput` interface with `llmConfig`
- Added `main()` function that routes to appropriate provider
- Added `runOpenAIMode()` - Handles OpenAI-compatible APIs
- Added `runClaudeMode()` - Original Claude SDK implementation
- Fallback support: OpenAI can fall back to Claude on error

Flow:
```
main()
  ├─> Check provider in llmConfig
  ├─> If 'openai': runOpenAIMode()
  │   ├─> Load CLAUDE.md as system prompt
  │   ├─> Call runOpenAIConversation()
  │   └─> On error: try fallback if configured
  └─> If 'claude' (default): runClaudeMode()
      └─> Original implementation
```

### 8. Documentation

**`.env.example`:**
- Added LLM configuration examples
- Documented all new environment variables
- Provided examples for different providers

**`docs/LLM_CONFIGURATION.md`:**
- Comprehensive guide for LLM configuration
- Provider-specific setup instructions
- Per-group configuration examples
- Retry and fallback strategy documentation
- Feature compatibility matrix
- Troubleshooting guide
- Cost optimization tips

## Configuration Examples

### Global Default (Claude)

```bash
# .env
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

### Global Default (OpenRouter)

```bash
# .env
LLM_PROVIDER=openai
OPENROUTER_API_KEY=sk-or-...
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=anthropic/claude-3.5-sonnet
```

### Per-Group Configuration

```typescript
// Main group uses Claude
setRegisteredGroup('main-jid', {
  name: 'Main',
  folder: 'main',
  trigger: '@Andy',
  added_at: new Date().toISOString(),
  isMain: true,
  llmConfig: {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
  },
});

// Work group uses GPT-4
setRegisteredGroup('work-jid', {
  name: 'Work',
  folder: 'work',
  trigger: '@Andy',
  added_at: new Date().toISOString(),
  llmConfig: {
    provider: 'openai',
    model: 'gpt-4-turbo',
    baseURL: 'https://api.openai.com/v1',
    temperature: 0.5,
  },
});
```

## Retry and Fallback Strategy

1. **Primary provider retry**: Attempts up to `maxRetries` (default: 3) with exponential backoff
2. **Fallback provider**: If primary fails, switches to `fallbackProvider` if configured
3. **Error logging**: If both fail, error is logged and returned to user

Example with fallback:

```bash
# Primary: OpenRouter
LLM_PROVIDER=openai
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_API_KEY=your_key

# Fallback: Direct Claude
LLM_FALLBACK_PROVIDER=claude
LLM_FALLBACK_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=your_anthropic_key
```

## Feature Compatibility

| Feature | Claude SDK | OpenAI Adapter |
|---------|-----------|----------------|
| Basic tools (bash, files) | ✅ | ✅ |
| Web search | ✅ | ⚠️ Placeholder |
| Browser automation | ✅ | ❌ |
| MCP servers | ✅ | ⚠️ IPC only |
| Agent swarms | ✅ | ❌ |
| Session persistence | ✅ | ❌ |
| Streaming | ✅ | ✅ |
| Memory (CLAUDE.md) | ✅ | ✅ (as system prompt) |

## Testing

To test the implementation:

1. **Test Claude (default)**:
   ```bash
   # No changes needed, works as before
   ```

2. **Test OpenAI**:
   ```bash
   # .env
   LLM_PROVIDER=openai
   OPENAI_API_KEY=your_key
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_MODEL=gpt-4-turbo
   ```

3. **Test OpenRouter**:
   ```bash
   # .env
   LLM_PROVIDER=openai
   OPENROUTER_API_KEY=your_key
   LLM_BASE_URL=https://openrouter.ai/api/v1
   LLM_MODEL=anthropic/claude-3.5-sonnet
   ```

4. **Check logs**:
   ```bash
   tail -f groups/your-group/logs/container-*.log
   ```
   Look for: `LLM Provider: openai` or `LLM Provider: claude`

## Migration Guide

Existing installations will continue to work without changes:

1. **No configuration**: Defaults to Claude (existing behavior)
2. **Existing groups**: No `llmConfig` means use global default
3. **Database migration**: Automatic on first run (adds `llm_config` column)

To migrate a group to a different LLM:

```typescript
import { getRegisteredGroup, setRegisteredGroup } from './db.js';

const group = getRegisteredGroup('group-jid');
if (group) {
  setRegisteredGroup('group-jid', {
    ...group,
    llmConfig: {
      provider: 'openai',
      model: 'gpt-4-turbo',
      baseURL: 'https://api.openai.com/v1',
    },
  });
}
```

## Future Enhancements

Potential improvements:

1. **Web UI for LLM configuration**: GUI to manage per-group LLM settings
2. **More providers**: Add native support for Gemini, Mistral, etc.
3. **Cost tracking**: Log token usage and costs per group
4. **Model routing**: Automatically route to cheapest/fastest model
5. **Enhanced OpenAI adapter**: Add browser automation, better MCP support
6. **Session persistence for OpenAI**: Implement conversation history
7. **Agent swarms for OpenAI**: Multi-agent support for non-Claude providers

## Security Considerations

- API keys are never written to disk or mounted as files
- Keys are passed via stdin to containers
- Per-group API keys are stored in database (encrypted recommended)
- Secrets are not exposed to bash subprocesses
- Container isolation prevents cross-group key access

## Performance Notes

- Claude SDK: Optimized for streaming, session resumption
- OpenAI adapter: Simpler implementation, may be slower for complex tasks
- Retry logic adds latency on failures (exponential backoff)
- Fallback adds additional latency if primary fails

## Known Limitations

1. **OpenAI adapter**:
   - No session persistence (stateless)
   - Limited MCP support
   - No agent swarms
   - Web search is placeholder
   - No browser automation

2. **Configuration**:
   - Per-group config requires programmatic setup (no UI yet)
   - API key rotation requires database update

3. **Compatibility**:
   - Some Claude-specific features unavailable with other providers
   - Tool schemas may differ between providers
