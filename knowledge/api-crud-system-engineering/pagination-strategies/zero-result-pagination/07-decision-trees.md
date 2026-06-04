# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Zero-Result Pagination
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Empty Response Structure Decision

---

## Decision Context

Determining the correct response structure and HTTP status code when a paginated query returns zero results.

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Is the requested resource endpoint valid (the resource exists)?
├── YES → Is this a paginated endpoint where zero results is a valid state?
│   ├── YES → Return HTTP 200 with `data: []`
│   │   └── Include accurate metadata (total, last_page, per_page, current_page)
│   └── NO → This is not a pagination scenario; handle normally
└── NO → Return 404 (resource endpoint does not exist)

Should the `data` key be an empty array, null, or omitted?
├── Empty array `[]` → Correct: safe for client iteration (.map, .forEach)
├── Null → Wrong: crashes client code (TypeError: data.map is not a function)
└── Omitted → Wrong: breaks client code expecting consistent response shape

Should `meta.reason` distinguish between empty types?
├── YES → Include `reason: "no_results" | "page_exceeds_total" | "cursor_depleted"`
└── NO → Standard consistent empty response (simpler for clients)

---

## Rationale

All empty pages return HTTP 200 with `data: []` — never 404, never null. 404 implies the resource doesn't exist, not that the page is empty. An empty array is the only value that is both semantically correct and safe for client iteration.

---

## Recommended Default

**Default:** HTTP 200 with `data: []` and accurate meta fields for all empty paginated responses
**Reason:** Consistent, parseable, safe for client iteration; follows Laravel defaults.

---

## Risks Of Wrong Choice

404 for empty pages prevents clients from distinguishing missing endpoint from empty dataset. `data: null` crashes client code with TypeError. Missing meta fields break pagination controls.

---

## Related Rules

* Always Return HTTP 200 With data: [] for Empty Pages
* Return Empty Array for data, Never Null or Omitted
* Include Accurate Metadata in Empty Responses

---

## Related Skills

* Handle Zero-Result Paginated Responses Correctly

---

## Client Termination Strategy

---

## Decision Context

Determining how clients should detect the end of pagination and terminate their pagination loop.

---

## Decision Criteria

* maintainability
* reliability

---

## Decision Tree

What pagination strategy is being used?
├── Offset → Client checks: `meta.current_page >= meta.last_page`
│   └── Also check: `data.length === 0`
└── Cursor → Client checks: `meta.has_more === false` or `meta.next_cursor === null`
    └── Also check: `data.length === 0` (defensive)

Should the client implement a maximum page cap?
├── YES → Implement client-side cap (e.g., 500 requests max) to prevent infinite loops
└── NO → Risk: client bug causes infinite pagination loop

---

## Rationale

Offset pagination clients terminate when `current_page >= last_page`. Cursor pagination clients terminate when `has_more === false`. Both should additionally check `data.length === 0` as a defensive fallback. A client-side maximum page cap prevents infinite loops from bugs.

---

## Recommended Default

**Default:** Check `data.length === 0` AND `has_more === false` (cursor) or `current_page >= last_page` (offset); cap at 500 requests
**Reason:** Defensive double-check prevents infinite loops; maximum cap catches edge cases.

---

## Risks Of Wrong Choice

Relying only on `has_more` may miss edge cases (cursor points to deleted records). No maximum cap allows infinite request loops from client bugs.

---

## Related Rules

* Always Return HTTP 200 With data: [] for Empty Pages

---

## Related Skills

* Handle Zero-Result Paginated Responses Correctly
