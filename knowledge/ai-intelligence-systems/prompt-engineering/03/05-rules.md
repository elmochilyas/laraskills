---
id: ku-03
title: "Context Window Management - Rules"
subdomain: "prompt-engineering"
ku-type: "foundation"
date-created: "2026-06-02"
---

## Rules for Context Window Management

### R1: Always measure and log context utilization per request to detect context-window pressure
- **Category:** Observability
- **Rule:** Log the total tokens sent, total tokens received, and the percentage of context window consumed for every LLM request; set alerts when utilization exceeds 80% of the model's limit.
- **Reason:** Without measurement, you don't know when context is being truncated. Truncation silently degrades output quality as system instructions or critical user data are pushed out.
- **Bad Example:** A chat application that never logs token counts — the team wonders why response quality degrades in long conversations.
- **Good Example:** Every request logged with `context_utilization_pct: 72, max_context: 128000`; a dashboard showing per-agent context usage trends.
- **Exceptions:** Non-production environments where logging overhead is undesirable.
- **Consequences of Violation:** Silent context truncation degrades output quality; undiagnosed quality regressions correlated with longer user inputs or conversation history.

### R2: Implement sliding window summarization for multi-turn conversations, not infinite context accumulation
- **Category:** Performance
- **Rule:** For conversations exceeding 50% of model context, summarize older turns into a condensed representation; never allow conversations to grow unbounded until hitting context limits.
- **Reason:** Context limits are hard caps — hitting them causes either errors or silent truncation of oldest messages. Proactive summarization preserves key information while keeping context within budget.
- **Bad Example:** A conversation agent that accumulates every turn in context until the model returns a "context length exceeded" error.
- **Good Example:** After every 10 turns, a summarizer agent condenses the first 8 turns into a 200-token summary stored in context; only recent 2 turns and summary retained.
- **Exceptions:** One-shot interactions that are inherently short.
- **Consequences of Violation:** Conversations are abruptly terminated when context limits are reached; user loses the entire conversation context, degrading UX and trust.

### R3: Match context window budget to model pricing — reserve expensive context for high-value content
- **Category:** Cost Management
- **Rule:** Allocate the context window budget deliberately: 20% system prompt, 50% user task content, 20% few-shot examples, 10% overhead; monitor and enforce these proportions per request.
- **Reason:** Context tokens are the primary cost driver (input costs scale with length). Unstructured context usage wastes money on low-value content while squeezing out high-value content.
- **Bad Example:** A system prompt that includes 5000 tokens of rarely-used instructions, leaving only 2000 tokens for the actual user request.
- **Good Example:** System prompt trimmed to 1000 tokens of essential instructions; 5000 tokens allocated for task content; 1000 tokens for examples; 1000 tokens reserved for response.
- **Exceptions:** When the user's request inherently requires a large amount of context (e.g., analyzing a 50-page document).
- **Consequences of Violation:** Paying premium input prices for context tokens that carry low informational value; critical user content squeezed out by verbose but unnecessary context.
