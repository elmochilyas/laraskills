---
id: ku-04
title: "Token Usage Analytics"
subdomain: "cost-management-observability"
ku-type: "analytics"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/cost-management-observability/ku-04/04-standardized-knowledge.md"
---

# Token Usage Analytics

## Overview

Token usage analytics provides granular visibility into how tokens are consumed across an AI system — by model, provider, user, feature, time, and request type. Unlike cost tracking (which converts tokens to dollars), token analytics focuses on understanding consumption patterns: which features consume the most tokens, which users have the highest usage, how prompt vs. completion tokens ratio varies by use case, and how context window utilization changes over time. This data drives prompt optimization, model selection, and capacity planning.

## Core Concepts

- **Prompt Tokens:** Tokens in the request (system message, messages, tools). Dominates total token usage in most applications (60-80%).
- **Completion Tokens:** Tokens in the LLM response. Smaller proportion but more expensive per token.
- **Token Ratio:** Ratio of prompt tokens to completion tokens. High ratio indicates verbose prompts; low ratio indicates verbose responses.
- **Context Utilization:** Percentage of the model's context window used per request. Low utilization = inefficient; high utilization → risk of truncation.
- **Token Attribution:** Breakdown of tokens by category (system prompt, user message, tool schemas, retrieved documents, conversation history).
- **Token Trend:** Token consumption over time (daily, weekly, monthly) — used for capacity planning and anomaly detection.
- **Wasted Tokens:** Tokens used for content that doesn't contribute to the final output (redundant context, irrelevant tool descriptions, overly verbose system prompts).

## When To Use

- Optimizing prompt efficiency — understanding where tokens are spent guides prompt compression efforts.
- Capacity planning — predicting future token consumption based on growth trends.
- Anomaly detection — sudden token spikes may indicate bugs, abuse, or inefficient prompts.
- Provider cost comparison — different providers charge different per-token rates.
- Context window management — ensuring models stay within their context limits.

## When NOT To Use

- Basic cost tracking where dollar amounts suffice (token analytics adds complexity).
- Low-volume applications (<1000 requests/month) where manual analysis is sufficient.

## Best Practices

- **Track prompt and completion tokens separately.** They have different cost rates and optimization strategies.
- **Attribute tokens to categories** (system, user, tool, context) to identify the largest token consumers.
- **Monitor context utilization** — if average utilization is below 30%, prompts may be unnecessarily padded. If above 80%, truncation risk is high.
- **Track wasted tokens** — tool schemas that are never used, context that is never referenced in the response.
- **Set token budgets per feature** — a feature that grows 20% month-over-month needs investigation.
- **Log token breakdown per request** for detailed analysis.

## Architecture Guidelines

- Token counting should happen at the **gateway level** (before sending to the provider) for prompt tokens, and after response for completion tokens.
- Use a **tokenizer library** (tiktoken, or provider-specific tokenizers) for accurate counting. Provider-reported token counts are authoritative but may be delayed.
- Store token data in a **time-series database** or column-store for efficient aggregation queries.
- Pre-aggregate tokens by hour and dimension (model, provider, user, feature) for dashboard performance.
- For real-time token monitoring, use **streaming metrics** (counters in Prometheus with cumulative counts).

## Performance Considerations

- Tokenization adds <0.1ms per 1000 tokens. Negligible for most applications.
- Storing per-request token data at scale: if each request generates 200 bytes of token metadata, 10M requests/month = 2GB/month. Plan storage accordingly.
- Pre-aggregation queries over millions of requests: use summary tables or materialized views.
- Token counting in streaming responses: count tokens as chunks arrive (cumulative). Don't wait for the full response.
- Batch token counting for older data: process from logs or database in background jobs.

## Security Considerations

- **Token data confidentiality:** Token counts can reveal usage patterns (feature popularity, user activity levels). Restrict access.
- **Token attribution leakage:** Don't expose token attribution per user in shared dashboards (user A's usage is private).
- **Manipulated token counts:** Ensure token counts are computed server-side (not client-reported) to prevent spoofing.
- **Data retention:** Token analytics data should have a retention policy like other observability data.
- **Granularity control:** Highly granular token data (per-request breakdown) may reveal more than intended. Aggregate where privacy matters.

## Common Mistakes

- Only tracking total tokens, not the prompt/completion split — misses the biggest optimization opportunity (prompt reduction).
- Using provider-reported token counts exclusively — providers may change tokenization algorithms.
- Not attributing tokens to categories — system prompt waste is invisible without category attribution.
- Ignoring tool schema tokens — verbose tool descriptions burn thousands of tokens per request.
- Not tracking context utilization — only noticing context limits when requests start failing.

## Anti-Patterns

- **Token Obsession:** Optimizing tokens at the expense of output quality. Token reduction must be validated against quality metrics.
- **Vanity Token Metrics:** Tracking "tokens saved" by optimizations without measuring impact on response quality or user satisfaction.
- **Ignoring Provider Differences:** Not accounting for different tokenization across providers — 1000 tokens with one provider may be 1200 with another.
- **No Baseline:** Optimizing token usage without a baseline measurement. You can't know if you've improved without a before/after comparison.
- **Per-Request Over-Analysis:** Analyzing every request's token breakdown individually. Aggregate analysis is more actionable.

## Examples

### Token Breakdown Log Entry
```json
{
  "correlation_id": "req_abc123",
  "token_breakdown": {
    "prompt": {
      "system": 450,
      "user": 120,
      "tool_schemas": 320,
      "retrieved_context": 2100,
      "conversation_history": 800
    },
    "completion": {
      "response": 250,
      "tool_calls": 80
    }
  },
  "total_prompt": 3790,
  "total_completion": 330,
  "context_utilization_pct": 41.2,
  "token_ratio": 11.5
}
```

### Token Attribution Service
```php
class TokenAttributionService {
    public function attribute(array $messages, array $response): TokenAttribution {
        $attribution = new TokenAttribution();

        foreach ($messages as $msg) {
            $tokens = $this->tokenizer->count($msg['content'] ?? '');
            $attribution->add(match($msg['role']) {
                'system' => Category::System,
                'user' => Category::User,
                'tool' => Category::ToolResult,
                'assistant' => Category::ConversationHistory,
                default => Category::Other,
            }, $tokens);
        }

        // Tool schemas from registered tools
        $schemaTokens = $this->tokenizer->count(json_encode($this->toolSchemas));
        $attribution->add(Category::ToolSchema, $schemaTokens);

        return $attribution;
    }
}
```

## Related Topics

- ku-01 (Cost Tracking & Allocation): Cost based on token usage.
- ku-02 (Cost Optimization Strategies): Token reduction as an optimization lever.
- prompt-engineering-systems/ku-03: Reducing prompt tokens through compression.
- llm-provider-abstraction/ku-05: Provider-specific tokenization differences.
- streaming-real-time-ai/ku-03: Token counting in streaming responses.

## AI Agent Notes

- When asked to analyze token usage, first request aggregated token data by feature to identify the biggest consumers.
- For token-related issues, check: context utilization, token ratio, and tool schema verbosity.
- Prefer reading the token attribution configuration before the counting implementation.
- When generating token analytics, include both prompt/completion split and category attribution for actionable insights.

## Verification

- [ ] Prompt and completion tokens are tracked separately.
- [ ] Tokens are attributed to categories (system, user, tool, context).
- [ ] Context utilization percentage is monitored per request.
- [ ] Token data is stored for historical trend analysis.
- [ ] Token counting uses a tokenizer library (not just provider-reported counts).
- [ ] Token budgets are set per feature with growth alerts.
- [ ] Token analytics data has a retention policy.
