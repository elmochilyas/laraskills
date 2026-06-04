# Decomposition: Request Duration Lifecycle Handlers

## Boundary Analysis
This knowledge unit covers the threshold-based duration monitoring mechanism that runs in the kernel's terminate phase. Its boundaries:
- **In scope:** `whenRequestLifecycleIsLongerThan()` registration API, `$lifecycleRequestDurationHandlers` property, duration calculation in `terminate()`, threshold comparison and handler invocation, handler callback signature (`$request, $response, $duration`), registration locations (service providers, `bootstrap/app.php`), use cases (slow request logging, alerting, pulse metrics).
- **Out of scope:** General terminate lifecycle (covered in HTTP Kernel Internals). Laravel Pulse internals (covered in Pulse KU). Third-party APM integration details. PHP microtime precision and platform variability (platform concern, not kernel concern). Alternative monitoring approaches (e.g., middleware-based timing, event-listener approaches).
- **Overlap:** The `terminate()` method where duration handlers execute is defined in the HTTP and Console kernel KUs — this KU covers only the duration check addition. The terminate middleware behavior (TerminableMiddleware interface) is separate from duration handlers but shares the same lifecycle phase.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
- Duration handlers are a single, well-scoped feature with a minimal API surface (one registration method, one execution flow).
- The mechanism is identical for both HTTP and Console kernels — splitting by kernel type would duplicate content.
- The feature is simple enough that it cannot be meaningfully decomposed — threshold registration and terminate-phase execution are inseparable.
- The monitoring use cases (logging, alerting) are applications of the mechanism, not separate features.

## Dependency Graph
```
request-duration-lifecycle-handlers
├── Prerequisites:
│   ├── HTTP Kernel Internals (understanding terminate() lifecycle)
│   ├── Console Kernel Internals (console terminate lifecycle)
│   └── PHP microtime() behavior
├── Internal Dependencies:
│   ├── HTTP Kernel Internals (duration check in terminate())
│   └── Console Kernel Internals (duration check in terminate())
├── Related (bidirectional):
│   ├── Laravel Pulse (Pulse uses duration handlers internally)
│   ├── Terminable Middleware (same lifecycle phase)
│   └── Performance Monitoring (application of duration data)
└── Consumed By:
    ├── Application Performance Monitoring (APM) tooling
    ├── Custom Logging Channels (slow request logging)
    └── Alerting Infrastructure (threshold-based notifications)
```

## Follow-up Opportunities
- **Async Handler Execution:** Laravel 13's addition of `shouldRunAsync()` for duration handlers — how true background processing works in Swoole/ReactPHP environments vs synchronous PHP-FPM. Implications for handler design.
- **Custom Lifecycle Hooks Beyond Duration:** Extending the kernel with additional threshold types (e.g., memory usage handlers via `whenRequestMemoryExceeds()`, database query count handlers). Pattern for adding new threshold types to the kernel.
- **Sampling and Rate Limiting in Handlers:** Implementing percentage-based sampling for high-traffic apps (e.g., only fire handler for 1% of requests exceeding threshold). Prevents handler overload in production.
- **Duration Handler Testing:** Strategies for testing duration handlers — using mocked microtime, replacing the duration calculation in tests, asserting handler invocation at specific thresholds.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization