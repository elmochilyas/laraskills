# Skills

## Skill 1: Implement server-side cost tracking with attribution for AI API calls

### Purpose
Track and attribute the monetary cost of every LLM API call per-request, using a server-side pricing table, and log cost attribution metadata (user, tenant, feature) in real-time for accurate billing and budget management.

### When To Use
- Use when you need to track AI spending per user, tenant, or feature
- Use when building a SaaS product that charges for AI usage
- Use when you need cost dashboards and reports for AI operations
- Use when preparing to implement budget enforcement or cost optimization

### When NOT To Use
- Do NOT use for fixed-price provider contracts where per-request cost tracking is not needed
- Do NOT use in development-only prototyping with free or local models
- Do NOT use when the provider's reported cost is accurate enough for your needs

### Prerequisites
- Laravel AI SDK or similar AI provider integration
- Access to LLM provider pricing data (per-model per-token pricing)
- A database or observability pipeline to store cost data
- Middleware or event listener support for intercepting LLM responses

### Inputs
- LLM response object with token counts (input_tokens, output_tokens)
- Model name and provider
- User/tenant/feature attribution context
- Pricing table (provider + model → per-token prices)

### Workflow
1. Create a pricing table configuration mapping provider + model to prompt and completion token prices
2. Build a `CostCalculator` service: `$cost = $promptTokens * $promptPrice + $completionTokens * $completionPrice`
3. Implement middleware that intercepts LLM responses (e.g., AgentMiddleware post-receive)
4. Extract token counts from the response: `$response->usage()->inputTokens`, `$response->usage()->outputTokens`
5. Compute cost using the local pricing table, not the provider's reported cost
6. Attach metadata: `user_id`, `tenant_id`, `feature_name`, `model`, `provider`
7. Write the cost entry to your observability pipeline or database in real-time
8. Aggregate costs by dimension for reporting (user, feature, model, time period)
9. Set up regular cost dashboards showing spend by dimension

### Validation Checklist
- [ ] Cost is computed server-side, not from provider-reported cost
- [ ] Pricing table covers all models used in the application
- [ ] Every LLM call has user_id, feature_name, and model attributed
- [ ] Costs are logged in real-time, not deferred to batch
- [ ] Cost data matches actual invoices within 5%
- [ ] Dashboard shows cost breakdown by user, feature, model, and time
- [ ] Pricing table is reviewed monthly against provider pricing changes

### Common Failures
- **Provider cost mismatch**: Provider-reported cost differs from negotiated rates — always use server-side pricing
- **Missing attribution**: Logged without user_id or feature_name — cannot cost-allocate later
- **Batch attribution errors**: Retroactive attribution loses context — log at request time
- **Stale pricing table**: Provider changes pricing but table is not updated — cost reports drift from invoices
- **Incomplete coverage**: Some LLM calls are not tracked — missing costs in reports

### Decision Points
- **Storage**: Use a database (MySQL/PostgreSQL) for historical analysis, Redis for real-time counters, or a dedicated observability pipeline
- **Attribution granularity**: Attribute at user level (for billing) or feature level (for optimization) — both needed
- **Pricing source**: Manual pricing table vs. provider API pricing — manual is more accurate for negotiated rates

### Performance Considerations
- Cost calculation adds <1ms per request — negligible overhead
- Database writes for cost logging should be queued for high-throughput applications
- Redis counters are sub-millisecond for real-time cost checks
- Aggregate dashboards should query pre-aggregated summaries, not raw cost entries

### Security Considerations
- Cost data may reveal business-sensitive usage patterns — restrict dashboard access
- User-level cost data may be PII in some jurisdictions — apply data retention policies
- Do not expose per-user costs in API responses without authorization

### Related Rules
- R1: Always compute cost server-side using a maintained pricing table, never trust provider-reported cost
- R2: Attribute costs to the correct dimension (user, tenant, feature) at request time, not in batch

### Related Skills
- Implement budget enforcement and cost limits
- Optimize AI token usage and model selection
- Set up usage metering and billing integration with Stripe
- Implement OpenTelemetry tracing for AI requests

### Success Criteria
- Every LLM call produces a cost entry within 100ms of completion
- Cost reports match actual invoices within 5% margin
- Cost breakdown by user, tenant, feature, and model is available in dashboards
- Budget enforcement can rely on real-time cost data for decision-making
- Cost tracking adds <1ms overhead per request
