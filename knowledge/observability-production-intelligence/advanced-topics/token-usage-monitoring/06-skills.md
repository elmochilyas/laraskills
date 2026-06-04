# Skill: Monitor AI Token Usage in Laravel Applications
## Purpose
Track and monitor AI model token usage (OpenAI, Anthropic, etc.) in Laravel applications to manage costs, detect usage spikes, optimize prompt efficiency, and set budgets per user or feature.
## When To Use
- Laravel applications integrating LLMs (OpenAI, Anthropic, Claude, GPT)
- Teams needing cost attribution per user, feature, or API key
- Production monitoring for unusual token consumption patterns
## When NOT To Use
- Applications not using AI/LLM APIs
- Low-volume usage where manual cost tracking suffices
## Prerequisites
- Laravel application making LLM API calls (OpenAI, Anthropic, etc.)
- LLM API integration package (e.g., `openai-php/client`, `anthropic`)
- Storage for token usage data (database, metrics system)
## Inputs
- LLM API responses (contain token counts)
- User/request context for attribution
- Budget limits per entity (user, feature, API key)
## Workflow
1. Capture token usage data from LLM API responses: prompt tokens, completion tokens, total tokens, model name, cost
2. Create `token_usage` database table: user_id, feature, model, prompt_tokens, completion_tokens, cost, request_meta (JSON), timestamp
3. Build middleware or Guzzle middleware to intercept LLM API responses and log token usage
4. Track context per request: authenticated user, feature/endpoint, session ID
5. Create dashboard chart: token usage over time, cost per user/feature, token spikes
6. Set budget alerts: daily spending limit per user, per feature, or global daily cap
7. Implement cost calculation per model (model × token rate) — update as pricing changes
8. Export token usage data: CSV, API, or push to metrics system (Prometheus, Datadog)
9. Review optimization opportunities: high-token queries, repetitive contexts, low-efficiency prompts
## Validation Checklist
- [ ] Token usage captured from LLM API responses (prompt, completion, total, model)
- [ ] Token usage table created with proper schema and indexes
- [ ] Middleware intercepts all LLM calls and logs usage
- [ ] User and feature attribution attached to each record
- [ ] Dashboard charts: usage over time, cost per user/feature
- [ ] Budget alerts configured per entity
- [ ] Cost per model calculated correctly
- [ ] Token usage exportable for external analysis
- [ ] Optimization opportunities reviewed periodically
- [ ] High-token usage spikes trigger alerts
## Common Failures
- **Missing token capture:** Token counts only available in API response — must capture synchronously.
- **No context attribution:** Token usage logged but can't identify which user or feature caused it.
- **Cost calculation errors:** Model pricing changes not updated in code. Use an updatable config or API.
- **Performance overhead:** Logging token usage adds DB writes on every LLM call. Use queued writes or batch insert.
- **Missing streaming token capture:** Streaming responses don't return full token counts in one response.
## Decision Points
- **DB storage vs metrics system:** DB for per-user attribution; Prometheus for aggregate trends.
- **Synchronous vs queued logging:** Synchronous for accurate per-request cost; queued for minimal app overhead.
- **Per-user vs aggregate tracking:** Per-user for billing/cost attribution; aggregate for trend monitoring.
- **Cost config vs hardcoded:** Config for updatable pricing; hardcoded for simplicity (update less frequently).
## Performance Considerations
- Token logging adds minimal DB write overhead (~5-10ms per LLM call)
- Use batch inserts for high-volume LLM usage
- Index the token_usage table on (user_id, created_at) for reporting queries
- Archive data older than 90 days to keep reporting fast
## Security Considerations
- Token usage logs may contain prompt/completion text — don't log actual prompts
- Store only token counts, not prompt content
- Usage data may reveal business intelligence (volume of AI interactions)
- Budget alerts should notify admins, not expose budget limits to users
## Related Skills
- LLM Tracing (advanced-topics)
- Prometheus Integration (metrics)
- Grafana Dashboard Design (dashboards)
- Notification Routing and Escalation (alerting)
## Success Criteria
- Token usage tracked per user and feature for all LLM API calls
- Dashboards show cost trends and usage spikes
- Budget alerts prevent unexpected spending
- Cost attribution allows per-user/per-feature cost reporting
- Optimization opportunities identified from usage patterns (high-token queries, redundant calls)
