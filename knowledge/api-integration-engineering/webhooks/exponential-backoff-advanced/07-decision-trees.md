# Metadata

**Domain:** API Integration Engineering
**Subdomain:** webhook-systems-outgoing
**Knowledge Unit:** Exponential Backoff Customization in Spatie webhook-server
**Generated:** 2026-06-03

---

# Decision Inventory

1. Backoff Strategy Selection (Default vs Custom)
2. Jitter Application (Pure Exponential vs Jitter-Based)
3. Max Attempts Configuration by Event Criticality

---

# Architecture-Level Decision Trees

---

## Backoff Strategy Selection

---

## Decision Context

Choosing between the default Spatie exponential backoff and a custom backoff strategy.

---

## Decision Criteria

* reliability
* architectural

---

## Decision Tree

Does the subscriber endpoint have documented rate limits or capacity constraints?
↓
YES → Implement custom backoff strategy matching subscriber capacity
  ↓
  Does the subscriber provide retry-after headers or rate limit info?
  ↓
  YES → Build adaptive backoff that reads subscriber feedback
  NO → Custom backoff with fixed parameters based on known limits
NO → Single webhook type with generic subscriber base?
  ↓
  YES → Default exponential backoff may suffice; evaluate subscriber behavior
    ↓
  Are subscribers heterogeneous with different capacity profiles?
    ↓
  YES → Custom per-subscriber or per-webhook-type backoff strategies
  NO → Default backoff with jitter is acceptable baseline
NO → Is the webhook volume high enough for retry storms to matter?
  ↓
  YES → Custom backoff with jitter is strongly recommended
  NO → Default exponential backoff is fine for low-volume systems

---

## Rationale

Default exponential backoff doubles delay each attempt. Custom strategies are needed when subscribers have specific rate limits, when different event types need different schedules, or when jitter is required to prevent thundering herd.

---

## Recommended Default

**Default:** Jitter-based exponential backoff with ±25% variance
**Reason:** Prevents thundering herd; respects subscriber rate limits; simple to implement

---

## Risks Of Wrong Choice

Pure exponential backoff without customization can overwhelm recovered subscribers with synchronized retry bursts. Default backoff may not match subscriber capacity, causing cascading failures.

---

## Related Rules

Use Jitter-Based Exponential Backoff as Default, Customize Backoff Per Event Type

---

## Related Skills

Apply Exponential Backoff with Jitter to Webhook Delivery

---

## Jitter Application

---

## Decision Context

Choosing whether to add jitter to exponential backoff delays.

---

## Decision Criteria

* reliability

---

## Decision Tree

Could multiple webhook deliveries fail simultaneously (service outage, network issue)?
↓
YES → Add jitter (±25%) to backoff delays; never use pure exponential
  ↓
  Is the subscriber a shared service used by many of your systems?
  ↓
  YES → Jitter is critical; synchronized retry from all systems will overwhelm it
  NO → Jitter still recommended; distributed systems have unpredictable retry alignment
NO → Single webhook at a time from a single sender?
  ↓
  YES → Jitter is less critical but still beneficial for avoiding periodic collisions
  NO → Multiple concurrent webhook senders?
    ↓
    YES → Jitter is mandatory to prevent thundering herd
    NO → Pure exponential may work but jitter adds safety with no cost
  ↓
  Subscriber uses fixed-interval retry window?
  ↓
  YES → Jitter may extend delivery beyond subscriber time window; evaluate carefully
  NO → Jitter always recommended for production reliability

---

## Rationale

Jitter (±25%) randomizes retry timing so that when a subscriber recovers after an outage, all retrying requests don't arrive simultaneously. This prevents the thundering herd problem that can cascade into a secondary outage.

---

## Recommended Default

**Default:** Apply ±25% jitter to all exponential backoff delays
**Reason:** Prevents thundering herd; negligible computational cost; no downside in production

---

## Risks Of Wrong Choice

Pure exponential backoff causes synchronized retry storms on service recovery. All failed webhooks retry at identical intervals, overwhelming the subscriber endpoint when it comes back online.

---

## Related Rules

Use Jitter-Based Exponential Backoff as Default

---

## Related Skills

Apply Exponential Backoff with Jitter to Webhook Delivery

---

## Max Attempts Configuration

---

## Decision Context

Setting the maximum number of retry attempts based on webhook event criticality.

---

## Decision Criteria

* reliability
* architectural

---

## Decision Tree

Is the webhook event business-critical (payment, order, account change)?
↓
YES → Configure 10-15 max attempts for a 24-hour delivery window
  ↓
  Does the subscriber need delivery within a specific time SLA?
  ↓
  YES → Calculate max attempts: SLA / base_delay; configure accordingly
  NO → 10-15 attempts with exponential backoff gives ~8-24 hour window
NO → Is the webhook a non-critical notification or log event?
  ↓
  YES → Configure 3-5 max attempts; premature failure is acceptable
    ↓
  Is the system high-volume with many non-critical webhooks?
    ↓
  YES → Aggressive limits (3 max) conserve queue resources
  NO → Moderate limits (5 max) provide reasonable delivery without waste
NO → Is the webhook fire-and-forget with no retry needed?
  ↓
  YES → Set max_attempts to 1; no retry on failure
  NO → Default to 5-10 attempts based on event importance
  ↓
  Need to distinguish between transient and permanent failures?
  ↓
  YES → Implement circuit breaker pattern; skip retries for dead endpoints
  NO → Standard retry with fixed max attempts suffices

---

## Rationale

Too few attempts cause premature failure on transient blips. Too many exhaust resources and delay final failure detection. Match max attempts to business criticality and delivery SLA.

---

## Recommended Default

**Default:** 10 attempts for critical webhooks; 5 attempts for non-critical webhooks
**Reason:** Balances delivery reliability with resource conservation; aligns with typical 8-24 hour delivery windows

---

## Risks Of Wrong Choice

Too few attempts: critical webhooks fail on transient network blips. Too many attempts: non-critical webhooks waste queue worker capacity and database storage on futile retries.

---

## Related Rules

Set Max Attempts Based on Business Criticality

---

## Related Skills

Apply Exponential Backoff with Jitter to Webhook Delivery
