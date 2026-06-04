# Rule 1: Track Tokens Per Request, Aggregate Per Minute

**Condition:** Implementing token usage monitoring.

**Action:** Record prompt_tokens and completion_tokens from each LLM API response. Aggregate into OTel Counter metrics at 1-minute intervals. Log per-request counts for detailed analysis.

**Consequence:** Per-minute metrics enable cost monitoring and alerting with minimal cardinality. Logs provide per-request detail for debugging. Together they cover monitoring and debugging needs.

# Rule 2: Set Per-User Token Budgets

**Condition:** User-facing LLM features.

**Action:** Define daily or monthly token limits per user tier. Enforce server-side — when the budget is exceeded, switch to cheaper model or block requests. Notify users when approaching limits.

**Consequence:** Budgets prevent cost explosion from individual users. A single user with a runaway agent cannot consume the entire month's LLM budget.

# Rule 3: Monitor Cost Per Feature

**Condition:** Multiple LLM features sharing API keys.

**Action:** Attribute each LLM call to a feature name. Track cost per feature monthly. Compare feature cost to feature revenue. Flag features with cost > revenue for review.

**Consequence:** Per-feature cost tracking enables ROI-based decisions. Features that cost more than they generate are candidates for removal or model downgrade.

# Rule 4: Alert on Cost Anomalies

**Condition:** Token usage monitoring is operational.

**Action:** Baseline daily token usage per user and per feature. Alert when usage exceeds 3x baseline for individual users or 2x for total. Use rolling 7-day baseline for accuracy.

**Consequence:** Cost anomaly detection catches prompt injection attacks, misconfigured agents, and billing errors within minutes. Without it, a $10,000 overage is only discovered at month end.

# Rule 5: Use Logs for Per-User Detail, Metrics for Aggregates

**Condition:** Tracking token usage with OTel.

**Action:** Store per-user token counts in structured logs. Store aggregated token counts (per feature, per model) as OTel Counter metrics. Do NOT use user_id as a metric attribute.

**Consequence:** Logs handle high-cardinality per-user data without performance issues. Metrics provide aggregate views without cardinality problems. Mixing them avoids Prometheus time series explosion.

# Rule 6: Track Input and Output Tokens Separately

**Condition:** Recording token counts from LLM API responses.

**Action:** Create separate metrics for input tokens and output tokens: `llm.token.input` and `llm.token.output`. Apply different pricing per type. Output tokens are typically 2-3x more expensive.

**Consequence:** Separate tracking enables accurate cost calculation. Merged token counting hides the cost distribution between input and output.

# Rule 7: Enforce Budgets Server-Side

**Condition:** Token budget enforcement.

**Action:** Check user's token budget before processing each LLM request. Reject with a clear error message if budget exceeded. Budget check must be on the server — never trust client-side budget enforcement.

**Consequence:** Server-side enforcement prevents budget bypass. Client-side budget enforcement is trivially bypassed by modified requests.

# Rule 8: Calculate Costs in Batch, Not Per-Request

**Condition:** Calculating monetary cost from token usage.

**Action:** Batch cost calculation every minute using aggregated token counts. Apply per-model pricing. Use decimal (not float) for cost storage to avoid rounding errors.

**Consequence:** Batch cost calculation avoids floating-point overhead on every LLM request and enables consistent pricing updates. Model pricing changes require updating only the batch calculation.
