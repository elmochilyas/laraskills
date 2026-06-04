# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** fintech-webhook-slas
**Generated:** 2026-06-03

---

# Decision Inventory

1. Delivery Reliability Strategy (At-Least-Once vs Exactly-Once)
2. Reconciliation Strategy (Event Matching vs Periodic)
3. SLA/SLO Target Setting Strategy

---

# Architecture-Level Decision Trees

---

## Delivery Reliability Strategy

---

## Decision Context

Choosing delivery semantics for fintech webhook processing.

---

## Decision Criteria

* reliability
* security

---

## Decision Tree

Does the webhook trigger a financial transaction?
↓
YES → At-least-once delivery with idempotent processing
  ↓
  Does the provider guarantee webhook delivery?
  ↓
  YES → Implement idempotency key as webhook ID; TTL matching retry window
  NO → Implement outbox pattern for guaranteed delivery on our side
NO → Does the webhook carry compliance-relevant data?
  ↓
  YES → At-least-once with audit logging and reconciliation
  NO → At-most-once is acceptable for non-financial notifications
  ↓
  Need exactly-once processing guarantees?
  ↓
  YES → Idempotency key + distributed locking + inbox pattern
  NO → At-least-once with idempotent processing is sufficient

---

## Rationale

At-least-once delivery with idempotent processing is the standard for financial webhooks. Exactly-once requires additional coordination (locking + inbox) but eliminates duplicate processing risk.

---

## Recommended Default

**Default:** At-least-once delivery with idempotency key deduplication
**Reason:** Prevents data loss; safe retry; no duplicate financial side effects

---

## Risks Of Wrong Choice

At-most-once for financial webhooks risks silent data loss. Exactly-once without locking allows concurrent duplicate processing.

---

## Related Rules
Design for At-Least-Once Delivery with Idempotent Processing

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Reconciliation Strategy

---

## Decision Context

Choosing how to reconcile webhook events with financial records.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Does the provider offer reconciliation APIs (list all events)?
↓
YES → Implement periodic reconciliation job matching webhook events with API
  ↓
  Reconciliation window matches provider's retry horizon?
  ↓
  YES → Run reconciliation daily; cover the entire retry window
  NO → Adjust window to match provider's maximum delivery guarantee
NO → Is webhook delivery the sole notification channel?
  ↓
  YES → Implement compensating logic for late or missed delivery
  NO → Poll provider API as secondary channel for missed webhooks
  ↓
  Need to reconcile across multiple providers?
  ↓
  YES → Per-provider reconciliation with unified dashboard
  NO → Single reconciliation process for the sole provider

---

## Rationale

Reconciliation catches missed or duplicate webhooks by comparing webhook events against provider API data. It's the safety net for webhook delivery failures.

---

## Recommended Default

**Default:** Daily reconciliation job with idempotent processing
**Reason:** Catches missed events within provider's retry window; safe to run multiple times

---

## Risks Of Wrong Choice

No reconciliation allows unreconciled transactions to accumulate silently. Reconciliation without idempotency creates duplicate adjustments.

---

## Related Rules
Set Reconciliation Window to Match Max Retry Horizon

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie

---

## SLA/SLO Target Setting Strategy

---

## Decision Context

Setting and monitoring delivery SLAs for fintech webhooks.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Is there a contractual SLA with the provider or customers?
↓
YES → Define SLIs (latency, success rate) and SLOs based on contract
  ↓
  Can we measure delivery latency accurately?
  ↓
  YES → Track p50/p95/p99 delivery latency per provider
  NO → Track success/failure rate as primary SLI
NO → Are internal reliability targets needed?
  ↓
  YES → Set aggressive SLOs (99.9% delivered within 5 minutes)
  NO → Track without formal SLOs initially
  ↓
  Need to alert on SLO violations?
  ↓
  YES → Real-time alerting when delivery latency exceeds p99 threshold
  NO → Dashboard-only; no alerting on SLO breaches

---

## Rationale

SLIs and SLOs provide measurable reliability targets. Real-time alerting on SLO violations enables rapid response to delivery degradation.

---

## Recommended Default

**Default:** Track p99 delivery latency, success rate, duplicate rate per provider; alert on SLO breach
**Reason:** Quantifiable reliability; proactive alerting; per-provider visibility

---

## Risks Of Wrong Choice

No SLOs make reliability improvements reactive. Overly aggressive SLOs generate alert fatigue. No per-provider tracking hides degradation in one provider.

---

## Related Rules
Monitor Delivery SLIs Per Provider in Real-Time, Implement Compensating Transactions

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie
