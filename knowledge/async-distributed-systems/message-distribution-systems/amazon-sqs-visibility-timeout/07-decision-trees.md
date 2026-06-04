# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** K039 — Amazon SQS Visibility Timeout and Queue Types
**Generated:** 2026-06-03

---

# Decision Inventory

* Standard vs FIFO SQS Queue Selection
* retry_after vs Visibility Timeout Alignment

---

# Architecture-Level Decision Trees

---

## Standard vs FIFO SQS Queue Selection

---

### Decision Context

Whether to use Standard (at-least-once) or FIFO (exactly-once, ordered) SQS queues.

---

### Decision Criteria

* Ordering requirements
* Throughput requirements
* Duplicate tolerance
* Message group ID support

---

### Decision Tree

Strict message ordering required?
YES → Throughput <= 300 TPS?
    YES → Use FIFO queue — ordered, exactly-once
NO → Use FIFO with multiple message group IDs (parallel ordered groups)
NO → Duplicate messages acceptable?
    YES → Use Standard queue — high throughput, no ordering
NO → Throughput is primary concern (>1000 TPS)?
    YES → Use Standard queue — virtually unlimited throughput
NO → Default?
    YES → Use Standard queue — simpler, higher throughput

---

### Rationale

Standard queues provide at-least-once delivery with unlimited throughput. FIFO queues provide exactly-once, ordered delivery limited to 300 TPS (3000 with batching). Choose FIFO only when ordering is critical and throughput fits.

---

### Recommended Default

**Default:** Use Standard queues for most use cases; FIFO only when strict ordering is required and throughput <= 300 TPS
**Reason:** Standard queues scale to unlimited throughput. FIFO's 300 TPS limit is a significant constraint.

---

### Risks Of Wrong Choice

- Standard when ordering needed: messages processed out of order
- FIFO when throughput > 300 TPS: throttling, message rejections
- FIFO without MessageGroupId: messages rejected by SQS

---

### Related Rules

- set-retry-after-less-than-visibility-timeout
- use-long-polling-for-sqs

---

### Related Skills

- Configure Amazon SQS Queue
- Set Up Queue Failure Handling and Retries

---

## retry_after vs Visibility Timeout Alignment

---

### Decision Context

Aligning Laravel's `retry_after` with SQS's visibility timeout to prevent double processing.

---

### Decision Criteria

* SQS visibility timeout setting
* Expected job runtime
* Safety margin requirements

---

### Decision Tree

retry_after < SQS visibility timeout?
YES → Safe — Laravel fails job before SQS releases it
NO → retry_after > SQS visibility timeout?
    YES → Double processing risk — SQS releases message before Laravel considers job failed
NO → retry_after == visibility timeout?
    YES → Race condition — both fire at same time, unpredictable

---

### Rationale

When `retry_after` exceeds the SQS visibility timeout, SQS makes the message visible to other workers while Laravel still considers the job running. A second worker picks it up, causing double processing. `retry_after` must be at least 5-10 seconds shorter than the visibility timeout.

---

### Recommended Default

**Default:** Set `retry_after = visibility_timeout - 10` (e.g., retry_after=50 for visibility_timeout=60)
**Reason:** Safety margin prevents double processing. 10 seconds gives Laravel time to fail/complete before SQS releases the message.

---

### Risks Of Wrong Choice

- retry_after > visibility timeout: guaranteed double processing
- retry_after == visibility timeout: race condition, intermittent double processing
- No retry_after set: uses default (may still conflict)

---

### Related Rules

- set-retry-after-less-than-visibility-timeout
- use-long-polling-for-sqs

---

### Related Skills

- Configure Amazon SQS Queue
