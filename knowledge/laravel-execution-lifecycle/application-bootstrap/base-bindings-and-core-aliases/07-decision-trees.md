# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Base Bindings and Core Aliases
**Generated:** 2026-06-03

---

# Decision Inventory

1. Custom Alias Registration: `$app->alias()` vs static array modification
2. Resolvability Check: alias existence vs `$app->bound()`
3. State Reset Strategy: `flush()` vs `reset()` for alias survival

---

# Architecture-Level Decision Trees

---

## Decision Name: Custom Alias Registration Method

---

## Decision Context

Registering a new container alias — either via the runtime `$app->alias()` method or by directly modifying the static `Application::$aliases` array.

---

## Decision Criteria

* performance — both are O(1); static array is slightly faster but negligible
* architectural — static array is per-process (shared across all Octane workers); `$app->alias()` is per-instance
* security — static modification aliases one worker's aliases to all workers
* maintainability — `$app->alias()` is the documented API

---

## Decision Tree

Are you registering an alias in application/package code?
↓
YES → Use `$app->alias($abstract, $alias)` in a service provider
NO → Are you adding an alias in the framework constructor chain?
↓
YES → Use the static `$aliases` array (framework internals only)
NO → Are you working in Octane and need per-worker isolation?
↓
YES → Always use `$app->alias()` — static modification affects all workers in the same process
NO → Use `$app->alias()` — it is always safe

---

## Rationale

The static `$aliases` array is shared across all Application instances in the same PHP process. Modifying it at runtime via reflection causes side effects in other Octane workers. `$app->alias()` safely registers the alias on the current instance without global mutation. The only valid use of static array modification is in the framework's own constructor chain where performance and global registration are intentional.

---

## Recommended Default

**Default:** `$app->alias(ConcreteClass::class, 'alias-key')` in a service provider's `register()` or `boot()` method.
**Reason:** Per-instance registration, safe in Octane, documented API.

---

## Risks Of Wrong Choice

- Static array modification in Octane: one worker's alias leaks to all other workers, causing alias collisions and unpredictable resolution behavior.
- Static array modification via reflection: the container does not validate the modified state, leading to inconsistent `$this->resolved` tracking.
- Using `$app->alias()` with a key that already exists: last registration wins silently with no warning.

---

## Related Rules

- Register custom aliases with `$app->alias()`, never by modifying static `$aliases` array (05-rules.md, Rule 2)
- Prefix custom facade aliases with unique namespace (05-rules.md, Rule 4)
- Never register a binding with same abstract key as a core alias (05-rules.md, Rule 5)

---

## Related Skills

- Register Core Aliases and Base Bindings (06-skills.md)
- Debug Facade Resolution Failures

---

## Decision Name: Resolvability Verification Strategy

---

## Decision Context

Checking whether a service can be resolved from the container — using alias existence vs actual binding existence.

---

## Decision Criteria

* performance — both are O(1)
* architectural — alias existence does not guarantee resolvability
* security — false positive leads to `BindingResolutionException` at runtime
* maintainability — `$app->bound()` is the correct semantic check

---

## Decision Tree

What are you checking?
↓
"Can I resolve this service from the container?"
YES → Use `$app->bound($abstract)` — checks actual binding
NO → Are you checking whether a facade alias is defined?
↓
YES → Use `$app->isAlias($alias)` — checks alias registration only
NO → Are you debugging why a service resolves to a different class?
↓
YES → Check tag bindings with `$app->tagged($tag)` or inspect resolved instances
NO → Always prefer `$app->bound()` for resolvability checks

---

## Rationale

Core aliases like `'config'`, `'auth'`, and `'cache'` exist immediately after construction, but their bindings are registered later by bootstrappers. `in_array('config', $app->getAliases())` returns `true` even though `$app->make('config')` would throw `BindingResolutionException`. `$app->bound()` returns `true` only when the binding exists, regardless of alias registration.

---

## Recommended Default

**Default:** `$app->bound('service-key')` for all resolvability checks.
**Reason:** Only check that accurately reflects whether `$app->make()` will succeed.

---

## Risks Of Wrong Choice

- Using `$app->isAlias()` or `getAliases()` to check resolvability: false positives for services whose aliases exist but bindings are not yet registered.
- Assuming `Facade::getFacadeAccessor()` resolves: the facade accessor is an alias key, not a binding check.

---

## Related Rules

- Always use `$app->bound()` to test resolvability, not alias existence (05-rules.md, Rule 3)

---

## Related Skills

- Register Core Aliases and Base Bindings (06-skills.md)
- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)

---

## Decision Name: Container State Reset Strategy

---

## Decision Context

Choosing between `flush()` and `reset()` when clearing container state between requests in long-running processes.

---

## Decision Criteria

* performance — `reset()` adds ~0.16ms over `flush()`
* architectural — `reset()` restores aliases and bootstrapping guard; `flush()` alone breaks facade resolution
* security — `flush()` without alias restoration leaves the container non-functional
* maintainability — `reset()` is the single-call solution; `flush()` requires manual alias re-registration

---

## Decision Tree

Are you resetting between request boundaries in Octane/RoadRunner/FrankenPHP?
↓
YES → Use `$app->reset()` — restores aliases, base bindings, and clears the bootstrapped guard
NO → Are you running a single Artisan command inside an Octane worker?
↓
YES → Use `$app->flush()` followed by manual re-registration of only the bindings you need (advanced use)
NO → Are you testing container survival behavior?
↓
YES → Use `$app->flush()` to verify that only base bindings survive; use `reset()` to test full re-initialization
NO → Neither method is needed in standard FPM — there is only one request per instance

---

## Rationale

`reset()` calls `flush()` and then re-registers base bindings, core aliases, clears `hasBeenBootstrapped`, and resets the provider registry. `flush()` alone leaves the container without aliases (breaking all facade resolution) and with `hasBeenBootstrapped = true` (preventing re-bootstrap). `reset()` is the correct choice for request-boundary cleanup in all long-running runtimes.

---

## Recommended Default

**Default:** `$app->reset()` for all request-boundary cleanup in long-running processes.
**Reason:** Single-call full container reset with alias restoration and bootstrapping guard clearance.

---

## Risks Of Wrong Choice

- Using `flush()` instead of `reset()` for request boundaries: all facade calls fail with `BindingResolutionException`, application cannot process subsequent requests without worker restart.
- Calling `flush()` or `reset()` mid-request (middleware, controller): catastrophic container destruction, immediate `BindingResolutionException` for any subsequent service resolution.
- Assuming `flush()` clears static properties: it does not — static state leaks are the #1 Octane security incident cause.

---

## Related Rules

- Always use `reset()` not `flush()` for request-boundary cleanup (05-rules.md, Rule 1)
- Never call `flush()` or `reset()` during a request lifecycle (05-rules.md, Rule 2)
- Test every custom binding for flush survival (05-rules.md, Rule 3)

---

## Related Skills

- Reset Application State Between Octane Requests (06-skills.md)
- Test Container Bindings for Flush Survival
