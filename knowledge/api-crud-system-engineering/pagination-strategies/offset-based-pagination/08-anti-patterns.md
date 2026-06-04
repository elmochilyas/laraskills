# Anti-Patterns: Offset-Based Pagination

## Deep Offset Abuse
**Description:** Supporting pagination to page 10,000+ with offset pagination, where each request scans millions of rows.
**Why it happens:** Default implementation doesn't limit page depth; nobody tests page 10,000.
**Consequences:** Database performance degrades dramatically for deep pages; queries timeout.
**Better approach:** Enforce maximum page number (e.g., page 1000). Recommend cursor pagination beyond that.

## Unlimited Per Page
**Description:** Allowing any per_page value without clamping, so clients request 1000 records per page.
**Why it happens:** No validation on the per_page parameter.
**Consequences:** Slow responses; high database load; memory exhaustion.
**Better approach:** Set min (1) and max (100) per_page limits. Clamp out-of-range values.

## Missing Total Count
**Description:** Using simplePaginate() when the UI requires page number navigation, leaving clients without navigation data.
**Why it happens:** Developers choose simplePaginate() for speed without considering UI requirements.
**Consequences:** UI cannot render page number navigation; users cannot jump to specific pages.
**Better approach:** Use paginate() when total count is needed. Choose by UI requirements, not convenience.

## COUNT(*) On Every Request
**Description:** Computing COUNT(*) on every paginated request for a table with millions of rows, even though data rarely changes.
**Why it happens:** Default paginate() behavior; no caching implemented.
**Consequences:** Unnecessary database load; slower response times.
**Better approach:** Cache total count with TTL. Invalidate only on create/delete.

## Offset Drift Ignorance
**Description:** Using offset pagination for real-time data like activity feeds, where new records shift page boundaries.
**Why it happens:** Developers don't consider data mutation during pagination.
**Consequences:** Users see the same record on multiple pages or miss records entirely.
**Better approach:** For real-time data, use cursor pagination. For static data, offset is fine.
