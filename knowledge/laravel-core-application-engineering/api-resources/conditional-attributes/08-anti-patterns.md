# ECC Anti-Patterns — Conditional Attributes

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Conditional Attributes |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Conditional Omission Used as Access Control
2. Too Many Conditional Fields (Resource Becomes Unpredictable)
3. Expensive Computation Without Callable Wrapping
4. Conditional Fields Not Documented for Clients

---

## Repository-Wide Anti-Patterns

- Authorization in Views (conditionals used as access control)
- Premature Optimization (callable wrapping when computation is cheap)

---

## Anti-Pattern 1: Conditional Omission Used as Access Control

### Category
Security

### Description
Using `when()` or `whenHas()` to hide sensitive fields (e.g., admin-only data) instead of enforcing authorization via policies and middleware.

### Why It Happens
Developers think "if the user doesn't have permission, just don't include the field." It looks like a neat solution because it doesn't require separate endpoints.

### Warning Signs
- `when(auth()->user()->isAdmin(), ...)` in resource `toArray()`
- Sensitive fields conditionally hidden but endpoint accessible to unauthorized users
- No policy or middleware check before the resource is returned

### Why It Is Harmful
Conditional omission is not authorization — the unauthorized user can still reach the endpoint. They may infer hidden fields exist. A response timing attack could reveal the field's existence.

### Real-World Consequences
A `secret_key` field is hidden with `when($request->user()->isAdmin())`. A non-admin discovers the endpoint URL and gets a 200 response — just without the `secret_key`. They now know the endpoint exists and that a secret_key field is hidden.

### Preferred Alternative
Enforce authorization at the controller/policy level before reaching the resource. Use `when()` only for convenience fields (e.g., optional profile fields), not for security.

### Refactoring Strategy
1. Move authorization checks to policies and middleware.
2. Replace `when(auth()->user()->isAdmin(), ...)` with policy-gated endpoints.
3. Use conditional attributes only for non-sensitive optional fields.
4. Add integration tests asserting unauthorized users get 403, not truncated responses.

### Detection Checklist
- [ ] Grep for `when(` in resources and check if conditions check user permissions
- [ ] Is there a policy/middleware check before the resource is returned?

### Related Rules
- Rule: Conditional Omission Is Not Access Control (from source)

---

## Anti-Pattern 2: Too Many Conditional Fields

### Category
Maintainability | Design

### Description
A resource with 10+ fields where 8 use conditional logic (`when`, `whenHas`, `mergeWhen`). The response shape is unpredictable — clients cannot know what fields to expect.

### Why It Happens
Developers keep adding optional fields to a single resource instead of creating separate resources for different contexts.

### Warning Signs
- Majority of fields in `toArray()` use conditional methods
- The resource has separate resources recommended in docs (e.g., `UserListResource` vs `UserDetailResource`) but uses conditions instead
- Client code uses `if (response.data.field !== undefined)` patterns extensively

### Why It Is Harmful
Unpredictable API contract. Clients must check for field existence before using it. Testing requires combinatorial coverage of all conditional states. The resource is hard to understand and maintain.

### Real-World Consequences
A mobile app developer must wrap every field access in `if (response.data?.field)` because no field is guaranteed. Adding a new conditional field requires updating a test matrix of all previous conditional combinations.

### Preferred Alternative
Split into separate resources per context (e.g., `UserSummaryResource`, `UserDetailResource`, `AdminUserResource`). Use conditionals only for 1-2 optional fields.

### Refactoring Strategy
1. Identify groups of conditional fields that always appear together.
2. Create separate resources for each group.
3. Replace the conditional-laden resource with context-specific resources.
4. Update controllers to return the appropriate resource per endpoint.
5. Remove excessive conditionals from the original resource.

### Detection Checklist
- [ ] Count conditional methods vs explicit fields in `toArray()`
- [ ] Are >50% of fields conditional?

### Related Rules
- Rule: Split Resources When Conditionals Dominate

### Related Decision Trees
- Decision: Conditional Field vs Separate Resource

---

## Anti-Pattern 3: Expensive Computation Without Callable Wrapping

### Category
Performance

### Description
Using `when($condition, expensiveComputation())` (eager evaluation) instead of `when($condition, fn() => expensiveComputation())` (lazy evaluation), causing unnecessary computation even when the condition is false.

### Why It Happens
Lack of awareness that `when()` evaluates the value parameter immediately. PHP evaluates function arguments before passing them.

### Warning Signs
- `when($condition, $this->heavyMethod())` — heavyMethod runs even when condition is false
- Database queries or API calls in `when()` value parameters
- Response time increases when condition is false (should be faster)

### Why It Is Harmful
The expensive computation runs on every request regardless of the conditional result. Wastes CPU and database resources.

### Real-World Consequences
A resource has `when($isAdmin, $this->loadAdminDashboard())` which runs a complex 500ms query. For 99% of users, `$isAdmin` is false, but the query still runs because it's evaluated before `when()` checks the condition.

### Preferred Alternative
Wrap expensive computations in closures: `when($condition, fn() => $this->heavyMethod())`. The closure is called only when the condition is true.

### Refactoring Strategy
1. Find all `when()` calls with expensive value parameters.
2. Replace the value with a closure: `fn() => expensiveComputation()`.
3. Keep simple values (strings, arrays) as direct parameters.
4. Add performance tests that verify conditional fields don't trigger expensive computation when false.

### Detection Checklist
- [ ] Grep for `when(` with method calls (e.g., `when($condition, $this->...)`)
- [ ] Check if values could be wrapped in closures

### Related Rules
- Rule: Use Callables for Expensive Conditional Computations
