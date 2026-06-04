# ECC Anti-Patterns — Policy Design for APIs

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | Policy Design for APIs |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Authorization Logic in Controllers Instead of Policies
2. Catch-All Admin Override Without Explicit Conditions
3. Exposing Denial Reasons in Production 403 Responses
4. Per-Item Policy Checks in Collection Endpoints
5. Missing restore/forceDelete Methods for Soft-Delete Models

---

## Repository-Wide Anti-Patterns

- Fat Controllers
- N+1 Query Problem
- Hidden Database Queries

---

## Anti-Pattern 1: Authorization Logic in Controllers Instead of Policies

### Category
Code Organization

### Description
Placing authorization checks directly in controller methods (e.g., `if ($user->id !== $post->user_id) abort(403)`) instead of using dedicated Policy classes, causing duplicated logic across controllers.

### Why It Happens
The inline check is faster to write for a single endpoint. Developers don't anticipate needing the same authorization rule elsewhere.

### Warning Signs
- `abort(403)` with conditional logic in controller methods
- Ownership checks duplicated across multiple controllers
- No `app/Policies/` directory or empty policy classes
- `$this->authorize()` calls absent from controller methods

### Why It Is Harmful
Same authorization logic appears across multiple controllers. Inconsistencies develop as one controller gets updated and others don't. Unit testing authorization requires hitting controllers instead of testing policies in isolation.

### Real-World Consequences
A security update to an authorization rule requires modifying 5 controllers. One is missed. The vulnerability persists for 3 months until discovered during a security audit.

### Preferred Alternative
Place all authorization in Policy classes. Call `$this->authorize('update', $post)` from controllers.

### Refactoring Strategy
1. Create `app/Policies/` directory with per-model policy classes
2. Extract authorization logic from controllers into policy methods
3. Replace inline checks with `$this->authorize()` calls
4. Register policies explicitly if models use non-standard namespaces
5. Write policy tests covering owner, non-owner, admin, guest scenarios

### Detection Checklist
- [ ] Search for `abort(403)` in controllers
- [ ] Search for `->user_id ===` patterns in controllers
- [ ] Verify policy classes exist for each resource model

### Related Rules
- Always Use Policies for Authorization, Never Controllers (05-rules.md)

### Related Skills
- (Policy design skills are embedded in the rules)

### Related Decision Trees
- (Authorization architecture choices)

---

## Anti-Pattern 2: Catch-All Admin Override Without Explicit Conditions

### Category
Security

### Description
Implementing admin check as `return true` at the start of every policy method without explicit conditions, granting administrators unrestricted access to all actions including future ones not yet considered.

### Why It Happens
It seems efficient: "admins can do everything, so return true." The catch-all is added early and never refined as new policy methods are added.

### Warning Signs
- `return true;` as the first line in multiple policy methods
- No `if ($user->isAdmin()) return true;` — just bare `return true;`
- Admin-specific logic not tested separately
- Future policy methods automatically allow all actions for admins

### Why It Is Harmful
A new policy method added months later inherits the catch-all `return true` without review. Actions that should be restricted for security (e.g., `forceDelete`, `restore`) become available to all admins without scrutiny.

### Real-World Consequences
A new `exportAllUsers` action is added to UserPolicy months later. The catch-all `return true` grants every admin access to bulk export PII. The data leak goes unnoticed until a compliance audit.

### Preferred Alternative
Check admin status explicitly in each method: `if ($user->isAdmin()) return true;` followed by specific business logic.

### Refactoring Strategy
1. Review all policy methods for bare `return true;` without admin check
2. Replace with explicit admin check + specific authorization logic
3. Add test for each policy method with admin user
4. Ensure new policy methods require explicit admin handling

### Detection Checklist
- [ ] Search for "return true;" in policy files
- [ ] Verify admin overrides have explicit conditions
- [ ] Check admin tests cover each policy method

### Related Rules
- Implement Admin Override Pattern with Explicit Conditions (05-rules.md)

### Related Skills
- (Authorization testing patterns)

### Related Decision Trees
- (Policy design architecture decisions)

---

## Anti-Pattern 3: Exposing Denial Reasons in Production 403 Responses

### Category
Security

### Description
Returning detailed error messages in 403 responses (e.g., "You are not the owner of this post"), leaking information about resource ownership structure and authorization rules to potential attackers.

### Why It Happens
Detailed error messages are useful during development. The same exception handler is deployed to production without customizing message visibility.

### Warning Signs
- 403 responses contain specific reasons like "not owner" or "not admin"
- Auth exception messages reveal business logic
- Production error responses are more detailed than "Forbidden"
- Attackers can enumerate resources by interpreting denial reasons

### Why It Is Harmful
Attackers can distinguish "resource doesn't exist" from "resource exists but you can't access it," enabling resource enumeration. Ownership structure (user_id vs team_id) is revealed, helping attackers understand the permission model.

### Real-World Consequences
An attacker sends requests to `/api/posts/1`, `/api/posts/2`, etc. Some return "Post not found" and others return "You are not the owner of this post." The attacker now knows which post IDs exist and can target the owners' accounts.

### Preferred Alternative
Return generic "Forbidden" message in production. Log the specific reason for debugging.

### Refactoring Strategy
1. Create environment-aware exception handler for AuthorizationException
2. In production, always return "Forbidden" regardless of reason
3. Log the specific denial reason with user_id, resource, and action
4. Test both development and production error formats

### Detection Checklist
- [ ] Check 403 response body for specific denial messages
- [ ] Review exception handler for AuthorizationException formatting
- [ ] Verify production responses use generic "Forbidden"

### Related Rules
- Never Expose Denial Reasons in Production 403 Responses (05-rules.md)

### Related Skills
- (Error handling in API responses)

### Related Decision Trees
- (Production vs development error detail)

---

## Anti-Pattern 4: Per-Item Policy Checks in Collection Endpoints

### Category
Performance

### Description
Filtering collection results by calling `$user->can('view', $post)` on each item in a loop instead of using `viewAny` + query scopes, causing N+1 authorization queries.

### Why It Happens
It's simpler to fetch all records and filter in PHP than to build dynamic query scopes. Developers don't notice the performance impact at low volumes.

### Warning Signs
- `->filter(fn($item) => $user->can('view', $item))` in controller
- Policy checks inside paginated collection loops
- Slow index endpoint responses as data grows
- 100+ policy check calls per request on collection endpoints

### Why It Is Harmful
Each policy check may trigger additional lazy-loaded relationship queries. For 100 records, this means 100+ extra database queries. API response time grows linearly with record count instead of remaining constant.

### Real-World Consequences
An index endpoint with 50 records executes 50 policy checks, each lazy-loading the post's team relationship. The endpoint responds in 2 seconds instead of 100ms. Under load, database connections exhaust.

### Preferred Alternative
Use `viewAny` for collection access control and filter via Eloquent query scopes at the database level.

### Refactoring Strategy
1. Implement `viewAny` policy method for collection access
2. Replace per-item filtering with query scopes on the base query
3. Ensure pagination happens before any PHP filtering
4. Remove `can()` calls from collection responses
5. Benchmark endpoint before and after

### Detection Checklist
- [ ] Search for `->filter` with `can()` in controllers
- [ ] Check for `authorize('view'` inside loops
- [ ] Verify `viewAny` is implemented and used for collections

### Related Rules
- Use viewAny for Collection Access, Filter via Scopes (05-rules.md)

### Related Skills
- (Query optimization patterns)

### Related Decision Trees
- (Performance optimization decisions)

---

## Anti-Pattern 5: Missing restore/forceDelete Methods for Soft-Delete Models

### Category
Maintainability

### Description
Implementing only `delete` policy method for soft-delete models without corresponding `restore` and `forceDelete` methods, causing all restore and force-delete operations to silently return 403.

### Why It Happens
Developers forget soft-delete interactions with authorization. The default return value for unimplemented policy methods is `false`, which blocks the operations silently.

### Warning Signs
- Soft-delete model has only `view`, `create`, `update`, `delete` policy methods
- Admin users get 403 on restore/force-delete routes
- No `restore` or `forceDelete` method definitions in policy class
- Users complain they cannot undo accidental deletes

### Why It Is Harmful
Restore operations silently fail with 403. Users cannot recover accidentally deleted content. Force-delete for cleanup is blocked even for admins unless explicitly authorized.

### Real-World Consequences
A user accidentally deletes a critical record. The restore endpoint returns 403 because no `restore` method exists. Support team escalates to engineering, who discovers the missing policy method.

### Preferred Alternative
Implement `restore` and `forceDelete` policy methods with appropriate authorization rules for all soft-delete models.

### Refactoring Strategy
1. Identify all models using `SoftDeletes` trait
2. Add `restore` and `forceDelete` methods to each policy
3. Implement appropriate authorization (usually same as delete for restore, admin-only for forceDelete)
4. Test restore and force-delete scenarios for owner, non-owner, admin
5. Verify restore/force-delete routes return proper status codes

### Detection Checklist
- [ ] Check models with `SoftDeletes` trait
- [ ] Verify corresponding policies have `restore` and `forceDelete` methods
- [ ] Test restore route with authorized and unauthorized users

### Related Rules
- Include restore and forceDelete for Soft-Delete Models (05-rules.md)

### Related Skills
- (Policy testing patterns)

### Related Decision Trees
- (Soft-delete authorization decisions)

---
