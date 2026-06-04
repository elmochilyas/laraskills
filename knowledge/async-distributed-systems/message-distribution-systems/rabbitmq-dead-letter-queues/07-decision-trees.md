# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** K037 — RabbitMQ Dead-Letter Queues
**Generated:** 2026-06-03

---

# Decision Inventory

* RabbitMQ DLX vs Application-Level DLQ
* DLX Routing Strategy

---

# Architecture-Level Decision Trees

---

## RabbitMQ DLX vs Application-Level DLQ

---

### Decision Context

Whether to use RabbitMQ's native Dead-Letter eXchange (DLX) or implement dead-letter handling in application code.

---

### Decision Criteria

* Queue driver (RabbitMQ native vs Laravel driver)
* Need for custom DLQ processing
* Routing flexibility requirements

---

### Decision Tree

Using RabbitMQ as direct queue backend (not through Laravel)?
YES → DLX is available — configure at exchange/queue level
NO → Using Laravel's queue driver for RabbitMQ?
    YES → Application-level DLQ in failed() — Laravel abstraction limits DLX access
NO → Need per-message dead-letter routing?
    YES → Application-level DLQ — full control over routing
NO → Default?
    YES → Infrastructure DLX for RabbitMQ-native; application-level for Laravel driver

---

### Rationale

RabbitMQ DLX automatically routes rejected/expired messages to a dead-letter exchange. When using Laravel's queue driver, the DLX configuration may need to be done at the broker level (not in Laravel config). Application-level DLQ works regardless of driver constraints.

---

### Recommended Default

**Default:** Use RabbitMQ DLX at broker level when possible; fall back to application-level DLQ in Laravel's failed() method
**Reason:** DLX is automatic at the broker level, requiring no application code. Laravel's abstraction may limit DLX access.

---

### Risks Of Wrong Choice

- No DLX or DLQ: failed messages permanently lost
- DLX without monitoring: messages pile up silently in dead-letter queue
- DLX routing mismatch: dead-lettered messages don't reach expected consumer

---

### Related Rules

- implement-poison-message-detection
- monitor-dlq-depth-and-age

---

### Related Skills

- Configure RabbitMQ Message Distribution
- Set Up Queue Failure Handling and Retries
