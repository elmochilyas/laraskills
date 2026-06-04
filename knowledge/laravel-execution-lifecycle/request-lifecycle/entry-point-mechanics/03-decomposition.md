# Decomposition: Entry Point Mechanics

## Boundary Analysis
This KU covers strictly what happens before any kernel method is invoked: Composer autoloader loading, Application instance creation via `bootstrap/app.php`, `ApplicationBuilder` configuration, `Request::capture()` via Symfony HttpFoundation, maintenance mode bypass checks, and the HTTP-vs-Console dispatch decision. It excludes everything inside `Kernel::handle()` — the bootstrapper sequence, middleware pipeline, and route dispatch belong to HTTP Kernel Dispatch. Octane's server-level entry (Swoole/RoadRunner worker manager) is referenced for comparison but not detailed — that belongs to the Long-Running Process Architecture subdomain.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The entry point is a short, deterministic sequence. The only candidate for extraction would be "Maintenance Mode Request Handling" or "Request Capture Internals," but these are tightly coupled to the entry point flow and would require repetition of the bootstrap context if split.

## Dependency Graph
```
Entry Point Mechanics
├── (no prerequisites — this is the root)
├── HTTP Kernel Dispatch        (immediate consumer)
├── Console Kernel Dispatch     (alternate consumer)
├── Application Bootstrap       (configured in bootstrap/app.php)
└── Octane Lifecycle            (alternative entry point pattern)
```

## Follow-up Opportunities
- "Maintenance Mode Mechanics" — The `PreventRequestsDuringMaintenance` middleware, `storage/framework/down` format, bypass IP/secret token, and `php artisan down/up` internals could form an independent KU if the maintenance system becomes more complex (Laravel Forge integration, scheduled maintenance windows).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization