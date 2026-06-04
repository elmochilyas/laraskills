# Decision Trees — Pagination Response Testing

## Tree 1: Paginator Type Selection for Testing

**Decision Context**: Which paginator type to test — LengthAwarePaginator vs CursorPaginator vs SimplePaginator — each has different response shapes.

**Decision Criteria**:
- Total record count availability
- Large dataset requirements
- Real-time data mutation tolerance

**Decision Tree**:
```
Do you need to display total record count and last page number?
├── YES → Use LengthAwarePaginator (paginate()) — test data, meta (current_page, last_page, per_page, total), links
└── NO → Do you have large datasets where counting total is expensive?
    ├── YES → Use CursorPaginator (cursorPaginate()) — test data, meta (next_cursor, prev_cursor, has_more), links
    └── NO → Do you only need next/previous without totals?
        ├── YES → Use SimplePaginator (simplePaginate()) — test data, links only
        └── NO → Use LengthAwarePaginator (default — most comprehensive)
```

**Rationale**: Each paginator type returns different meta fields. Tests must assert the correct shape for the chosen type. CursorPaginator doesn't have `total` or `last_page`.

**Recommended Default**: LengthAwarePaginator with full shape assertion on data, meta, and links.

**Risks**: Testing LengthAwarePaginator shape against a CursorPaginator response (asserting `total` and `last_page` that don't exist).

---

## Tree 2: Boundary Page Testing

**Decision Context**: Which page boundaries to test — first page, last page, page beyond last, negative page, per_page limits.

**Decision Criteria**:
- Pagination implementation robustness
- Consumer edge case handling
- API security requirements

**Decision Tree**:
```
Is the paginator accessible without authentication (public)?
├── YES → Test all boundaries: page=1, page=last, page=beyond last (empty data), page=-1 (rejected), per_page=0 (default), per_page=max+1 (capped)
└── NO → Is the paginator for authenticated endpoints only?
    ├── YES → Test standard boundaries: page=1, page=beyond last, per_page=max+1 (capped)
    └── NO → Test at minimum: page=1, page=beyond last (empty data), per_page max limit
```

**Rationale**: Public endpoints face more abuse and need stricter boundary testing. Authenticated endpoints still need standard boundary protection.

**Recommended Default**: Test page=1, last page (seed per_page+1 records), page beyond last (empty data), and per_page cap.

**Risks**: Untested negative page or per_page=0 parameters may cause 500 errors or expose all records.
