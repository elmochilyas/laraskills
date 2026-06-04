# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** delivery-retry
**Generated:** 2026-06-03

---

# Decision Inventory

1. Backoff Strategy Selection (Exponential vs Custom Schedule)
2. Error-Aware Retry Strategy
3. Final Failure and Dead Letter Strategy

---

# Architecture-Level Decision Trees

---

## Backoff Strategy Selection

---

## Decision Context

Choosing the retry delay pattern for failed webhook deliveries.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Is the subscriber a critical service with strict delivery SLA?
↓
YES → Use exponential backoff with jitter (10s base, 3600s max)
  ↓
  Does the subscriber have documented preferred retry schedule?
  ↓
  YES → Use subscriber-specific custom backoff schedule
  NO → Standard exponential backoff with jitter is sufficient
NO → Is the subscriber an internal service in the same network?
  ↓
  YES → Shorter exponential backoff (5s base, 300s max, 5 attempts)
  NO → Standard exponential with moderate base (30s) and cap (3600s)
  ↓
  Multiple subscribers with different capacity?
  ↓
  YES → Per-subscriber backoff configuration based on subscriber tier
  NO → Uniform backoff for all subscribers

---

## Rationale

Exponential backoff gives recovering subscribers time to stabilize. Jitter prevents synchronized retry across subscribers. Per-subscriber backoff matches retry pattern to subscriber capacity.

---

## Recommended Default

**Default:** Exponential backoff with full jitter (10s base, 3600s max, 10 attempts)
**Reason:** Standard pattern respected by all subscriber types; balances delivery speed vs recovery time

---

## Risks Of Wrong Choice

Too-aggressive backoff overwhelms recovering subscribers. Too-slow backoff misses delivery SLAs. No jitter causes thundering herd on subscriber recovery.

---

## Related Rules

Use Exponential Backoff with Full Jitter, Implement Error-Aware Strategies

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Error-Aware Retry Strategy

---

## Decision Context

Adjusting retry behavior based on subscriber HTTP response status.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Does the subscriber return 429 (rate limited)?
↓
YES → Follow Retry-After header delay; ignore exponential backoff for this attempt
  ↓
  Retry-After header present and valid?
  ↓
  YES → Release job with Retry-After value as delay
  NO → Use exponential backoff as fallback; longer than typical window
NO → Does the subscriber return 5xx (server error)?
  ↓
  YES → Use standard exponential backoff; subscriber needs recovery time
  NO → Does the subscriber return 4xx (client error)?
    ↓
    YES → Do NOT retry; mark as permanently failed (invalid request)
    NO → Network/timeout errors: retry with standard exponential backoff
  ↓
  Different subscribers return different error codes?
  ↓
  YES → Implement subscriber-specific error classification
  NO → Global error classification is sufficient

---

## Rationale

429 responses indicate rate limiting — the subscriber wants retry but with a specific delay. 5xx indicates server error — exponential backoff gives recovery time. 4xx (except 429) are client errors that won't succeed on retry.

---

## Recommended Default

**Default:** Follow Retry-After for 429; exponential backoff for 5xx; never retry 4xx
**Reason:** Respects subscriber rate limits; gives recovery time; avoids wasted retries on client errors

---

## Risks Of Wrong Choice

Retrying on 4xx sends invalid requests repeatedly, wasting resources. Ignoring Retry-After on 429 may cause subscriber to escalate to blocking. Treating all errors the same misses optimization opportunities.

---

## Related Rules

Implement Error-Aware Strategies: 429 Follows Retry-After, 5xx Uses Exponential

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Final Failure and Dead Letter Strategy

---

## Decision Context

Handling webhooks that have exhausted all retry attempts.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Have all retry attempts been exhausted?
↓
YES → Fire FinalWebhookCallFailedEvent for business logic fallback
  ↓
  Is alternative delivery path needed (email, SMS, manual queue)?
  ↓
  YES → Implement fallback in event listener; trigger alternative channel
  NO → Log failure and alert; no alternative delivery
NO → Are consecutive failures being tracked?
  ↓
  YES → Disable subscriber after threshold (e.g., 10 consecutive failures)
  NO → Keep sending; subscriber may recover before max attempts
  ↓
  Need dead letter queue for analysis?
  ↓
  YES → Copy failed webhook to separate dead letter table for analysis
  NO → Failed webhooks only in webhook_calls table with failed status
  ↓
  Manual retry capability needed?
  ↓
  YES → Implement Artisan command or dashboard to retry failed calls
  NO → Failed webhooks are final; no manual re-processing

---

## Rationale

Final failure handling completes the retry lifecycle with clear escalation. Dead letter queue preserves failed webhooks for postmortem analysis. Manual retry enables operator recovery without code changes.

---

## Recommended Default

**Default:** Fire FinalWebhookCallFailedEvent; disable subscriber after 10 consecutive failures; Artisan command for retry
**Reason:** Full lifecycle management with operational visibility and recovery path

---

## Risks Of Wrong Choice

No final failure handling silently drops undelivered webhooks. No subscriber disable sends unlimited retries to dead endpoints. No manual retry requires code deployment to re-process.

---

## Related Rules

Set Max Attempts to 5-10, Listen to FinalWebhookCallFailedEvent

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie
