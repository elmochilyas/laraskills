# Skills

## Skill 1: Implement usage metering with Stripe billing integration for AI token consumption

### Purpose
Track AI token consumption per user/tenant and integrate with Stripe's usage-based billing API to charge customers based on AI usage, with dual tracking using in-app Redis counters for real-time enforcement and Stripe for billing accuracy.

### When To Use
- Use when building a SaaS product that charges customers based on AI usage
- Use when you need per-user or per-tenant billing for AI features
- Use when implementing quota management with pre-paid token buckets
- Use when you need to allocate AI costs across tenants in a multi-tenant application

### When NOT To Use
- Do NOT use for single-tenant applications with no per-user billing
- Do NOT use when AI costs are bundled into a flat subscription fee
- Do NOT use during early prototyping before billing model is defined

### Prerequisites
- Laravel application with multi-tenant or per-user billing
- Stripe account with usage-based billing enabled
- AI cost tracking implemented (per-request token counts and cost)
- Redis or similar high-speed data store for real-time counters
- Queue system for asynchronous usage event submission to Stripe

### Inputs
- Per-request token usage data (input_tokens, output_tokens, model)
- User/tenant identification and subscription/tier info
- Stripe billing meter configuration
- Pricing tier definitions (free, pro, enterprise)

### Workflow
1. Set up Stripe billing meters for each pricing dimension (e.g., "ai_tokens" meter)
2. Implement dual tracking:
   - In-app Redis counters: increment `usage:{user_id}:{period}` on each request (sub-millisecond)
   - Stripe events: queue a job to send aggregated usage to Stripe periodically (hourly)
3. Create a middleware that checks Redis counters before each AI request for real-time quota enforcement
4. Configure idempotency keys for all Stripe usage events: `usage_{request_id}_{retry_count}`
5. Implement tiered pricing: different per-token rates for free/pro/enterprise tiers
6. Build a cost allocation system that distributes shared AI costs across tenants
7. Set up monthly invoice integration showing AI usage summaries
8. Implement usage dashboard for customers to view their consumption

### Validation Checklist
- [ ] Redis counters track usage in real-time for every user/tenant
- [ ] Stripe metering events include idempotency keys
- [ ] Queued jobs handle failures gracefully with retry logic
- [ ] Usage data matches between in-app counters and Stripe within 1% tolerance
- [ ] Real-time enforcement uses Redis, not Stripe API
- [ ] Tiers have correct per-token pricing configured
- [ ] Edge cases handled: plan upgrade mid-cycle, refunds, overage billing
- [ ] Usage dashboard is accessible to customers

### Common Failures
- **Double billing**: Retried jobs send duplicate usage events — fixed by idempotency keys
- **Stripe latency**: Checking Stripe for real-time enforcement adds 200-500ms — use Redis counters
- **Counter drift**: Redis counters and Stripe totals diverge — periodic reconciliation job needed
- **Race conditions**: Two concurrent requests both charge the same token bucket — use atomic Redis increment
- **Billing cycle confusion**: Plan change mid-cycle causes incorrect proration — handle subscription changes carefully

### Decision Points
- **Billing model**: Per-token (simple) vs. tiered (complex but flexible)
- **Periodic vs. real-time Stripe submission**: Hourly batch is standard; real-time for high-value customers
- **Quota vs. postpaid**: Pre-paid token buckets vs. postpaid billing — choose based on business model

### Performance Considerations
- Redis counters are sub-millisecond — negligible overhead per request
- Stripe API calls are 200-500ms — always queue, never call synchronously
- Usage aggregation queries should use pre-aggregated summaries, not raw events
- Cache usage data for dashboard to avoid repeated aggregation queries

### Security Considerations
- Stripe API keys must be stored encrypted and restricted to specific jobs
- Usage data may reveal business-sensitive patterns — restrict dashboard access
- Implement rate limiting on usage dashboard to prevent API abuse
- User-level usage data should be scoped to authenticated users
- Stripe webhooks must be validated with signature verification

### Related Rules
- R1: Implement dual tracking — in-app counters for real-time enforcement and Stripe for billing accuracy
- R2: Always implement idempotency for billing usage events to prevent double-billing

### Related Skills
- Implement server-side cost tracking with attribution
- Implement budget enforcement and cost limits
- Optimize AI token usage and model selection

### Success Criteria
- Usage counters update within 1ms of each AI request
- Stripe billing events are sent with 100% accuracy and no duplicates
- Real-time quota enforcement prevents over-usage in Redis (no Stripe latency)
- Usage dashboard shows accurate, up-to-date consumption data
- Invoices reflect actual usage within 1% margin
- System handles plan changes, prorations, and refunds correctly
