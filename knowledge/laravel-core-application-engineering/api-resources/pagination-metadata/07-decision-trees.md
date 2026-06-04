# Decision Trees — Pagination Metadata

---

## Decision: LengthAwarePaginator vs CursorPaginator vs SimplePaginator

---

## Decision Context

Which paginator type should a collection endpoint use — offset-based (LengthAware), cursor-based, or simple (prev/next only)?

---

## Decision Criteria

* **Dataset size:** How large is the underlying table?
* **Random access:** Do clients need to jump to arbitrary pages (page 5, page 100)?
* **Total count:** Do clients need `total` and `last_page` for progress indicators?
* **Deep pagination:** Will users page deeply (page 500+)?

---

## Decision Tree

Need to paginate a list endpoint?

↓

Will clients need random page access ("go to page 5")?

YES → Does the table have > 1M rows?

    YES → Use `LengthAwarePaginator` but cache the `COUNT(*)` result — full metadata with expensive count query

    NO → Use `LengthAwarePaginator` — full metadata, `COUNT(*)` is cheap on small tables

NO → Does the dataset have > 1M rows or will users page deeply (page 100+)?

    YES → Use `CursorPaginator` — no `COUNT(*)`, no OFFSET, stable performance at any depth

    NO → Is the dataset medium-sized (10K-1M rows)?

        YES → Use `LengthAwarePaginator` — `COUNT(*)` cost is acceptable

        NO → Use `SimplePaginator` — no count needed, just prev/next

---

## Rationale

`LengthAwarePaginator` provides the most metadata (current_page, last_page, per_page, total, links) but requires a `COUNT(*)` query that is expensive on large tables. `CursorPaginator` provides stable performance at any depth (no OFFSET, no count query) but does not support random page access — clients can only go forward/backward. `SimplePaginator` is the lightest option but provides no total count.

---

## Recommended Default

**Default:** `LengthAwarePaginator` for most endpoints (tables < 1M rows); `CursorPaginator` for large datasets or deep pagination
**Reason:** Full metadata is the most client-friendly; cursor pagination is an optimization for scale

---

## Risks Of Wrong Choice

`LengthAwarePaginator` on a 10M-row table runs a `COUNT(*)` query that takes seconds. `CursorPaginator` on an API that documents random page access (with page number UI) frustrates users who cannot jump to specific pages.

---

## Related Rules

* Rule: Prefer CursorPaginator for Datasets Over 1M Rows (pagination-metadata/05-rules.md)
* Rule: Always Include per_page and total in Paginated Responses (pagination-metadata/05-rules.md)

---

## Related Skills

* Customize Pagination Metadata in Collections (pagination-metadata/06-skills.md)
* Resource Collections (resource-collections/06-skills.md)

---

---

## Decision: Default paginationInformation Structure vs Custom

---

## Decision Context

Should the default `paginationInformation()` structure be used, or should it be customized?

---

## Decision Criteria

* **Client needs:** Do mobile clients need simplified metadata (no links, just page info)?
* **Consistency:** Will all collections use the same custom structure?
* **Default sufficiency:** Does the default structure meet all client needs?

---

## Decision Tree

Need to customize pagination metadata structure?

↓

Does the default [`data`, `links`, `meta`] structure meet all client needs?

YES → No customization needed — use the default

NO → Does the customization just ADD fields (applied filters, sort info)?

    YES → Override `paginationInformation()` and merge with `$default` — preserves default structure, adds only what's needed

    NO → Does the customization REMOVE or RENAME fields?

        YES → Is this for a mobile-optimized API that cannot afford extra bytes?

            YES → Customize minimally — remove links, simplify meta keys, but be consistent across ALL endpoints

            NO → Avoid removing/renaming — clients depend on default field names

---

## Rationale

Every customization to pagination metadata creates a new response schema that clients must handle. The default structure is well-documented and understood by most API consumers. Adding fields (filters, sort info) is safe and useful. Removing or renaming fields should be avoided unless absolutely necessary (e.g., extreme bandwidth constraints for mobile).

---

## Recommended Default

**Default:** Use the default `paginationInformation()` structure; only customize to add extra context fields (filters, sort)
**Reason:** Default structure is standard, well-documented, and supported by client libraries; customization should be additive, not restructural

---

## Risks Of Wrong Choice

Removing `total` from pagination metadata breaks mobile clients that rely on it for infinite scroll termination. Renaming `current_page` to `page` requires every client to rewrite their pagination handler. These are unnecessary breaking changes.

---

## Related Rules

* Rule: Keep paginationInformation Customizations Minimal (pagination-metadata/05-rules.md)
* Rule: Never Include Business Data Inside Pagination Metadata (pagination-metadata/05-rules.md)

---

## Related Skills

* Customize Pagination Metadata in Collections (pagination-metadata/06-skills.md)
* Resource Collections (resource-collections/06-skills.md)

---

---

## Decision: Per-Collection Customization vs Base Collection Class

---

## Decision Context

Should each collection customize its own pagination metadata, or should a shared base class enforce consistent structure?

---

## Decision Criteria

* **Collection count:** How many collection endpoints does the API have?
* **Consistency requirement:** Is uniform pagination structure important for clients?

---

## Decision Tree

Need to implement pagination metadata for collections?

↓

Does the API have 3 or more collection endpoints?

YES → Create a `BaseCollection` that extends `ResourceCollection` and overrides `paginationInformation()` consistently — all collections extend `BaseCollection`

NO → Are the existing collections already returning different metadata shapes?

    YES → Create a `BaseCollection` to normalize — even with 2 collections, inconsistency is harmful

    NO → Individual collection customization is acceptable until the API grows

---

## Rationale

A base collection class enforces a single pagination structure across all endpoints. Clients write one pagination handler that works everywhere. Without a base class, each collection may have a different metadata shape, forcing per-endpoint client logic. The threshold is 3+ collections — below that, the overhead of maintaining a base class may exceed the benefit.

---

## Recommended Default

**Default:** Create a base collection class from the start, even if only 1-2 collection endpoints exist
**Reason:** Adding a base class later is harder than starting with one; the overhead is minimal (one file) and the consistency benefit is immediate

---

## Risks Of Wrong Choice

Without a base class, collections silently diverge. `UserCollection` uses `current_page` while `PostCollection` uses `page`. `OrderCollection` removes `total`. Each endpoint requires a different client parsing strategy. Retroactively normalizing requires changes in every collection and client.

---

## Related Rules

* Rule: Use a Base Collection Class for Consistent Pagination Metadata (pagination-metadata/05-rules.md)
* Rule: Document the Paginator Type Per Endpoint (pagination-metadata/05-rules.md)

---

## Related Skills

* Customize Pagination Metadata in Collections (pagination-metadata/06-skills.md)
* Resource Collections (resource-collections/06-skills.md)
