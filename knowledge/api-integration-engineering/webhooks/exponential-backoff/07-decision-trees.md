# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** exponential-backoff
**Generated:** 2026-06-03

---

# Decision Inventory

1. Backoff Formula Selection
2. Jitter Strategy Selection
3. Retry Budget Configuration
4. Delay Cap and Attempt Limit Strategy

---

# Architecture-Level Decision Trees

---

## Backoff Formula Selection

---

## Decision Context

Choosing the backoff calculation formula for webhook delivery retries.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Does the delivery SLA require rapid initial retry?
↓
YES → Use exponential backoff with low base delay (1s-5s initial)
  ↓
  Need predictable retry timing for capacity planning?
  ↓
  YES → Pure exponential: delay = base * (2 ^ attempt)
  NO → Full jitter exponential prevents thundering herd
NO → Is the subscriber sensitive to request bursts?
  ↓
  YES → Use exponential backoff with higher base delay (10s-60s)
  NO → Standard exponential with moderate base delay (5s-10s)
  ↓
  Need to respect subscriber Retry-After headers?
  ↓
  YES → Use subscriber-provided delay when present; fall back to exponential
  NO → Exponential backoff only; ignore Retry-After

---

## Rationale

Low base delay with exponential growth enables quick initial retry while rapidly backing off. Pure exponential provides predictable timing; jittered exponential prevents synchronized retry storms.

---

## Recommended Default

**Default:** Full jitter exponential with base 10s, max 3600s
**Reason:** Balances quick recovery with thundering herd prevention across common subscriber capacities

---

## Risks Of Wrong Choice

No backoff (fixed interval) causes cascade failures on subscriber recovery. Too-low base delay overwhelms recovering subscribers. Too-high base delay extends delivery SLA unnecessarily.

---

## Related Rules

Always Add Jitter to Backoff Delays, Cap Maximum Backoff Delay

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Jitter Strategy Selection

---

## Decision Context

Choosing the type of jitter to apply to exponential backoff delays.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Is preventing thundering herd the primary concern?
↓
YES → Use full jitter: delay = random(0, base * 2^attempt)
  ↓
  Need to minimize worst-case delivery time?
  ↓
  YES → Use equal jitter: delay = (base * 2^attempt) / 2 + random(0, (base * 2^attempt) / 2)
  NO → Full jitter provides best thundering herd prevention
NO → Is predictability more important than herd prevention?
  ↓
  YES → Use no jitter — pure exponential with known delay schedule
  NO → Use full jitter for general-purpose retry resilience
  ↓
  Multiple retrying subscribers that share a downstream?
  ↓
  YES → Full jitter is mandatory to prevent synchronized retries
  NO → Equal jitter is acceptable for lower contention scenarios

---

## Rationale

Full jitter provides the best thundering herd prevention by spreading retries uniformly across the backoff window. Equal jitter provides a minimum delay guarantee while still adding variance. No jitter offers predictability at the cost of herd vulnerability.

---

## Recommended Default

**Default:** Full jitter for all retry scenarios
**Reason:** Best thundering herd prevention; simplest implementation; suitable for most workloads

---

## Risks Of Wrong Choice

No jitter causes all retries to fire simultaneously, recreating the original failure condition. Equal jitter still has a predictable component that can synchronize under high concurrency.

---

## Related Rules

Always Add Jitter to Backoff Delays

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Retry Budget Configuration

---

## Decision Context

Determining how many retry attempts to allow within a delivery SLA.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Does the webhook have a critical delivery SLA (<1 hour)?
↓
YES → Calculate max attempts from SLA: high base + few attempts
  ↓
  SLA requires delivery within 5 minutes?
  ↓
  YES → 3-5 attempts with 10s base, 60s cap (total ~3min median)
  NO → 10-15 attempts with 10s base, 3600s cap (total ~6hr median)
NO → Is this a non-critical informational webhook?
  ↓
  YES → 3-5 attempts maximum; log and forget on failure
  NO → 7-10 attempts with standard backoff parameters
  ↓
  Need to respect subscriber rate limits during retry?
  ↓
  YES → Reduce base delay or cap; stay within subscriber's documented rate
  NO → Use default retry budget without rate limit adjustment

---

## Rationale

Max attempts should be calculated from the delivery SLA and backoff schedule. Critical webhooks need more attempts to ensure delivery, while informational webhooks can fail after fewer attempts.

---

## Recommended Default

**Default:** 10 attempts with 10s base, 3600s cap
**Reason:** ~6 hour total delivery window; sufficient for most business SLAs; manageable queue retention

---

## Risks Of Wrong Choice

Too few attempts on critical webhooks causes SLA misses. Too many on non-critical wastes queue capacity and delays final failure notification.

---

## Related Rules

Set Maximum Attempts Based on Business SLA

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Delay Cap and Attempt Limit Strategy

---

## Decision Context

Setting boundaries on backoff growth and total retry duration.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Does the webhook delivery need to complete within a business day?
↓
YES → Cap delay at 3600s (1 hour); max 10-15 attempts
  ↓
  Regulatory requirements demand delivery within specific window?
  ↓
  YES → Calculate cap to fit within regulatory window with margin
  NO → 1-hour cap is standard for most business operations
NO → Is the webhook purely informational with no SLA?
  ↓
  YES → Cap at 3600s; 5 max attempts; allow faster failure
  NO → Default cap of 3600s with 10 attempts covers most cases
  ↓
  Multiple subscribers with different SLAs?
  ↓
  YES → Configure per-subscriber cap and max_attempts in subscriber config
  NO → Single global configuration is sufficient for uniform subscribers

---

## Rationale

A 1-hour delay cap prevents exponential growth from creating multi-day delays between retries. Combined with max_attempts, it provides both an upper bound on individual delay and total delivery window.

---

## Recommended Default

**Default:** 3600s max delay cap, 10 max attempts
**Reason:** Prevents multi-day delays while providing ~6 hour total delivery window

---

## Risks Of Wrong Choice

No delay cap creates multi-day delays between retries, delaying final failure notification. No max attempts causes infinite retry loops. Too-low cap combined with high attempts unnecessarily extends delivery window.

---

## Related Rules

Cap Maximum Backoff Delay, Set Maximum Attempts Based on Business SLA

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries
