# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** K023 — Dead-Letter Queue Pattern and Poison Messages
**Generated:** 2026-06-03

---

# Decision Inventory

* Application-Level DLQ vs Infrastructure-Level DLQ
* Poison Message Detection Strategy

---

# Architecture-Level Decision Trees

---

## Application-Level DLQ vs Infrastructure-Level DLQ

---

### Decision Context

Whether to implement dead-letter handling in application code (dispatch to DLQ queue in `failed()`) or rely on infrastructure-level DLQ (SQS Redrive, RabbitMQ DLX).

---

### Decision Criteria

* Queue driver (Redis vs SQS vs RabbitMQ)
* Need for custom DLQ processing logic
* Cross-driver consistency
* Operational complexity tolerance

---

### Decision Tree

Driver is Redis?
YES → Application-level DLQ — dispatch to dead-letter queue in failed()
NO → Driver is SQS with Redrive Policy?
    YES → Infrastructure DLQ available — simpler, no application code
NO → Driver is RabbitMQ with DLX?
    YES → Infrastructure DLQ available — configure exchange-level DLX
NO → Need custom per-job DLQ routing?
    YES → Application-level DLQ — full control over routing logic
NO → Default?
    YES → Application-level DLQ — works with all drivers

---

### Rationale

Infrastructure-level DLQ (SQS Redrive, RabbitMQ DLX) moves messages automatically without application code. Application-level DLQ gives full control over routing and works with any driver (including Redis, which has no native DLQ).

---

### Recommended Default

**Default:** Application-level DLQ for Redis (no native DLQ); infrastructure-level DLQ for SQS/RabbitMQ; always implement poison message detection
**Reason:** Redis has no native dead-letter mechanism. SQS/RabbitMQ have built-in DLQ support. Poison detection should always be implemented.

---

### Risks Of Wrong Choice

- No DLQ at all: failed jobs permanently lost after max attempts
- Infrastructure DLQ without monitoring: messages pile up silently
- Application DLQ without poison detection: all retries consumed before DLQ

---

### Related Rules

- implement-poison-message-detection
- monitor-dlq-depth-and-age

---

### Related Skills

- Set Up Queue Failure Handling and Retries

---

## Poison Message Detection Strategy

---

### Decision Context

How to detect poison messages — jobs that can never succeed and waste retry attempts.

---

### Decision Criteria

* Time to first failure (under 1 second indicates no real processing)
* Repeated failure pattern
* Failure consistency across retries

---

### Decision Tree

Job fails within 1 second on first retry?
YES → Likely poison message — dispatch to DLQ immediately after 2 rapid failures
NO → Job fails on same exception consistently?
    YES → Poison message — same exception, no progress
NO → Job fails with different exceptions?
    YES → Not poison — transient issues, continue retrying
NO → Default?
    YES → After 3 retries with same exception, classify as poison

---

### Rationale

A poison message fails immediately because the underlying data or condition is permanently invalid. Early detection saves retry attempts and worker time. A job that fails on first retry in <1 second (no real processing) is a strong poison indicator.

---

### Recommended Default

**Default:** Detect poison messages by monitoring retry time; if first retry fails in <1 second, categorize as poison and DLQ after 2 rapid attempts
**Reason:** Saves retry attempts for permanently failing jobs. Two rapid failures confirm the pattern before moving to DLQ.

---

### Risks Of Wrong Choice

- No poison detection: all retries consumed for doomed jobs — worker time wasted
- Aggressive detection (single failure): false positives — transient slow start classified as poison
- No DLQ reprocessing: poison messages never re-examined

---

### Related Rules

- implement-poison-message-detection
- monitor-dlq-depth-and-age

---

### Related Skills

- Set Up Queue Failure Handling and Retries
