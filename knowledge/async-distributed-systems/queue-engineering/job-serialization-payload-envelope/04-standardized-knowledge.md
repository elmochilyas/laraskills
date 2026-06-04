# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K004 — Job Serialization and Payload Envelope Structure
- **Knowledge ID:** K004
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Source — `Illuminate\Queue\Jobs\Job::payload()`

---

# Overview

Every queued job is serialized into a structured payload envelope before storage. This envelope contains the job class, data, and metadata: connection details, middleware, tags, chained jobs, batch IDs, and retry configuration. Understanding the envelope structure is critical for debugging serialization failures, optimizing payload size, and working with backends that have payload size limits (SQS 256KB). Serialization relies on PHP's `serialize()` — Eloquent models are handled via `SerializesModels`.

---

# Core Concepts

- **Payload envelope:** JSON stored in the backend. Contains `uuid`, `displayName`, `job` (serialized class), `data`, `maxTries`, `maxExceptions`, `backoff`, `timeout`, `tags`, `chained`.
- **Serialization:** PHP `serialize()` on the job object. Base64-encoded, stored as the `job` field.
- **Model serialization:** Eloquent models are serialized to just class name + key (via `SerializesModels` trait), not the entire model state.
- **Closure jobs:** Serialized using `Opis\Closure`/`Laravel\SerializableClosure` — captures closure's scope and bound variables.

---

# When To Use

- **Pass IDs, not models:** Always pass model IDs and re-fetch in `handle()`. Reduces payload size and avoids stale data.
- **SQS overflow storage (Laravel 11+):** For payloads exceeding SQS's 256KB limit — stores overflow in cache.

---

# When NOT To Use

- Avoid closures for complex jobs — closure serialization is fragile.
- Avoid serializing full Eloquent models with loaded relations — payload bloat and stale data.

---

# Best Practices

- **Pass IDs, not full models.** Serializing a model with loaded relations serializes the entire object graph. *Why: Each loaded relation adds another serialized `ModelIdentifier` — a model with 5 loaded relations serializes into 6 separate entries, each triggering a `find()` query on deserialization.*
- **Keep payloads minimal.** Only pass the data the job actually needs in `handle()`. *Why: Payload size directly impacts Redis memory, SQS network transfer, and deserialization time — larger payloads reduce throughput proportionally.*
- **Avoid closures for complex jobs.** Class jobs have stable serialization and are testable. *Why: Closure serialization is ~5-10x slower, more fragile across deploys, and cannot use `$this`, `release()`, or `delete()`.*

---

# Performance Considerations

- Serialization time scales with object complexity — 10 large models serializes ~10x slower than IDs.
- Base64 encoding adds ~33% overhead to serialized size.
- Payload size directly impacts Redis memory and SQS network transfer time.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Pass Eloquent models with loaded relations | Convenience | Serializes entire object graph — large payload, stale data | Pass IDs, re-fetch in `handle()` |
| Closures in batch callbacks | Simple syntax | Fragile serialization, no `$this` support | Use class jobs |
| Modifying job properties after constructor | Assuming change persists | Changes not reflected in serialized payload | Set all data in constructor |

---

# Related Topics

- **K005 SerializesModels Trait (K005)** — Model serialization specifics
- **K078 Closures as Queued Jobs (K078)** — Closure serialization
