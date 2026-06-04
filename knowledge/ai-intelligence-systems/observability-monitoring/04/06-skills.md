# Skills

## Skill 1: Implement token usage analytics with cost projection and trend monitoring

### Purpose
Capture token usage data from every LLM call, break down consumption by model, feature, user, and time dimension, and build a cost projection model from historical patterns for proactive budget alerts.

### When To Use
- Use when you need visibility into how tokens are consumed across the AI system
- Use when identifying which features, users, or models drive token consumption
- Use when building a cost projection model for budget forecasting
- Use when planning context window optimization and prompt compression
- Use when capacity planning for AI infrastructure

### When NOT To Use
- Do NOT use when cost tracking is not yet implemented — token analytics builds on cost data
- Do NOT use for one-time experiments where historical trend analysis is not needed
- Do NOT use when the only need is real-time monitoring (use basic metrics instead)
- Do NOT use without an observability pipeline to store and query token data

### Prerequisites
- Per-request cost tracking implemented (extracting input_tokens, output_tokens, model from every response)
- Time-series database or analytics platform (Grafana, ClickHouse, TimescaleDB)
- Streaming response token aggregation (sum tokens from chunks)
- Understanding of prompt/completion token ratio and context utilization

### Inputs
- Per-request token data: input_tokens, output_tokens, model, provider, user_id, feature_name
- Response timing: latency, TTFB (time to first byte), total duration
- Cost per token pricing table

### Workflow
1. Capture token usage data from every LLM response:
   - Extract `input_tokens` and `output_tokens` from response metadata
   - For streaming, aggregate token counts from all chunks
   - Log model, provider, user_id, feature_name with each entry
2. Build analytics dashboards showing:
   - Token consumption by model, feature, user, and time
   - Prompt vs. completion token ratio per feature
   - Context window utilization percentage
   - Token trends (daily, weekly, monthly)
3. Calculate key metrics:
   - Prompt tokens as percentage of total (typically 60-80%)
   - Completion token cost vs. prompt token cost
   - Context utilization efficiency
4. Implement token attribution analysis:
   - Breakdown by category: system prompt, user messages, tool schemas, retrieved documents, conversation history
5. Build cost projection model:
   - Daily cost projection from 14-day trend
   - Model breakdown: cost per feature, per model, per user
   - Budget alerts when projected spend exceeds 80% of budget
6. Set up anomaly detection on token consumption patterns

### Validation Checklist
- [ ] Token usage is captured from every LLM call (input + output)
- [ ] Streaming responses have aggregated token counts
- [ ] Token data is attributed to user, feature, model, and provider
- [ ] Dashboards show token consumption by all dimensions
- [ ] Prompt/completion token ratio is calculated per feature
- [ ] Context window utilization is monitored
- [ ] Cost projection model produces daily forecasts
- [ ] Alerts fire when projected spend exceeds budget thresholds
- [ ] Anomaly detection identifies unusual consumption patterns
- [ ] Token data retention policy is defined

### Common Failures
- **Missing token data**: Some LLM calls don't have token counts logged — enforce mandatory extraction
- **Streaming aggregation gap**: Only final response counted, not streaming chunks — aggregate all chunks
- **No attribution**: Token data logged without user_id or feature_name — cannot identify cost drivers
- **Stale projections**: Cost model doesn't update with new pricing or usage patterns
- **Ignoring prompt token dominance**: 60-80% of cost is prompt tokens — optimize prompts first

### Decision Points
- **Analytics granularity**: Per-request (detailed) vs. aggregated (summary) — detailed for debugging, aggregated for dashboards
- **Data retention**: 90 days for raw data, 2 years for aggregated summaries
- **Projection model**: Simple (14-day average) vs. ML-based (seasonal patterns) — simple is sufficient for most
- **Anomaly detection algorithm**: Statistical (2σ deviation) vs. ML-based — statistical for initial deployment

### Performance Considerations
- Token data writes add <1ms overhead (async queued writes)
- Dashboard queries should use pre-aggregated summaries for performance
- Cost projection runs as a daily cron job, not in request path
- Anomaly detection can run on aggregated data, not raw events
- Store token data in a columnar database for efficient aggregation queries

### Security Considerations
- Token usage data may reveal business-sensitive patterns — restrict dashboard access
- User-level token data may be PII in some jurisdictions — apply data retention policies
- Cost projections may be commercially sensitive — limit access to finance team
- Anomaly detection may flag legitimate usage spikes — require human review before action
- Aggregate token data for cross-user analytics, never expose individual user data

### Related Rules
- R1: Always capture token usage data (input_tokens, output_tokens, model) from every LLM call
- R2: Implement a cost projection model based on historical usage patterns for budget forecasting

### Related Skills
- Implement server-side cost tracking with attribution
- Implement budget enforcement with pre-flight cost estimation
- Optimize AI token usage and model selection
- Implement OpenTelemetry tracing for AI requests

### Success Criteria
- Token usage is captured for 100% of LLM calls (including streaming)
- Dashboards show token consumption by model, feature, user, and time
- Cost projection model forecasts spend within 10% accuracy
- Alerts fire when projected spend exceeds budget thresholds
- Prompt token dominance is identified and optimized
- Anomaly detection catches unusual consumption within 24 hours
