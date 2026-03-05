# Stagehand Integration Guide

NanoClaw now includes Stagehand, an AI-powered browser automation framework that complements the existing agent-browser tool.

## Overview

**Hybrid Approach**: NanoClaw uses both tools intelligently:
- **agent-browser**: Fast, deterministic, zero-cost (default for simple tasks)
- **Stagehand**: AI-powered, adaptive, flexible (for complex workflows)

## Quick Start

### Enable Stagehand

Add to your `.env`:

```bash
# Enable Stagehand
STAGEHAND_ENABLED=true

# Set limits
STAGEHAND_MAX_ACTIONS_PER_SESSION=10
STAGEHAND_COST_LIMIT=0.50

# Fallback behavior
STAGEHAND_FALLBACK_TO_AGENT_BROWSER=true
```

### Basic Usage

```bash
# Navigate
stagehand goto "https://example.com"

# Perform actions with natural language
stagehand act "click the login button"
stagehand act "fill in the email field with user@example.com"

# Extract data
stagehand extract "get the product price"

# Check usage
stagehand stats
```

## When to Use Each Tool

### Use agent-browser for:
- Simple, known tasks
- Quick interactions
- Cost-sensitive operations
- When you know exact element locations
- Testing and debugging

### Use Stagehand for:
- Complex multi-step workflows
- Unfamiliar websites
- Tasks requiring adaptation
- Form filling with context understanding
- Data extraction from dynamic sites

## Configuration

### Environment Variables

```bash
# Enable/disable Stagehand
STAGEHAND_ENABLED=true  # Default: false

# Usage limits (prevent runaway costs)
STAGEHAND_MAX_ACTIONS_PER_SESSION=10  # Default: 10
STAGEHAND_COST_LIMIT=0.50  # USD, Default: 0.50

# Fallback behavior
STAGEHAND_FALLBACK_TO_AGENT_BROWSER=true  # Default: true
```

### LLM Configuration

Stagehand uses your configured LLM provider:

```bash
# Uses Claude (default)
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=your_key

# Or OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
LLM_MODEL=gpt-4-turbo

# Or OpenRouter
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key
LLM_MODEL=anthropic/claude-3.5-sonnet
```

## Examples

### Example 1: Simple Login (agent-browser better)

```bash
# Fast, deterministic, free
agent-browser open "https://example.com/login"
agent-browser snapshot -i
agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password"
agent-browser click @e3
```

### Example 2: Complex Form (Stagehand better)

```bash
# Adaptive, understands context
stagehand goto "https://example.com/application"
stagehand act "fill in the application form with my information"
stagehand act "upload my resume"
stagehand act "submit the application"
```

### Example 3: Data Extraction (Stagehand better)

```bash
stagehand goto "https://shop.com/products"
stagehand extract "get all product names and prices" --schema='{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "price": {"type": "number"}
    }
  }
}'
```

## Cost Management

### Cost Estimates

| Provider | Cost per Action | 100 actions/day | 1000 actions/day |
|----------|----------------|-----------------|------------------|
| Claude 3.5 Sonnet | $0.015 | $45/month | $450/month |
| GPT-4 Turbo | $0.03 | $90/month | $900/month |
| GPT-3.5 Turbo | $0.005 | $15/month | $150/month |

### Monitoring Usage

```bash
# Check current session stats
stagehand stats

# Output:
# Session Statistics:
#   Actions used: 5/10
#   Estimated cost: $0.08/$0.50
#   Duration: 45s
```

### Automatic Limits

When limits are reached:
1. Stagehand stops accepting new actions
2. Error message suggests fallback to agent-browser
3. Session must be closed to reset counters

```bash
# If limit reached:
# "Max actions limit reached (10). Fallback to agent-browser."

# Then use agent-browser:
agent-browser open "https://example.com"
agent-browser snapshot -i
agent-browser click @e1
```

## Claude's Decision Making

Claude automatically chooses the best tool based on:

1. **Task Complexity**: Simple → agent-browser, Complex → Stagehand
2. **Cost Sensitivity**: Budget-conscious → agent-browser
3. **Adaptability Needs**: Dynamic sites → Stagehand
4. **User Preference**: Explicit requests honored

### System Prompt Addition

Claude receives this guidance:

```
You have two browser automation tools:

1. agent-browser: Fast, deterministic, free
   - Use for simple, known tasks
   - Perfect when you know exact steps
   - Zero cost, instant execution

2. stagehand: AI-powered, adaptive, costs $0.01-0.03/action
   - Use for complex, multi-step workflows
   - Adapts to website changes
   - Understands natural language instructions

Choose agent-browser by default. Use stagehand only when:
- Task is complex and multi-step
- Website structure is unfamiliar
- Adaptation to UI changes is needed
- User explicitly requests AI automation
```

## Troubleshooting

### "Stagehand is disabled"

**Solution**: Enable in `.env`:
```bash
STAGEHAND_ENABLED=true
```

### "Max actions limit reached"

**Solutions**:
1. Increase limit: `STAGEHAND_MAX_ACTIONS_PER_SESSION=20`
2. Use agent-browser for remaining tasks
3. Close session: `stagehand close`

### "Cost limit reached"

**Solutions**:
1. Increase limit: `STAGEHAND_COST_LIMIT=1.00`
2. Wait for next session
3. Use agent-browser instead

### Actions not working as expected

**Solutions**:
1. Be more specific: "click the blue submit button" vs "submit"
2. Use `stagehand observe` to see available actions
3. Fall back to agent-browser for precise control

### Stagehand not installed

**Solution**: Rebuild container:
```bash
cd ~/nanoclaw
docker build -t nanoclaw-agent:latest -f container/Dockerfile .
```

## Best Practices

1. **Start with agent-browser**: Use it for simple tasks to save costs
2. **Use Stagehand strategically**: Reserve for complex workflows
3. **Monitor costs**: Check `stagehand stats` regularly
4. **Set appropriate limits**: Adjust based on your budget
5. **Combine both tools**: Use each for what it's best at
6. **Test before production**: Verify workflows work as expected

## Migration from agent-browser Only

### Before (agent-browser only)

```bash
# Manual, step-by-step
agent-browser open "https://linkedin.com/jobs"
agent-browser snapshot -i
agent-browser fill @e1 "software engineer"
agent-browser click @e2
agent-browser snapshot -i
agent-browser click @e5
# ... 20+ more steps
```

### After (with Stagehand)

```bash
# Natural language, adaptive
stagehand goto "https://linkedin.com/jobs"
stagehand act "search for software engineer jobs"
stagehand act "filter by remote positions"
stagehand act "click on the first job listing"
stagehand extract "get the job details"
```

## Performance Comparison

| Metric | agent-browser | Stagehand |
|--------|--------------|-----------|
| Latency | <100ms | 1-3s per action |
| Cost | $0.00 | $0.01-0.03/action |
| Reliability | High (if selectors correct) | High (adapts to changes) |
| Maintenance | High (breaks on UI changes) | Low (self-healing) |
| Complexity | Low | Medium |
| Debugging | Easy | Harder |

## Advanced Usage

### Combining Both Tools

```bash
# Use agent-browser for navigation (fast, free)
agent-browser open "https://example.com"

# Use Stagehand for complex interaction
stagehand act "complete the checkout process"

# Back to agent-browser for simple extraction
agent-browser snapshot -i
agent-browser extract @e10
```

### Custom Schemas

```bash
# Extract structured data
stagehand extract "get all products" --schema='{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "price": {"type": "number"},
      "rating": {"type": "number"},
      "inStock": {"type": "boolean"},
      "reviews": {
        "type": "array",
        "items": {"type": "string"}
      }
    }
  }
}'
```

## See Also

- [Browser Tools Comparison](./BROWSER_TOOLS_COMPARISON.md)
- [agent-browser Documentation](../container/skills/agent-browser/SKILL.md)
- [Stagehand Documentation](../container/skills/stagehand-browser/SKILL.md)
- [LLM Configuration](./LLM_CONFIGURATION.md)
