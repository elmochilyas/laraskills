# ECC Anti-Patterns — Middleware Registration Order

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Middleware Registration Order |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Arbitrary Reordering of Global Middleware
2. Registering Middleware in Wrong Group
3. Global Middleware for Route-Specific Concerns
4. Ignoring Middleware Priority When Mixing Sources

---

## Repository-Wide Anti-Patterns

- Fat Controllers — middleware logic that should be global pushed into controllers instead.
- Hidden Database Queries — middleware that triggers database queries on every request.

---

## Anti-Pattern 1: Arbitrary Reordering of Global Middleware

### Category
Reliability

### Description
Reordering the `$middleware` array on the HTTP Kernel without understanding the dependencies between middleware classes. The default order is designed for correct framework operation.

### Why It Happens
A developer encounters a middleware ordering issue and moves middleware in the array to fix it, assuming the default order is arbitrary.

### Warning Signs
- `Kernel::$middleware` array order differs significantly from the framework default
- After reordering, some middleware stops functioning correctly
- Middleware that depends on session or authentication runs before those services are ready

### Why It Is Harmful
Framework middleware have implicit ordering dependencies. `StartSession` must run before `Authenticate`. `EncryptCookies` must run before cookies are read. Reordering without understanding these dependencies breaks core functionality.

### Real-World Consequences
A developer moves `StartSession` to the end of the global middleware array to "optimize" non-session routes. Session-dependent middleware now runs before the session starts, causing CSRF token mismatches and authentication failures on every route.

### Preferred Alternative
Use `$middlewarePriority` for fine-grained ordering control rather than reordering the global array. Add custom middleware at the correct position using prepend/append methods.

### Refactoring Strategy
1. Restore the default `$middleware` array order
2. Use `$middleware->prepend()` or `$middleware->append()` in the ApplicationBuilder
3. If custom ordering is needed, use `$middlewarePriority`

### Detection Checklist
- [ ] `$middleware` array manually reordered
- [ ] Framework middleware breaking after reorder
- [ ] Middleware priority not used for ordering control

### Related Rules
Rule 1 (05-rules.md): Do not reorder framework-provided middleware arbitrarily.

### Related Skills
Configure Middleware Registration Order (06-skills.md).

### Related Decision Trees
Middleware Order decision (07-decision-trees.md).

---

## Anti-Pattern 2: Registering Middleware in Wrong Group

### Category
Architecture

### Description
Placing middleware in the wrong middleware group — e.g., CORS middleware in the `web` group where it runs after session start instead of in the `api` group where it runs before authentication.

### Why It Happens
Developers don't read group documentation and add middleware to whichever group "seems right" or copy from Stack Overflow without understanding group semantics.

### Warning Signs
- CORS middleware in the `web` group
- Session-dependent middleware in the `api` group
- Middleware that works in web routes but fails in API routes, or vice versa

### Why It Is Harmful
The `web` group includes session, CSRF, and cookie middleware. The `api` group typically does not. Middleware placed in the wrong group either runs with unnecessary dependencies or misses required prerequisites.

### Real-World Consequences
CORS middleware is added to the `web` group. CORS headers are set after session middleware runs, which is fine. But API routes don't use the `web` group, so API requests have no CORS headers. Frontend API calls fail with CORS errors.

### Preferred Alternative
Understand each middleware group's composition and purpose. Register middleware in the group that matches its requirements. Create custom groups for specialized middleware pipelines.

### Refactoring Strategy
1. Review which group each custom middleware is registered in
2. Move middleware to the appropriate group based on its dependencies
3. Create new groups if existing groups don't fit

### Detection Checklist
- [ ] CORS middleware in `web` group
- [ ] Session-dependent middleware in `api` group
- [ ] Middleware behavior differs from group intent

### Related Rules
Rule 2 (05-rules.md): Register middleware in the correct group based on its dependencies.

### Related Skills
Configure Middleware Registration Order (06-skills.md).

### Related Decision Trees
Middleware Group Selection decision (07-decision-trees.md).

---

## Anti-Pattern 3: Global Middleware for Route-Specific Concerns

### Category
Performance

### Description
Adding middleware to the global `$middleware` array that should only apply to specific routes. Global middleware runs on every request, wasting resources on routes that don't need it.

### Why It Happens
Developers add middleware globally for convenience instead of applying it to specific routes or groups. They don't consider the performance impact on routes that don't need the middleware.

### Warning Signs
- Route-specific concern (admin auth, logging) in `$middleware` array
- Global middleware that short-circuits for most routes
- Middleware that does heavy I/O on every request but is only needed on one route

### Why It Is Harmful
Every request pays the cost of global middleware, even requests to routes that don't need it. Database queries, external API calls, and authentication checks in global middleware add latency to all endpoints.

### Real-World Consequences
An IP-allowlisting middleware is added globally. Every API call, health check, and static asset request checks the IP allowlist. Latency increases by 50ms per request. Health check endpoints that should return in 10ms now take 60ms, causing load balancer timeouts.

### Preferred Alternative
Apply route-specific middleware directly to the routes or groups that need it. Use global middleware only for concerns that truly apply to every request (e.g., maintenance mode, trust proxies).

### Refactoring Strategy
1. Identify global middleware that is not needed on all routes
2. Move to route-specific or group-specific registration
3. Use conditional logic inside the middleware if truly needed globally

### Detection Checklist
- [ ] Route-specific concern in global middleware array
- [ ] Middleware contains early-return for most routes
- [ ] Performance impact on routes that don't need the middleware

### Related Rules
Rule 3 (05-rules.md): Register route-specific concerns as route/group middleware, not global middleware.

### Related Skills
Configure Middleware Registration Order (06-skills.md).

### Related Decision Trees
Global vs Route Middleware decision (07-decision-trees.md).

---

## Anti-Pattern 4: Ignoring Middleware Priority When Mixing Sources

### Category
Reliability

### Description
Relying on registration order to determine execution order when middleware from different sources (global, groups, route) are mixed. The `$middlewarePriority` array controls the order when sources conflict.

### Why It Happens
Developers assume that middleware executes in the order they are listed in their respective arrays. They don't realize `$middlewarePriority` can override this when middleware from different sources are combined.

### Warning Signs
- Middleware execution order differs from array registration order
- `$middlewarePriority` is not defined or not understood
- Conflicting priorities between global and group middleware

### Why It Is Harmful
The pipeline sorts middleware by their priority before executing. Ignoring priority means your middleware may execute before or after middleware it depends on, regardless of where you placed it in the array.

### Real-World Consequences
A rate-limiting middleware is registered first in the global array. A `ValidateSignature` middleware is registered later. But `ValidateSignature` has a higher priority in the defaults. The signature check runs before rate limiting, causing signature verification failures on rate-limited requests.

### Preferred Alternative
Use `$middlewarePriority` to explicitly define the order when middleware from different sources interact. Test middleware execution order with `Route::middleware()` testing utilities.

### Refactoring Strategy
1. Review `$middlewarePriority` for the kernel version in use
2. Add explicit priority entries for custom middleware that must run before/after specific framework middleware
3. Test middleware order with integration tests

### Detection Checklist
- [ ] Middleware execution order does not match registration order
- [ ] `$middlewarePriority` not reviewed after adding custom middleware
- [ ] Priority conflicts between different middleware sources

### Related Rules
Rule 4 (05-rules.md): Use `$middlewarePriority` to control execution order when mixing middleware from different sources.

### Related Skills
Configure Middleware Registration Order (06-skills.md).

### Related Decision Trees
Middleware Priority decision (07-decision-trees.md).
