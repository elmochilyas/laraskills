# Decomposition: HTTP Kernel Internals

## Boundary Analysis
The HTTP Kernel Internals knowledge unit covers the complete lifecycle of HTTP request processing from entry point (`handle()`) to response delivery and termination. Its boundary includes:
- **In scope:** `Illuminate\Foundation\Http\Kernel` class, middleware pipeline construction and execution, the `sendRequestThroughRouter()` orchestration, `dispatchToRouter()` delegation, `terminate()` lifecycle, kernel constructor setup, middleware registration (global/group/route), `$middlewarePriority` ordering, bootstrapper integration via `bootstrap()`.
- **Out of scope:** Detailed middleware implementation (covered in Middleware Internals KU), router internals (covered in Routing Internals KU), service provider boot sequence (covered in Service Container & Providers KU), bootstrapper internals (covered in Kernel Bootstrappers KU), console/Artisan request handling (covered in Console Kernel Internals KU).
- **Overlap:** The `bootstrap()` call within `handle()` touches bootstrapper territory — this KU covers the *invocation* point only, not bootstrapper internals. Middleware pipeline mechanics are covered here but specific middleware classes (e.g., `TrimStrings`, `VerifyCsrfToken`) belong to Middleware Internals.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
- The HTTP kernel represents a single cohesive class with a well-defined responsibility: convert Request to Response via a middleware pipeline.
- The handle → sendRequestThroughRouter → dispatchToRouter → terminate flow is a linear, inseparable sequence.
- Splitting would create artificial boundaries (e.g., "Middleware Pipeline Execution" vs "Router Dispatch") that are inherently coupled.
- The kernel's API surface (`handle()`, `terminate()`, constructor) is minimal and stable.
- External dependencies (Pipeline class, Router contract, bootstrap sequence) are consumed, not owned — they belong to other KUs.

## Dependency Graph
```
http-kernel-internals
├── Prerequisites:
│   ├── PHP PSR-7/PSR-15 Middleware (conceptual)
│   ├── Laravel Service Container
│   └── Basic Request/Response lifecycle understanding
├── Internal Dependencies:
│   ├── Kernel Bootstrappers (invokes bootstrap())
│   ├── Routing Internals (via dispatchToRouter())
│   └── Pipeline Implementation (via Illuminate\Pipeline\Pipeline)
├── Related (bidirectional):
│   ├── Middleware Internals (kernel registers and executes middleware)
│   └── Service Providers (kernel boots providers via bootstrappers)
└── Consumed By:
    ├── Console Kernel Internals (parallel kernel for CLI)
    ├── Kernel Version Evolution (tracks kernel API changes)
    ├── Legacy Kernel Migration (before/after kernel structure)
    └── Request Duration Lifecycle Handlers (hooks into kernel lifecycle)
```

## Follow-up Opportunities
- **Custom Bootstrapper Development:** Creating application-specific bootstrappers that run before or after the core six — requires deep understanding of bootstrap ordering and guarded initialization.
- **Middleware Pipeline Customization:** Advanced middleware pipeline modification (adding middleware dynamically, reordering priority at runtime) — explores the Pipeline class internals beyond the kernel's static configuration.
- **Kernel Replacement Strategies:** Replacing the HTTP kernel entirely with a custom implementation (e.g., for ReactPHP or Swoole async contexts) — requires implementing the full `Http\Kernel` contract.
- **Sub-request Handling:** The kernel's ability to handle sub-requests (internal requests within the same process) — used by some packages but poorly documented.
- **Early Return Optimization:** Patterns for short-circuiting the middleware pipeline before reaching the router for cache-hit scenarios or health-check endpoints.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization