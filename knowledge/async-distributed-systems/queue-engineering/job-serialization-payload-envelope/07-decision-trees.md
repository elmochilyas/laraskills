# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K004 — Job Serialization and Payload Envelope Structure
**Generated:** 2026-06-03

---

# Decision Inventory

* Pass IDs vs Pass Models to Jobs
* Class Jobs vs Closure Jobs
* Payload Size Optimization Strategy

---

# Architecture-Level Decision Trees

---

## Pass IDs vs Pass Models to Jobs

---

### Decision Context

Whether to pass Eloquent model IDs (re-fetched in `handle()`) or the model instances directly to job constructors.

---

### Decision Criteria

* Payload size and Redis memory
* Data freshness at processing time
* SerializesModels overhead (N+1 on wakeup)
* Model existence guarantees

---

### Decision Tree

Need latest model state at processing time?
YES → Pass ID, re-fetch in handle()
NO → Model has loaded relations?
    YES → Pass ID only — avoid cascading find()
    NO → Small payload (<1KB) and model always exists?
        YES → Model ID acceptable (SerializesModels)
        NO → Pass ID, re-fetch in handle()

---

### Rationale

Passing IDs gives fresh data, smaller payloads, and avoids N+1 deserialization queries. Passing models via `SerializesModels` triggers a `find()` per model property on wakeup — a model with 5 loaded relations becomes 6 queries before `handle()` starts.

---

### Recommended Default

**Default:** Always pass IDs and re-fetch the model in `handle()`
**Reason:** Fresh data, minimal payload, no N+1 deserialization, and explicit null handling for deleted models.

---

### Risks Of Wrong Choice

- Models with loaded relations: cascading find() queries on deserialization
- Stale data: model state at dispatch differs from state at processing
- Large payload: Redis memory consumption, SQS 256KB limit issues
- Null models: deleted models return null via find() — call to member function on null

---

### Related Rules

- pass-ids-not-models
- guard-against-null-models
- avoid-models-with-loaded-relations

---

### Related Skills

- Implement Job Batching and Chaining
- Handle Serialization and Payload Design

---

## Class Jobs vs Closure Jobs

---

### Decision Context

Whether to implement a full job class or dispatch a closure for async tasks.

---

### Decision Criteria

* Job complexity and reusability
* Serialization reliability
* Testing requirements
* Feature requirements (release, delete, batch, failed)

---

### Decision Tree

Job needs release(), delete(), batch(), or failed()?
YES → Use class job (mandatory)
NO → Job is complex (>10 lines) or reusable?
    YES → Use class job
NO → Job is a simple one-off task?
    YES → Closure job acceptable
NO → High-throughput requirements?
    YES → Use class job (closures 5-10x slower serialization)

---

### Rationale

Closure serialization is 5-10x slower than class serialization, more fragile (AST analysis), and doesn't support `$this->release()`, `$this->delete()`, `$this->batch()`, or explicit `failed()` methods. Class jobs are testable, reusable, and have stable serialization.

---

### Recommended Default

**Default:** Use class jobs for all production code; closures only for prototyping or trivial one-off tasks
**Reason:** Class jobs have stable serialization, are testable, support the full job API, and avoid closure serialization fragility.

---

### Risks Of Wrong Choice

- Closure with $this: serialization failure or wrong context on deserialization
- Missing use imports in closure: class not found error in worker
- Closure in high-throughput path: 5-10x slower serialization overhead
- Closure needing failed(): not supported without class job

---

### Related Rules

- avoid-closures-for-complex-jobs
- import-classes-explicitly-in-closures

---

### Related Skills

- Handle Serialization and Payload Design
- Implement Job Batching and Chaining

---

## Payload Size Optimization Strategy

---

### Decision Context

How to minimize job payload size to optimize Redis memory, SQS throughput, and deserialization performance.

---

### Decision Criteria

* Backend payload limits (SQS 256KB)
* Redis memory cost per job
* Deserialization time
* Number of jobs in queue at peak

---

### Decision Tree

Passing Eloquent models?
YES → Pass IDs, re-fetch in handle()
NO → Using closures?
    YES → Evaluate refactoring to class job (smaller payload)
NO → Payload contains large arrays or objects?
    YES → Only include fields needed by handle()
NO → SQS driver and payload >256KB?
    YES → Use SQS overflow storage (Laravel 11+)

---

### Rationale

Payload size directly impacts Redis memory, SQS network transfer, and deserialization time. Each unnecessary serialized property adds to all three. For SQS, payloads exceeding 256KB are rejected unless using Laravel 11+ overflow storage.

---

### Recommended Default

**Default:** Pass only the data `handle()` needs — IDs over models, scalars over objects
**Reason:** Minimizes Redis memory, avoids SQS size limits, speeds up serialization and deserialization.

---

### Risks Of Wrong Choice

- SQS payload >256KB: message rejected, job never queued
- Full model serialization: 10x payload size, Redis memory waste
- Large collections serialized: N+1 deserialization queries before handle()

---

### Related Rules

- pass-ids-not-models
- keep-payloads-minimal

---

### Related Skills

- Handle Serialization and Payload Design
