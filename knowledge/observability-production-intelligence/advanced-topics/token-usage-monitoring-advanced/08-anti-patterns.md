# ECC Anti-Patterns — Token Usage & Cost Monitoring

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Observability & Production Intelligence |
| **Subdomain** | AI/LLM Observability |
| **Knowledge Unit** | Token Usage & Cost Monitoring |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. User ID as Metric Label — Cardinality Explosion
2. Hardcoded Token-to-Cost Conversion
3. Combined Prompt and Completion Token Tracking
4. No Per-Feature Budget Alerts
5. Ignoring Cached Response Token Tracking

---

## Repository-Wide Anti-Patterns

- Massive Configuration Files
- Hidden Database Queries

---

## Anti-Pattern 1: User ID as Metric Label — Cardinality Explosion

### Category
Scalability

### Description
Using raw `user_id` as a metric label dimension for token counters, creating unbounded cardinality that crashes the metrics backend and makes dashboards unqueryable.

### Warning Signs
- Token counter metric has `user_id` label
- Prometheus time series count growing with user count
- Metrics backend performance degrading
- Dashboards timing out on queries

### Why It Is Harmful
Each unique user as a metric label creates a new time series. With 10,000 users, a single counter explodes to 10,000 time series. This crashes the metrics backend (Prometheus, Mimir, Thanos) and makes dashboards unqueryable.

### Real-World Consequences
A team adds `user_id` label to their token counter. They have 50,000 active users. After 2 weeks, Prometheus has 150,000+ time series. Queries time out. Prometheus OOMs and needs restarting with a week of metric data loss.

### Preferred Alternative
Aggregate per-user token tracking to user tier (free/pro/enterprise) in metrics. Keep per-user detail in trace span attributes (not metric labels).

### Refactoring Strategy
1. Remove `user_id` from metric labels
2. Replace with `user_tier` (low cardinality: 3-5 values)
3. Add `user_id` as a span attribute in traces only
4. Verify metrics backend cardinality decreased

### Detection Checklist
- [ ] `user_id` used as metric label
- [ ] High time series count in metrics backend
- [ ] Metrics queries timing out

### Related Rules
- (Rule: Never use per-user IDs as metric labels for token tracking)

### Related Skills
- (Related: Monitor LLM Token Usage and Cost — metric dimensions section)

---

## Anti-Pattern 2: Hardcoded Token-to-Cost Conversion

### Category
Maintainability

### Description
Hardcoding token pricing directly in application code for cost calculation, requiring a code deployment every time model pricing changes.

### Warning Signs
- Cost calculation in application code: `$tokens / 1000000 * 2.50`
- Pricing values embedded in controllers or service classes
- Cost dashboards show stale numbers after pricing updates
- Model pricing changes require full deploy cycle

### Why It Is Harmful
Model pricing changes frequently — OpenAI adjusts prices, new models launch with different pricing, enterprise discounts are negotiated. Hardcoded pricing requires a code commit, review, and deployment to update costs, leading to stale cost dashboards.

### Real-World Consequences
GPT-4o input pricing drops from $2.50 to $1.25 per 1M tokens. The hardcoded pricing still shows $2.50. The cost dashboard shows double the actual cost for 2 weeks until a developer notices and deploys a fix.

### Preferred Alternative
Store per-model pricing in external configuration (env vars, config files, API endpoint). Calculate cost in the dashboard layer, not application code.

### Refactoring Strategy
1. Extract pricing to `config/llm-costs.php`
2. Use env vars with default fallbacks
3. Move cost calculation to dashboard layer (PromQL, Grafana transformations)
4. Update pricing in config without code deployment

### Detection Checklist
- [ ] Pricing hardcoded in application code
- [ ] Cost dashboard shows incorrect totals
- [ ] Pricing changes require code deployment

### Related Rules
- (Rule: Externalize token-to-cost conversion to configuration — never hardcode)

### Related Skills
- (Related: Monitor LLM Token Usage and Cost — cost calculation section)

---

## Anti-Pattern 3: Combined Prompt and Completion Token Tracking

### Category
Observability

### Description
Tracking only total tokens without separating prompt and completion token counts, hiding the 2-4x cost differential between input and output tokens.

### Warning Signs
- Only `total_tokens` recorded, no `prompt_tokens` or `completion_tokens`
- Cannot identify whether cost is driven by long system prompts or verbose model responses
- Optimization efforts target wrong area

### Why It Is Harmful
Completion tokens cost 2-4x more than prompt tokens. Combining them hides which side drives cost. Optimizing prompt size (system prompts, conversation history) is a different strategy than reducing completion length (max_tokens, response formatting).

### Real-World Consequences
A chat assistant has high token costs. The team sees "total_tokens = 5M" but doesn't know the split. They optimize prompts (which cost $2.50/1M) when 80% of cost is from completions ($10/1M). Wasted optimization effort.

### Preferred Alternative
Track `prompt_tokens` and `completion_tokens` as separate metrics. Alert on each independently with appropriate thresholds.

### Refactoring Strategy
1. Add separate counters for prompt and completion tokens
2. Update cost dashboard to show both with per-type pricing
3. Set per-type alerts: `prompt_tokens` growth → check system prompts; `completion_tokens` growth → check max_tokens

### Detection Checklist
- [ ] Only total tokens tracked
- [ ] Cannot identify cost driver (prompt vs completion)
- [ ] Optimization efforts misdirected

### Related Rules
- (Rule: Always separate prompt token tracking from completion token tracking)

### Related Skills
- (Related: Monitor LLM Token Usage and Cost — granularity section)

---

## Anti-Pattern 4: No Per-Feature Budget Alerts

### Category
Scalability

### Description
Configuring only aggregate token budget alerts without per-feature budgets, allowing anomalous consumption in a single feature to go undetected until the total budget is exceeded.

### Warning Signs
- Only monthly total token budget is monitored
- Cannot identify which feature is driving cost increases
- Anomalous consumption in one feature hidden by other features' normal usage
- Budget overrun surprises with no pre-detection

### Why It Is Harmful
Aggregate budget alerts only fire when total spending is high. A bug in one feature's conversation history management can double token consumption silently — it's hidden by other features' normal usage until the total exceeds the budget.

### Real-World Consequences
A bug in the "content-summary" feature causes it to send the full conversation history on every request, increasing token consumption 5x. The aggregate monthly budget of $1,000 is exceeded on day 12, but nobody notices because the aggregate alert fires at $1,000. The bill is $3,200.

### Preferred Alternative
Set per-feature daily token budgets with 80% consumption alerts.

### Refactoring Strategy
1. Define per-feature budget thresholds based on expected usage
2. Configure per-feature alerts at 80% consumption
3. Monitor per-feature daily consumption in dashboard
4. Investigate anomalies at the feature level

### Detection Checklist
- [ ] Only aggregate budget monitoring
- [ ] Cannot attribute cost overruns to specific features
- [ ] No per-feature daily limits

### Related Rules
- (Rule: Set daily token budget alerts per feature at 80% threshold)

### Related Skills
- (Related: Monitor LLM Token Usage and Cost — budget section)

---

## Anti-Pattern 5: Ignoring Cached Response Token Tracking

### Category
Observability

### Description
Not tracking cached LLM responses separately, hiding the cost savings from caching and creating misleading "zero cost" assumptions for cached features.

### Warning Signs
- Cached LLM responses recorded without cache-hit attribution
- Cannot measure cache effectiveness in cost dashboards
- Cached responses counted as full token usage
- API cost calculations don't match usage patterns

### Why It Is Harmful
Cache hits save tokens but most tracking records them as standard LLM calls, overcounting token usage. Conversely, some teams exclude cached responses entirely, undercounting and hiding the value of the caching layer.

### Real-World Consequences
A caching layer reduces LLM API calls by 70%. But the token counter doesn't distinguish cache hits from cache misses. The cost dashboard shows flat token consumption. The team thinks caching is ineffective and considers removing it.

### Preferred Alternative
Track cached responses separately with `gen_ai.cache_hit: true` dimension. Measure cache hit rate and cost savings independently.

### Refactoring Strategy
1. Add cache-hit attribute to LLM span: `gen_ai.cache_hit: true/false`
2. Create separate counter for cached vs non-cached tokens
3. Dashboard: show cost savings from caching
4. Alert: if cache hit rate drops below 50%, investigate caching layer

### Detection Checklist
- [ ] Cached responses not tracked separately
- [ ] Cannot measure cache hit rate
- [ ] Cost savings from caching invisible

### Related Rules
- (Implied: track cached responses separately — from anti-patterns in knowledge)

### Related Skills
- (Related: Instrument LLM Calls with OpenTelemetry Tracing — cache instrumentation)
