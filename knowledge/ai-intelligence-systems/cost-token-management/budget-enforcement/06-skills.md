# Skills

## Skill 1: Implement pre-flight cost estimation with progressive model downgrade for budget enforcement

### Purpose
Prevent AI cost runaway by implementing pre-flight cost estimation before every LLM call, with progressive model downgrade (soft cap) and hard cap rejection, using `UseCheapestModel` and `UseSmartestModel` attributes for automatic cost optimization.

### When To Use
- Use when you need to cap AI spending at user, tenant, or application level
- Use when offering free-tier or budget-limited AI features
- Use when you want automatic model downgrade when approaching budget limits
- Use when preventing cost overruns is a business requirement

### When NOT To Use
- Do NOT use for fixed-price provider contracts where per-request cost tracking is informational
- Do NOT use during development with local/free models
- Do NOT use when budget limits are not enforced (informational tracking only)

### Prerequisites
- Cost tracking implemented (per-request token counts and pricing)
- Redis or similar for real-time budget counters
- Multiple model options per task (cheap and expensive)
- `UseCheapestModel` and `UseSmartestModel` attributes from Laravel AI SDK (or equivalent)
- Pre-flight cost estimation logic (estimate prompt tokens before sending)

### Inputs
- Current prompt text (for token estimation)
- Target model and its pricing
- Remaining budget for the user/tenant (from Redis counters)
- Budget thresholds: soft cap (80%), hard cap (100%)
- User's plan tier (determines base budget)

### Workflow
1. Set up budget configuration per user/tenant: monthly token limit and dollar budget
2. Initialize Redis counters: `budget:{user_id}:{month}` with the period's budget
3. Implement pre-flight cost estimation middleware:
   - Estimate prompt tokens from input text
   - Compute projected cost = `estimated_prompt * prompt_price + estimated_completion * completion_price`
   - Check against remaining budget in Redis
4. Configure progressive model downgrade:
   - 0-80% budget remaining: use #[UseSmartestModel] (best quality)
   - 80-100% budget remaining: switch to #[UseCheapestModel] and notify user
   - 100%+ budget: return 429 with "budget exhausted, resets on [date]" message
5. Implement `CostCalculator::estimate($prompt)` for token estimation
6. Add middleware to check Redis budget counter before forwarding to provider
7. Notify user on soft cap hit with upgrade prompt or temporary degradation
8. Set up automated alerts when budget approaches limits (90%, 95%, 100%)

### Validation Checklist
- [ ] Pre-flight cost estimation runs before every LLM call
- [ ] Redis counters track real-time budget consumption
- [ ] Soft cap (80%) triggers automatic model downgrade
- [ ] Hard cap (100%) blocks requests with clear error message
- [ ] Budget resets correctly at the start of each period
- [ ] Progressive downgrade maintains functionality (degraded but working)
- [ ] Users are notified of budget status and reset date
- [ ] Alerts fire when budget thresholds are reached
- [ ] Budget enforcement adds <1ms overhead (Redis read)

### Common Failures
- **Post-hoc enforcement**: Budget check after API call — cost is already incurred; always pre-flight
- **Abrupt rejection**: Hard cutoff at 100% without warning — users frustrated; progressive degradation is better
- **Race conditions**: Two concurrent requests bypass budget — use atomic Redis operations
- **Token estimation inaccuracy**: Estimated vs. actual tokens differ — add 20% safety margin
- **Budget not resetting**: Monthly counter doesn't reset at period boundary — check TTL implementation

### Decision Points
- **Soft cap percentage**: 80% is standard; adjust based on usage patterns and tolerance for degradation
- **Degradation strategy**: Model downgrade vs. smaller responses vs. caching only
- **Budget period**: Daily, weekly, or monthly — monthly is standard for SaaS, daily for tight control
- **Notification channel**: In-app toast, email, or dashboard only

### Performance Considerations
- Redis budget check adds <1ms per request — acceptable for all traffic levels
- Token estimation adds ~5-10ms depending on input size — consider caching estimates for identical prompts
- Atomic Redis operations ensure consistency under high concurrency
- Budget alerts should be queued to avoid loading the request path

### Security Considerations
- Budget counter manipulation via forged requests — validate user identity in middleware
- Budget exhaustion by unauthenticated users — require authentication for AI endpoint
- Do not expose budget details in API responses that could be scraped
- Rate limit budget status API endpoints to prevent abuse

### Related Rules
- R1: Always implement pre-flight cost estimation before sending requests to the LLM provider
- R2: Implement progressive model downgrade rather than abrupt hard cap rejection

### Related Skills
- Implement server-side cost tracking with attribution
- Implement usage metering and billing integration with Stripe
- Optimize AI token usage and model selection

### Success Criteria
- No request exceeds the user's budget without being blocked
- Progressive downgrade keeps features functional for all users even near budget limits
- Pre-flight estimation blocks 100% of over-budget requests before cost is incurred
- Users see clear notifications about budget status and downgrade
- Budget enforcement adds <1ms overhead to the request path
- No race conditions allow budget overruns under concurrent load
