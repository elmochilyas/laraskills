# Skill: Optimize Prompt Token Usage and Quality

## Purpose
Reduce prompt token counts and improve output quality through systematic optimization — trimming redundant instructions, compressing context, enforcing token budgets per section, and A/B testing optimized prompts against baselines.

## When To Use
- Production prompts with high call volume — small token savings multiply across millions of requests
- Long-context prompts exceeding 4000 tokens — compression can dramatically reduce cost
- Prompts with degraded quality — optimization may improve instruction-following
- Before scaling — optimize prompts before increasing request volume

## When NOT To Use
- Prototypes where optimization effort exceeds potential savings
- Prompts under 500 tokens with low call volume — optimization ROI is negligible
- When prompt quality is already optimal and further compression degrades output

## Prerequisites
- KU-01 (Prompt Engineering Fundamentals) — understanding of prompt structure
- Token counting utility (accurate per-model tokenizer)
- Baseline quality metrics for the current prompt
- Test suite for quality evaluation
- Production metrics (call volume, token usage per prompt)

## Inputs
- Current prompt templates (system, user, few-shot examples)
- Call volume per prompt (requests/month)
- Current prompt token counts (per section)
- Quality baseline metrics (format compliance, user satisfaction, accuracy)
- Token budgets per section (optional, for budget enforcement)
- Model pricing per token

## Workflow
1. **Measure current state**: Track prompt token counts per feature. Identify the highest-volume and longest prompts. Record current quality metrics as a baseline.
2. **Set token budgets**: Define max token counts per prompt section (system: 500-800, few-shot: 300-500, RAG context: 2000, conversation history: 3000). Enforce at runtime.
3. **Remove redundant instructions**: Audit the prompt for duplicate, contradictory, or unnecessary instructions. Question every sentence — if removing it doesn't degrade quality, remove it.
4. **Compress the system prompt**: Keep only essential persona, constraints, safety, and format instructions. Move rarely-used instructions to a separate "extended" prompt that's only included when needed.
5. **Optimize few-shot examples**: Reduce from 5 examples to 2-3. Test whether fewer examples maintain accuracy. Remove examples that don't add unique coverage.
6. **Compress RAG context**: For long RAG context (>2000 tokens), use extractive or abstractive compression. Extract key sentences (keep entities, numbers, facts). Use a smaller/cheaper model for compression.
7. **Implement sliding window for conversation history**: For multi-turn conversations, summarize older turns into a condensed representation after every 10 turns. Keep recent 2-3 turns verbatim.
8. **Set per-task output limits**: Configure `max_tokens` per request type (classification: 10, chat: 500, code: 2000). Never leave at model default.
9. **A/B test optimized prompt**: Run optimized prompt against baseline on a held-out test set. Measure quality metrics (format compliance, relevance, accuracy). Only deploy if quality is maintained or improved.
10. **Monitor and iterate**: Track prompt token count per version. Set alerts for token count growth. Periodically review (quarterly) and re-optimize as models and use cases evolve.

## Validation Checklist
- [ ] Token budgets are defined per prompt section (system, tools, context, history)
- [ ] Optimization targets the highest-volume or longest prompts (measured first)
- [ ] Quality is validated after every optimization against a baseline test set
- [ ] Safety instructions are excluded from compression/truncation
- [ ] Truncation events are logged for monitoring
- [ ] A/B testing capability exists for comparing optimized vs. original prompts
- [ ] Prompt optimization is revisited periodically

## Common Failures
- **Quality regression from compression**: Removing or compressing essential information degrades output. Fix: always validate quality after optimization; roll back if degraded.
- **Safety instructions compressed**: Compression removes or rephrases safety guardrails, making the model unsafe. Fix: exclude safety instructions from compression entirely.
- **KV-cache thrashing from system prompt changes**: Changing the system prompt prefix invalidates the KV-cache on every request. Fix: batch system prompt changes; avoid per-request system prompt modification.
- **Over-optimization on low-volume prompts**: Spending hours optimizing a prompt that costs $10/month. Fix: focus optimization effort where ROI is highest (high volume or high token count).
- **Context window pressure not monitored**: Optimizing without knowing whether context is being truncated. Fix: log context utilization per request and set alerts.

## Decision Points
- **Truncation vs. compression**: Use truncation for time-sensitive paths (O(1)). Use compression (extractive or LLM-based) when preserving information is more important than latency.
- **Budget enforcement approach**: Hard reject (fail request if budget exceeded) for cost control. Soft warning (log and continue) for flexibility. Start with soft, move to hard when stable.
- **Focus areas**: Start with system prompt optimization (applies to every request). Then optimize few-shot examples. Then RAG context. Then conversation history.

## Performance Considerations
- Token counting: <0.1ms with cached tokenizer
- Truncation: O(1) — fastest option
- Extractive compression: O(n) — suitable for most cases
- LLM-based compression: 100-500ms — only when savings exceed cost
- Few-shot reduction: saving 300 tokens at 1M requests/month saves significant cost at scale
- Context utilization monitoring: <0.1ms overhead per request

## Security Considerations
- Never compress or summarize safety-related instructions — keep verbatim
- Truncated context may cause hallucinations if critical information is removed — log truncation events
- Anonymize test sets used for A/B optimization evaluation (may contain sensitive data)
- If using an LLM for compression, ensure it runs in a secure environment (no data leakage)
- Optimized prompts must be versioned for immediate rollback if quality regresses

## Related Rules
- Always measure and log context utilization per request to detect context-window pressure
- Implement sliding window summarization for multi-turn conversations, not infinite context accumulation
- Match context window budget to model pricing — reserve expensive context for high-value content
- Define explicit token budgets per agent and per request type before writing prompts
- Always calculate output token limits based on task needs, not model defaults
- Implement a token budget rebalancing mechanism that adjusts allocation based on response patterns

## Related Skills
- Skill: Design and Manage Production Prompts (ku-01)
- Skill: Design System Prompts for Agents (ku-02)
- Skill: Test and Evaluate Prompt Quality (ku-05)
- Skill: Track AI Usage Costs (cost-ku-01)

## Success Criteria
- Prompt token count reduced by 20-40% without quality degradation
- Token budgets enforced per section with no section exceeding budget
- Context utilization is logged and alerted (>80% triggers warning)
- Sliding window summarization prevents conversation context overflow
- Output token limits set per task type (classification: 10, chat: 500, etc.)
- A/B testing validates optimized prompt maintains or improves quality
- Optimization ROI positive (savings > optimization effort cost) at 3-month horizon