# ECC Anti-Patterns — Application Builder Configuration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Application Bootstrap |
| **Knowledge Unit** | Application Builder Configuration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Business Logic in Bootstrap Closures
2. Global State in Builder Closures
3. Duplicate Binding Registration
4. Over-Chaining Unused Builder Methods
5. Capturing Request-Scoped Variables in Builder Closures

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — closures in builder chain that run database queries during construction.
- Premature Caching — caching inside builder closures assumes the closure runs only once per request.

---

## Anti-Pattern 1: Business Logic in Bootstrap Closures

### Category
Architecture

### Description
Placing validation, API calls, heavy computation, or business decisions inside builder closures passed to `with*()` methods or `booting()`/`booted()` callbacks in `bootstrap/app.php`.

### Why It Happens
Developers see closures as "convenient" and add logic directly inside them instead of creating service providers or middleware. The builder chain runs during construction, so any heavy logic blocks the application bootstrap.

### Warning Signs
- `bootstrap/app.php` contains closures with database queries, HTTP calls, or complex conditionals
- `booting()` or `booted()` callbacks contain business logic
- Bootstrap time increases with application complexity

### Why It Is Harmful
Builder closures run during construction, before error handlers and middleware are fully active. Logic errors in bootstrap closures crash the entire application. In Octane, closures persist across requests.

### Real-World Consequences
A `booting()` callback makes an HTTP API call to a third-party service during bootstrap. The third-party service is slow, delaying every request by 500ms. In Octane, the closure runs once, but the delayed bootstrap blocks worker initialization.

### Preferred Alternative
Move business logic to service providers, middleware, or dedicated action classes. Use the builder chain only for declarative configuration.

### Refactoring Strategy
1. Extract all logic from builder closures into service provider methods
2. Move request-dependent logic to middleware
3. Replace complex conditionals in `bootstrap/app.php` with `$app->environment()` branching

### Detection Checklist
- [ ] Builder closures contain loops, conditionals, or method calls beyond simple config
- [ ] `bootstrap/app.php` contains `DB::`, `Http::`, or other service calls
- [ ] `booting()`/`booted()` callbacks contain more than 3 lines of code

### Related Rules
Rule 1 (05-rules.md): Use builder for declarative configuration, not business logic.

### Related Skills
Configure Application via ApplicationBuilder (06-skills.md).

### Related Decision Trees
Where to Register Container Bindings decision (07-decision-trees.md).

---

## Anti-Pattern 2: Global State in Builder Closures

### Category
Architecture

### Description
Modifying global variables, static properties, or global state inside `with*()` closures or `booting()`/`booted()` callbacks in the builder chain.

### Why It Happens
Developers treat builder closures as initialization code without considering that they run during construction, before request isolation exists. Global state modification in closures persists across requests in long-running processes.

### Warning Signs
- `$GLOBALS` modified inside builder closures
- Static properties set or mutated in `bootstrap/app.php`
- Global helper functions called for their side effects

### Why It Is Harmful
Global state set in builder closures survives across all requests in Octane. One request's data leaks to the next, causing data corruption and security vulnerabilities.

### Real-World Consequences
A `booting()` callback sets `$GLOBALS['current_user_id']` during initialization. In Octane, this global persists across requests, causing User A's operations to be attributed to User B.

### Preferred Alternative
Use scoped bindings or request-specific lifecycle hooks for per-request state. Use service providers for framework initialization.

### Refactoring Strategy
1. Identify all global state modifications in builder closures
2. Replace globals with scoped container bindings
3. Replace static property mutations with instance-bound services

### Detection Checklist
- [ ] `$GLOBALS`, `global`, or static `::` property assignment in `bootstrap/app.php`
- [ ] Side-effect function calls in builder closures

### Related Rules
Rule 2 (05-rules.md): Never modify global state inside builder closures.

### Related Skills
Configure Application via ApplicationBuilder (06-skills.md).

---

## Anti-Pattern 3: Duplicate Binding Registration

### Category
Reliability

### Description
Registering the same abstract in both `withSingletons()`/`withBindings()` in the builder AND in a service provider, causing race conditions where the last registration wins unpredictably.

### Why It Happens
Developers register a binding in the builder for convenience and later add a service provider for the same binding without removing the builder registration. The execution order between builder callbacks and provider registration depends on timing.

### Warning Signs
- Same abstract appears in both `bootstrap/app.php` and a service provider
- Binding behavior changes unpredictably when provider order changes
- `$app->bound()` returns true earlier than expected

### Why It Is Harmful
The last registration wins, but the order between builder and provider registration is not guaranteed. CI and production may behave differently based on provider discovery order.

### Real-World Consequences
A payment gateway binding registered in `withSingletons()` is overridden by a service provider on the developer's machine but NOT in production due to different provider discovery ordering. Production uses the wrong payment implementation.

### Preferred Alternative
Register each binding in exactly one place. Use builder for simple class-to-class mappings; use service providers for bindings requiring setup logic.

### Refactoring Strategy
1. Identify all singletons/bindings registered in both builder and providers
2. Decide which location is appropriate for each
3. Remove the duplicate registration
4. Add CI check to detect duplicate abstract registration

### Detection Checklist
- [ ] Same abstract appears in `withSingletons()`/`withBindings()` and in a service provider
- [ ] `vendor:publish` providers may duplicate builder bindings

### Related Rules
Rule 3 (05-rules.md): Register each binding in exactly one location.

### Related Skills
Configure Application via ApplicationBuilder (06-skills.md).

---

## Anti-Pattern 4: Over-Chaining Unused Builder Methods

### Category
Maintainability

### Description
Calling every available `with*()` method in the builder chain, including those for subsystems the application does not use (e.g., `withBroadcasting()` with no broadcasting config).

### Why It Happens
Developers copy the default Laravel bootstrap file or tutorials and leave all methods in place "just in case." The builder chain grows with dead configuration.

### Warning Signs
- Builder chain contains 10+ `with*()` calls
- Configuration files referenced in builder methods don't exist
- `withBroadcasting()` called with no broadcasting configuration

### Why It Is Harmful
Each `with*()` call registers deferred callbacks and configurator objects, adding memory overhead and complexity. Dead configuration makes `bootstrap/app.php` harder to read and maintain.

### Real-World Consequences
A project with 8 `with*()` calls includes `withBroadcasting()` and `withCommands()` that configure nothing. When a developer needs to debug the bootstrap, they waste time understanding which calls are actually active.

### Preferred Alternative
Only call `with*()` methods for subsystems the application actually uses. Remove unused calls. Keep the chain minimal and explicit.

### Refactoring Strategy
1. Review each `with*()` call and verify the application uses that subsystem
2. Remove unused calls
3. Add a comment explaining why each call exists

### Detection Checklist
- [ ] `withBroadcasting()` called but no broadcasting channels configured
- [ ] `withCommands()` called but command array is empty
- [ ] Builder chain exceeds 8 method calls

### Related Rules
Rule 4 (05-rules.md): Keep the builder chain minimal — only configure subsystems the application uses.

---

## Anti-Pattern 5: Capturing Request-Scoped Variables in Builder Closures

### Category
Performance

### Description
Capturing request-scoped variables (like `$request`, service instances with per-request state) inside `booting()` or `booted()` closures in the builder chain. These closures persist across requests in Octane.

### Why It Happens
Developers write closures that reference `$request` or other request-scoped objects for convenience. In FPM, this works because each request starts fresh. In Octane, the closure survives across requests with the captured reference.

### Warning Signs
- `booting()` or `booted()` callback references `$request`, `$user`, or session objects
- In Octane, values captured in closure are stale on subsequent requests
- Memory grows over time as captured references accumulate

### Why It Is Harmful
Captured variables become memory leaks in Octane because the closure persists across requests. The application holds references to objects that should have been garbage-collected.

### Real-World Consequences
An Octane application's memory grows from 30MB to 500MB over 24 hours. Investigation reveals a `booted()` callback captured a `$request` variable. Each request overwrites the capture, but the old objects cannot be garbage-collected because the closure holds a reference.

### Preferred Alternative
Use middleware for request-scoped logic. Use Octane lifecycle hooks (`tick()`, `RequestTerminated`) instead of builder closures for per-request setup.

### Refactoring Strategy
1. Identify all builder closures that reference `$request` or per-request objects
2. Move the logic to middleware
3. Use Octane's request lifecycle hooks for request-scoped cleanup

### Detection Checklist
- [ ] Builder closures reference `$request`, `$user`, session/cache that varies by request
- [ ] Octane memory grows over time
- [ ] Stale request data appears in subsequent requests

### Related Rules
Rule 5 (05-rules.md): Never capture request-scoped variables in builder closures — they persist across Octane requests.

### Related Skills
Configure Application via ApplicationBuilder (06-skills.md).

### Related Decision Trees
Where to Register Container Bindings decision (07-decision-trees.md).
