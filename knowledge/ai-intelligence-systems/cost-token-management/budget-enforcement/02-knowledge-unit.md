# Knowledge Unit: Budget Enforcement

## Metadata

- **ID:** KU-041
- **Subdomain:** Cost Management & Observability
- **Slug:** budget-enforcement
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Budget enforcement prevents AI cost runaway by capping token usage at user, tenant, or application level. The Laravel AI SDK provides `UseCheapestModel` and `UseSmartestModel` attributes for automatic cost optimization. Community packages add pre-flight cost estimation, per-user quotas, monthly budgets, and automatic model downgrades when approaching limits.

## Core Concepts

- **Pre-flight check**: Estimate cost before API call — abort if exceeds remaining budget
- **Per-user quotas**: Token limit per user per period (daily/weekly/monthly)
- **Per-tenant budgets**: Aggregate limit for all users in a tenant
- **Model downgrade**: Switch to cheaper model when budget threshold is reached
- `UseCheapestModel`: Attribute that auto-selects cheapest available model
- `UseSmartestModel`: Attribute for quality-critical paths regardless of cost
- **Hard cap**: Absolute limit — reject requests when exhausted
- **Soft cap**: Warning threshold — notify but allow with degraded model

## Mental Models

- **Rate limiting for cost**: Like API rate limiting but for token budgets — track allowance, deny when exhausted, reset periodically.
- **Prepaid mobile plan**: You have a monthly token allowance. Fast (expensive) model until 80% used, then slow (cheap) model. Hard cap at 100%.

## Internal Mechanics

Budget enforcement middleware:
1. Intercept agent call before LLM request
2. Estimate input token count (using offline estimator)
3. Lookup user/tenant remaining budget from cache/DB
4. Compare estimated cost against remaining budget
5. If over budget: reject with user-friendly message, log rejection
6. If approaching threshold (80%): downgrade model automatically
7. Allow request, deduct estimated budget (reconcile with actual after response)
8. Post-execution: adjust budget with actual cost, log usage

Budget storage: Redis (fast, non-durable) or PostgreSQL (durable, slower). Cache budget with periodic persistence to DB.

## Patterns

- **Tiered budgets**: Premium users get higher budget → smarter model. Basic users get lower budget → cheaper model.
- **Cascading downgrade**: Hard cap is last resort — downgrade model progressively: GPT-4o → GPT-4o-mini → reject
- **Budget reset**: Monthly reset with pro-rata for mid-cycle plan changes
- **Grace period**: Allow brief over-budget to avoid abrupt UX degradation, with notification
- **Budget rollover**: Unused budget rolls to next period (up to cap)

## Architectural Decisions

- **Decision**: Pre-estimation vs. post-billing → Pre-estimation for enforcement (stop before cost incurred). Post-billing for reconciliation (adjust for actual usage).
- **Decision**: Redis vs. DB budget storage → Redis for real-time enforcement (sub-millisecond checks). PostgreSQL for durable budget records. Read from Redis, write to both.
- **Decision**: Hard vs. soft caps → Both. Soft cap at 80% (warning + model degradation). Hard cap at 100% (rejection).

## Tradeoffs

| Strategy | Cost Control | UX Impact | Complexity |
|----------|-------------|-----------|------------|
| No enforcement | None (cost risk) | Best | None |
| Soft cap only | Medium | Good (notice only) | Low |
| Model downgrade | Good | Slight quality drop | Medium |
| Hard cap (reject) | Best | Poor (rejection) | Low |
| Full stack (all) | Best | Good (progressive) | High |

## Performance Considerations

- Pre-flight estimation: <10ms (offline token counter)
- Budget lookup: <1ms (Redis)
- Budget deduction: <1ms (atomic increment)
- Post-execution reconciliation: <5ms
- Total overhead: ~15ms per request

## Production Considerations

- Store budget limits in config or DB — env-configurable per environment
- Implement budget exhaustion notifications (email, webhook, dashboard alert)
- Budget overrides for internal users, testing, and emergency access
- Handle budget race conditions — two requests checking budget simultaneously
- Monthly budget reset: scheduled job at start of period
- Monitor budget consumption velocity — predict depletion before billing cycle ends
- Allow manual budget overrides via admin panel

## Common Mistakes

- No budget enforcement — cost surprise at month end
- Hard cap only (no progressive degradation) — abrupt UX breaks at budget limit
- Pre-estimation mismatch with actual cost — budget depletes faster than expected
- Not handling model downgrade gracefully — user gets different quality without notice
- Budget reset issues — scheduling failure leaves users locked out
- Not excluding internal/test users from budget enforcement

## Failure Modes

- **Race condition**: Two requests check budget simultaneously, both allowed, budget exceeded — use atomic decrement
- **Budget drift**: Pre-estimation consistently underestimates cost — budget depletes 2x faster than expected
- **Reset failure**: Cron job misses budget reset — all users denied until manual intervention
- **Cache loss**: Redis flush loses budget state — all budgets reset to full allowance — cost spike
- **Model downgrade oscillation**: User near budget threshold gets mixed model quality per request — sticky session preferred

## Ecosystem Usage

- `subhashladumor1/laravel-ai-guard`: Most comprehensive — budget enforcement + cost estimation + reporting
- `ajooda/laravel-ai-metering`: Budget enforcement with Stripe billing integration
- `dewaldhugo/laravel-ai-governor`: Budget policies per agent + prompt versioning
- Laravel AI SDK: `UseCheapestModel` / `UseSmartestModel` attributes for declarative cost optimization
- Filament admin: dashboard for budget management and manual overrides

## Related Knowledge Units

- KU-040: Token Tracking & Cost Estimation
- KU-042: Usage Metering & Billing
- KU-043: Filament Observability Dashboards

## Research Notes

- Laravel AI SDK's `UseCheapestModel` attribute added in v0.4.0
- Budget enforcement is the top request from production Laravel AI teams
- No first-party budget management in Laravel AI SDK — all community packages
- Enterprise AI spend: 40% of enterprises spend $250K+ annually on LLMs (2025 data)
- Teams applying full cost optimization stack report 60-80% cost reduction
