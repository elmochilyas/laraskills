# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Retry & Failure Handling
**Knowledge Unit:** ignoring-missing-models
**Generated:** 2026-06-03

---

# Decision Inventory

* Ignoring Missing Models vs Explicit Null Check
* Soft-Deleted Model Handling

---

# Architecture-Level Decision Trees

---

## Ignoring Missing Models vs Explicit Null Check

---

### Decision Context

Whether to use `ShouldBeUnique` or `ModelNotFoundException` handling when a job's model has been deleted between dispatch and processing.

---

### Decision Criteria

* Job criticality when model is missing
* Need to fail vs silently skip
* Data consistency requirements

---

### Decision Tree

Model may be deleted before job processes?
YES → Should the job fail silently (skip) or fail loudly?
    Silent skip → Use ShouldBeUnique + ignoreModelNotFound middleware
    Fail loudly → Let ModelNotFoundException propagate — job fails, alert fires
NO → Model always exists at processing time?
    YES → No special handling needed
NO → Default safe approach?
    YES → Explicit null check in handle() — handle both cases

---

### Rationale

A model may be deleted between dispatch and processing. `ModelNotFoundException` from `SerializesModels` can be caught or allowed to propagate. The choice depends on whether a missing model is a normal condition or a bug.

---

### Recommended Default

**Default:** Explicit null check in `handle()` (`if (! $this->model) return;`) for non-critical jobs; let `ModelNotFoundException` propagate for critical jobs
**Reason:** Non-critical jobs can skip gracefully. Critical jobs should alert on missing data. Explicit null check is the most transparent approach.

---

### Risks Of Wrong Choice

- Silently ignoring all missing models: critical data issues go undetected
- Failing on all missing models: normal deletions cause unnecessary failures
- No null check: "call to a member function on null" crash

---

### Related Rules

- guard-against-null-models

---

### Related Skills

- Handle Serialization and Payload Design
- Set Up Queue Failure Handling and Retries

---

## Soft-Deleted Model Handling

---

### Decision Context

How to handle soft-deleted models in queued jobs that use `SerializesModels`.

---

### Decision Criteria

* Whether soft-deleted models should still be processed
* Need for trashed model querying

---

### Decision Tree

Job should process soft-deleted models?
YES → Use `withTrashed()` in SerializesModels or pass ID and query with trashed
NO → Soft-deleted models should be skipped?
    YES → null check — skip if model is null (SerializesModels returns null for soft-deleted by default)
NO → Default?
    YES → SerializesModels returns null for soft-deleted (find() respects soft-deletes)

---

### Rationale

By default, `SerializesModels` calls `find()` which respects soft-deletes — soft-deleted models return null. To include soft-deleted models, use `withTrashed()` or pass the ID and query with trashed in `handle()`.

---

### Recommended Default

**Default:** Let `SerializesModels` return null for soft-deleted models; guard with null check
**Reason:** Default behavior correctly reflects that soft-deleted models should typically not be processed. Explicit `withTrashed()` when needed.

---

### Risks Of Wrong Choice

- Not guarding null: soft-deleted model returns null — "call to member function on null"
- Assuming soft-deleted models are returned: find() excludes soft-deleted by default
- Processing soft-deleted without trashed check: model not found, silent skip

---

### Related Rules

- guard-against-null-models

---

### Related Skills

- Handle Serialization and Payload Design
