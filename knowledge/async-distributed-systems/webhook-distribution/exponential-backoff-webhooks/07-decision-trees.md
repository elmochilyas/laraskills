# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Webhook Distribution
**Knowledge Unit:** exponential-backoff-webhooks
**Generated:** 2026-06-03

---

# Decision Inventory

* Fixed vs Exponential Backoff for Webhook Retries
* Webhook Retry Count Selection

---

# Architecture-Level Decision Trees

---

## Fixed vs Exponential Backoff for Webhook Retries

---

### Decision Context

Whether to use fixed or exponential backoff when retrying failed webhook deliveries.

---

### Decision Criteria

* Downstream service rate limits
* Recovery time requirements
* Thundering herd prevention

---

### Decision Tree

Downstream service has documented rate limits?
YES → Use exponential backoff — respect rate limit windows
NO → Multiple webhooks may fail simultaneously for the same service?
    YES → Use exponential + jitter — prevent thundering herd on recovery
NO → Single webhook to a reliable service?
    YES → Fixed backoff is acceptable
NO → Default?
    YES → Exponential backoff with jitter — industry standard

---

### Rationale

Webhook deliveries to external services are susceptible to rate limits and temporary outages. Exponential backoff with jitter is the industry standard for webhook retries, preventing thundering herd on service recovery.

---

### Recommended Default

**Default:** Exponential backoff with jitter for all webhook retries; fixed backoff only for internal, reliable services
**Reason:** External services have unpredictable recovery patterns. Exponential backoff gives the best recovery profile. Jitter prevents synchronized retries.

---

### Risks Of Wrong Choice

- Fixed for external APIs: considered aggressive, may trigger abuse protections
- No backoff: immediate retry loop burns retries with no recovery window
- No jitter: all retries synchronize on recovery — thundering herd

---

### Related Rules

- use-exponential-plus-jitter-for-external-apis

---

### Related Skills

- Configure Webhook Delivery and Backoff
- Set Up Queue Failure Handling and Retries

---

## Webhook Retry Count Selection

---

### Decision Context

Choosing the number of retry attempts for failed webhook deliveries.

---

### Decision Criteria

* Delivery time sensitivity
* Downstream service reliability
* Total retry time window
* Idempotency of webhook payload

---

### Decision Tree

Webhook is time-sensitive (password reset, payment notification)?
YES → 3-5 retries over 5-30 minutes — time matters more than retries
NO → Webhook is non-critical (analytics, reporting)?
    YES → 5-10 retries over 1-24 hours — maximize delivery probability
NO → Downstream service is unreliable?
    YES → More retries (8-10) over extended period
NO → Default?
    YES → 5 retries over 1-2 hours — balanced approach

---

### Rationale

More retries increase delivery probability but delay final failure notification. Time-sensitive webhooks need fewer retries over a shorter window. Non-critical webhooks benefit from more retries over a longer period.

---

### Recommended Default

**Default:** 5 retries with exponential backoff from 1 minute to 2 hours
**Reason:** Provides good delivery probability (95%+ for transient failures) while capping total retry time at ~2 hours. Adjust based on business requirements.

---

### Risks Of Wrong Choice

- Too few retries: transient failure causes permanent delivery failure
- Too many retries: delayed notification of permanent failure
- No idempotency check: duplicate delivery causes duplicate side effects

---

### Related Rules

- use-exponential-plus-jitter-for-external-apis

---

### Related Skills

- Configure Webhook Delivery and Backoff
