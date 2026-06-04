# Anti-Patterns: Include Related Resources

## Unrestricted Includes
**Description:** No allowlist for the `?include=` parameter — clients can include any Eloquent relationship, including sensitive or non-existent ones.
**Why it happens:** Developers implement includes by parsing the parameter and passing it directly to `->with()` without validation.
**Consequences:** Relationship enumeration attack (clients discover relationships by trying names); expensive join queries on non-existent relations throw 500 errors.
**Better approach:** Define an explicit allowlist per resource. Reject unknown include values with 422.

## N+1 Via Includes
**Description:** Resource accesses `$this->comments` without `whenLoaded()` after the include was requested, or includes are loaded after pagination, causing N+1 on large datasets.
**Why it happens:** Resource unconditionally accesses the relationship; includes are parsed but not eagerly loaded before pagination.
**Consequences:** Collection of 100 items with includes triggers 101+ queries; paginated responses load relationships for all matching records, not just the current page.
**Better approach:** Use `whenLoaded()` for all includable relationships. Eager load before pagination.

## Unauthorized Includes
**Description:** Included relationships bypass authorization — a user who cannot view comments receives them via `?include=comments`.
**Why it happens:** Authorization is checked for the primary resource but not for included relationships.
**Consequences:** Data leakage through includes; users can access related resources they shouldn't see.
**Better approach:** Apply authorization checks to included relationships at every nesting level.

## Infinite Nesting
**Description:** Clients can request arbitrarily deep includes like `?include=posts.comments.author.profile.avatar`, triggering a chain of queries.
**Why it happens:** No depth limit on include parsing. Developer assumes clients will be reasonable.
**Consequences:** Database load from deep joins; response size explosion; potential DoS vector.
**Better approach:** Enforce a maximum nesting depth (2-3 levels). Reject deeper include requests.

## Include After Pagination
**Description:** `->with($includes)` is called after `->paginate()`, loading relationships for ALL matching records instead of just the current page.
**Why it happens:** The include logic runs after the query is already paginated, typically because the pagination and include code are separated in the controller.
**Consequences:** N+1 for each page item PLUS full-table relationship loading — worst-case performance.
**Better approach:** Apply `->with()` to the query before `->paginate()`. Ensure the query builder chain is correct.
