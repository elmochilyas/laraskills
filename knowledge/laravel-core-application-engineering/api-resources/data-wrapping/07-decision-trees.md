# Decision Trees — Data Wrapping

---

## Decision: Wrapped vs Unwrapped API Response Format

---

## Decision Context

Should resource responses be wrapped in a `data` key or returned as flat JSON?

---

## Decision Criteria

* **Top-level metadata:** Does the API need metadata alongside data (version, timestamps, request ID)?
* **Pagination:** Will list endpoints use pagination?
* **JSON:API compliance:** Is the API required to follow the JSON:API spec?
* **Client simplicity:** Does a single-client (BFF) API benefit from cleaner flat responses?

---

## Decision Tree

Need to decide the response envelope format?

↓

Is the API a public API consumed by multiple clients?

YES → Is JSON:API compliance required?

    YES → Use wrapped responses — JSON:API requires the `data` wrapper

    NO → Will the API need top-level metadata (version, timestamps) alongside data?

        YES → Use wrapped responses — metadata lives outside `data`

        NO → Use unwrapped responses — simpler, less nesting for clients

NO → Is this an internal/BFF API consumed by a single known client?

    YES → Does the client need pagination metadata?

        YES → Use wrapped responses — `data` + `links` + `meta` structure is needed

        NO → Use unwrapped responses — simpler, no unnecessary nesting

---

## Rationale

Wrapped responses (`{ "data": {...}, "meta": {...} }`) provide room for metadata alongside the payload and are required for JSON:API. Unwrapped responses (`{ "id": 1, "name": "John" }`) are simpler but cannot later accommodate top-level metadata without a breaking change. The key constraint is future-proofing: wrapped responses can always be extended; unwrapped responses are a terminal format.

---

## Recommended Default

**Default:** Use wrapped responses for all public APIs; unwrapped only for BFF or internal APIs where the single client is versioned atomically
**Reason:** Wrapping from the start allows future metadata addition without breaking changes; unwrapping only when you are certain you will never need metadata

---

## Risks Of Wrong Choice

Unwrapped responses cannot later add metadata without a breaking change (changing from array to object). Wrapped responses add a tiny nesting overhead that matters little for most clients. The asymmetry favors wrapping.

---

## Related Rules

* Rule: Keep Wrapping Strategy Consistent Across All Endpoints (data-wrapping/05-rules.md)
* Rule: Always Wrap Collection Responses from the Start (data-wrapping/05-rules.md)

---

## Related Skills

* Configure Data Wrapping for an API (data-wrapping/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

---

---

## Decision: Global withoutWrapping vs Per-Resource $wrap

---

## Decision Context

Should the unwrapping strategy be configured globally via `JsonResource::withoutWrapping()` or per-resource via the `$wrap` property?

---

## Decision Criteria

* **Consistency:** Is the wrapping strategy the same for all resources?
* **Custom keys:** Do some resources need custom wrapper keys (`$wrap = 'user'`)?
* **Nested resources:** Are resources nested inside other resources?

---

## Decision Tree

Need to configure the wrapping behavior?

↓

Is the wrapping strategy identical for ALL resources?

YES → Use `JsonResource::withoutWrapping()` globally in `AppServiceProvider::boot()`

NO → Do specific resources need custom wrapper keys (`'user'`, `'order'`)?

    YES → Use `$wrap` property on individual resources — but only on top-level resources (nested resources' `$wrap` is ignored)

    NO → Are you trying to unwrap only a subset of resources?

        YES → Use a base class with `$wrap = null` — but be consistent across the sub-API

---

## Rationale

Global `withoutWrapping()` is the simplest and safest approach for unwrapped APIs — one call in `AppServiceProvider` ensures every resource is unwrapped. Per-resource `$wrap` is only needed when different resources need different wrapper keys, and only works for top-level resources. Nested resources always ignore their `$wrap`, so configuring it on sub-resources is misleading.

---

## Recommended Default

**Default:** Use global `JsonResource::withoutWrapping()` for unwrapped APIs; use base class `$wrap` configuration for wrapped APIs
**Reason:** Global configuration is simpler and prevents per-resource inconsistency; per-resource configuration is only for custom wrapper keys

---

## Risks Of Wrong Choice

Mixing `withoutWrapping()` with per-resource `$wrap` creates confusion — some resources unwrapped, some wrapped with custom keys, some with default `data` wrapping. The response format becomes unpredictable for clients.

---

## Related Rules

* Rule: Prefer Global withoutWrapping for Unwrapped APIs (data-wrapping/05-rules.md)
* Rule: Never Rely on $wrap for Nested Resource Formatting (data-wrapping/05-rules.md)

---

## Related Skills

* Configure Data Wrapping for an API (data-wrapping/06-skills.md)
* Resource Collections (resource-collections/06-skills.md)

---

---

## Decision: Collection Wrapping — Bare Array vs Wrapped from the Start

---

## Decision Context

Should a non-paginated collection endpoint return a bare JSON array or a wrapped `{ "data": [...] }` structure?

---

## Decision Criteria

* **Future pagination:** Is there any realistic chance this endpoint will need pagination later?
* **Client contract:** Can all consumers be updated atomically if the format changes?
* **Endpoint type:** Is this a list endpoint (many items) or a small set (few items)?

---

## Decision Tree

Need to return a collection from an endpoint?

↓

Is this an internal endpoint where all consumers can be updated atomically with the API?

YES → Bare array is acceptable — `[{...}]` — simplest format for internal consumers

NO → Will this endpoint realistically ever need pagination?

    YES → Wrap from the start — `{ "data": [...], "links": null, "meta": null }` — adding pagination later is non-breaking

    NO → Are you absolutely certain it will never need pagination (config list, enum values)?

        YES → Bare array is acceptable — but prefer wrapping for consistency

        NO → Wrap from the start — uncertainty means wrap

---

## Rationale

The core insight is that a bare JSON array is a terminal format — adding pagination metadata changes the root from array to object, which is a breaking change for all clients. Wrapping from the start (even without pagination) costs ~20 bytes per response but allows adding pagination later without breaking the contract.

---

## Recommended Default

**Default:** Always wrap collection responses from the start with a `data` key, even without pagination
**Reason:** The 20-byte overhead is negligible; the future flexibility to add pagination metadata without a breaking change is invaluable

---

## Risks Of Wrong Choice

An unwrapped collection that later needs pagination forces a breaking change from `[{...}]` to `{ "data": [{...}], "meta": {...} }`. Every client must update their parsing logic. This is the most common API breaking-change regret.

---

## Related Rules

* Rule: Always Wrap Collection Responses from the Start (data-wrapping/05-rules.md)
* Rule: Avoid Bare JSON Arrays as Top-Level Responses (data-wrapping/05-rules.md)

---

## Related Skills

* Configure Data Wrapping for an API (data-wrapping/06-skills.md)
* Resource Collections (resource-collections/06-skills.md)
