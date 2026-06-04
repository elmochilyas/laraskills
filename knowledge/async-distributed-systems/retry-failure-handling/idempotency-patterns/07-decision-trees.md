# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** idempotency-patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Idempotency Key Strategy
* At-Least-Once vs At-Most-Once Processing Guarantee

---

# Architecture-Level Decision Trees

---

## Idempotency Key Strategy

---

### Decision Context

How to implement idempotency for jobs that may process the same message multiple times.

---

### Decision Criteria

* Duplicate processing tolerance
* Processing guarantees (at-least-once vs exactly-once)
* Storage for idempotency keys
* Key scope (per job, per resource, per operation)

---

### Decision Tree

Job processes external action (charge, send email, API call)?
YES → Must be idempotent — implement idempotency key check
NO → Job updates local state (DB write)?
    YES → Use DB transaction + unique constraint — natural idempotency
NO → Job reads data only?
    YES → Idempotent by nature — no key needed
NO → Need exactly-once processing?
    YES → Idempotency key in Redis/cache with expiry

---

### Rationale

At-least-once delivery means a job may process multiple times. External actions (payments, API calls) must be idempotent to prevent duplicate side effects. Local DB writes can use unique constraints as natural idempotency.

---

### Recommended Default

**Default:** Implement idempotency for all jobs that have external side effects; use unique constraints for local DB writes
**Reason:** Prevents duplicate side effects from retry-driven re-execution. Local writes can use existing DB constraints.

---

### Risks Of Wrong Choice

- Non-idempotent payment processing: customer charged twice
- Non-idempotent email: duplicate notifications
- Idempotency key without expiry: storage grows unbounded
- Key expires too early: duplicate slips through window

---

### Related Rules

- implement-poison-message-detection

---

### Related Skills

- Set Up Queue Failure Handling and Retries

---

## At-Least-Once vs At-Most-Once Processing Guarantee

---

### Decision Context

Whether to design for at-least-once (duplicates possible) or at-most-once (some messages may be lost) processing.

---

### Decision Criteria

* Duplicate tolerance
* Message loss tolerance
* Idempotency implementation feasibility
* Queue driver guarantees

---

### Decision Tree

Message loss is unacceptable?
YES → At-least-once — accept duplicates, implement idempotency
NO → Duplicates are unacceptable and hard to make idempotent?
    YES → At-most-once — accept potential message loss
NO → FIFO queue with exactly-once available (SQS FIFO)?
    YES → Exactly-once — no duplicates, no loss (within throughput limits)
NO → Default?
    YES → At-least-once with idempotency — standard approach

---

### Rationale

Standard SQS queues are at-least-once by design. FIFO queues provide exactly-once but are limited to 300 TPS. The safest approach is designing for at-least-once with idempotency, which works regardless of queue driver guarantees.

---

### Recommended Default

**Default:** Design for at-least-once with idempotency; use SQS FIFO for exactly-once when throughput allows
**Reason:** At-least-once is the most common delivery guarantee. Idempotency makes it safe. FIFO exactly-once is the gold standard when throughput requirements permit.

---

### Risks Of Wrong Choice

- At-most-once for critical jobs: message loss means operation never happens
- Exactly-once assumption on standard SQS: SQS may deliver duplicates
- No idempotency with at-least-once: duplicate side effects on retry

---

### Related Rules

- implement-poison-message-detection

---

### Related Skills

- Set Up Queue Failure Handling and Retries
- Select and Configure the Right Queue Driver
