# Stagehand Setup Guide

Quick guide to enable Stagehand in your NanoClaw installation.

## Prerequisites

- NanoClaw installed and running
- Docker or Apple Container runtime
- LLM API key (Claude, OpenAI, or OpenRouter)

## Installation Steps

### Step 1: Update Dependencies

```bash
cd ~/nanoclaw

# Install dependencies
npm install

# Update container dependencies
cd container/agent-runner
npm install
cd ../..
```

### Step 2: Rebuild Container

```bash
# Rebuild Docker image with Stagehand
docker build -t nanoclaw-agent:latest -f container/Dockerfile .

# Verify Stagehand is installed
docker run --rm nanoclaw-agent:latest sh -c "which stagehand"
# Should output: /usr/local/bin/stagehand
```

### Step 3: Configure Environment

Edit your `.env` file:

```bash
nano ~/nanoclaw/.env
```

Add Stagehand configuration:

```bash
# Enable Stagehand
STAGEHAND_ENABLED=true

# Set limits
STAGEHAND_MAX_ACTIONS_PER_SESSION=10
STAGEHAND_COST_LIMIT=0.50

# Fallback behavior
STAGEHAND_FALLBACK_TO_AGENT_BROWSER=true
```

Save and exit (Ctrl+X, Y, Enter).

### Step 4: Restart NanoClaw

```bash
# If running as service
sudo systemctl restart nanoclaw

# Or if running manually
npm start
```

### Step 5: Verify Installation

Send a test message to your bot:

```
@Andy use stagehand to navigate to example.com and tell me what you see
```

Check logs:

```bash
# If running as service
sudo journalctl -u nanoclaw -f

# Look for:
# "Stagehand enabled: true"
# "Stagehand session initialized"
```

## Quick Test

Test Stagehand directly in a container:

```bash
# Start a test container
docker run -it --rm \
  -e STAGEHAND_ENABLED=true \
  -e OPENAI_API_KEY=your_key \
  nanoclaw-agent:latest \
  bash

# Inside container, test Stagehand
stagehand goto "https://example.com"
stagehand extract "get the page title"
stagehand stats
stagehand close
```

## Configuration Options

### Basic Configuration

```bash
# Enable/disable
STAGEHAND_ENABLED=true  # Default: false

# Usage limits
STAGEHAND_MAX_ACTIONS_PER_SESSION=10  # Default: 10
STAGEHAND_COST_LIMIT=0.50  # USD, Default: 0.50

# Fallback
STAGEHAND_FALLBACK_TO_AGENT_BROWSER=true  # Default: true
```

### LLM Configuration

Stagehand uses your configured LLM:

```bash
# Option 1: Claude (recommended)
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Option 2: OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxx
LLM_MODEL=gpt-4-turbo

# Option 3: OpenRouter (cost-effective)
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-xxxxx
LLM_MODEL=anthropic/claude-3.5-sonnet
```

## Troubleshooting

### "Stagehand command not found"

**Cause**: Container not rebuilt with Stagehand

**Solution**:
```bash
docker build -t nanoclaw-agent:latest -f container/Dockerfile .
sudo systemctl restart nanoclaw
```

### "Stagehand is disabled"

**Cause**: Not enabled in `.env`

**Solution**:
```bash
echo "STAGEHAND_ENABLED=true" >> ~/nanoclaw/.env
sudo systemctl restart nanoclaw
```

### "API key required"

**Cause**: LLM API key not configured

**Solution**:
```bash
# Add to .env
echo "OPENAI_API_KEY=your_key" >> ~/nanoclaw/.env
# Or
echo "ANTHROPIC_API_KEY=your_key" >> ~/nanoclaw/.env

sudo systemctl restart nanoclaw
```

### High costs

**Cause**: Too many Stagehand actions

**Solution**:
```bash
# Reduce limits in .env
STAGEHAND_MAX_ACTIONS_PER_SESSION=5
STAGEHAND_COST_LIMIT=0.25

sudo systemctl restart nanoclaw
```

### Actions failing

**Cause**: Various (network, LLM, website issues)

**Solution**:
1. Check logs: `sudo journalctl -u nanoclaw -f`
2. Try agent-browser instead
3. Increase timeout if needed
4. Verify LLM API key is valid

## Cost Management

### Estimated Costs

| Usage Level | Actions/Day | Cost/Month (Claude) | Cost/Month (GPT-4) |
|-------------|-------------|---------------------|-------------------|
| Light | 10 | $4.50 | $9.00 |
| Medium | 50 | $22.50 | $45.00 |
| Heavy | 200 | $90.00 | $180.00 |

### Monitoring

```bash
# Check usage in real-time
sudo journalctl -u nanoclaw -f | grep -i stagehand

# Look for:
# "Actions used: 5/10"
# "Estimated cost: $0.08/$0.50"
```

### Cost Optimization Tips

1. **Use agent-browser by default**: Reserve Stagehand for complex tasks
2. **Set conservative limits**: Start with 10 actions/session
3. **Use cheaper models**: GPT-3.5 Turbo costs 1/6 of GPT-4
4. **Monitor regularly**: Check `stagehand stats` output
5. **Disable if not needed**: Set `STAGEHAND_ENABLED=false`

## Updating Stagehand

When new versions are released:

```bash
cd ~/nanoclaw/container/agent-runner

# Update Stagehand
npm update @browserbasehq/stagehand

# Rebuild
npm run build
cd ../..

# Rebuild container
docker build -t nanoclaw-agent:latest -f container/Dockerfile .

# Restart
sudo systemctl restart nanoclaw
```

## Disabling Stagehand

If you want to disable Stagehand:

```bash
# Option 1: Disable in .env
echo "STAGEHAND_ENABLED=false" >> ~/nanoclaw/.env
sudo systemctl restart nanoclaw

# Option 2: Remove from container (saves space)
# Edit container/agent-runner/package.json
# Remove "@browserbasehq/stagehand" from dependencies
# Rebuild container
```

## Next Steps

- Read [Stagehand Integration Guide](./STAGEHAND_INTEGRATION.md)
- See [Browser Tools Comparison](./BROWSER_TOOLS_COMPARISON.md)
- Check [Stagehand Skill Documentation](../container/skills/stagehand-browser/SKILL.md)

## Support

If you encounter issues:

1. Check logs: `sudo journalctl -u nanoclaw -n 100`
2. Verify configuration: `cat ~/nanoclaw/.env | grep STAGEHAND`
3. Test in isolation: Use Docker test command above
4. Report issues: [GitHub Issues](https://github.com/caesarlab/nanoclaw/issues)
