# Skill: Monitor LLM Token Usage and Cost

## Purpose
Track token consumption per model, user, feature, and time period for cost attribution, budget control, and anomaly detection in LLM-powered Laravel applications.

## When To Use
- Any application using LLM APIs with measurable token consumption
- Cost attribution per user, team, or feature for chargeback
- Budget management and anomaly detection for AI spending

## When NOT To Use
- Applications without LLM integration
- Free-tier LLM usage where monitoring overhead exceeds benefit

## Prerequisites
- LLM instrumentation with token usage span attributes in place
- Metrics backend (Prometheus, Grafana, or OTel-compatible)
- Pricing data per model for cost calculation

## Inputs
- Token counts per LLM call (prompt, completion, total)
- Model name and feature name per call
- Pricing per 1K tokens per model

## Workflow
1. Record `gen_ai.response.usage.total_tokens` as a span attribute on every LLM call
2. Separate prompt token vs completion token tracking as separate span attributes
3. Create a Counter metric for cumulative token consumption with `model` and `feature` dimensions
4. Create a Histogram metric for per-request token distribution
5. Configure daily/weekly token budgets per feature with 80% consumption alert
6. Build dashboard showing token consumption by model, user, and feature over time
7. Multiply token counts by model pricing in the dashboard layer

## Validation Checklist
- [ ] Every LLM call records token usage as span attributes
- [ ] Prompt tokens tracked separately from completion tokens
- [ ] Token metrics created with model and feature dimensions
- [ ] Budget alerts configured at 80% consumption threshold

## Common Failures
- Recording only total tokens without separating prompt/completion — hides 2-4x cost difference
- Missing `model` dimension — cannot compare model cost efficiency
- No `feature` dimension — cannot attribute cost to specific features

## Decision Points
- Counter vs Histogram for token tracking?
- Dashboard calculation vs source-of-truth cost data?

## Performance Considerations
- Token counters add negligible overhead on LLM calls
- Histogram aggregations consume memory — limit feature dimensions

## Security Considerations
- Token usage data may reveal feature adoption rates — protect as business data
- Cost data per user may be sensitive in multi-tenant apps

## Related Skills
- Instrument LLM Calls with OpenTelemetry Tracing
- Set Up OTel Collector for Production

## Success Criteria
- Token consumption visible per model, user, and feature
- Cost per feature calculated and tracked over time
- Budget alerts fire before spending exceeds thresholds
