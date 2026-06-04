# Decision Trees — Resource Collections

---

## Decision: Anonymous Collection vs Named ResourceCollection Class

---

## Decision Context

Should a list endpoint use `Resource::collection()` (anonymous) inline or create a dedicated `ResourceCollection` class?

---

## Decision Criteria

* **Custom metadata:** Does the endpoint need collection-level metadata beyond the default?
* **Pagination customization:** Does the endpoint need custom pagination information?
* **Reusability:** Is the collection shape shared by multiple endpoints?

---

## Decision Tree

Need to return a collection from an endpoint?

↓

Does the collection need custom metadata (totals, aggregates, applied filters)?

YES → Create a named `ResourceCollection` class — override `toArray()` or `paginationInformation()`

NO → Does the collection need non-default pagination structure (custom links/meta)?

    YES → Create a named `ResourceCollection` class — override `paginationInformation()`

    NO → Is this collection shape used by more than one endpoint/controller?

        YES → Create a named `ResourceCollection` class — reuse avoids duplicating `$collects`

        NO → Use `Resource::collection()` inline — no dedicated class needed

---

## Rationale

Anonymous collections (`Resource::collection()`) are the simplest choice for straightforward list endpoints with no custom behavior. Named collections are only needed when you need to override `toArray()`, `paginationInformation()`, or share the collection pattern across multiple endpoints. Named collections add a file but enable customization and reuse.

---

## Recommended Default

**Default:** Start with `Resource::collection()` inline; extract to a named `ResourceCollection` class only when custom behavior is needed
**Reason:** Avoids premature class creation; extraction is simple when needed

---

## Risks Of Wrong Choice

Creating named collections for every endpoint produces many empty boilerplate classes. Using `Resource::collection()` everywhere makes it impossible to add collection-level metadata without refactoring every endpoint.

---

## Related Rules

* Rule: Use Anonymous Collections for Simple Endpoints (resource-collections/05-rules.md)
* Rule: Always Set $collects Explicitly on Custom Collections (resource-collections/05-rules.md)

---

## Related Skills

* Create a Resource Collection (resource-collections/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

---

---

## Decision: Paginated vs Non-Paginated Collection

---

## Decision Context

Should a list endpoint use pagination or return all results at once?

---

## Decision Criteria

* **Item count:** How many items could the endpoint realistically return?
* **Memory budget:** How much memory is acceptable per request?
* **Client needs:** Does the client need all data at once or incremental loading?

---

## Decision Tree

Need to return multiple items from an endpoint?

↓

Could the endpoint realistically return more than 50 items?

YES → Must paginate — use `Model::paginate()`, `Model::cursorPaginate()`, or `Model::simplePaginate()`

NO → Is the endpoint an export/download that should return the full dataset?

    YES → Use chunked response or streaming — pagination is not appropriate for full exports

    NO → Is the memory footprint of all items acceptable (verify, do not guess)?

        YES → Non-paginated is acceptable — all results in one response

        NO → Paginate — even for small datasets, pagination prevents memory surprises

---

## Rationale

Non-paginated collections load all matching records into memory. A "safe-looking" endpoint that returns 1000 items with relationships can consume 50MB+ of memory. Pagination is the standard defense against unbounded memory growth. The 50-item threshold is conservative; many teams use 20-30 as the trigger for mandatory pagination.

---

## Recommended Default

**Default:** Always paginate list endpoints; only skip pagination for guaranteed-small results (< 50 items) or export endpoints
**Reason:** Pagination from the start prevents future memory issues and avoids the breaking change of adding pagination later

---

## Risks Of Wrong Choice

A non-paginated endpoint that grows to 100K items causes memory exhaustion (out of memory error) or HTTP timeout. Adding pagination later changes the response format from array to object, breaking clients.

---

## Related Rules

* Rule: Paginate List Endpoints That Could Exceed 50 Items (resource-collections/05-rules.md)
* Rule: Keep Pagination Logic in the Controller, Not the Collection (resource-collections/05-rules.md)

---

## Related Skills

* Create a Resource Collection (resource-collections/06-skills.md)
* Pagination Metadata (pagination-metadata/06-skills.md)

---

---

## Decision: Preserve Keys vs Re-index Collection Keys

---

## Decision Context

Should the collection preserve the original model keys (`$preserveKeys = true`) or re-index to a sequential array?

---

## Decision Criteria

* **Client expectation:** Does the client expect an array or an ID-keyed object?
* **API contract:** Is the key structure documented and stable?

---

## Decision Tree

Need to decide collection key structure?

↓

Does the client explicitly need ID-keyed maps (e.g., `{ "1": {...}, "5": {...} }`)?

YES → Set `$preserveKeys = true` — but only if documented in the API contract

NO → Does the collection apply filtering that could leave non-sequential keys?

    YES → Do NOT preserve keys — after filtering, `{ "5": {...}, "12": {...} }` is unexpected

    NO → Default to sequential array — always the safest choice

---

## Rationale

Preserving keys produces a JSON object (`{ "1": {...} }`) instead of a JSON array (`[{...}]`). Most JavaScript clients expect arrays for collections and may misinterpret objects. Non-sequential keys after filtering create particularly confusing responses.

---

## Recommended Default

**Default:** Do NOT preserve keys — always return sequential arrays from collections
**Reason:** Arrays are the universal collection format; ID-keyed objects are a niche requirement that must be explicitly documented and agreed upon

---

## Risks Of Wrong Choice

Preserving keys on a filtered collection produces `{ "5": {...}, "12": {...} }`, which breaks clients expecting an array `[{...}, {...}]`. The response format changes from array to object without warning.

---

## Related Rules

* Rule: Only Preserve Collection Keys When Clients Rely on Them (resource-collections/05-rules.md)
* Rule: Keep Collection Types Homogeneous (resource-collections/05-rules.md)

---

## Related Skills

* Create a Resource Collection (resource-collections/06-skills.md)
