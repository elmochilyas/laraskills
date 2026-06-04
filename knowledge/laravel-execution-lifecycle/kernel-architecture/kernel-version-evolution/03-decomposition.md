# Decomposition: Kernel Version Evolution

## Boundary Analysis
This knowledge unit covers the historical and structural evolution of the Laravel kernel across major versions. Its boundaries:
- **In scope:** Userland kernel classes (`App\Http\Kernel`, `App\Console\Kernel`) across version 10→13, the removal decision in Laravel 11, the `bootstrap/app.php` ApplicationBuilder pattern (`withMiddleware()`, `withCommands()`, `withSchedule()`), BC compatibility layer, `syncMiddlewareToRouter()` bridge, framework kernel stability, version-specific constructor differences, and the deprecation timeline.
- **Out of scope:** Framework kernel internal mechanics (covered in HTTP/Console Kernel KUs). Middleware class implementation changes (covered in Middleware Internals). Upgrade guides and tooling (covered in upgrade-specific documentation). The ApplicationBuilder internal state management (covered in Application Structure KU).
- **Overlap:** The `syncMiddlewareToRouter()` method bridges kernel property configuration with the Router — this is a migration concern, not a routing concern. Middleware group evolution often tracks kernel version changes but middleware *behavior* is version-independent.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
- The KU tracks a single concern: how kernel configuration surfaces change across versions.
- It covers both HTTP and Console kernels together because both evolved simultaneously.
- The version narrative (10→11→12→13) is a linear history — splitting by version or by kernel type would lose the evolutionary perspective.
- The BC layer and migration patterns are only meaningful in the context of version comparisons.
- A "Laravel 10 Kernel" KU or "Laravel 11 Kernel" KU would be too narrow and lose the comparative value.

## Dependency Graph
```
kernel-version-evolution
├── Prerequisites:
│   ├── HTTP Kernel Internals (understanding what the kernel does)
│   ├── Console Kernel Internals (understanding console kernel)
│   └── Laravel version history (major release timeline)
├── Internal Dependencies:
│   ├── Legacy Kernel Migration (practical migration patterns)
│   └── ApplicationBuilder (Laravel 11+ configuration mechanism)
├── Related (bidirectional):
│   ├── HTTP Kernel Internals (framework kernel unchanged)
│   ├── Console Kernel Internals (framework kernel unchanged)
│   ├── Middleware Internals (middleware configuration moved)
│   └── Application Skeleton Evolution (broader skeleton changes)
└── Consumed By:
    ├── Upgrade Guide (10→11)
    ├── Package Development (multi-version support)
    └── Laravel Certification / Architecture Knowledge
```

## Follow-up Opportunities
- **ApplicationBuilder Internals:** Deep dive into `Illuminate\Foundation\Configuration\ApplicationBuilder` — how it accumulates state, how `withMiddleware()` interacts with the container, how the framework kernel consumes the builder's output.
- **Multi-Version Package Development:** Patterns for supporting Laravel 10 (kernel class), 11+ (ApplicationBuilder), and auto-detection via `class_exists()` checks — essential for package maintainers.
- **Kernel Deprecation in Laravel 14:** Speculating on full framework kernel removal — what would replace it, how middleware pipeline would be constructed without a kernel class, implications for the entire request lifecycle.
- **Skeleton Evolution History:** Broader study of Laravel skeleton changes — how `bootstrap/app.php` became the central configuration file, comparing with other frameworks (Symfony Flex, Rails initializers).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization