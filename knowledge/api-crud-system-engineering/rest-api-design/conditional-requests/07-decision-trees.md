# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** REST API Design
**Knowledge Unit:** Conditional Requests
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## ETag vs Last-Modified for Conditional Requests

---

### Decision Context

Choosing between ETag and Last-Modified headers for cache validation and conditional requests based on precision requirements and computation cost.

---

### Decision Criteria

* performance
* reliability
* architectural

---

### Decision Tree

Is sub-second precision required for cache validation?
├── YES → Use ETag (strong or weak)
│   ├── Is the response byte-for-byte deterministic when resource is unchanged?
│   │   ├── YES → Use strong ETag (`"abc123"`)
│   │   └── NO → Use weak ETag (`W/"abc123"`) — allows semantic equivalence
│   └── Are there concurrent write conflicts to prevent?
│       ├── YES → Use ETag for If-Match on PUT/PATCH/DELETE
│       └── NO → ETag only for GET cache validation
└── NO → Is the response derived from a reliable timestamp source?
    ├── YES → Use Last-Modified (simpler, sufficient for cache validation)
    └── NO → Use ETag (timestamps may not reflect content changes)

Is this a GET endpoint or a write endpoint?
├── GET → Use ETag + Last-Modified for cache validation (If-None-Match → 304)
└── PUT/PATCH/DELETE → Use ETag only for If-Match optimistic concurrency (→ 412)

---

### Rationale

ETags provide precise content-based validation but require computation (model timestamp hash is cheap). Last-Modified is simpler but has 1-second resolution and requires reliable timestamps. For writes, only ETags provide the precision needed for If-Match concurrency.

---

### Recommended Default

**Default:** Model-timestamp ETag for all GET responses; If-Match with ETag for high-contention write endpoints
**Reason:** Timestamp-based ETags are cheap and precise; writes need ETag precision for concurrency control.

---

### Risks Of Wrong Choice

Last-Modified alone misses changes within the same second. No conditional headers force full re-download on every request. No If-Match on writes allows silent lost updates.

---

### Related Rules

* Compute ETags From Model Timestamps
* Return ETag and Last-Modified On Every GET Response

---

### Related Skills

* Implement Conditional Requests
* Response Caching Headers

---

---

## Optimistic Concurrency for Write Endpoints

---

### Decision Context

Determining which write endpoints require If-Match optimistic concurrency protection and how to implement the 412 conflict response.

---

### Decision Criteria

* reliability
* maintainability
* performance

---

### Decision Tree

Does the resource face concurrent modification risk (multiple clients updating same resource)?
├── YES → Implement If-Match on PUT/PATCH/DELETE
│   ├── Is lost update acceptable (last-write-wins policy)?
│   │   ├── YES → Document the policy; skip If-Match
│   │   └── NO → Require If-Match header; return 412 on mismatch
│   └── What should the 412 response include?
│       ├── Current ETag (for immediate retry without re-fetch)
│       ├── Current resource state (for client-side merge)
│       └── Both → include both for maximum client flexibility
└── NO → Is the resource append-only (logs, events)?
    ├── YES → No optimistic concurrency needed
    └── NO → Evaluate: low contention may still benefit from If-Match

Does the controller `fresh()` the model before setting ETag on write responses?
├── YES → ETag reflects post-write state — correct
└── NO → Add `$model->fresh()` — stale ETag defeats future conditional checks

---

### Rationale

Without If-Match, two clients can read the same resource, both modify it, and the second write silently overwrites the first (lost-update problem). If-Match ensures the second client's write is rejected with 412, forcing a re-read and merge.

---

### Recommended Default

**Default:** Require If-Match on all PUT/PATCH/DELETE endpoints where data integrity matters; always include current ETag and resource state in 412 response
**Reason:** Lost updates are silent data corruption; 412 with current state eliminates an extra round-trip.

---

### Risks Of Wrong Choice

No If-Match causes silent data loss from concurrent updates. If-Match on every endpoint doubles request count for low-contention resources. No `fresh()` after write returns stale ETag.

---

### Related Rules

* Use If-Match For Write Endpoints With Concurrent Modification Risk
* Refresh Model Before Setting ETag After Write

---

### Related Skills

* Idempotency Semantics
* HTTP Method Semantics

---

---

## ETag Computation Strategy

---

### Decision Context

Choosing between model-timestamp-based ETag computation and full-content hashing based on response composition and performance requirements.

---

### Decision Criteria

* performance
* reliability

---

### Decision Tree

Is the response directly derived from a single Eloquent model with `updated_at`?
├── YES → Use `md5($model->updated_at->timestamp . $model->id)` — ~0.01ms
│   └── Does the response include dynamic metadata that changes every request?
│       ├── YES → Use weak ETag `W/"` prefix to allow semantic equivalence
│       └── NO → Use strong ETag (byte-for-byte comparison)
└── NO → Is the response derived from multiple models with timestamps?
    ├── YES → Hash the max timestamp across the collection
    └── NO → Use full-content hash as fallback
        └── Cache computed ETags in Redis to avoid recomputation cost

Can the ETag be computed without serializing the full response?
├── YES → Prefer the cheaper computation
└── NO → Full-content hash is the only option; cache it

---

### Rationale

Full-content hashing requires serializing the entire resource just to compute the hash, wasting the CPU time that ETags are meant to save. Model-timestamp ETags are ~0.01ms vs ~0.1ms per MB for full hashing and achieve the same validation result.

---

### Recommended Default

**Default:** Model-timestamp ETag (`md5($updated_at . $id)`) with weak `W/` prefix for GET responses
**Reason:** Timestamp-based computation avoids unnecessary serialization; weak ETag accounts for dynamic metadata.

---

### Risks Of Wrong Choice

Full-content hashing serializes every response even when unchanged. Strong ETag on responses with dynamic metadata changes on every request, defeating conditional request optimization.

---

### Related Rules

* Compute ETags From Model Timestamps
* Include Current ETag In 412 Response Body

---

### Related Skills

* Response Caching Headers
* HTTP Status Code Selection
