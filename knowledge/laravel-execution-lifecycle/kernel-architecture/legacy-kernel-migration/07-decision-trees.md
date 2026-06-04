# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Kernel Architecture
**Knowledge Unit:** Legacy Kernel Migration
**Generated:** 2026-06-03

---

# Decision Inventory

1. Migration Strategy: Incremental vs big-bang migration
2. Middleware Parity: Verifying middleware config matches between old and new
3. Service Provider Impact: Handling `$kernel->pushMiddleware()` in providers

---

# Architecture-Level Decision Trees

---

## Decision Name: Migration Strategy

---

## Decision Context

Choosing between incremental migration (keeping old kernel while adding new config) and big-bang migration (removing kernel class entirely).

---

## Decision Criteria

* performance — no runtime difference
* architectural — strangler fig pattern allows safe incremental migration
* security — silent middleware loss if old kernel removed before new config is complete
* maintainability — incremental is safer but slower; big-bang is faster but riskier

---

## Decision Tree

Is the application in active development with multiple contributors?
↓
YES → Use incremental migration (strangler fig pattern):
  1. Add `withMiddleware()` config in Laravel 10.43+ first
  2. Test thoroughly with both configs active
  3. Upgrade to Laravel 11+
  4. Remove old kernel class after verification
NO → Is the application a simple project with minimal middleware?
↓
YES → Big-bang migration is acceptable — move all config at once, remove kernel class, test
NO → Does the application have custom middleware, commands, and scheduling?
↓
YES → Use incremental migration — too many moving parts for big-bang
NO → Use incremental migration — it's the safer approach regardless of complexity

---

## Rationale

Laravel 11+ detects existing kernel classes and falls back to legacy behavior — enabling incremental migration. If both old kernel AND `withMiddleware()` are configured, the framework merges both configs additively. This allows teams to migrate one section at a time, testing each step before the old kernel class is removed.

---

## Recommended Default

**Default:** Incremental migration — add `withMiddleware()` config first, test, upgrade, then remove kernel.
**Reason:** Safer; each step is independently testable and reversible.

---

## Risks Of Wrong Choice

- Big-bang missing middleware: middleware simply doesn't run — no warning. Silent security issue.
- Dual configuration conflict: additive merge may produce duplicate middleware entries.
- Removing kernel before `withRouting()` is complete: route model binding breaks.

---

## Related Skills

- Migrate Legacy Kernel to ApplicationBuilder (06-skills.md)

---

## Decision Name: Middleware Parity Verification

---

## Decision Context

Verifying that the ApplicationBuilder middleware configuration produces identical behavior to the old kernel class.

---

## Decision Criteria

* performance — no difference
* architectural — both produce identical internal arrays
* security — missing middleware = no warning
* maintainability — use `route:list -v` to verify

---

## Decision Tree

Have all middleware entries from the old kernel been migrated?
↓
YES → Run `php artisan route:list -v` — verify middleware column matches expected
NO → Are there middleware entries in `$middleware` (global) that are not in `withMiddleware()`?
↓
YES → Add them with `$middleware->append()` — global middleware must be explicitly migrated
NO → Are there group entries (`web`, `api`) not in `withMiddleware()`?
↓
YES → Configure via `$middleware->web()` and `$middleware->api()` methods
NO → Are there route middleware aliases not in `withMiddleware()`?
↓
YES → Register with `$middleware->alias(['name' => Class::class])`
NO → Are there `$middlewarePriority` entries not migrated?
↓
YES → Configure via `$middleware->priority([...])`
NO → Run `route:list -v` and compare middleware order between old kernel (before removal) and new config

---

## Rationale

The BC layer merges old kernel config and new ApplicationBuilder config. The resulting middleware array is visible via `php artisan route:list -v`. Comparing the middleware column before and after kernel removal is the definitive verification. Any difference means middleware was lost during migration.

---

## Recommended Default

**Default:** Verify with `php artisan route:list -v` before and after kernel removal; ensure middleware columns match exactly.
**Reason:** Silent middleware loss is the #1 migration risk — visual verification catches it.

---

## Risks Of Wrong Choice

- Relying on application behavior alone: subtle middleware loss may not be noticeable until a specific route fails.
- Not checking `$middlewarePriority`: framework middleware execution order may change without explicit priority configuration.
- Additive merge confusion: middleware appears twice in `route:list -v` if both old kernel and new config define it.

---

## Related Skills

- Migrate Legacy Kernel to ApplicationBuilder (06-skills.md)
