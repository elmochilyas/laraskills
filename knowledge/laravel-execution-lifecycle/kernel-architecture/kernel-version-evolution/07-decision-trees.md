# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Kernel Architecture
**Knowledge Unit:** Kernel Version Evolution
**Generated:** 2026-06-03

---

# Decision Inventory

1. Configuration Pattern: ApplicationBuilder vs legacy kernel class
2. Package Compatibility: Supporting pre-11 and post-11 kernel patterns
3. Migration Timing: Incremental vs big-bang kernel migration

---

# Architecture-Level Decision Trees

---

## Decision Name: Configuration Pattern Selection

---

## Decision Context

Choosing between the modern `bootstrap/app.php` ApplicationBuilder pattern and the legacy `App\Http\Kernel` class for middleware/command configuration.

---

## Decision Criteria

* performance — no runtime difference; same internal state produced
* architectural — ApplicationBuilder uses composition; kernel class uses inheritance
* security — ApplicationBuilder is the future-proof, supported pattern
* maintainability — ApplicationBuilder is documented API; kernel class may be removed

---

## Decision Tree

What Laravel version is the application running?
↓
11+ → Use ApplicationBuilder exclusively (`bootstrap/app.php`) — kernel class is deprecated
10.x → Is the application being actively developed and may upgrade to 11+?
↓
YES → Adopt `withMiddleware()` (backported to 10.43+) now; migrate the rest during upgrade
NO → Legacy kernel class is acceptable
< 10 → Legacy kernel class is the only option

---

## Rationale

Laravel 11 removed the userland `App\Http\Kernel` and `App\Console\Kernel` classes. Middleware, commands, and schedule configuration moved to `bootstrap/app.php` via `ApplicationBuilder`. The framework still loads legacy kernel classes if they exist (BC layer), but this is a migration bridge, not a permanent solution. New Laravel 11+ projects should use `bootstrap/app.php` exclusively.

---

## Recommended Default

**Default:** ApplicationBuilder in Laravel 11+; legacy kernel in Laravel ≤ 10 (but adopt ApplicationBuilder patterns for future upgrade).
**Reason:** ApplicationBuilder is the documented, future-proof approach.

---

## Risks Of Wrong Choice

- Using kernel class in Laravel 11+: framework ignores kernel class — configuration silently not applied.
- Using ApplicationBuilder in Laravel 10 without backport: method not available — runtime error.
- Keeping both kernel class AND ApplicationBuilder: additive merge may produce duplicate middleware or unexpected ordering.

---

## Related Skills

- Migrate Legacy Kernel to ApplicationBuilder (legacy-kernel-migration)

---

## Decision Name: Package Compatibility Strategy

---

## Decision Context

Building packages that support both Laravel 10 (kernel class) and Laravel 11+ (ApplicationBuilder) patterns.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — framework kernel unchanged; only userland configuration moved
* security — kernel type-hint breakage in packages
* maintainability — `class_exists()` detection for BC

---

## Decision Tree

Does the package extend or type-hint `App\Http\Kernel` or `App\Console\Kernel`?
↓
YES → Replace with `Illuminate\Contracts\Http\Kernel` or `Illuminate\Contracts\Console\Kernel` — the contract exists in all versions
NO → Does the package call `$kernel->pushMiddleware()` in a service provider?
↓
YES → Guard with `class_exists('App\Http\Kernel')` — the call silently becomes no-op in Laravel 11+ without the kernel class
NO → Does the package need to configure middleware or commands?
↓
YES → Document both approaches: `bootstrap/app.php` for Laravel 11+, old kernel class for Laravel 10
NO → Package is version-agnostic — no changes needed

---

## Rationale

The framework kernel classes (`Illuminate\Foundation\Http\Kernel`, `Illuminate\Foundation\Console\Kernel`) remain unchanged across versions. Only the userland extension classes (`App\Http\Kernel`, `App\Console\Kernel`) were removed. Contracts (`Illuminate\Contracts\Http\Kernel`, `Illuminate\Contracts\Console\Kernel`) are stable across all versions and should be used for type-hinting.

---

## Recommended Default

**Default:** Type-hint contracts, not concrete kernel classes; use `class_exists()` for BC in service providers.
**Reason:** Contracts are version-stable; `class_exists()` enables graceful degradation.

---

## Risks Of Wrong Choice

- Type-hinting `App\Http\Kernel`: "Class not found" on Laravel 11+ skeleton projects.
- Calling `$kernel->pushMiddleware()` in Laravel 11+: silently no-op — middleware never added.
- Overriding framework kernel instead of using ApplicationBuilder: configuration not picked up by framework.

---

## Related Skills

- Migrate Legacy Kernel to ApplicationBuilder (legacy-kernel-migration)
