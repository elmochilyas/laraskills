# Decomposition: Bootstrap App PHP File

## Boundary Analysis
The KU covers the `bootstrap/app.php` file as a concrete artifact: its structure, the `Application::configure()` static factory, the `->create()` method, and the return convention. The boundary includes why these elements exist and how they interact with calling code (`public/index.php`, `artisan`). Excluded are the internal details of individual `with*()` methods (covered in Application Builder Configuration KU) and the downstream kernel binding/resolution.

**In scope:** `bootstrap/app.php` file structure, `Application::configure()` factory, `create()` method internals, return convention, cross-context compatibility concerns.
**Out of scope:** Individual builder method internals, kernel resolution after file return, bootstrapper execution.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

The KU describes a single file and its supporting static factory. The factory (`configure()`) and the file are inseparable — you cannot understand one without the other. The `create()` method is the natural boundary between file execution and kernel initiation. Splitting would create artificial separation between the file and the factory it calls.

## Dependency Graph
```
public/index.php / artisan / Octane worker
         │
         │ require 'bootstrap/app.php'
         ▼
┌─────────────────────────────────────┐
│ bootstrap/app.php                   │
│                                     │
│  Application::configure()           │
│    └─► new ApplicationBuilder(...)  │
│                                     │
│  ->withRouting(...)                 │
│  ->withMiddleware(...)              │
│  ->withExceptions(...)              │
│  ->create()                         │
│    └─► returns Application         │
│                                     │
│  return $app;                       │
└─────────────────┬───────────────────┘
                  │
                  ▼
     Caller receives Application
     Caller resolves Kernel via $app->make(Kernel::class)
```

Dependencies: The file depends on the Application class and the ApplicationBuilder class, both loaded via Composer autoloader, which must be loaded before `bootstrap/app.php` is required.

## Follow-up Opportunities
- **Deployment Strategy Analysis:** How CI/CD pipelines handle `bootstrap/app.php` (environment substitution, file templating, read-only deployment packaging).
- **Migration Guide:** A practical guide for upgrading from pre-Laravel 11 `bootstrap/app.php` to the new builder syntax, including common pitfalls and compatibility shims.
- **Entry Point Comparison:** Contrast how `public/index.php`, `artisan`, and Octane worker entry points each consume `bootstrap/app.php` and handle the returned Application differently.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization