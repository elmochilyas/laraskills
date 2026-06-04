# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Lifecycle & Governance
**Knowledge Unit:** Bulk Operation Design
**Generated:** 2026-06-03

---

# Decision Inventory

* Atomicity level (per-operation vs full-batch transaction)
* Synchronous vs async bulk processing

---

# Architecture-Level Decision Trees

## Atomicity Level — Per-Operation vs Full-Batch Transaction

## Decision Context
Should bulk operations be atomic per-operation or across the entire batch? Arises when designing bulk endpoint semantics.

## Decision Criteria
* failure isolation — one failure should not block unrelated operations
* consistency requirements — some operations need all-or-nothing guarantees
* performance — full-batch transactions hold locks longer
* consumer expectations — partial success vs all-or-nothing

## Decision Tree
Are the operations related (e.g., transferring money between accounts)?
↓
YES → Full-batch atomic transaction (all succeed or all fail)
NO → Independent operations on different resources?
    YES → Per-operation transactions (partial failure OK)
    NO → Per-operation (safe default)

## Recommended Default
**Default:** Per-operation transactions (non-atomic)
**Reason:** One failed operation should not prevent successful operations. Full-batch atomicity is rare.

## Risks Of Wrong Choice
Full-batch for independent operations: one failure blocks all other operations. Per-operation for related operations: partial state inconsistency.

## Synchronous vs Async Bulk Processing

## Decision Context
Should bulk operations be processed synchronously in the HTTP response or asynchronously with polling?

## Decision Tree
Is the batch size under 500 operations?
↓
YES → Synchronous processing within HTTP request/response
NO → Async processing with status polling endpoint or webhook callback

## Recommended Default
**Default:** Synchronous for <=500 operations; async for larger batches
**Reason:** Synchronous is simpler; async prevents timeouts and resource exhaustion for large batches.

## Risks Of Wrong Choice
Sync for large batches: HTTP timeout, memory exhaustion, poor consumer experience.
