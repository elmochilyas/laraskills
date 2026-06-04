# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** webhook-retry-logic
**Generated:** 2026-06-03

---

# Decision Inventory

1. Retry Event Recording Strategy
2. Retry Analytics and Optimization Strategy
3. Replay Strategy from Retry Events

---

# Architecture-Level Decision Trees

---

## Retry Event Recording Strategy

---

## Decision Context

Choosing when and what to record for retry attempt events.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Should retry attempts be recorded in an event store?
↓
YES → Record retry attempt event BEFORE executing the HTTP call
  ↓
  Include full context (attempt number, delay, subscriber, response)?
  ↓
  YES → Record full metadata for audit and analytics
  NO → Record minimal metadata (attempt number + status only)
NO → Is standard webhook_calls table tracking sufficient?
  ↓
  YES → Use Spatie's built-in attempt tracking (no event sourcing)
  NO → Custom retry event recording needed for compliance
  ↓
  Record retry metadata per attempt?
  ↓
  YES → Each attempt stored with timestamp, delay, response, error details
  NO → Aggregate retry status only (no per-attempt detail)

---

## Rationale

Event-sourced retry recording provides immutable audit trail and analytics capability. Standard table tracking is simpler for basic retry management without compliance requirements.

---

## Recommended Default

**Default:** Event-sourced retry recording for critical webhooks; table-based tracking for standard
**Reason:** Compliance-grade audit where needed; simplicity where not

---

## Risks Of Wrong Choice

No retry recording makes failure analysis impossible. Event sourcing for non-critical webhooks adds storage and complexity overhead.

---

## Related Rules
Record Retry Attempt Event BEFORE Executing Retry HTTP Call

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Retry Analytics and Optimization Strategy

---

## Decision Context

Using retry event data to optimize backoff strategies.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Are retry events being collected with full metadata?
↓
YES → Build retry effectiveness projector for analytics
  ↓
  Need to compare backoff strategies across providers?
  ↓
  YES → Track retry success rate per backoff strategy; optimize accordingly
  NO → Monitor aggregate retry effectiveness only
NO → Is basic retry monitoring sufficient?
  ↓
  YES → Standard webhook delivery metrics (success rate, latency) only
  NO → Implement retry event recording for analytics capability
  ↓
  Adjust backoff strategy based on analytics?
  ↓
  YES → A/B test backoff strategies; optimize based on retry success data
  NO → Fixed backoff configuration; no adjustment

---

## Rationale

Retry analytics from event data enables data-driven backoff optimization. Comparing strategies per provider identifies the most effective approach for each subscriber.

---

## Recommended Default

**Default:** Track retry effectiveness per strategy; quarterly review for optimization
**Reason:** Data-driven backoff tuning; minimal overhead; periodic optimization cadence

---

## Risks Of Wrong Choice

No analytics means retry strategy optimization is guesswork. Overly frequent strategy changes destabilize retry behavior. No per-provider tracking hides subscriber-specific patterns.

---

## Related Rules
Track Backoff Strategy Decisions Per Provider

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Replay Strategy from Retry Events

---

## Decision Context

Using recorded retry events to re-process failed webhook deliveries.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Need to re-process failed webhooks from retry event data?
↓
YES → Replay retry events through delivery projector with updated logic
  ↓
  Is the original outward webhook URL still valid?
  ↓
  YES → Replay delivery to the original subscriber
  NO → Alert on invalid URL; skip or update before replay
NO → Is audit-only review needed (no re-delivery)?
  ↓
  YES → Query retry events for analysis without replay
  NO → No replay or review capability needed
  ↓
  Replay all failed events in batch?
  ↓
  YES → Batch replay with rate limiting (respect subscriber capacity)
  NO → Selective replay per event

---

## Rationale

Retry event replay enables re-delivery after fixing subscriber or delivery bugs. Batch replay with rate limiting ensures re-delivery doesn't overwhelm subscribers.

---

## Recommended Default

**Default:** Selective replay per event with rate-limited batch capability
**Reason:** Controlled recovery; subscriber protection; operational flexibility

---

## Risks Of Wrong Choice

Full batch replay without rate limiting overwhelms recovering subscribers. No replay capability means failed webhooks are permanently lost. Replay without idempotency check causes duplicate delivery.

---

## Related Rules
Full Context: Attempt Number, Scheduled Delay, Actual Delay

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie
