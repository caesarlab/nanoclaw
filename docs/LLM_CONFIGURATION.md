# LLM Configuration Guide

NanoClaw supports multiple LLM providers through a flexible configuration system. You can use Claude (default), OpenAI, or any OpenAI-compatible API like OpenRouter, Together AI, or Groq.

## Configuration Hierarchy

LLM settings are resolved in this order:
1. **Per-group configuration** (stored in database)
2. **Global defaults** (from `.env` file)
3. **Hardcoded defaults** (Claude with sensible parameters)

## Global Configuration

Set default LLM provider in your `.env` file:

```bash
# Use Claude (default)
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=your_key_here

# Or use OpenAI-compatible API
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4-turbo
```

### Available Parameters

```bash
# Provider selection
LLM_PROVIDER=claude  # or 'openai'

# Model selection (provider-specific)
LLM_MODEL=claude-3-5-sonnet-20241022  # for Claude
# LLM_MODEL=gpt-4-turbo  # for OpenAI
# LLM_MODEL=anthropic/claude-3.5-sonnet  # for OpenRouter

# API configuration
LLM_BASE_URL=https://api.openai.com/v1  # Required for OpenAI-compatible APIs
OPENAI_API_KEY=your_key
OPENROUTER_API_KEY=your_key  # Auto-detected for OpenRouter URLs

# Model parameters
LLM_TEMPERATURE=0.7  # 0-1, controls randomness
LLM_MAX_TOKENS=4096  # Maximum completion tokens
LLM_TOP_P=1.0  # Nucleus sampling parameter

# Retry configuration
LLM_MAX_RETRIES=3  # Number of retry attempts
LLM_RETRY_DELAY=1000  # Milliseconds between retries (exponential backoff)

# Fallback configuration
LLM_FALLBACK_PROVIDER=claude  # Provider to use if primary fails
LLM_FALLBACK_MODEL=claude-3-5-sonnet-20241022
```

## Per-Group Configuration

Each group can override the global LLM settings. This is stored in the database and can be configured programmatically:

```typescript
import { setRegisteredGroup } from './db.js';

setRegisteredGroup('group-jid', {
  name: 'My Group',
  folder: 'my-group',
  trigger: '@Andy',
  added_at: new Date().toISOString(),
  llmConfig: {
    provider: 'openai',
    model: 'gpt-4-turbo',
    baseURL: 'https://api.openai.com/v1',
    apiKey: 'group-specific-key',  // Optional override
    temperature: 0.8,
    maxTokens: 8192,
  },
});
```

### Example: Different Models Per Group

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

// Family group uses GPT-4
setRegisteredGroup('family-jid', {
  name: 'Family',
  folder: 'family',
  trigger: '@Andy',
  added_at: new Date().toISOString(),
  llmConfig: {
    provider: 'openai',
    model: 'gpt-4-turbo',
    baseURL: 'https://api.openai.com/v1',
    temperature: 0.7,
  },
});

// Work group uses OpenRouter with Claude
setRegisteredGroup('work-jid', {
  name: 'Work',
  folder: 'work',
  trigger: '@Andy',
  added_at: new Date().toISOString(),
  llmConfig: {
    provider: 'openai',
    model: 'anthropic/claude-3.5-sonnet',
    baseURL: 'https://openrouter.ai/api/v1',
    temperature: 0.5,
  },
});
```

## Provider-Specific Configuration

### Claude (Anthropic)

```bash
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-3-5-sonnet-20241022  # Optional, this is the default
```

Available models:
- `claude-3-5-sonnet-20241022` (default, most capable)
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

### OpenAI

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4-turbo
```

Available models:
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`

### OpenRouter

```bash
LLM_PROVIDER=openai
OPENROUTER_API_KEY=sk-or-...
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=anthropic/claude-3.5-sonnet
```

OpenRouter provides access to many models. See [openrouter.ai/docs](https://openrouter.ai/docs) for available models.

### Together AI

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_together_key
LLM_BASE_URL=https://api.together.xyz/v1
LLM_MODEL=meta-llama/Llama-3-70b-chat-hf
```

### Groq

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_groq_key
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama3-70b-8192
```

## Retry and Fallback Strategy

NanoClaw implements a robust retry and fallback mechanism:

1. **Retry with same provider**: If a request fails, it retries up to `LLM_MAX_RETRIES` times with exponential backoff
2. **Fallback to alternate provider**: If all retries fail and a fallback is configured, it switches to the fallback provider
3. **Error logging**: If both primary and fallback fail, the error is logged and returned to the user

Example configuration with fallback:

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

# Retry settings
LLM_MAX_RETRIES=3
LLM_RETRY_DELAY=1000
```

## Feature Compatibility

### Claude SDK Features (provider: 'claude')
- ✅ Full tool support (Bash, file operations, web search, browser)
- ✅ MCP server integration
- ✅ Agent swarms (multi-agent collaboration)
- ✅ Session persistence and resumption
- ✅ Streaming responses
- ✅ Memory (CLAUDE.md)

### OpenAI-Compatible Features (provider: 'openai')
- ✅ Basic tool support (Bash, file operations, web search)
- ⚠️ Limited MCP support (via IPC only)
- ❌ Agent swarms (not yet implemented)
- ❌ Session persistence (stateless)
- ✅ Streaming responses
- ✅ Memory (loaded as system prompt)

## Checking Current Configuration

You can check which LLM is being used by looking at the container logs:

```bash
# View logs for a specific group
tail -f groups/your-group/logs/container-*.log
```

Look for lines like:
```
LLM Provider: openai
```

## Troubleshooting

### "OpenAI API key is required"
- Ensure `OPENAI_API_KEY` or `OPENROUTER_API_KEY` is set in `.env`
- For per-group config, ensure `apiKey` is set in the group's `llmConfig`

### "OpenAI base URL is required"
- Set `LLM_BASE_URL` in `.env` or in the group's `llmConfig`

### Requests timing out
- Increase `CONTAINER_TIMEOUT` in `.env`
- Check your API provider's rate limits
- Verify network connectivity

### Fallback not working
- Ensure `LLM_FALLBACK_PROVIDER` is set
- Verify fallback provider credentials are configured
- Check logs for fallback attempt messages

## Cost Optimization

Different providers have different pricing. Here are some strategies:

1. **Use cheaper models for simple tasks**:
   ```typescript
   // Simple group uses GPT-3.5
   llmConfig: {
     provider: 'openai',
     model: 'gpt-3.5-turbo',
   }
   ```

2. **Use OpenRouter for cost comparison**:
   OpenRouter shows pricing for all models and can route to the cheapest option

3. **Set lower max_tokens for groups that don't need long responses**:
   ```typescript
   llmConfig: {
     maxTokens: 1024,  // Shorter responses = lower cost
   }
   ```

4. **Use fallback to cheaper model**:
   ```bash
   LLM_PROVIDER=openai
   LLM_MODEL=gpt-4-turbo
   LLM_FALLBACK_PROVIDER=openai
   LLM_FALLBACK_MODEL=gpt-3.5-turbo  # Cheaper fallback
   ```
