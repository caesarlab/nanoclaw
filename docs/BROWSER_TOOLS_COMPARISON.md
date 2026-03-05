# Browser Tools Comparison: agent-browser vs Stagehand

## Executive Summary

**Recommendation: Add Stagehand as an optional enhancement, keep agent-browser as default**

Both tools serve different use cases and can coexist. Stagehand offers superior AI-powered automation for complex workflows, while agent-browser provides simpler, more predictable interactions.

---

## Current: agent-browser

### What It Is
- CLI tool built on Playwright/Puppeteer
- Snapshot-based interaction with element references (@e1, @e2, etc.)
- Direct command execution via bash
- Part of Claude Agent SDK ecosystem

### Strengths

✅ **Simple and Predictable**
- Clear command structure: `agent-browser open`, `snapshot`, `click @e1`
- No AI inference needed - deterministic behavior
- Easy to debug and understand what's happening

✅ **Low Latency**
- No LLM calls for basic interactions
- Fast execution for known workflows
- Minimal overhead

✅ **Already Integrated**
- Works out of the box with Claude Agent SDK
- Available in all containers
- No additional setup required

✅ **Cost Effective**
- No extra API calls
- No additional LLM usage
- Free to use

✅ **Good for Known Workflows**
- Perfect when you know exact steps
- Reliable for repetitive tasks
- Great for testing and scraping

### Weaknesses

❌ **Brittle Selectors**
- Element references (@e1, @e2) change when DOM changes
- Requires re-snapshotting after navigation
- Breaks when websites update

❌ **Manual Navigation**
- Agent must explicitly handle each step
- No automatic adaptation to UI changes
- Requires detailed instructions

❌ **Limited Intelligence**
- Can't understand context or intent
- No automatic error recovery
- Can't adapt to unexpected UI states

### Best Use Cases
- Simple scraping tasks
- Known, repetitive workflows
- Testing specific UI elements
- Taking screenshots
- Extracting visible data

---

## Alternative: Stagehand

### What It Is
- AI-powered browser automation framework
- Built on Playwright with natural language control
- Four primitives: act, extract, observe, agent
- Developed by Browserbase

### Strengths

✅ **AI-Powered Flexibility**
- Natural language actions: `await stagehand.act("click the login button")`
- Adapts to UI changes automatically
- Understands context and intent

✅ **Multiple Modes**
```typescript
// Simple action
await stagehand.act("fill in the email field");

// Structured extraction
const price = await stagehand.extract("get the price", z.number());

// Discover actions
const actions = await stagehand.observe("find all buttons");

// Full automation
await agent.execute("complete the checkout process");
```

✅ **Resilient to Changes**
- Doesn't rely on brittle selectors
- Adapts when websites update
- Self-healing automations

✅ **Composable**
- Mix AI and deterministic code
- Choose level of automation per task
- Gradual adoption possible

✅ **Production Ready**
- Repeatable actions (can save/replay)
- Built for scale
- Active development and support

### Weaknesses

❌ **Requires LLM Calls**
- Every AI action needs an LLM inference
- Adds latency (1-3 seconds per action)
- Increases costs

❌ **Less Predictable**
- AI might interpret instructions differently
- Harder to debug when things go wrong
- Non-deterministic behavior

❌ **Additional Setup**
- Needs npm package installation
- Requires configuration
- More complex integration

❌ **Cost Considerations**
- LLM API calls for each AI action
- Can get expensive with heavy usage
- Need to monitor token usage

### Best Use Cases
- Complex multi-step workflows
- Automating unfamiliar websites
- Tasks requiring adaptation
- Form filling with context understanding
- Data extraction from dynamic sites

---

## Side-by-Side Comparison

| Feature | agent-browser | Stagehand |
|---------|--------------|-----------|
| **Ease of Use** | Simple CLI commands | Natural language |
| **Latency** | Fast (<100ms) | Slower (1-3s per AI action) |
| **Cost** | Free | LLM API costs |
| **Reliability** | Deterministic | AI-dependent |
| **Adaptability** | Brittle | Self-healing |
| **Learning Curve** | Low | Medium |
| **Debugging** | Easy | Harder |
| **Complex Workflows** | Manual | Automated |
| **Setup** | Built-in | Requires installation |
| **Multi-LLM Support** | N/A | Yes (OpenAI, Claude, etc.) |

---

## Recommendation: Hybrid Approach

### Strategy: Best of Both Worlds

Implement both tools with smart routing:

1. **Default to agent-browser** for:
   - Simple, known tasks
   - Quick interactions
   - Cost-sensitive operations
   - Testing and debugging

2. **Use Stagehand** for:
   - Complex workflows
   - Unfamiliar websites
   - Tasks requiring adaptation
   - When user explicitly requests AI automation

### Implementation Plan

#### Phase 1: Add Stagehand as Optional Tool

```typescript
// In container/agent-runner
// Add Stagehand alongside existing tools

// Simple tasks - use agent-browser
await bash("agent-browser open https://example.com");
await bash("agent-browser snapshot -i");
await bash("agent-browser click @e1");

// Complex tasks - use Stagehand
import { Stagehand } from "@browserbasehq/stagehand";
const stagehand = new Stagehand();
await stagehand.act("complete the entire checkout process");
```

#### Phase 2: Smart Tool Selection

Let Claude decide which tool to use based on task complexity:

```typescript
// System prompt addition
"You have two browser automation tools:
1. agent-browser: Fast, deterministic, good for simple tasks
2. stagehand: AI-powered, adaptive, good for complex workflows

Choose agent-browser for simple, known tasks.
Choose stagehand for complex, adaptive tasks."
```

#### Phase 3: Cost Optimization

```typescript
// Track Stagehand usage
const stagehandConfig = {
  maxActionsPerSession: 10,
  fallbackToAgentBrowser: true,
  costLimit: 0.50, // $0.50 per session
};
```

---

## Cost Analysis

### agent-browser
- **Per action**: $0.00
- **100 actions/day**: $0.00/month
- **1000 actions/day**: $0.00/month

### Stagehand (with GPT-4)
- **Per AI action**: ~$0.01-0.03 (depending on complexity)
- **100 actions/day**: ~$30-90/month
- **1000 actions/day**: ~$300-900/month

### Stagehand (with Claude 3.5 Sonnet)
- **Per AI action**: ~$0.005-0.015
- **100 actions/day**: ~$15-45/month
- **1000 actions/day**: ~$150-450/month

### Stagehand (with cheaper models)
- **Per AI action**: ~$0.001-0.005
- **100 actions/day**: ~$3-15/month
- **1000 actions/day**: ~$30-150/month

---

## Integration Complexity

### agent-browser (Current)
- ✅ Already integrated
- ✅ Zero setup
- ✅ Works in all containers

### Stagehand (New)
- ⚠️ Requires npm package in container
- ⚠️ Needs LLM API configuration
- ⚠️ Additional Docker image size (~50MB)
- ⚠️ Requires code changes in agent-runner

**Estimated Integration Time**: 4-6 hours

---

## Real-World Examples

### Example 1: Simple Scraping

**Task**: Get product price from Amazon

**agent-browser** (Better choice):
```bash
agent-browser open "https://amazon.com/product/B08..."
agent-browser snapshot -i
agent-browser extract @e5  # Price element
```
- Time: ~2 seconds
- Cost: $0.00
- Reliability: High (if element ref is correct)

**Stagehand**:
```typescript
await stagehand.act("navigate to the product page");
const price = await stagehand.extract("get the price", z.number());
```
- Time: ~5 seconds
- Cost: ~$0.02
- Reliability: High (adapts to layout changes)

### Example 2: Complex Form Filling

**Task**: Apply for a job on LinkedIn

**agent-browser** (Tedious):
```bash
agent-browser open "https://linkedin.com/jobs/..."
agent-browser snapshot -i
agent-browser click @e3  # Apply button
agent-browser snapshot -i
agent-browser fill @e7 "John Doe"
agent-browser fill @e8 "john@example.com"
# ... 20+ more steps
```
- Time: ~30 seconds
- Cost: $0.00
- Reliability: Low (breaks with UI changes)
- Maintenance: High

**Stagehand** (Better choice):
```typescript
await stagehand.agent.execute(
  "apply for this job using my resume and cover letter"
);
```
- Time: ~15 seconds
- Cost: ~$0.10
- Reliability: High (adapts to form changes)
- Maintenance: Low

### Example 3: Data Extraction

**Task**: Extract all product listings from a page

**agent-browser**:
```bash
agent-browser open "https://shop.com/products"
agent-browser snapshot -i
# Manually identify each product element
agent-browser extract @e1
agent-browser extract @e2
# ... repeat for all products
```

**Stagehand** (Better choice):
```typescript
const products = await stagehand.extract(
  "get all product names and prices",
  z.array(z.object({
    name: z.string(),
    price: z.number(),
  }))
);
```

---

## Recommendation Summary

### For NanoClaw

**Implement Hybrid Approach:**

1. **Keep agent-browser as default** (already works, zero cost)
2. **Add Stagehand as optional tool** for complex tasks
3. **Let Claude choose** which tool to use based on task
4. **Add cost controls** to prevent runaway Stagehand usage

### Configuration

```bash
# .env additions
STAGEHAND_ENABLED=true  # Enable Stagehand
STAGEHAND_MAX_ACTIONS_PER_SESSION=10  # Limit usage
STAGEHAND_COST_LIMIT=0.50  # Max cost per session
STAGEHAND_FALLBACK_TO_AGENT_BROWSER=true  # Fallback on error
```

### Benefits

✅ Best of both worlds
✅ Cost-effective (use agent-browser by default)
✅ Powerful when needed (Stagehand for complex tasks)
✅ Gradual adoption (users can disable Stagehand)
✅ Future-proof (AI automation is the future)

### Risks

⚠️ Increased complexity
⚠️ Higher costs if overused
⚠️ Potential for confusion (two tools)
⚠️ Additional maintenance burden

---

## Conclusion

**Add Stagehand as an optional enhancement**, but keep agent-browser as the default. This gives users:

- **Speed and cost-efficiency** for simple tasks (agent-browser)
- **Power and flexibility** for complex workflows (Stagehand)
- **Choice** based on their needs and budget

The hybrid approach provides the best user experience while managing costs and complexity.

---

## Next Steps

If you decide to add Stagehand:

1. Add Stagehand to container dependencies
2. Create wrapper functions in agent-runner
3. Update system prompts to explain both tools
4. Add cost tracking and limits
5. Document usage patterns
6. Test with real workflows
7. Monitor costs and performance

Estimated implementation: 1-2 days
