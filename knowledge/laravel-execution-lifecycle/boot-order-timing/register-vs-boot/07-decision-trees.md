# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** ku-01-register-vs-boot
**Generated:** 2026-06-03

---

# Decision Inventory

1. Provider Logic Placement: `register()` vs `boot()` for binding vs initialization
2. Provider Decomposition: Single provider vs split binding/boot providers
3. Late Registration Handling: Normal eager provider vs deferred provider strategy

---

# Architecture-Level Decision Trees

---

## Decision Name: Provider Logic Placement

---

## Decision Context

Choosing whether to place a piece of provider logic in `register()` (first phase) or `boot()` (second phase), based on whether it sets up bindings or performs initialization.

---

## Decision Criteria

* performance — `register()` runs before `boot()`, but both run on every request for eager providers
* architectural — `register()` guarantees all providers' `register()` are done; `boot()` guarantees all bindings exist
* security — services resolved in `register()` may not yet be registered by later providers
* maintainability — clear separation between bindings (register) and initialization (boot)

---

## Decision Tree

Is the code adding a container binding (bind, singleton, scoped, instance, alias, contextual)?
↓
YES → Place in `register()` using `$this->app->bind()`, `$this->app->singleton()`, or `$bindings`/`$singletons` properties
NO → Does the code need to resolve a service from the container?
↓
YES → Place in `boot()` — all providers have completed `register()`, all bindings exist
NO → Does the code register routes, event listeners, view composers, gates, or commands?
↓
YES → Place in `boot()` — these often depend on resolved services (middleware classes, listener classes)
NO → Does the code read configuration values or environment?
↓
YES → Place in `boot()` — config is loaded before boot, but should not be accessed in `register()`
NO → Does the code publish config/migration files (package development)?
↓
YES → Use `$this->publishes()` and `mergeConfigFrom()` — config merging in `register()`, publishing in `boot()`
NO → Default to `boot()` — it is the safer phase for any non-binding logic

---

## Rationale

The two-phase design guarantees all providers complete `register()` before any provider's `boot()` starts. A service resolved in `register()` may depend on a binding that a later provider hasn't registered yet, causing `BindingResolutionException`. `register()` should contain only pure container bindings — no resolution, no I/O, no side effects. `boot()` is for everything else.

---

## Recommended Default

**Default:** Container bindings in `register()`; all initialization (routes, events, views, gates, resolutions) in `boot()`.
**Reason:** Guarantees all bindings are available before any initialization runs.

---

## Risks Of Wrong Choice

- Resolving in `register()`: `BindingResolutionException` during bootstrap — non-deterministic, depends on provider order.
- Registering bindings in `boot()`: bindings might be invisible to deferred providers that resolved before boot.
- Heavy I/O in `register()`: delays all subsequent providers' `register()` — the entire bootstrap phase serializes on your heavy operation.

---

## Related Rules

- Keep register() Pure — Bindings Only (05-rules.md, Rule 1)
- Use boot() for All Initialization (05-rules.md, Rule 2)
- Do Not Modify Container Bindings in boot() (05-rules.md, Rule 5)

---

## Related Skills

- Separate Service Registration from Initialization (06-skills.md)
- Structure Service Provider boot() Methods (boot-phase-order)

---

## Decision Name: Provider Decomposition Strategy

---

## Decision Context

Deciding whether to keep a provider as a single class or split it into separate binding and boot providers, particularly when one phase is heavy or conditionally needed.

---

## Decision Criteria

* performance — splitting allows deferring the binding-only part
* architectural — deferred providers skip register()/boot() until service is used
* maintainability — split providers are more focused but increase file count
* security — split providers isolate concerns

---

## Decision Tree

Does the provider have both bindings AND boot logic?
↓
YES → Can the binding-only part be deferred (no boot() dependencies)?
YES → Split into a deferred binding provider and an eager boot provider
NO → Keep as single provider — split would not improve bootstrap cost
NO → Does the provider only have bindings (no boot logic)?
↓
YES → Implement `DeferrableProvider` and `provides()` — skip register()/boot() until first service resolution
NO → Does the provider only have boot logic (no bindings)?
↓
YES → Keep as eager provider with empty register() — no deferral benefit
NO → Keep as single provider

---

## Rationale

Deferred providers skip both `register()` and `boot()` until the first time a service they provide is resolved. If a provider only registers bindings and has no boot logic, it is a prime candidate for deferral — the bootstrap cost is eliminated for requests that never use those bindings. Providers with boot logic must remain eager unless the boot logic itself can be moved to a separate eager provider.

---

## Recommended Default

**Default:** Single provider for both bindings and boot logic unless the binding portion is large and deferrable.
**Reason:** Simplicity; avoid premature optimization. Deferral adds complexity with `provides()` and `when()` methods.

---

## Risks Of Wrong Choice

- Over-deferral: every provider deferred creates latency spikes on first service usage — the first `make()` pays `register()` + `boot()` synchronously.
- Split without need: two files instead of one for no measurable performance gain.
- Forgetting `provides()` on deferred provider: `BindingResolutionException` when service is resolved — provider never loads.

---

## Related Rules

- Keep register() Pure — Bindings Only (05-rules.md, Rule 1)
- Use `DeferrableProvider` for binding-only providers (deferred-providers, Rule 1)
- Keep `provides()` complete for every deferred provider (deferred-providers, Rule 2)

---

## Related Skills

- Separate Service Registration from Initialization (06-skills.md)
- Implement Deferred Providers (deferred-provider-loading-timing)

---

## Decision Name: Provider Registration Strategy

---

## Decision Context

Choosing between normal eager provider registration and deferred provider registration for optimizing bootstrap performance.

---

## Decision Criteria

* performance — deferred providers skip bootstrap entirely until first use
* architectural — deferred providers are invisible during register/boot phases
* security — deferred providers load on first resolution, possibly mid-request
* maintainability — deferred providers require `provides()` maintenance

---

## Decision Tree

Is the service used on every request or in most requests?
↓
YES → Use normal eager provider — deferral adds complexity with no benefit
NO → Does the provider only register bindings (no boot logic)?
↓
YES → Implement `DeferrableProvider` and `provides()` — ideal candidate
NO → Does the provider have boot logic that must run on every request?
↓
YES → Use normal eager provider — boot logic cannot be deferred
NO → Does the provider have boot logic that can be triggered by an event?
↓
YES → Use `when()` method to trigger deferred loading on specific events
NO → Use normal eager provider — evaluate whether boot logic is truly needed

---

## Rationale

Deferred providers are most effective for bindings-only providers whose services are used infrequently. The bootstrap cost savings come from skipping both `register()` and `boot()` on every request. If the service is type-hinted in every controller constructor, deferral provides no benefit — the provider loads on every request regardless.

---

## Recommended Default

**Default:** Normal eager provider; only defer when profiling shows measurable bootstrap overhead from the provider.
**Reason:** Deferral adds complexity; optimize based on data, not speculation.

---

## Risks Of Wrong Choice

- Deferring a provider that registers routes/views/gates: routes don't exist until provider is triggered — runtime errors.
- Deferring a service type-hinted in high-traffic constructors: provider loads on first request anyway — no benefit.
- Stale services manifest: after changing `provides()`, the manifest must be regenerated or resolution fails.

---

## Related Rules

- Use `DeferrableProvider` for binding-only providers (05-rules.md, Rule 3)
- Keep `provides()` complete for every deferred provider (05-rules.md, Rule 4)

---

## Related Skills

- Separate Service Registration from Initialization (06-skills.md)
- Implement Deferred Providers (deferred-provider-loading-timing)
