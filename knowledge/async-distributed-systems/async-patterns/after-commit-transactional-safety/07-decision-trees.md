# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Async Patterns
**Knowledge Unit:** after-commit-transactional-safety
**Generated:** 2026-06-03

---

# Decision Inventory

* after_commit=true vs Manual afterCommit() per Dispatch
* Transactional Job Dispatch Strategy

---

# Architecture-Level Decision Trees

---

## after_commit=true vs Manual afterCommit() per Dispatch

---

### Decision Context

Whether to set `after_commit=true` at the connection level or use `afterCommit()`/`afterCommit(false)` per dispatch.

---

### Decision Criteria

* Job sensitivity to stale/missing data
* Transaction frequency at dispatch points
* Need for some jobs to dispatch immediately

---

### Decision Tree

Most dispatches happen within transactions?
YES → Set after_commit=true at connection level — catch-all safety
NO → Some jobs must dispatch immediately within transactions?
    YES → Set after_commit=true at connection level + override per dispatch with afterCommit(false) for immediate jobs
NO → No transactional dispatches?
    YES → after_commit=false (default) — no benefit from setting true
NO → Default?
    YES → Set after_commit=true — safe default

---

### Rationale

Without `after_commit`, jobs dispatched inside transactions may process before the transaction commits. The worker sees stale or missing data. Setting `after_commit=true` at the connection level defers all dispatches until after the transaction commits.

---

### Recommended Default

**Default:** Set `after_commit=true` at the connection level; override with `afterCommit(false)` for jobs that must dispatch immediately
**Reason:** Prevents jobs from reading uncommitted data. Immediate-dispatch jobs are the exception and should be explicitly marked.

---

### Risks Of Wrong Choice

- after_commit=false (default): jobs process before transaction commits — stale data
- after_commit=true for non-transactional dispatches: no penalty — check is cheap
- after_commit=true without understanding: no dispatch outside transaction — check is cheap

---

### Related Rules

- set-after-commit-at-connection-level

---

### Related Skills

- Configure Async Patterns and Transactional Safety

---

## Transactional Job Dispatch Strategy

---

### Decision Context

How to handle job dispatching within database transactions for data consistency.

---

### Decision Criteria

* Transaction size and duration
* Job data freshness requirements
* Error handling within transactions

---

### Decision Tree

Job reads data that was modified in the same request?
YES → Must dispatch after commit — otherwise job sees stale data
NO → Job writes to same data as request?
    YES → Must dispatch after commit — prevent write conflicts
NO → Job is independent of request data?
    YES → Dispatch immediately — no consistency concern
NO → Default?
    YES → Dispatch after commit — safest approach

---

### Rationale

Jobs that read or write data modified in the same request/transaction must dispatch after the transaction commits. Otherwise, the worker may see uncommitted (or missing) data. Independent jobs can dispatch immediately.

---

### Recommended Default

**Default:** Always dispatch after commit unless the job is truly independent of the current transaction's data
**Reason:** Prevents data consistency issues. The overhead of checking for an active transaction is negligible (~microseconds).

---

### Risks Of Wrong Choice

- Immediate dispatch within transaction: worker sees uncommitted data
- after_commit not set: default false — jobs dispatch before commit
- Mixing immediate and after-commit jobs: ordering issues between dependent jobs

---

### Related Rules

- set-after-commit-at-connection-level

---

### Related Skills

- Configure Async Patterns and Transactional Safety
