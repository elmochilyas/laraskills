# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K005 — SerializesModels Trait and Model Restoration
**Generated:** 2026-06-03

---

# Decision Inventory

* SerializesModels vs Manual ID Passing
* Collection Handling Strategy
* Null Model Guarding Strategy

---

# Architecture-Level Decision Trees

---

## SerializesModels vs Manual ID Passing

---

### Decision Context

Whether to use the `SerializesModels` trait on a job or manually pass IDs and re-fetch models in `handle()`.

---

### Decision Criteria

* Number of model properties on the job
* Need for data freshness at processing time
* Payload size constraints
* Pivot data requirements

---

### Decision Tree

Job needs pivot data from BelongsToMany?
YES → Manual ID passing — SerializesModels loses pivot attributes
NO → Job has many model properties (>3)?
    YES → Manual ID passing — avoid N+1 on wakeup
NO → Need exact dispatch-time state?
    YES → Manual ID passing — SerializesModels re-fetches fresh
NO → Standard case (1-2 models, fresh state OK)?
    YES → Use SerializesModels

---

### Rationale

`SerializesModels` re-fetches models from the database on deserialization. Each model property triggers one `find()` query. For simple cases (1-2 models), convenience wins. For many models, pivot data, or dispatch-time state, manual ID passing is safer.

---

### Recommended Default

**Default:** Use `SerializesModels` for jobs with 1-2 model properties; manual ID passing for >2 models or pivot data needs
**Reason:** Balances convenience with performance. Simple cases benefit from automatic re-fetching; complex cases need explicit control.

---

### Risks Of Wrong Choice

- SerializesModels with loaded relations: cascading find() — 3 relations = 4 queries before handle()
- Pivot data loss: BelongsToMany pivot attributes not restored
- Null models: deleted model returns null — call to member function on null
- Collection >100 items: 100+ find() queries on wakeup

---

### Related Rules

- guard-against-null-models
- avoid-models-with-loaded-relations
- pass-ids-not-models

---

### Related Skills

- Handle Serialization and Payload Design

---

## Collection Handling Strategy

---

### Decision Context

How to pass collections of models to jobs — via `SerializesModels` or as arrays of IDs.

---

### Decision Criteria

* Collection size
* Deserialization query overhead
* Data freshness requirements

---

### Decision Tree

Collection size > 100 items?
YES → Pass array of IDs, batch-fetch in handle()
NO → Need to know which models exist at processing time?
    YES → Pass IDs, handle missing models explicitly
NO → Standard collection re-fetch acceptable?
    YES → SerializesModels handles it (each item = one find())

---

### Rationale

Each collection item triggers a separate `find()` query on deserialization. For 1000 items, that's 1000 queries before `handle()` starts. For large collections, pass IDs and batch-fetch (`whereIn`) in `handle()`.

---

### Recommended Default

**Default:** Pass array of IDs for collections >100; SerializesModels for smaller collections
**Reason:** Avoids N+1 deserialization overhead for large collections while keeping convenience for small ones.

---

### Risks Of Wrong Choice

- Large collection via SerializesModels: 1000+ queries before handle()
- No null guarding: individual items may be deleted, returning null
- Memory: each find() hydrates a full Eloquent model — batch whereIn can be more efficient

---

### Related Rules

- guard-against-null-models
- avoid-models-with-loaded-relations

---

### Related Skills

- Handle Serialization and Payload Design
