# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Kernel Architecture
**Knowledge Unit:** HTTP Kernel Structure & Handle Flow
**Generated:** 2026-06-03

---

# Decision Inventory

1. Middleware Placement: Global vs group vs route middleware
2. Bootstrap Strategy: Caching optimization for bootstrappers
3. Kernel Extension: Custom kernel implementation vs service providers

---

# Architecture-Level Decision Trees

---

## Decision Name: Middleware Placement Level

---

## Decision Context

Choosing the appropriate placement level for middleware in the HTTP kernel pipeline.

---

## Decision Criteria

* performance — global middleware runs on every request; route middleware runs only on matched routes
* architectural — execution order: global → group → route
* security — auth middleware must be in the correct group
* maintainability — least-privilege middleware placement

---

## Decision Tree

Does the middleware need to run on every single request?
↓
YES → Add to global `$middleware` array — but audit; could it be group or route-specific?
NO → Does the middleware apply to a group of routes (web, api)?
↓
YES → Add to the appropriate `$middlewareGroups` array (`web` or `api`)
NO → Does the middleware apply to specific routes only?
↓
YES → Register as route middleware alias and apply per-route (or per-group if many routes share it)
NO → Is the middleware an auth or session dependency?
↓
YES → Place in the appropriate group; auth in `web`, token/auth in `api`
NO → Default to route-specific; promote to group if needed across many routes

---

## Rationale

Least-privilege middleware placement dictates adding middleware at the most specific level that covers all needed routes. Global middleware runs on 100% of requests — every unnecessary entry in `$middleware` affects every request. Group middleware balances coverage with specificity. Route middleware is the most targeted.

---

## Recommended Default

**Default:** Route-specific middleware for single-route concerns; group middleware for cohesive route sets; global only for framework-essential operations.
**Reason:** Minimizes unnecessary middleware execution; improves performance and debuggability.

---

## Risks Of Wrong Choice

- Over-globalization: every request pays for middleware only needed on a few routes.
- Missing route middleware: security middleware not applied to specific routes.
- Group misassignment: CORS in `web` group runs after session start; should be global.

---

## Related Skills

- Register and Order Middleware (middleware-pipeline)

---

## Decision Name: Kernel Extension Strategy

---

## Decision Context

Choosing between extending the HTTP kernel, implementing the kernel contract, or using service providers for custom request handling.

---

## Decision Criteria

* performance — custom kernel may bypass framework optimizations
* architectural — kernel extension is for structural changes; providers are for configuration
* security — bypassing standard kernel behavior risks missing security middleware
* maintainability — service providers are the standard extension point

---

## Decision Tree

Do you need to change the request handling STRUCTURE (not just add middleware or providers)?
↓
YES → Extend `Illuminate\Foundation\Http\Kernel` and override `handle()` or `sendRequestThroughRouter()`
NO → Do you need to add middleware or configuration?
↓
YES → Use `bootstrap/app.php` with `withMiddleware()` or service providers — standard extension points
NO → Do you need to add bootstrappers or initialization logic?
↓
YES → Use service providers — not kernel extension
NO → Do you need a completely different request lifecycle (async, ReactPHP)?
↓
YES → Implement `Illuminate\Contracts\Http\Kernel` interface — full custom kernel
NO → Do not extend the kernel

---

## Rationale

The kernel is a template method class designed for structural extension (overriding `handle()`, `sendRequestThroughRouter()`). Most customization needs (middleware, providers, configuration) are better served by service providers and `bootstrap/app.php`. Extending the kernel should be reserved for fundamental changes to how requests are processed.

---

## Recommended Default

**Default:** Use service providers and `bootstrap/app.php` for all customization; extend the kernel only for structural changes.
**Reason:** Standard extension points are documented, supported, and forwards-compatible.

---

## Risks Of Wrong Choice

- Overriding `handle()` without calling parent: entire bootstrap/middleware pipeline bypassed — no middleware, no bootstrappers.
- Extending kernel for simple middleware addition: over-engineering — use `withMiddleware()` instead.
- Implementing raw kernel contract: must manually handle bootstrapping, pipeline, and termination.

---

## Related Skills

- Implement Custom Bootstrappers (kernel-bootstrappers)
- Migrate Kernel to ApplicationBuilder (legacy-kernel-migration)
