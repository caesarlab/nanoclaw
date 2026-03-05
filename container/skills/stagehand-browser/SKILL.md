---
name: stagehand-browser
description: AI-powered browser automation for complex workflows. Use natural language to control the browser, extract data, and automate multi-step tasks. Best for unfamiliar websites and adaptive workflows. Falls back to agent-browser if limits are reached.
allowed-tools: Bash(stagehand:*)
---

# AI Browser Automation with Stagehand

Stagehand provides AI-powered browser automation that adapts to website changes and understands natural language instructions.

## When to Use Stagehand vs agent-browser

**Use Stagehand for:**
- Complex multi-step workflows
- Unfamiliar websites
- Tasks requiring adaptation
- Form filling with context understanding
- Data extraction from dynamic sites

**Use agent-browser for:**
- Simple, known tasks
- Quick interactions
- Cost-sensitive operations
- When you know exact element locations

## Quick Start

```bash
# Navigate to a page
stagehand goto "https://example.com"

# Perform actions with natural language
stagehand act "click the login button"
stagehand act "fill in the email field with user@example.com"
stagehand act "click submit"

# Extract structured data
stagehand extract "get the product price" --schema '{"type":"number"}'

# Discover available actions
stagehand observe "find all clickable buttons"

# Get session stats
stagehand stats
```

## Core Commands

### Navigation

```bash
stagehand goto <url>              # Navigate to URL
```

### Actions (AI-powered)

```bash
stagehand act "click the login button"
stagehand act "fill in the search box with 'AI tools'"
stagehand act "scroll to the bottom of the page"
stagehand act "click the third product in the list"
```

### Data Extraction (AI-powered)

```bash
# Extract simple data
stagehand extract "get the page title"

# Extract structured data with schema
stagehand extract "get all product names and prices" --schema '{
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

### Observation (AI-powered)

```bash
# Discover available actions
stagehand observe "find all submit buttons"
stagehand observe "what can I click on this page?"
```

### Session Management

```bash
stagehand stats                   # Get usage statistics
stagehand close                   # Close browser session
```

## Examples

### Example 1: Login Flow

```bash
stagehand goto "https://example.com/login"
stagehand act "fill in the email field with user@example.com"
stagehand act "fill in the password field with mypassword"
stagehand act "click the login button"
stagehand act "wait for the dashboard to load"
```

### Example 2: Data Extraction

```bash
stagehand goto "https://shop.com/products"
stagehand extract "get all product information" --schema '{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "price": {"type": "number"},
      "rating": {"type": "number"},
      "inStock": {"type": "boolean"}
    }
  }
}'
```

### Example 3: Form Filling

```bash
stagehand goto "https://example.com/application"
stagehand act "fill in the application form with:
  - Name: John Doe
  - Email: john@example.com
  - Phone: 555-0123
  - Message: I'm interested in your services"
stagehand act "click submit"
```

### Example 4: Complex Workflow

```bash
stagehand goto "https://linkedin.com/jobs/search"
stagehand act "search for 'software engineer' jobs"
stagehand act "filter by remote positions"
stagehand act "click on the first job listing"
stagehand extract "get the job details" --schema '{
  "type": "object",
  "properties": {
    "title": {"type": "string"},
    "company": {"type": "string"},
    "location": {"type": "string"},
    "salary": {"type": "string"},
    "description": {"type": "string"}
  }
}'
```

## Cost Management

Stagehand uses LLM calls for AI actions, which incur costs:

- Each `act`, `extract`, or `observe` command costs ~$0.01-0.03
- Session limits prevent runaway costs
- Falls back to agent-browser when limits are reached

**Check your usage:**
```bash
stagehand stats
# Output:
# Actions used: 5/10
# Estimated cost: $0.08/$0.50
# Duration: 45 seconds
```

## Configuration

Stagehand is configured via environment variables:

```bash
# Enable/disable Stagehand
STAGEHAND_ENABLED=true

# Set limits
STAGEHAND_MAX_ACTIONS_PER_SESSION=10
STAGEHAND_COST_LIMIT=0.50

# Fallback behavior
STAGEHAND_FALLBACK_TO_AGENT_BROWSER=true
```

## Fallback to agent-browser

When Stagehand reaches limits or encounters errors, it automatically suggests falling back to agent-browser:

```bash
# If Stagehand limit reached:
# "Max actions limit reached (10). Fallback to agent-browser."

# Then use agent-browser:
agent-browser open "https://example.com"
agent-browser snapshot -i
agent-browser click @e1
```

## Best Practices

1. **Start with simple actions**: Test with basic tasks before complex workflows
2. **Use specific instructions**: "click the blue submit button" is better than "submit"
3. **Monitor costs**: Check `stagehand stats` regularly
4. **Combine with agent-browser**: Use Stagehand for complex parts, agent-browser for simple parts
5. **Handle errors gracefully**: Always have a fallback plan

## Limitations

- Requires LLM API calls (adds latency and cost)
- Less predictable than agent-browser
- May interpret instructions differently than expected
- Session limits prevent unlimited usage

## Troubleshooting

**"Stagehand is disabled"**
- Set `STAGEHAND_ENABLED=true` in .env

**"Max actions limit reached"**
- Increase `STAGEHAND_MAX_ACTIONS_PER_SESSION`
- Or use agent-browser for remaining tasks

**"Cost limit reached"**
- Increase `STAGEHAND_COST_LIMIT`
- Or wait for next session

**Action not working as expected**
- Try more specific instructions
- Use `stagehand observe` to see available actions
- Fall back to agent-browser for precise control

## Comparison with agent-browser

| Feature | Stagehand | agent-browser |
|---------|-----------|---------------|
| Natural language | ✅ Yes | ❌ No |
| Adapts to changes | ✅ Yes | ❌ No |
| Cost | 💰 $0.01-0.03/action | ✅ Free |
| Speed | ⚠️ 1-3s/action | ✅ <100ms |
| Predictability | ⚠️ AI-dependent | ✅ Deterministic |
| Complex workflows | ✅ Excellent | ⚠️ Manual |

## See Also

- [agent-browser documentation](../agent-browser/SKILL.md)
- [Browser Tools Comparison](../../../docs/BROWSER_TOOLS_COMPARISON.md)
