# Knowledge Unit: Usage Metering & Billing Integration

## Metadata

- **ID:** KU-042
- **Subdomain:** Cost Management & Observability
- **Slug:** usage-metering-billing
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Usage metering tracks AI consumption per user/tenant for billing, quota enforcement, and capacity planning. `ajooda/laravel-ai-metering` provides Stripe billing integration, usage-based pricing, quota management, and multi-tenant cost allocation. This enables SaaS products to bill customers based on AI token consumption with usage metering events sent to Stripe.

## Core Concepts

- **Usage events**: Aggregated token counts per user/tenant sent to billing provider
- **Stripe metering**: Stripe's usage-based billing API — `POST /v1/billing/meter_events`
- **Quota management**: Pre-paid token buckets per billing period
- **Tiered pricing**: Different per-token rates for different plan tiers
- **Cost allocation**: Distribute AI costs across tenants based on consumption
- **Invoice integration**: Usage summaries included in monthly invoices

## Mental Models

- **AWS billing for AI**: Like AWS meter your API calls — usage is tracked, aggregated, and billed to the customer. Each AI call is a billable event.
- **SaaS usage metering**: Like Stripe's usage-based billing for SMS or API calls — track consumption, send to Stripe, invoice customer at period end.

## Internal Mechanics

Metering flow:
1. Each AI call records usage (tokens, model, user_id, tenant_id)
2. Usage aggregated periodically (every hour or daily)
3. Aggregated events sent to Stripe Metering API
4. Stripe calculates charges based on plan pricing
5. Invoice generated at billing period end
6. Quotas check current period usage against plan limits

In-app implementation for quota management:
1. User makes AI request
2. Check current period usage against user's plan quota
3. If under quota: allow request, record usage
4. If over quota: reject or downgrade model with upgrade prompt
5. Quota resets at billing period

## Patterns

- **Dual tracking**: In-app (real-time quota enforcement) + Stripe (billing). In-app uses faster, approximate counts. Stripe uses provider-reported exact counts.
- **Tiered metering rates**: Free tier: $0 (limited quota). Pro tier: per-token pricing. Enterprise: flat rate + fair use.
- **Quota notification**: Warn user at 80% quota consumption — upsell opportunity
- **Admin override**: Allow admin to grant quota overrides and exemption codes

## Architectural Decisions

- **Decision**: In-app vs. Stripe-only billing → Both. In-app for real-time enforcement (no Stripe latency). Stripe for invoicing and payment processing.
- **Decision**: Aggregation interval → Hourly for high-volume apps. Daily for lower volume. More frequent = more Stripe API calls.
- **Decision**: Quota reset → Align with subscription billing cycle. Monthly billing → monthly quota reset. Annual billing → annual quota.

## Tradeoffs

| Aspect | In-App Only | Stripe Only | Both |
|--------|-------------|-------------|------|
| Real-time enforcement | Yes | No (Stripe latency) | Yes |
| Billing accuracy | Approximate | Exact | Both |
| Complexity | Low | Medium | High |
| Stripe API costs | None | Per-event fee | Both |
| Latency for enforcement | None | 200-500ms | ~15ms |

## Performance Considerations

- Usage recording: <5ms per request (Redis counter increment)
- Aggregation job: scheduled, not real-time — negligible user-facing impact
- Stripe API calls: batched per aggregation interval
- Quota check: <1ms (Redis counter read)
- Stripe metering event: ~200ms per batch — run as queued job

## Production Considerations

- Handle Stripe API failures gracefully — queue events for retry, don't block app
- Reconcile in-app vs. Stripe usage monthly — identify discrepancies
- Monitor Stripe metering event volume — high-volume apps may need batching
- Implement meter event idempotency — prevent double-billing on retry
- Store usage records for audit — immutable log of all AI consumption
- Handle mid-cycle plan upgrades — pro-rate quota
- GDPR: usage data is personal data — include in data retention policy

## Common Mistakes

- Building billing on approximate token counts — always reconcile with provider-reported usage
- No idempotency on usage events — retry causes double-billing
- Synchronous Stripe API calls during AI request — adds 200-500ms latency
- Not handling quota exhaustion gracefully — user gets hard error instead of upgrade prompt
- Mixing test and production usage data in Stripe — separate Stripe environments
- Ignoring multi-currency billing — AI pricing is USD, but customers may bill in local currency

## Failure Modes

- **Stripe outage**: Meter events queued but not sent — delayed billing. Queue with retry, alert on prolonged failure.
- **Usage reconciliation failure**: In-app count differs from Stripe count by >5% — investigate and correct.
- **Quota race condition**: Two requests check quota simultaneously, both pass — quota exceeded. Use atomic Redis operations.
- **Mid-cycle data loss**: Redis flush loses accumulated usage — partial billing period. Persist to DB periodically.
- **Meter event limit**: Stripe rate limit on metering events — batch more aggressively.

## Ecosystem Usage

- `ajooda/laravel-ai-metering`: Complete Stripe billing integration for AI usage
- Stripe Metering API: standard for usage-based billing
- Custom implementation: track usage in Redis, send to Stripe via queued job
- CSV export for non-Stripe billing workflows

## Related Knowledge Units

- KU-040: Token Tracking & Cost Estimation
- KU-041: Budget Enforcement
- KU-043: Filament Observability Dashboards

## Research Notes

- Stripe Metering API launched 2024 — purpose-built for usage-based billing
- Billing integration is critical for SaaS products embedding AI features
- Most SaaS AI products bill via usage metering, not flat-rate
- Quota management is typically feature-gated — different tokens per plan tier
- No first-party billing integration in Laravel AI SDK — community packages provide this
