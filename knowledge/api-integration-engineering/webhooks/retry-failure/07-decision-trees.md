# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** retry-failure
**Generated:** 2026-06-03

---

# Decision Inventory

1. Retry Backoff Strategy (Exponential vs Fixed)
2. Circuit Breaker Integration Strategy
3. Final Failure Escalation Strategy

---

# Architecture-Level Decision Trees

---

## Retry Backoff Strategy

---

## Decision Context

Choosing the retry backoff pattern for failed webhook processing jobs.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Is the processing failure due to a downstream API call?
↓
YES → Use exponential backoff with jitter (30s base, 12h max)
  ↓
  Does the downstream return 429 with Retry-After?
  ↓
  YES → Use error-aware backoff; follow Retry-After when present
  NO → Standard exponential backoff with jitter is sufficient
NO → Is the failure internal (database, queue, infrastructure)?
  ↓
  YES → Short backoff (5-10s) with fewer attempts (3-5)
  NO → Default exponential backoff with 10 attempts
  ↓
  Job fails on every retry without progress?
  ↓
  YES → Set $maxExceptions to 3; fail permanently after threshold
  NO → Continue retrying with backoff; transient failures are expected

---

## Rationale

Exponential backoff with jitter prevents retry storms on recovering downstream services. Error-aware backoff respects downstream rate limits. Max exceptions prevents non-transient errors from consuming all retry attempts.

---

## Recommended Default

**Default:** Exponential backoff (30s base, 12h max, full jitter) with $maxExceptions = 3
**Reason:** Balances retry opportunity against resource consumption; stops on persistent errors

---

## Risks Of Wrong Choice

Fixed-interval retry creates retry storms. No max exceptions exhausts all retries on non-transient errors. Exponential without jitter causes synchronized retry across jobs.

---

## Related Rules

Configure Exponential Backoff with Jitter for Webhook Retry, Apply Circuit Breaker Middleware

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries

---

## Circuit Breaker Integration Strategy

---

## Decision Context

Integrating circuit breaker with webhook retry to stop retries during outages.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Does the webhook processing depend on a specific downstream service?
↓
YES → Apply Fuse CircuitBreakerMiddleware on the webhook job
  ↓
  Is the downstream service currently failing?
  ↓
  YES → Circuit breaker opens; job releases with delay until half-open
  NO → Circuit is closed; normal retry proceeds
NO → Is the processing purely internal (no external dependencies)?
  ↓
  YES → Circuit breaker not needed; focus on retry configuration
  NO → Circuit breaker recommended if any external dependency exists
  ↓
  Need to distinguish between downstream outage and transient blip?
  ↓
  YES → Circuit breaker tracks failure count; opens only after threshold
  NO → Use $maxExceptions for simpler per-job throttling

---

## Rationale

Circuit breaker prevents retry chains from hammering a downed service. When the circuit is open, jobs are released with delay instead of being retried immediately, giving the downstream time to recover.

---

## Recommended Default

**Default:** Fuse CircuitBreakerMiddleware on all webhook jobs with external dependencies
**Reason:** Prevents retry storms during outages; automatically resumes when service recovers

---

## Risks Of Wrong Choice

No circuit breaker causes retries to hammer a failing service, delaying recovery. Retry-only (no circuit breaker) on a downed service exhausts all attempts quickly without giving recovery time.

---

## Related Rules

Apply Fuse CircuitBreakerMiddleware for Queue Job Circuit Breaking, Set $maxExceptions to 3

---

## Related Skills

Implement Retry and Circuit Breaker

---

## Final Failure Escalation Strategy

---

## Decision Context

Handling webhooks that have exhausted all retry attempts.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Has the webhook exhausted all retry attempts ($tries)?
↓
YES → Fire FinalWebhookCallFailedEvent for business logic fallback
  ↓
  Is manual retry capability needed?
  ↓
  YES → Implement UI dashboard or Artisan command for retry
  NO → Log failure; no manual intervention path
NO → Has the job exceeded $maxExceptions?
  ↓
  YES → Move to failed_jobs table; mark permanently failed
  NO → Continue retry cycle with backoff
  ↓
  Need alternative delivery path (email, SMS) for critical webhooks?
  ↓
  YES → Implement fallback notification in FinalWebhookCallFailedEvent listener
  NO → Log and alert only; no alternative delivery

---

## Rationale

FinalWebhookCallFailedEvent is the standard hook for business logic fallback when all retries are exhausted. Manual retry UI enables operators to re-process failed webhooks after fixing the root cause.

---

## Recommended Default

**Default:** Fire FinalWebhookCallFailedEvent with alerting; provide Artisan command for manual retry
**Reason:** Ensures operational visibility; enables manual recovery without code changes

---

## Risks Of Wrong Choice

No final failure event leaves permanent failures undetected until subscriber complains. No manual retry capability requires code deployment to re-process failed webhooks.

---

## Related Rules

Implement Manual Retry UI, Listen to FinalWebhookCallFailedEvent

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie
