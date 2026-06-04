# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Response Caching Headers
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Cache-Control Directive Selection

---

### Decision Context

Choosing the appropriate `Cache-Control` directives for a given GET endpoint based on data sensitivity, change frequency, and caching layer.

---

### Decision Criteria

* security
* performance
* architectural

---

### Decision Tree

Does the response contain user-specific or authenticated data?
├── YES → Is the data suitable for browser caching but not shared caching?
│   ├── YES → `Cache-Control: private, max-age=<TTL>, must-revalidate`
│   └── NO → `Cache-Control: no-cache, private` (always revalidate, no shared)
└── NO → Is the data public and cacheable by shared caches (CDN, proxy)?
    ├── YES → Does the data change frequently (minutes)?
    │   ├── YES → `Cache-Control: public, max-age=<short TTL>, s-maxage=<short TTL>`
    │   └── NO → `Cache-Control: public, max-age=<long TTL>, s-maxage=<long TTL>`
    └── NO → `Cache-Control: no-store` (never cache)

Is CDN caching with different TTL than browser caching required?
├── YES → `Cache-Control: public, max-age=0, s-maxage=3600` — CDN caches 1hr, browser never
└── NO → Single TTL for all caches

---

### Rationale

`Cache-Control` directives determine whether and how responses are cached. Missing or incorrect directives can leak private data through shared caches or waste bandwidth by not caching public data. Separating browser (`max-age`) and CDN (`s-maxage`) TTLs enables fine-grained control.

---

### Recommended Default

**Default:** `Cache-Control: public, max-age=60` for public data; `Cache-Control: private, no-cache` for authenticated data; `Cache-Control: no-store` for errors
**Reason:** Explicit directives prevent unpredictable browser caching heuristics.

---

### Risks Of Wrong Choice

`public` on authenticated data leaks user data through shared caches. `no-store` on public data wastes bandwidth. Missing `Cache-Control` causes unpredictable browser caching.

---

### Related Rules

* Always Set Explicit `Cache-Control` on Every GET Response
* Use `Cache-Control: private` for Authenticated Responses

---

### Related Skills

* Implement Response Caching Headers
* Conditional Requests

---

---

## ETag Generation Strategy

---

### Decision Context

Choosing between model-timestamp-based ETags and full-content-hashing ETags based on performance requirements and response composition.

---

### Decision Criteria

* performance
* reliability

---

### Decision Tree

Is the response derived from a single Eloquent model with an `updated_at` timestamp?
├── YES → Use model-timestamp ETag: `md5($model->updated_at . $model->id)`
│   └── Does the response include dynamic metadata (request_id, timestamps)?
│       ├── YES → Use weak ETag with `W/` prefix
│       └── NO → Use strong ETag
└── NO → Is the response derived from a collection of models with timestamps?
    ├── YES → Use max(updated_at) across collection: `md5($collection->max('updated_at') . $collection->count())`
    └── NO → Use full-content hash as fallback (aggregated reports, computed views)

Does the response change on every request due to volatile metadata?
├── YES → Use weak ETag based on stable content identity, not full response hash
└── NO → Standard ETag based on content

---

### Rationale

Full-content hashing requires serializing the entire resource just to compute the hash, wasting the CPU time that ETags are meant to save. Timestamp-based ETags are ~0.01ms vs ~0.1ms per MB for full hashing and achieve the same validation result.

---

### Recommended Default

**Default:** Model-timestamp ETag with `W/` prefix (weak) for most responses; full-content hash only for non-model responses
**Reason:** Weak ETags account for dynamic metadata that changes without resource modification; timestamp-based computation avoids unnecessary serialization.

---

### Risks Of Wrong Choice

Full-content hashing serializes every response even when unchanged. Strong ETags on responses with dynamic metadata change on every request, defeating conditional request optimization.

---

### Related Rules

* Generate ETags from Model Timestamps, Not Full Content Hashes
* Use Weak ETags for Responses with Dynamic Metadata

---

### Related Skills

* Conditional Requests
* Response Compression

---

---

## Vary Header Strategy

---

### Decision Context

Determining which `Vary` headers to set to ensure correct cache key differentiation across content types and authentication states.

---

### Decision Criteria

* reliability
* security

---

### Decision Tree

Does the endpoint serve multiple content types via content negotiation (JSON, XML)?
├── YES → Include `Vary: Accept`
└── NO → Omit `Vary: Accept`

Does the endpoint include authenticated responses?
├── YES → Include `Vary: Authorization` (prevents shared cache contamination)
│   └── Are there other request headers that affect the response?
│       ├── YES → Include `Vary: Accept, Authorization, <other>`
│       └── NO → Include only `Vary: Authorization`
└── NO → Omit `Vary: Authorization`

Does the response use compression (gzip, brotli)?
├── YES → Include `Vary: Accept-Encoding`
└── NO → Omit `Vary: Accept-Encoding`

Are there too many Vary headers (>3)?
├── YES → Consolidate: each Vary header fragments the cache; keep the list minimal
└── NO → Include all relevant Vary headers

---

### Rationale

CDNs and proxies use the `Vary` header to determine which request headers differentiate cache entries. Missing `Vary: Authorization` causes authenticated responses to be served to unauthenticated users. Too many `Vary` headers fragment the cache into unusably small segments.

---

### Recommended Default

**Default:** `Vary: Accept, Authorization` for authenticated content-negotiated endpoints; `Vary: Accept-Encoding` added by server-level compression
**Reason:** Accept ensures correct content type; Authorization prevents cross-user cache contamination; Accept-Encoding is handled by the web server layer.

---

### Risks Of Wrong Choice

Missing `Vary: Authorization` causes authenticated data served to other users. Too many `Vary` headers fragment cache hit ratio. Missing `Vary: Accept` serves wrong content type from cache.

---

### Related Rules

* Set `Vary: Accept` on Content-Negotiated Endpoints
* Never Cache Error Responses

---

### Related Skills

* Content Negotiation
* Response Compression
