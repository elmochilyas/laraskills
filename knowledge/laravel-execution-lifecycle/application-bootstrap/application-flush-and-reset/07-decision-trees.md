# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Application Flush and Reset
**Generated:** 2026-06-03

---

# Decision Inventory

1. Container Reset Method: `reset()` vs `flush()` for request boundaries
2. Reset Timing: Inter-request vs mid-request container reset
3. Binding Lifetime: `scoped()` vs `singleton()` for Octane compatibility
4. State Cleanup: Container flush vs static property cleanup

---

# Architecture-Level Decision Trees

---

## Decision Name: Container Reset Method Selection

---

## Decision Context

Choosing between `$app->reset()` and `$app->flush()` when clearing container state between requests in long-running processes.

---

## Decision Criteria

* performance — `reset()` adds ~0.16ms over `flush()` (alias re-registration)
* architectural — `reset()` restores aliases and bootstrapping guard; `flush()` alone breaks facade resolution
* security — `flush()` without alias restoration leaves the container non-functional
* maintainability — `reset()` is the single-call solution; `flush()` requires manual re-registration

---

## Decision Tree

Are you resetting between request boundaries in Octane/RoadRunner/FrankenPHP?
↓
YES → Use `$app->reset()` — the complete reset that restores aliases, base bindings, and clears the bootstrapped guard
NO → Are you running a single isolated command (e.g., Artisan command) inside an Octane worker and need fine-grained control?
↓
YES → Use `$app->flush()` followed by manual re-registration of necessary bindings (advanced — only when you fully understand what survives)
NO → Are you writing a test to verify binding survival behavior?
↓
YES → Use `$app->flush()` to verify only base bindings survive; use `reset()` to test full re-initialization
NO → Use `$app->reset()` — it is always the safer choice

---

## Rationale

`reset()` calls `flush()` and then re-registers base bindings, core aliases (all ~70 facade aliases), clears `hasBeenBootstrapped`, resets `booted`, and clears `loadedProviders`. `flush()` alone clears everything except the three base bindings (`'app'`, `Container::class`, PSR-11). After `flush()`, no facade aliases exist — `Facade::resolveFacadeInstance()` cannot resolve through the container. After `flush()`, `hasBeenBootstrapped` remains `true`, so `bootstrapWith()` throws `LogicException`. `reset()` is the correct choice for request-boundary cleanup.

---

## Recommended Default

**Default:** `$app->reset()` for all request-boundary cleanup in long-running processes.
**Reason:** Single-call complete reset — restores aliases, base bindings, and allows re-bootstrapping.

---

## Risks Of Wrong Choice

- Using `flush()` instead of `reset()` for request boundaries: all facade calls fail with `BindingResolutionException`, application cannot process subsequent requests without full worker restart.
- Calling `flush()` or `reset()` mid-request (middleware, controller): catastrophic destruction of container state, immediate `BindingResolutionException` for any subsequent service resolution.
- Assuming any custom binding survives `flush()`: only `'app'`, `Container::class`, and `Psr\Container\ContainerInterface` survive — all other bindings must be re-registered.

---

## Related Rules

- Always use `reset()` not `flush()` for request-boundary cleanup (05-rules.md, Rule 1)
- Never call `flush()` or `reset()` during a request lifecycle (05-rules.md, Rule 2)
- Test every custom binding for flush survival (05-rules.md, Rule 3)

---

## Related Skills

- Reset Application State Between Octane Requests (06-skills.md)
- Test Container Bindings for Flush Survival

---

## Decision Name: Binding Lifetime Selection for Octane

---

## Decision Context

Choosing between `$app->scoped()`, `$app->singleton()`, and `$app->bind()` when registering services in applications that run on Octane or other long-running runtimes.

---

## Decision Criteria

* performance — `scoped()` creates new instance per request; `singleton()` reuses across requests
* architectural — `scoped()` bindings are cleared by `flush()`; `singleton()` bindings must be re-registered
* security — `singleton()` bindings that capture request state leak data across requests
* maintainability — `scoped()` is the Octane-safe default for most services

---

## Decision Tree

Does the service hold request-scoped state (user data, request metadata, session)?
↓
YES → Use `$app->scoped()` — automatically cleared by flush between requests
NO → Is the service stateless (no mutable properties, no captured references)?
↓
YES → Use `$app->singleton()` — safe to reuse across requests, better performance
NO → Does the service depend on a scoped service?
↓
YES → Use `$app->scoped()` — a singleton should never depend on a scoped service (creates stale dependencies)
NO → Does the service need a fresh instance every time it is resolved?
↓
YES → Use `$app->bind()` — creates new instance on every resolution
NO → Use `$app->singleton()` if stateless; `$app->scoped()` if stateful per request

---

## Rationale

`singleton()` in Octane creates an instance once per worker — the same instance serves all requests. If that instance holds user data from request #1, request #2 sees user #1's data. `scoped()` creates one instance per request, which is cleared when `flush()` runs between requests. `bind()` creates a new instance on every resolution — the most isolation but also the highest allocation cost. Choose the most reusable option that safely isolates state.

---

## Recommended Default

**Default:** `$app->scoped()` for any service that touches request data; `$app->singleton()` for stateless utility services.
**Reason:** `scoped()` provides request isolation with minimal overhead; `singleton()` is safe only for truly stateless services.

---

## Risks Of Wrong Choice

- `singleton()` with request-scoped state: user authentication data, cart contents, or session data leak from request to request — the #1 Octane data contamination cause.
- `bind()` for every service: excessive object allocation, increased memory pressure and GC overhead.
- Singleton depending on scoped: the singleton resolves its dependency once and never re-resolves — the scoped dependency becomes stale.

---

## Related Rules

- Use `scoped()` instead of `singleton()` for fresh-per-request bindings (05-rules.md, Rule 5)
- Test every custom binding for flush survival (05-rules.md, Rule 3)
- Never rely on `flush()` to clear static properties (05-rules.md, Rule 4)

---

## Related Skills

- Reset Application State Between Octane Requests (06-skills.md)
- Test Container Bindings for Flush Survival
