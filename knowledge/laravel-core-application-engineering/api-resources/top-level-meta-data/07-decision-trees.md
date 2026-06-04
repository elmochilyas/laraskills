# Decision Trees — Top-Level Meta Data

---

## Decision: with() vs Middleware for Response Metadata

---

## Decision Context

Should metadata (version, timestamps, request ID) be added via the resource's `with()` method or via HTTP middleware?

---

## Decision Criteria

* **Scope:** Is the metadata global (every response) or endpoint-specific?
* **Data source:** Does the metadata depend on the resource data or the request context?
* **Header vs body:** Is the metadata best expressed as an HTTP header or JSON body data?

---

## Decision Tree

Need to add response-wide information?

↓

Does the metadata apply to ALL responses (e.g., CORS headers, content type)?

YES → Use middleware — handles cross-cutting concerns without per-resource code

NO → Does the metadata belong in the JSON body (API version, cache timestamp)?

    YES → Use `with()` on the resource — JSON body data that varies by resource

    NO → Does the metadata belong in HTTP headers (Deprecation, Sunset, custom headers)?

        YES → Use `withResponse()` on the resource — header modifications that vary by resource

        NO → Use middleware — the metadata is not resource-specific

---

## Rationale

Middleware is the right tool for cross-cutting response concerns that apply to all endpoints (CORS, global content-type). `with()` is for JSON body metadata that varies by resource or endpoint. `withResponse()` is for HTTP header modifications that are resource-specific. The distinction is scope: global → middleware; per-endpoint → `with()` or `withResponse()`.

---

## Recommended Default

**Default:** Global concerns in middleware; endpoint-specific JSON body data in `with()`; header modifications in `withResponse()`
**Reason:** Separating concerns by tool prevents middleware from being littered with endpoint-specific logic and prevents resources from duplicating global concerns

---

## Risks Of Wrong Choice

Putting CORS headers in every resource's `withResponse()` violates DRY and creates 50+ identical overrides. Putting API version in middleware makes it invisible at the resource level and harder to version per-endpoint.

---

## Related Rules

* Rule: Use Middleware for Global Metadata; Use with() for Endpoint-Specific (top-level-meta-data/05-rules.md)
* Rule: Use withResponse() for HTTP Headers, with() for JSON Body (top-level-meta-data/05-rules.md)

---

## Related Skills

* Add Top-Level Metadata to a Resource (top-level-meta-data/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

---

---

## Decision: Base Class with() vs Per-Resource with() for Metadata

---

## Decision Context

Should metadata be defined in a base resource class that all resources extend, or defined individually in each resource?

---

## Decision Criteria

* **Consistency:** Do all resources need the same metadata keys?
* **Resource count:** How many resource classes exist?

---

## Decision Tree

Need to add metadata via `with()`?

↓

Should all resources include the same metadata keys (API version, request ID)?

YES → Does the API have 5 or more resource classes?

    YES → Create a base `ApiResource` class with standardized `with()` — all resources extend it

    NO → Base class overhead may exceed benefit for < 5 resources; per-resource `with()` is acceptable

NO → Per-resource `with()` for endpoint-specific metadata — each resource adds its own keys

---

## Rationale

A base class ensures every resource produces the same top-level metadata structure (same key names, same structure). Clients can always find `api_version`, `request_id` in any response. Without a base class, `UserResource` may use `api_version` while `PostResource` uses `version`, creating client confusion.

---

## Recommended Default

**Default:** Create a base `ApiResource` class with standardized `with()` from the start
**Reason:** Prevents metadata inconsistency; adding a base class later requires updating every existing resource

---

## Risks Of Wrong Choice

Without a base class, metadata keys diverge across resources. `UserResource` returns `{ "api_version": "1.0", "request_id": "abc" }` while `PostResource` returns `{ "version": "1", "rid": "xyz" }`. Clients must parse each endpoint differently.

---

## Related Rules

* Rule: Standardize Metadata Structure via a Base Resource Class (top-level-meta-data/05-rules.md)
* Rule: Avoid Key Conflicts with Pagination Metadata (top-level-meta-data/05-rules.md)

---

## Related Skills

* Add Top-Level Metadata to a Resource (top-level-meta-data/06-skills.md)
* Resource Organization (resource-organization/06-skills.md)

---

---

## Decision: with() Computation Timing — Resource vs Controller Pre-Computation

---

## Decision Context

Should expensive metadata computations run inside the resource's `with()` method or be pre-computed in the controller and passed to the resource?

---

## Decision Criteria

* **Computation cost:** Is the metadata derived from expensive operations (DB queries, API calls)?
* **Caching:** Can the metadata be cached and reused across requests?
* **Consumer need:** Does every consumer of the endpoint need this metadata?

---

## Decision Tree

Need to compute metadata inside `with()`?

↓

Is the metadata derived from config values, request headers, or simple string operations?

YES → Compute inside `with()` — trivial operations, no performance concern

NO → Is the metadata from a DB query, external API, or expensive computation?

    YES → Can the result be cached and reused across multiple requests?

        YES → Cache it — compute once, serve from cache in `with()`

        NO → Pre-compute in the controller — pass to resource via constructor or container

    NO → Is the metadata only needed by specific consumers (not all)?

        YES → Pre-compute in the controller — conditional on consumer need

        NO → Pre-compute in the controller — `with()` should be cheap

---

## Rationale

`with()` is called on every resource response. Expensive operations inside `with()` execute on every request, regardless of whether the consumer uses the metadata. The rule is: if the operation involves I/O (database, network, disk), it should not be in `with()`. Cache it or pre-compute it in the controller.

---

## Recommended Default

**Default:** Keep `with()` computation trivial (config reads, string formatting, timestamps); pre-compute expensive metadata in the controller
**Reason:** `with()` is called on every response; expensive operations should be cached or controller-computed to avoid per-request overhead

---

## Risks Of Wrong Choice

A `with()` that queries `Order::sum('amount')` on every response adds a full table scan to every endpoint that uses the resource. For a high-traffic endpoint, this multiplies database load unnecessarily.

---

## Related Rules

* Rule: Keep with() Computation Light (top-level-meta-data/05-rules.md)
* Rule: Never Include Sensitive Data in with() Output (top-level-meta-data/05-rules.md)

---

## Related Skills

* Add Top-Level Metadata to a Resource (top-level-meta-data/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)
