# Decomposition: Legacy Kernel Migration

## Boundary Analysis
This knowledge unit covers the practical patterns and mechanisms for migrating from Laravel 10's kernel class configuration to Laravel 11+'s ApplicationBuilder pattern. Its boundaries:
- **In scope:** Mapping logic between `$middleware`, `$middlewareGroups`, `$routeMiddleware` properties and `withMiddleware()` API, `$commands`/`commands()` to `withCommands()`, `schedule()` to `withSchedule()`, the `syncMiddlewareToRouter()` bridge mechanism, BC detection via `class_exists()`, incremental migration strategy, ordering and priority differences, duplicate middleware prevention.
- **Out of scope:** General Laravel upgrade process (covered in upgrade guides). Framework kernel internals (covered in HTTP/Console Kernel KUs). ApplicationBuilder API design (covered in Application Skeleton KU). Specific middleware class migration (e.g., changing `VerifyCsrfToken` behavior — covered in Middleware Internals).
- **Overlap:** The `syncMiddlewareToRouter()` bridge is a migration-specific method, but it's implemented in the framework kernel class (HTTP Kernel Internals overlap). Both old and new kernel configuration formats produce identical runtime state — the state description belongs to HTTP/Console Kernel KUs.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
- The KU covers a single transitional mechanism from one API to another.
- All three configuration areas (middleware, commands, schedule) migrate together as part of the same conceptual shift.
- The BC layer and incremental strategy are cross-cutting concerns affecting all three areas.
- Splitting into "Middleware Migration" and "Command Migration" would create artificial KUs that are too narrow.
- The migration pattern (property → method, inheritance → composition) is consistent across all configuration areas.

## Dependency Graph
```
legacy-kernel-migration
├── Prerequisites:
│   ├── HTTP Kernel Internals (understanding what $middleware arrays do)
│   ├── Console Kernel Internals (understanding commands and schedule)
│   ├── Kernel Version Evolution (why the migration exists)
│   └── Middleware Internals (middleware class configuration)
├── Internal Dependencies:
│   ├── ApplicationBuilder (target configuration API)
│   ├── syncMiddlewareToRouter() (bridge mechanism)
│   └── Middleware Configuration Class (Illuminate\Foundation\Configuration\Middleware)
├── Related (bidirectional):
│   ├── Upgrade Guide (10→11) (migration is part of the upgrade)
│   └── Application Skeleton Evolution (broader skeleton changes)
└── Consumed By:
    ├── Laravel Upgrade Tooling (automated migration scripts)
    ├── Package Compatibility Guides (version-conditional behavior)
    └── Technical Debt Remediation (modernizing old Laravel apps)
```

## Follow-up Opportunities
- **Automated Migration Tooling:** Developing a package or artisan command (like Rector rules) that automatically converts `App\Http\Kernel` properties to `withMiddleware()` calls — detects current kernel state and generates the equivalent ApplicationBuilder configuration.
- **Custom Kernel Configuration for Multi-Tenancy:** Patterns for conditionally configuring middleware per-tenant using the ApplicationBuilder's closure API — more flexible than the old kernel property approach.
- **Middleware Removal Patterns:** The `withMiddleware()` API's `$middleware->remove()` method allows removing framework default middleware — explore use cases for reducing middleware stack in API-only or microservice deployments.
- **Cross-Version Package Development Strategy:** Best practices for packages that need to support both kernel-class and ApplicationBuilder configuration — leveraging class_exists checks, service provider version detection, and dual configuration paths.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization