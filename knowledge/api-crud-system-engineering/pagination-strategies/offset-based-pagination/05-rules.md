# Rules: Offset-Based Pagination

## Rule: Set Maximum Per-Page Limit
- **Condition:** When implementing offset pagination
- **Action:** Set a maximum per_page value (default 100). Clamp or reject values above the limit.
- **Consequence:** Prevents large page requests from overwhelming the database.
- **Enforcement:** Form Request validation enforces per_page maximum.

## Rule: Validate Page Parameter
- **Condition:** When accepting page parameter from clients
- **Action:** Validate that page is a positive integer. Reject page 0, negative pages, and non-numeric values.
- **Consequence:** Prevents unexpected query behavior.
- **Enforcement:** Integration tests verify invalid page values return 422.

## Rule: Return Pagination Metadata
- **Condition:** In every paginated API response
- **Action:** Include current_page, per_page, total, last_page, and navigation links in the response metadata.
- **Consequence:** Clients have complete navigation information.
- **Enforcement:** API contract tests verify pagination metadata structure.

## Rule: Use SimplePaginate For Infinite Scroll
- **Condition:** When the UI does not need page number navigation
- **Action:** Use `simplePaginate()` instead of `paginate()` to skip the COUNT(*) query.
- **Consequence:** Faster responses for UIs that only need next/previous navigation.
- **Enforcement:** Review flags paginate() usage where simplePaginate() suffices.

## Rule: Cache Total Count For Large Tables
- **Condition:** When COUNT(*) on the paginated table takes >50ms
- **Action:** Cache the total count with a TTL. Invalidate cache on record creation or deletion.
- **Consequence:** Paginated responses are fast regardless of table size.
- **Enforcement:** Performance tests verify COUNT(*) latency with caching enabled.
