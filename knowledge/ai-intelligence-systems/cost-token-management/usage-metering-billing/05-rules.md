---
id: KU-042
title: "Usage Metering & Billing Integration - Rules"
subdomain: "cost-token-management"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Usage Metering & Billing Integration

### R1: Implement dual tracking — in-app counters for real-time enforcement and Stripe for billing accuracy
- **Category:** Architecture
- **Rule:** Track usage in Redis counters for real-time quota enforcement (sub-millisecond reads) and periodically send aggregated usage events to Stripe for invoicing; never rely on Stripe for real-time enforcement.
- **Reason:** Stripe's metering API has 200-500ms latency and rate limits. Using it for real-time quota checks would add unacceptable latency and risk hitting Stripe API limits during usage bursts.
- **Bad Example:** Checking Stripe's current usage balance via API before every AI request, adding 300ms+ latency to every call.
- **Good Example:** In-app Redis counter checked in middleware; queued job sends aggregated usage to Stripe every hour for invoicing.
- **Exceptions:** Low-traffic applications (<100 requests/day) where Stripe API latency is acceptable.
- **Consequences of Violation:** Significant latency added to every AI request; Stripe API rate limits triggered during usage spikes, causing enforcement failures.

### R2: Always implement idempotency for billing usage events to prevent double-billing
- **Category:** Reliability
- **Rule:** Include a unique idempotency key (e.g., `usage_{request_id}_{retry_count}`) in every usage event sent to Stripe; handle Stripe's idempotency responses correctly.
- **Reason:** Queued jobs that send metering events can fail and retry. Without idempotency, each retry creates a duplicate billing event, overcharging the customer.
- **Bad Example:** A queued job that sends usage data to Stripe without an idempotency key, then retries on failure and charges the customer twice.
- **Good Example:** Stripe usage event includes `idempotency_key` derived from the unique request ID, ensuring the same event is processed only once even if the job retries.
- **Exceptions:** Non-billing usage tracking where approximate counts are acceptable.
- **Consequences of Violation:** Customer invoicing errors, billing disputes, lost customer trust, and manual reconciliation effort.
