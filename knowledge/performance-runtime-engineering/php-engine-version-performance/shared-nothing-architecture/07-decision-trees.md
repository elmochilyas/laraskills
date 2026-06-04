# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** PHP Engine Performance
**Knowledge Unit:** Shared-Nothing Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Shared-nothing (FPM) vs memory-resident (Octane) | Architecture | Architect |
| 2 | Whether to share state across FPM workers | Architecture | Implement |
| 3 | How to optimize bootstrap within shared-nothing | Configuration | Optimize |

---

# Architecture-Level Decision Trees

---

## Decision: Shared-Nothing (FPM) vs Memory-Resident (Octane)

---

## Decision Context

Choosing between PHP-FPM's process-per-request isolation and memory-resident architecture for application serving.

---

## Decision Criteria

* **performance** — bootstrap overhead elimination vs continuous memory cost
* **architectural** — isolation guarantees vs state management complexity
* **security** — complete process isolation vs potential state leakage
* **maintainability** — universal compatibility vs code audit requirements

---

## Decision Tree

What is framework bootstrap as percentage of total request time?
↓
**<20%** → Stay on shared-nothing FPM; gain from Octane is minimal
**20-50%** → Octane provides moderate gain (2-5x); worth evaluating
**>50%** → Octane provides significant gain (3-15x); strong candidate

---

What is the average request latency?
↓
**<50ms (fast API)** → Bootstrap dominates (60-80%); Octane strongly beneficial
**50-500ms** → Mixed; profile bootstrap proportion to decide
**>500ms (slow)** → Bootstrap is <10%; Octane gain is minimal

---

Is the team willing to audit all static properties and singletons?
↓
**YES** → Octane migration is feasible
**NO** → Stay on FPM or budget audit effort first

---

Is regulatory per-request process isolation required?
↓
**YES** → Must stay on shared-nothing FPM
**NO** → Memory-resident is viable

---

## Rationale

Shared-nothing maximizes safety (no request can corrupt another) at the cost of per-request bootstrap overhead. The decision depends on whether that overhead is meaningful relative to total request time.

---

## Recommended Default

**Default:** Shared-nothing (FPM) for most deployments unless bootstrap >20% of request time.
**Reason:** Simplicity, universal compatibility, and complete isolation outweigh performance gains when bootstrap proportion is low.

---

## Risks Of Wrong Choice

* FPM for fast APIs: 3-15x lower throughput than possible
* Octane without audit: user data leakage between requests, security incidents
* Octane for slow endpoints: added complexity with minimal gain

---

## Related Rules

* Choose Memory-Resident Architecture When Bootstrap Exceeds 20%
* Never Share State Across PHP-FPM Workers via Shared Memory
* Always Optimize Bootstrap Within Shared-Nothing Model

---

## Related Skills

* Optimize Within the Shared-Nothing Architecture
* Migrate from PHP-FPM to a Memory-Resident Architecture

---

---

## Decision: Whether to Share State Across FPM Workers

---

## Decision Context

Deciding whether to use APCu, shared memory, or file-based state sharing across PHP-FPM workers.

---

## Decision Criteria

* **performance** — shared state avoids external service round-trips
* **architectural** — violates shared-nothing model
* **security** — race conditions from concurrent writes
* **maintainability** — introduces hard-to-debug non-deterministic bugs

---

## Decision Tree

Is the state read-only (configuration, translations)?
↓
**YES** → Safe to cache via APCu; no mutation race condition
**NO (mutable)** → Use external service (Redis) for atomic operations

---

Is the state per-request or cross-request?
↓
**Per-request** → Use request-scoped DI; no sharing needed
**Cross-request** → Use external service (Redis, database) for atomicity

---

## Rationale

Read-only cached data via APCu is safe because there is no mutation race. Mutable shared state across workers introduces race conditions that are extremely hard to debug. External services provide atomic operations.

---

## Recommended Default

**Default:** Never share mutable state across FPM workers; use Redis or database for cross-request state.
**Reason:** Shared-nothing architecture guarantees isolation; violating it introduces non-deterministic bugs.

---

## Risks Of Wrong Choice

* Race conditions, data corruption, non-deterministic bugs
* Hard-to-reproduce production issues
* No thread safety guarantees in FPM's process model

---

## Related Rules

* Never Share State Across PHP-FPM Workers via Shared Memory

---

## Related Skills

* Optimize Within the Shared-Nothing Architecture
