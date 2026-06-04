# Anti-Patterns: Query Parameter Filtering

## Unrestricted Filtering
**Description:** Any query parameter accepted as a filter, exposing the entire database schema.
**Why it happens:** No allowlist implemented; naive `$query->where($request->all())` approach.
**Consequences:** Security vulnerability; database structure exposed; injection possible.
**Better approach:** Implement filter allowlist. Reject unknown filter parameters.

## Raw SQL In Filters
**Description:** Concatenating filter values into SQL strings instead of using parameterized queries.
**Why it happens:** Quick implementation; developer unaware of SQL injection risks.
**Consequences:** Critical security vulnerability; any filter value can execute arbitrary SQL.
**Better approach:** Use Eloquent where methods. Never concatenate filter input.

## No Validation Of Filter Values
**Description:** Passing filter values directly to the query builder without type or format validation.
**Why it happens:** Trusting client input to always be valid.
**Consequences:** Database errors from invalid values; potential injection vectors.
**Better approach:** Validate all filter values before applying to queries.
