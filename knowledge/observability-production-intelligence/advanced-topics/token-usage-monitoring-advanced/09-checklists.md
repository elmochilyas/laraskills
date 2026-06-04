# Token Usage & Cost Monitoring — Checklist

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** AI/LLM Observability
- **Knowledge Unit:** Token Usage & Cost Monitoring
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] OTel Metrics SDK installed (Counter, Histogram)
- [ ] LLM API integration exists with token usage data available
- [ ] Pricing data for each model is accessible (config/env vars)
- [ ] Metrics backend configured (Prometheus, Datadog, etc.)

## Implementation Checklist
- [ ] Token counters are instrumented per model and feature
- [ ] Prompt and completion tokens are tracked separately
- [ ] Model version is included in every token record
- [ ] Daily/weekly budget alerts are configured per feature
- [ ] Cost calculation uses external pricing config (not hardcoded)
- [ ] Per-user cost tracking uses tier aggregation, not raw user IDs
- [ ] Cached responses are modeled separately
- [ ] Streaming responses' final chunk usage is parsed
- [ ] Dashboard shows token consumption with cost overlay
- [ ] Monthly budget alerts are configured at account level

## Verification Checklist
- [ ] `gen_ai.response.usage.total_tokens` span attribute on every LLM call
- [ ] `gen_ai.response.usage.prompt_tokens` and `gen_ai.response.usage.completion_tokens` tracked separately
- [ ] OTel Counter (`gen_ai.tokens.total`) for cumulative totals
- [ ] OTel Histogram for per-request token distribution
- [ ] Model and feature dimensions on all counter metrics
- [ ] Token-to-cost conversion done in dashboard layer (not at write time)
- [ ] User tier dimension (not raw user ID) used for metric aggregation
- [ ] Cache hit/miss dimension on token metrics

## Security Checklist
- [ ] Token usage data doesn't reveal business-sensitive information about feature adoption
- [ ] Per-user token tracking respects privacy implications (GDPR)
- [ ] Anonymous user tiers used where possible for per-user tracking
- [ ] API keys or tokens never appear in metric labels or span attributes
- [ ] User-level detail stored in traces only, not metrics
- [ ] Pricing config is stored securely (env vars or API)

## Performance Checklist
- [ ] Token monitoring adds <1ms per LLM API call
- [ ] Cost calculation is simple multiplication (negligible CPU)
- [ ] Token tracking storage adds ~100 bytes per LLM call record
- [ ] Real-time dashboards use minimum 5-second refresh
- [ ] High cardinality avoided (user tier, not user ID, in metric dimensions)
- [ ] Cached responses tracked separately to avoid double-counting

## Production Readiness Checklist
- [ ] Daily/weekly budget alerts at 80% threshold per feature
- [ ] Anomaly detection for unusual token consumption patterns
- [ ] Cost per model tracked for comparison (GPT-4o vs Claude vs GPT-4o-mini)
- [ ] Non-cached vs cached token usage visible in dashboards
- [ ] Budget alerts at feature level (not just aggregate)
- [ ] Pricing updates reflected without code changes (external config)
- [ ] Conversation history growth (prompt tokens) monitored for cost creep

## Common Mistakes to Avoid
- [ ] Ignoring prompt vs completion cost differential — output tokens 2-4x more expensive
- [ ] Not tracking model version — GPT-4o and GPT-4o-mini have 20x cost difference
- [ ] No budget alerts — discovering $10,000+ monthly bill after the fact
- [ ] Counting only API-reported tokens — missing streaming final stats
- [ ] Per-user ID as metric dimension — creates high cardinality for Prometheus
- [ ] Token-to-cost conversion at write time — pricing changes break calculations
- [ ] Ignoring cached responses — cache hits save tokens but hide usage
