# ECC Anti-Patterns — Lifecycle Callback Hooks

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Lifecycle Callback Hooks |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Callback Spaghetti
2. Using Hooks Instead of Provider boot()
3. State Mutation in booting() Callbacks
4. Forgetting Fire-Once Semantics
5. Heavy Work in booting() Callbacks

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — booting/booted callbacks that trigger database queries before providers are ready
- Premature Caching — caching in booting() before all providers have registered their config

---

## Anti-Pattern 1: Callback Spaghetti

### Category
Code Organization

### Description
Registering `booting()` and `booted()` callbacks in multiple places across different providers without clear coordination or documentation.

### Why It Happens
Developers discover hooks and use them freely as "just another way to run code at boot time," scattering callbacks throughout the codebase.

### Warning Signs
- `$app->booting()` used in 5+ different providers
- `$app->booted()` used in 10+ different places
- Hard to determine which callbacks run and in what order
- Callbacks that conflict with each other (modifying the same config)

### Why It Is Harmful
Callbacks registered across multiple providers create an invisible execution sequence that is not documented by the provider list. Determining which callback runs when requires inspecting every `register()` method in the application. This makes the boot phase impossible to reason about.

### Real-World Consequences
Five providers each register `booted()` callbacks. One sets up routes, another registers middleware, a third configures exception handling, the fourth initializes a service, and the fifth logs the boot time. The order of these callbacks depends on provider registration order. When a new provider is added, the callback order shifts, and route setup runs before middleware configuration — breaking the application.

### Preferred Alternative
Minimize the use of `booting()` and `booted()` callbacks. Use provider `boot()` for provider-specific logic. Reserve hooks for genuine cross-provider coordination that cannot be expressed otherwise.

### Refactoring Strategy
1. List all `booting()` and `booted()` callbacks in the codebase
2. Move provider-specific logic from hooks into the provider's `boot()` method
3. Consolidate remaining cross-cutting callbacks into a single dedicated provider
4. Document the order and purpose of remaining callbacks

### Detection Checklist
- [ ] `booting()` or `booted()` used in 5+ providers
- [ ] Provider-specific logic in global hooks
- [ ] Callback order not documented or understood

### Related Rules
Lifecycle Callback Hooks Rule 2 (05-rules.md): Use booted() for Post-Provider Setup, Not Provider boot().
Lifecycle Callback Hooks Rule 5 (05-rules.md): Prefer Provider boot() Over Hooks for Provider-Specific Logic.

### Related Skills
Use Lifecycle Callback Hooks for Cross-Provider Coordination (06-skills.md).

### Related Decision Trees
Hook Selection Strategy (07-decision-trees.md).

---

## Anti-Pattern 2: Using Hooks Instead of Provider boot()

### Category
Code Organization

### Description
Placing initialization logic that belongs in a specific provider's `boot()` method into a global `booting()` or `booted()` callback.

### Why It Happens
Developers discover hooks first and use them as a general-purpose "run at boot" mechanism, not realizing each provider has its own dedicated `boot()` method.

### Warning Signs
- `$this->app->booted()` callback contains provider-specific route registration
- `$this->app->booting()` callback sets up bindings that belong in `register()`
- A provider's `boot()` method is empty while its `register()` registers a `booted()` callback

### Why It Is Harmful
Global hooks are for cross-provider coordination. Provider-specific logic in hooks scatters initialization across different registration points, making it harder to discover which code runs during which phase.

### Real-World Consequences
A `PaymentProvider` registers a `booted()` callback to set up payment routes instead of using its own `boot()` method. A developer debugging payment routing looks at `PaymentProvider::boot()` — it's empty. They assume payment has no routes. Hours later, they discover the routes are registered in a `booted()` callback in a completely different file.

### Preferred Alternative
Use the provider's `boot()` method for all initialization that belongs to that provider. Use hooks only for logic that must run before or after ALL providers boot.

### Refactoring Strategy
1. Find providers that register `booted()` callbacks for their own initialization
2. Move that initialization into the provider's `boot()` method
3. Remove the `booted()` callback if the provider no longer needs cross-provider coordination

### Detection Checklist
- [ ] Provider registers `booted()` callback for its own setup
- [ ] Provider's `boot()` is empty while `register()` sets up hooks
- [ ] Initialization logic scattered across hook registrations

### Related Rules
Lifecycle Callback Hooks Rule 5 (05-rules.md): Prefer Provider boot() Over Hooks for Provider-Specific Logic.

### Related Skills
Use Lifecycle Callback Hooks for Cross-Provider Coordination (06-skills.md).

### Related Decision Trees
Hook Selection Strategy (07-decision-trees.md).

---

## Anti-Pattern 3: State Mutation in booting() Callbacks

### Category
Reliability

### Description
Registering container bindings or modifying service implementations inside `booting()` callbacks.

### Why It Happens
Developers see `booting()` as "early initialization" and add bindings there, thinking they will be available to all providers.

### Warning Signs
- `$app->bind()` or `$app->singleton()` in a `booting()` callback
- `$app->instance()` in a `booting()` callback
- Bindings that are available to some providers but not others

### Why It Is Harmful
`booting()` callbacks run before any provider boots but after all providers have registered. Bindings added here are visible to some providers but not others — those that already booted won't see them. This creates non-deterministic behavior based on provider iteration order.

### Real-World Consequences
A `booting()` callback binds `Logger::class` to `FileLogger::class`. Two providers boot after this callback — both respect the binding. But a third provider, registered earlier in the array, already booted and resolved `Logger` as `NullLogger`. The application has two different logger implementations active simultaneously.

### Preferred Alternative
All container bindings belong in provider `register()` methods. Use `booting()` only for lightweight flag-setting or observation, never for binding registration.

### Refactoring Strategy
1. Find all `$app->bind()`, `singleton()`, `scoped()`, `instance()` calls in `booting()` callbacks
2. Move each to the appropriate provider's `register()` method
3. Verify no bindings remain in `booting()` callbacks

### Detection Checklist
- [ ] `$app->bind()` in `booting()` callback
- [ ] `$app->singleton()` in `booting()` callback
- [ ] `$app->instance()` in `booting()` callback
- [ ] Binding behavior varies depending on provider order

### Related Rules
Lifecycle Callback Hooks Rule 6 (05-rules.md): Do Not Modify Container Bindings in booting() Callbacks.

### Related Skills
Use Lifecycle Callback Hooks for Cross-Provider Coordination (06-skills.md).

### Related Decision Trees
Hook Registration Timing (07-decision-trees.md).

---

## Anti-Pattern 4: Forgetting Fire-Once Semantics

### Category
Reliability

### Description
Relying on a `booted()` callback to execute on every request or every test case, not realizing it fires only once per application instance.

### Why It Happens
Developers are accustomed to per-request code (middleware, controllers) and apply the same expectation to lifecycle hooks without reading their documentation.

### Warning Signs
- Per-request state setup in a `booted()` callback
- `booted()` callback registered in test `setUp()` that should run per-test
- Octane workers where `booted()` fires once but code expects per-request execution

### Why It Is Harmful
Once the app is booted, `$app->booted = true`. Any new `booted()` callback registered after this point fires immediately and is removed. In Octane and repeated test runs, this means the callback fires at unexpected times or only once.

### Real-World Consequences
A test suite calls `$this->app->booted()` in `setUp()` to register a callback that sets up test-specific state. The first test registers the callback — it fires immediately (app is already booted) and sets up state. The second test registers the callback — it fires immediately again, but the state from test 1 is still present. Tests leak state between each other.

### Preferred Alternative
Use middleware for per-request logic. Use `booted()` only for one-time initialization that should happen exactly once per application lifecycle.

### Refactoring Strategy
1. Identify `booted()` callbacks used for per-request or per-test logic
2. Move per-request logic to middleware
3. Move per-test logic to test `setUp()` or `HttpKernel` test setup
4. Move one-time initialization to `booted()` if it truly belongs there

### Detection Checklist
- [ ] `booted()` callback used for per-request state
- [ ] `booted()` callback in test `setUp()`
- [ ] Octane workers where `booted()` fires once but code expects per-request

### Related Rules
Lifecycle Callback Hooks Rule 4 (05-rules.md): Understand Fire-Once Semantics of booted().

### Related Skills
Use Lifecycle Callback Hooks for Cross-Provider Coordination (06-skills.md).

### Related Decision Trees
Fire-Once Awareness (07-decision-trees.md).

---

## Anti-Pattern 5: Heavy Work in booting() Callbacks

### Category
Performance

### Description
Performing database queries, API calls, or heavy computation inside `booting()` callbacks.

### Why It Happens
Developers do not realize that `booting()` runs before any provider boots — it is the earliest point in the provider initialization phase, and every millisecond here delays all subsequent initialization.

### Warning Signs
- `DB::query()` in a `booting()` callback
- HTTP API calls in a `booting()` callback
- Large file parsing in a `booting()` callback
- Cache warming with complex computations in a `booting()` callback

### Why It Is Harmful
`booting()` callbacks run before any provider boots — the earliest point in the provider initialization phase. Heavy operations here delay the entire boot sequence, directly impacting time-to-first-byte for every request.

### Real-World Consequences
A `booting()` callback queries a remote configuration API to load feature flags. The API call takes 200ms. Every single request is delayed by 200ms before any provider boots. In Octane, this is paid once per worker start — but in FPM, it adds 200ms to every request's bootstrap time.

### Preferred Alternative
Keep `booting()` callbacks extremely lightweight — set flags, store timestamps, or register observers. Move heavy operations to `booted()` or middleware.

### Refactoring Strategy
1. Identify all I/O and heavy computation in `booting()` callbacks
2. Move database queries to `booted()` or middleware
3. Move API calls to `booted()` or a queued job
4. Move feature flag loading to `booted()` with caching

### Detection Checklist
- [ ] Database queries in `booting()` callback
- [ ] API calls in `booting()` callback
- [ ] File parsing or heavy computation in `booting()` callback
- [ ] Bootstrap time impact > 5ms from `booting()` callbacks

### Related Rules
Lifecycle Callback Hooks Rule 3 (05-rules.md): Keep booting() Callbacks Lightweight.

### Related Skills
Use Lifecycle Callback Hooks for Cross-Provider Coordination (06-skills.md).

### Related Decision Trees
Hook Selection Strategy (07-decision-trees.md).
