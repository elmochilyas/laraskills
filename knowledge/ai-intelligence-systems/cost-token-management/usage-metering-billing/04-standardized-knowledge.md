---
id: KU-042
title: "Usage Metering & Billing Integration"
subdomain: "cost-token-management"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/08-cost-token-management/usage-metering-billing/04-standardized-knowledge.md"
---

# Usage Metering & Billing Integration

## Overview

Usage metering tracks AI consumption per user/tenant for billing, quota enforcement, and capacity planning. `ajooda/laravel-ai-metering` provides Stripe billing integration, usage-based pricing, quota management, and multi-tenant cost allocation. This enables SaaS products to bill customers based on AI token consumption with usage metering events sent to Stripe.

## Core Concepts

- **Usage events**: Aggregated token counts per user/tenant sent to billing provider
- **Stripe metering**: Stripe's usage-based billing API â€” `POST /v1/billing/meter_events`
- **Quota management**: Pre-paid token buckets per billing period
- **Tiered pricing**: Different per-token rates for different plan tiers
- **Cost allocation**: Distribute AI costs across tenants based on consumption
- **Invoice integration**: Usage summaries included in monthly invoices

## When To Use

- Production applications requiring Usage Metering & Billing Integration functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Dual tracking**: In-app (real-time quota enforcement) + Stripe (billing). In-app uses faster, approximate counts. Stripe uses provider-reported exact counts.
- **Tiered metering rates**: Free tier: $0 (limited quota). Pro tier: per-token pricing. Enterprise: flat rate + fair use.
- **Quota notification**: Warn user at 80% quota consumption â€” upsell opportunity
- **Admin override**: Allow admin to grant quota overrides and exemption codes

- **AWS billing for AI**: Like AWS meter your API calls â€” usage is tracked, aggregated, and billed to the customer. Each AI call is a billable event.
- **SaaS usage metering**: Like Stripe's usage-based billing for SMS or API calls â€” track consumption, send to Stripe, invoice customer at period end.

## Architecture Guidelines

- **Decision**: In-app vs. Stripe-only billing â†’ Both. In-app for real-time enforcement (no Stripe latency). Stripe for invoicing and payment processing.
- **Decision**: Aggregation interval â†’ Hourly for high-volume apps. Daily for lower volume. More frequent = more Stripe API calls.
- **Decision**: Quota reset â†’ Align with subscription billing cycle. Monthly billing â†’ monthly quota reset. Annual billing â†’ annual quota.

## Performance Considerations

- Usage recording: <5ms per request (Redis counter increment)
- Aggregation job: scheduled, not real-time â€” negligible user-facing impact
- Stripe API calls: batched per aggregation interval
- Quota check: <1ms (Redis counter read)
- Stripe metering event: ~200ms per batch â€” run as queued job

| Aspect | In-App Only | Stripe Only | Both |
|--------|-------------|-------------|------|
| Real-time enforcement | Yes | No (Stripe latency) | Yes |
| Billing accuracy | Approximate | Exact | Both |
| Complexity | Low | Medium | High |
| Stripe API costs | None | Per-event fee | Both |
| Latency for enforcement | None | 200-500ms | ~15ms |

## Security Considerations

- Handle Stripe API failures gracefully â€” queue events for retry, don't block app
- Reconcile in-app vs. Stripe usage monthly â€” identify discrepancies
- Monitor Stripe metering event volume â€” high-volume apps may need batching
- Implement meter event idempotency â€” prevent double-billing on retry
- Store usage records for audit â€” immutable log of all AI consumption
- Handle mid-cycle plan upgrades â€” pro-rate quota
- GDPR: usage data is personal data â€” include in data retention policy

## Common Mistakes

- Building billing on approximate token counts â€” always reconcile with provider-reported usage
- No idempotency on usage events â€” retry causes double-billing
- Synchronous Stripe API calls during AI request â€” adds 200-500ms latency
- Not handling quota exhaustion gracefully â€” user gets hard error instead of upgrade prompt
- Mixing test and production usage data in Stripe â€” separate Stripe environments
- Ignoring multi-currency billing â€” AI pricing is USD, but customers may bill in local currency

## Anti-Patterns

- **Stripe outage**: Meter events queued but not sent â€” delayed billing. Queue with retry, alert on prolonged failure.
- **Usage reconciliation failure**: In-app count differs from Stripe count by >5% â€” investigate and correct.
- **Quota race condition**: Two requests check quota simultaneously, both pass â€” quota exceeded. Use atomic Redis operations.
- **Mid-cycle data loss**: Redis flush loses accumulated usage â€” partial billing period. Persist to DB periodically.
- **Meter event limit**: Stripe rate limit on metering events â€” batch more aggressively.

## Examples

The following ecosystem packages provide reference implementations:

- `ajooda/laravel-ai-metering`: Complete Stripe billing integration for AI usage
- Stripe Metering API: standard for usage-based billing
- Custom implementation: track usage in Redis, send to Stripe via queued job
- CSV export for non-Stripe billing workflows

## Related Topics

- KU-040: Token Tracking & Cost Estimation
- KU-041: Budget Enforcement
- KU-043: Filament Observability Dashboards

## AI Agent Notes

- When asked about Usage Metering & Billing Integration, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

