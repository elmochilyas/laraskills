# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K078 — Closures as Queued Jobs
**Generated:** 2026-06-03

---

# Decision Inventory

* Closure Job vs Class Job for Async Tasks
* Closure Variable Capture Strategy

---

# Architecture-Level Decision Trees

---

## Closure Job vs Class Job for Async Tasks

---

### Decision Context

When to dispatch a closure vs creating a dedicated job class for an async task.

---

### Decision Criteria

* Job complexity and reusability
* Need for release(), delete(), batch(), failed()
* Serialization performance requirements
* Testing requirements

---

### Decision Tree

Job needs $this->release(), $this->delete(), $this->batch()?
YES → Class job (closures don't support these)
NO → Job needs explicit failed() method?
    YES → Class job (closures limited catch() callback)
NO → Job is complex (>10 lines) or called from multiple places?
    YES → Class job (reusable, testable)
NO → High-throughput path (>100 jobs/min)?
    YES → Class job (closures 5-10x slower serialization)
NO → Simple one-off task (cache clear, log cleanup)?
    YES → Closure job acceptable

---

### Rationale

Closure serialization uses AST analysis and source extraction — 5-10x slower than class serialization. Closures don't support `$this->release()`, `$this->delete()`, or `$this->batch()`. Class jobs are testable, reusable, and have stable serialization.

---

### Recommended Default

**Default:** Use class jobs for all production code; closures only for prototyping or trivial one-off tasks
**Reason:** Class jobs are faster to serialize, support the full job API, and are testable. Closure serialization is fragile and limited.

---

### Risks Of Wrong Choice

- Closure needing release()/delete(): not supported
- $this in closure body: serialization failure or wrong context on deserialization
- Missing use imports: class not found error in worker
- Closure in high-throughput path: 5-10x slower serialization

---

### Related Rules

- avoid-closures-for-complex-jobs
- avoid-dollar-this-in-closure-bodies
- import-classes-explicitly-in-closures

---

### Related Skills

- Handle Serialization and Payload Design

---

## Closure Variable Capture Strategy

---

### Decision Context

How to pass variables into closure jobs — via `use ()` binding vs relying on scope.

---

### Decision Criteria

* Variable mutability needs
* Serialization requirements
* Reference vs value semantics

---

### Decision Tree

Variable needs to be modified after closure creation?
YES → Assign to local variable, capture with `use ($var)`
NO → Variable is a large object?
    YES → Capture only needed data, not entire object
NO → Need pass-by-reference behavior?
    YES → Not supported — closures capture by value at serialization time
NO → Default capture?
    YES → Use `use ($neededVar)` — explicit, serializable

---

### Rationale

Closures capture variables by value at serialization time, not by reference. The `use` clause must include all external variables the closure needs. Pass-by-reference (`use (&$var)`) captures the value at serialization, not a live reference.

---

### Recommended Default

**Default:** Use `use ($var)` to explicitly capture needed variables; never rely on `$this` or global scope
**Reason:** Explicit capture ensures serialization works correctly and avoids context-dependent bugs.

---

### Risks Of Wrong Choice

- $this in closure: may not serialize or references wrong context on deserialization
- Pass-by-reference use (&$var): captured at serialization time, not live
- Missing use import: class not found error in worker
- Capturing entire large object: bloated payload, slow serialization

---

### Related Rules

- avoid-dollar-this-in-closure-bodies
- import-classes-explicitly-in-closures

---

### Related Skills

- Handle Serialization and Payload Design
