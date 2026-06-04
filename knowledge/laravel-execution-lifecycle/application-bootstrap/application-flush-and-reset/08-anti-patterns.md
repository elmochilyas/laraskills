# ECC Anti-Patterns — Application Flush and Reset

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Application Bootstrap |
| **Knowledge Unit** | Application Flush and Reset |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Mid-Request Reset
2. Flush Without Rebind
3. Static Property Accumulation
4. Binding State Capture in Callbacks

---

## Repository-Wide Anti-Patterns

- Shared Mutable State — static properties persist across `flush()` and leak between requests in Octane.

---

## Anti-Pattern 1: Mid-Request Reset

### Category
Reliability

### Description
Calling `flush()` or `reset()` during a request lifecycle — in middleware, controllers, or services. This destroys container state unpredictably mid-pipeline.

### Why It Happens
Developers misunderstand `flush()` as a general-purpose "clean state" method. They call it to reset state between operations within the same request, not realizing it clears all container bindings.

### Warning Signs
- `$app->flush()` or `$app->reset()` called in middleware or controller code
- After calling flush, facade resolution breaks mid-request
- `BindingResolutionException` after custom reset logic

### Why It Is Harmful
Mid-request reset clears all non-base bindings, breaking every service that has been resolved. The application enters an inconsistent state where some services work (those re-resolved lazily) and others fail.

### Real-World Consequences
A controller calls `$app->flush()` to "reset state" before processing a batch job. After flush, the logger binding is gone, so all subsequent log calls silently fail. Batch processing errors go unlogged, and debugging becomes impossible.

### Preferred Alternative
Never call `flush()` or `reset()` manually in request-scoped code. Use `reset()` only between requests in long-running process lifecycle hooks. Use `app()->forgetInstance()` or `app()->forgetScopedInstances()` for targeted cleanup.

### Refactoring Strategy
1. Remove all `flush()` and `reset()` calls from middleware and controllers
2. Replace with targeted `forgetInstance()` for specific singleton cleanup
3. Use Octane lifecycle hooks (`tick()`, `RequestTerminated`) for request-boundary reset

### Detection Checklist
- [ ] `flush()` or `reset()` called in middleware, controller, or service code
- [ ] Facade resolution breaks after custom reset logic

### Related Rules
Rule 1 (05-rules.md): Never call `flush()` or `reset()` during a request lifecycle.

### Related Skills
Configure Application Flush and Reset for Octane (06-skills.md).

### Related Decision Trees
Mid-Request Container Reset decision (07-decision-trees.md).

---

## Anti-Pattern 2: Flush Without Rebind

### Category
Reliability

### Description
Using `flush()` directly instead of `reset()` for request boundaries, without immediately re-registering essential bindings and aliases. `flush()` clears all aliases, breaking facade resolution.

### Why It Happens
Developers see `flush()` as the simpler method and don't realize that `reset()` is the complete solution. They assume aliases survive `flush()` because base bindings do.

### Warning Signs
- `$app->flush()` called without subsequent `registerBaseBindings()` and `registerCoreContainerAliases()`
- After flush, `Facade::resolvedInstance()` returns empty for all facades
- Facade calls throw `BindingResolutionException` after flush

### Why It Is Harmful
`flush()` clears alias mappings, so facade resolution fails. The container becomes partially functional — `$app->make('app')` works, but `Cache::get()` and `DB::connection()` throw errors.

### Real-World Consequences
An Octane worker calls `flush()` between requests instead of `reset()`. After thousands of successful requests, a request triggers a binding clean-up that calls `flush()`. Subsequent requests fail with `BindingResolutionException` for all facade resolutions, taking down the API.

### Preferred Alternative
Always use `reset()` instead of `flush()` for request boundaries. `reset()` calls `flush()`, then re-registers base bindings and all core aliases, and clears the `hasBeenBootstrapped` guard.

### Refactoring Strategy
1. Replace all `flush()` calls with `reset()` where request-boundary reset is needed
2. If `flush()` is truly needed, follow immediately with `registerBaseBindings()` and `registerCoreContainerAliases()`

### Detection Checklist
- [ ] `flush()` is used instead of `reset()` for request boundaries
- [ ] Facade resolution fails after `flush()`

### Related Rules
Rule 2 (05-rules.md): Use `reset()` not `flush()` for request boundaries.

### Related Skills
Configure Application Flush and Reset for Octane (06-skills.md).

### Related Decision Trees
Flush vs Reset selection decision (07-decision-trees.md).

---

## Anti-Pattern 3: Static Property Accumulation

### Category
Performance

### Description
Storing request-scoped data in static properties or static class members expecting `flush()` to clear them. `flush()` only clears container state, not static properties on user classes.

### Why It Happens
Developers use static properties as a convenient way to cache per-request data without realizing that `flush()` only manages container bindings. They assume static data is part of container state.

### Warning Signs
- Static properties used to store user, request, or session data
- After `flush()`, static properties retain old values
- In Octane, one request's data appears in the next request

### Why It Is Harmful
Static state leaks are the #1 security concern in Octane. One request's authenticated user leaks to the next request, causing data cross-contamination and potential privilege escalation.

### Real-World Consequences
A `CurrentUser` helper class stores the authenticated user in a static property. In Octane, Request A authenticates as admin. The static `$user` retains the admin user. Request B authenticates as regular user, but `CurrentUser::get()` still returns the admin user from Request A. The regular user gains admin privileges.

### Preferred Alternative
Use scoped container bindings for per-request data. Scoped bindings are automatically cleared by `flush()` via `$this->scopedInstances`.

### Refactoring Strategy
1. Find all static properties that hold request-scoped data
2. Replace with `$app->scoped()` bindings
3. Inject the scoped service instead of accessing static properties
4. Verify scoped instances are cleared after `flush()`

### Detection Checklist
- [ ] Static properties hold user, request, or session data
- [ ] Data from one request persists to the next in Octane
- [ ] `memory_get_usage()` does not decrease after `flush()`

### Related Rules
Rule 3 (05-rules.md): Use scoped bindings instead of static properties for request-scoped data.

### Related Skills
Detect Static Property Leaks in Octane (06-skills.md).

### Related Decision Trees
State Management in Long-Running Processes decision (07-decision-trees.md).

---

## Anti-Pattern 4: Binding State Capture in Callbacks

### Category
Performance

### Description
Registering `resolving()`, `afterResolving()`, or `beforeResolving()` callbacks that capture request-scoped state. These callbacks survive `flush()` if not cleared from the callback registries.

### Why It Happens
Developers register resolution callbacks as a convenient way to configure newly-resolved services. They capture request-scoped variables without realizing the callback persists in `$this->beforeResolvingCallbacks` or `$this->afterResolvingCallbacks` across flushes.

### Warning Signs
- `resolving()` callback captures `$request`, `$user`, or session data
- After `flush()`, the callback still executes on new resolutions
- Callbacks accumulate over time, slowing resolution

### Why It Is Harmful
Callbacks that survive `flush()` continue to apply to newly-resolved services in subsequent requests. If they capture stale request state, they corrupt every service they touch.

### Real-World Consequences
A `resolving(Mailer::class, function ($mailer, $app) use ($user) { ... })` captures the user from Request A. After `flush()`, the callback persists. Request B resolves a Mailer, and the callback applies Request A's user to Request B's email. Customer A receives Customer B's email.

### Preferred Alternative
Register callbacks in the scoped lifecycle or use `forgetScopedInstances()` to clear them. For per-request service configuration, use middleware or service provider `boot()` methods.

### Refactoring Strategy
1. Find all `resolving()`/`afterResolving()` callbacks that capture request data
2. Replace with scoped bindings that include the configuration logic
3. Clear callbacks explicitly in Octane lifecycle hooks if needed

### Detection Checklist
- [ ] `resolving()`/`afterResolving()` callbacks capture request-scoped variables
- [ ] After `flush()`, callbacks still execute
- [ ] Callback registry grows unbounded in long-running processes

### Related Rules
Rule 4 (05-rules.md): Ensure resolution callbacks do not capture request-scoped data that would be stale after flush.

### Related Skills
Detect Binding State Capture in Long-Running Processes (06-skills.md).

### Related Decision Trees
Callback Scope Management decision (07-decision-trees.md).
