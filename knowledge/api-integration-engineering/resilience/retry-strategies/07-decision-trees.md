# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 04-resilience
**Knowledge Unit:** retry-strategies
**Generated:** 2026-06-03

---

# Decision Inventory

1. Retryable Failure Classification
2. Backoff Strategy Selection
3. Retry Budget and Deadline Strategy

---

# Architecture-Level Decision Trees

---

## Retryable Failure Classification

---

## Decision Context

Determining which HTTP errors and exceptions should trigger a retry.

---

## Decision Criteria

* reliability
* security

---

## Decision Tree

Is the status code 5xx (server error)?
↓
YES → Retryable (upstream had a transient server issue)
  ↓
  Is it 503 (Service Unavailable)?
  ↓
  YES → Definitely retry; upstream is temporarily overwhelmed
  NO → Retry with standard backoff
NO → Is the status code 429 (rate limited)?
  ↓
  YES → Retryable; respect Retry-After header if present
  NO → Is it a network/timeout/connection error?
    ↓
    YES → Retryable; network issues are typically transient
    NO → Is it a 4xx client error (400, 401, 403, 404, 409)?
      ↓
      YES → NOT retryable (client error won't succeed on retry)
        ↓
        Exception: 409 Conflict with etag-based retry?
        ↓
        YES → Conditional retry with fresh data (not plain retry)
        NO → Never retry; client error is permanent
      NO → Unexpected error; generally not retryable

---

## Rationale

5xx and network errors are transient — the upstream may recover. 4xx are client errors that the same request won't fix. 429 is retryable but only after the specified delay.

---

## Recommended Default

**Default:** Retry 5xx, 429, timeouts, and network errors; never retry 4xx
**Reason:** Matches industry standard; prevents wasting retries on permanent errors

---

## Risks Of Wrong Choice

Retrying 4xx errors wastes resources and may cause account lockout (401 retries). Not retrying 5xx misses recovery opportunities. Retrying 429 without Retry-After wastes attempts.

---

## Related Rules

Only Retry on Retryable Status Codes, Use Exponential Backoff with Jitter

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Backoff Strategy Selection

---

## Decision Context

Choosing the delay pattern between retry attempts.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Is the failure likely to be resolved quickly (<5s)?
↓
YES → Use exponential backoff with aggressive initial delay (100ms-500ms)
  ↓
  Is upstream prone to thundering herd sensitivity?
  ↓
  YES → Add full jitter to spread retries
  NO → Pure exponential (predictable, simple)
NO → Is the failure due to upstream overload?
  ↓
  YES → Exponential backoff with higher base (5-30s) and full jitter
  NO → Standard exponential with moderate base (1-5s)
  ↓
  Need to respect upstream Retry-After header?
  ↓
  YES → Follow Retry-After when present; fall back to exponential
  NO → Exponential backoff only
  ↓
  Overall deadline for retry sequence?
  ↓
  YES → Calculate max attempts from deadline ÷ (avg attempt time + backoff)
  NO → Hard cap at 3-5 attempts regardless of deadline

---

## Rationale

Exponential backoff with jitter is the industry standard for retry. The base delay should match the expected recovery time of the failure mode. A deadline bounds the total retry duration.

---

## Recommended Default

**Default:** Exponential backoff with full jitter (1s base, 30s max, 3 attempts)
**Reason:** Standard AWS-recommended pattern; balances recovery time vs latency

---

## Risks Of Wrong Choice

Too-aggressive backoff overwhelms upstream on recovery. Too-slow backoff extends total operation time without benefit. No jitter causes thundering herd.

---

## Related Rules

Cap Maximum Retries, Set Overall Deadline for Retry Sequence

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Retry Budget and Deadline Strategy

---

## Decision Context

Preventing retry amplification and bounding total retry time.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Is there a risk of retry amplification (one failure triggers many retries)?
↓
YES → Implement retry budget per time window
  ↓
  Does the upstream have rate limits?
  ↓
  YES → Include rate limit in retry budget calculation
  NO → Simple retry count cap per window is sufficient
NO → Is the operation user-facing with latency expectations?
  ↓
  YES → Set overall deadline (e.g., 10s total including retries)
  NO → Hard cap at 3-5 attempts without deadline
  ↓
  Need shorter timeout per retry attempt?
  ↓
  YES → Decrease timeout on each retry (first 30s, second 15s, third 5s)
  NO → Same timeout for all attempts
  ↓
  Log each retry attempt?
  ↓
  YES → Log with attempt number, delay, and error for debugging
  NO → No retry logging; harder to debug transient failures

---

## Rationale

Retry budget prevents a single failure from generating excessive retry load. Overall deadline bounds user-facing latency. Decreasing per-attempt timeout avoids long waits on likely-to-fail retries.

---

## Recommended Default

**Default:** 3 retry attempts; 10s total deadline; log each retry
**Reason:** Standard safe defaults; bounded latency; debug visibility

---

## Risks Of Wrong Choice

No retry budget allows retry amplification (each failure triggers N retries, which each trigger N more). No deadline allows retries to extend total operation time indefinitely.

---

## Related Rules

Log Each Retry Attempt with Reason and Attempt Number

---

## Related Skills

Implement Retry and Circuit Breaker
