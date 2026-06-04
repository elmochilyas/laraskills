# ECC Anti-Patterns — Query Handler Patterns

## Domain: Backend Architecture & Design | Subdomain: Command Query Separation

### Anti-Pattern Inventory

1. **Query Handler with Side Effects** — Query that triggers writes, notifications, or caches
2. **Fat Query Results** — Returning full entities when specific fields are needed
3. **No Query Optimization** — Eloquent with N+1 in query handlers
4. **Query Handler Coupled to HTTP** — Handler returning Response objects instead of data
5. **Over-Specific Queries** — Separate query class for every unique field combination
6. **Query Handler Doing Authorization** — Mixing access control with data retrieval

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Query Handler with Side Effects

**Category:** CQRS Violation

**Description:** Query handler that triggers writes, creates cache entries, or sends notifications.

**Why It Happens:** Convenience — "while we're fetching data, let's also update it."

**Warning Signs:** Query handler that writes to a cache, updates a "last viewed" timestamp, or sends analytics.

**Why Is It Harmful:** Query is no longer idempotent. Repeated queries have side effects. Cannot safely retry or cache. Violates CQRS separation.

**Preferred Alternative:** Queries are read-only. Side effects go in commands.

**Refactoring Strategy:** Move side effects to commands. Queries return data only.

**Related Rules:** Queries must be side-effect-free (05-rules.md)

---

### Anti-Pattern 2: Fat Query Results

**Category:** Performance

**Description:** Query handler returning full Eloquent models with all relations when caller needs 2 fields.

**Why It Happens:** Model reuse — "caller can pick what they need."

**Warning Signs:** Query returns `User` but caller only uses `$user->getName()`; eager loading of unnecessary relations.

**Why Is It Harmful:** Database loads unnecessary columns and joins. Network transfers excess data. Memory wasted on unused objects.

**Preferred Alternative:** Return specific read models/DTOs containing only required fields.

**Refactoring Strategy:** Create targeted read model with specific fields. Use query builder select() for efficient queries.

**Related Rules:** Return only data the caller needs (05-rules.md)

---

### Anti-Pattern 3: No Query Optimization

**Category:** Performance

**Description:** Query handlers with N+1 queries, missing indexes, or full table scans.

**Why It Happens:** Handlers written without considering query performance.

**Warning Signs:** Query handler in loop; repeated DB calls; missing `with()` for relationships.

**Why Is It Harmful:** Slow API responses. Database load spikes. Poor user experience.

**Preferred Alternative:** Optimize queries with eager loading, select only needed columns, add database indexes.

**Refactoring Strategy:** Profile query handlers for N+1. Add eager loading. Add indexes based on query patterns.

**Related Rules:** Optimize queries in query handlers (05-rules.md)

---

### Anti-Pattern 4: Query Handler Coupled to HTTP

**Category:** Architecture

**Description:** Query handler returning HTTP Response objects or framework-specific types.

**Why It Happens:** Controllers delegate to handlers that return ready-to-send responses.

**Warning Signs:** Query handler returns `JsonResponse`, `Response`, or view data.

**Why Is It Harmful:** Query handler tied to HTTP transport. Cannot reuse for CLI, queue, or non-HTTP contexts.

**Preferred Alternative:** Handler returns plain data (DTO, array, collection). Controller formats response.

**Refactoring Strategy:** Strip framework dependencies from handler return types. Return plain PHP data.

**Related Rules:** Query handlers return data, not HTTP responses (05-rules.md)

---

### Anti-Pattern 5: Over-Specific Queries

**Category:** Maintainability

**Description:** Separate query class for every unique combination of filters and fields.

**Why It Happens:** "One query per use case" taken to extreme.

**Warning Signs:** `GetActiveUsersByRoleQuery`, `GetActiveUsersByRoleWithPostsQuery`, `GetActiveUsersByRoleWithPostsSinceDateQuery`.

**Why Is It Harmful:** Query class explosion. Most queries share logic. Maintenance burden of many nearly-identical classes.

**Preferred Alternative:** Use composable query objects or repository methods with parameters.

**Refactoring Strategy:** Merge similar queries. Use parameterized repository methods instead of per-combination classes.

**Related Rules:** Use composable queries, not per-combination classes (05-rules.md)

---

### Anti-Pattern 6: Query Handler Doing Authorization

**Category:** Separation of Concerns

**Description:** Query handler checking user permissions and filtering results based on authorization.

**Why It Happens:** Convenience — "handler knows the data, it should filter."

**Warning Signs:** Query handler receives user object; handler contains `if ($user->can('view', $model))`.

**Why Is It Harmful:** Authorization logic scattered across handlers. Cannot reuse handlers for admin/internal contexts. Testing requires authorization setup.

**Preferred Alternative:** Apply authorization before query dispatch. Handler assumes caller is authorized.

**Refactoring Strategy:** Move authorization to controller/gate layer. Query handler receives pre-authorized input.

**Related Rules:** Separate query from authorization (05-rules.md)
