# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Terminable Middleware
**Generated:** 2026-06-03

---

# Decision Inventory

* Terminable Middleware vs Queue-Based Post-Response Processing
* Singleton Registration vs Default New Instance for State Sharing
* Lightweight vs Heavy Processing in terminate()
* Per-Request State Management via spl_object_id vs Instance Properties

---

# Architecture-Level Decision Trees

---

## Decision 1: Terminable Middleware vs Queue-Based Post-Response Processing

---

## Decision Context

Whether to use terminable middleware (runs after response sent in same process) or queue jobs (async, separate process) for post-response tasks.

---

## Decision Criteria

* Whether the operation needs access to the Request and Response objects
* Whether the operation must execute reliably (survive server crashes)
* Whether the operation is lightweight or heavyweight
* Whether the operation can tolerate async execution

---

## Decision Tree

Does the operation need access to the Request or Response object (status code, headers, request data)?
↓
NO → Queue job — standard or `afterResponse()` dispatch; more reliable, async
YES → Is the operation lightweight (<100ms, no synchronous I/O)?
    ↓
    YES → Does the operation need guaranteed execution (must run even on server crash)?
        ↓
        YES → Queue job with retries — `terminate()` may not fire in all server configurations
        NO → Terminable middleware — lightweight, in-process, after response sent
    NO → Queue job — heavy processing in `terminate()` blocks the web process
NO → Is the operation a cleanup task that needs the response context?
    ↓
    YES → Terminable middleware — file cleanup, session cleanup
    NO → Queue job — general post-response work

---

## Rationale

Terminable middleware fires after `$response->send()` in the same process. It can access the completed request and response. However: `terminate()` may not fire in RoadRunner, some Swoole setups, or if the server crashes before termination. Heavy processing blocks the web process from handling the next request. Queue jobs are more reliable but lose request/response context.

---

## Recommended Default

**Default:** Queue jobs for operations that must execute reliably. Terminable middleware for lightweight operations that need the response object or must run in the same process.
**Reason:** Queue jobs provide retry, async execution, and survive server crashes. `terminate()` is for specific use cases where response context is essential.

---

## Risks Of Wrong Choice

* Terminable for critical operations: Server crash means operation never runs; no retry mechanism
* Terminable with heavy processing: Blocks the web process; next request is delayed
* Queue for response-dependent operations: Request/response objects may not be serializable
* Terminable in RoadRunner: `terminate()` may not fire; operation silently skipped

---

## Related Rules

* Do Not Store Per-Request State on Middleware Instance Properties
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement Terminable Middleware with Singleton Registration
* Write Direct Unit Tests for Custom Middleware

---

---

## Decision 2: Singleton Registration vs Default New Instance for State Sharing

---

## Decision Context

Whether to register terminable middleware as a singleton to share state between `handle()` and `terminate()`.

---

## Decision Criteria

* Whether the middleware needs to share data between `handle()` and `terminate()`
* Whether the middleware is safe for concurrent requests (Octane/Swoole)
* Whether the middleware tracks per-request data

---

## Decision Tree

Does the middleware need to share data between `handle()` and `terminate()` (start time, resolved data)?
↓
NO → Default new instance — `terminate()` receives a fresh resolution; no state sharing needed
YES → Is the middleware used in Octane or concurrent request environments?
    ↓
    YES → Singleton + request-keyed data — use `spl_object_id($request)` to key per-request state
    NO → Singleton — same instance for both methods; state set in `handle()` is available in `terminate()`
NO → Can the middleware compute data independently in `terminate()`?
    ↓
    YES → Default new instance — re-read or recompute in `terminate()`
    NO → Singleton — data must flow from `handle()` to `terminate()`

---

## Rationale

By default, `Kernel::terminate()` resolves a fresh middleware instance via `$this->app->call()`. Any state stored on `$this` during `handle()` is lost. Singleton registration (`$this->app->singleton(LogMiddleware::class)`) ensures the same instance is used for both methods. In Octane, singleton middleware must key per-request data by `spl_object_id($request)` to prevent data corruption across concurrent requests.

---

## Recommended Default

**Default:** Default new instance when state sharing is not needed. Singleton with request-keyed data when state must flow from `handle()` to `terminate()`.
**Reason:** New instance is safe by default. Singleton adds complexity and risk of data leakage across concurrent requests.

---

## Risks Of Wrong Choice

* No singleton for shared state: `terminate()` receives null for all data set in `handle()`; timing, logging, metrics are all broken
* Singleton without request keying: In Octane, concurrent requests overwrite each other's data; timing values are corrupted
* Singleton with unbounded data accumulation: Array property grows per request — memory leak in Octane
* Singleton in PHP-FPM only: Works correctly but unnecessary — instances are per-request anyway

---

## Related Rules

* Do Not Store Per-Request State on Middleware Instance Properties
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement Terminable Middleware with Singleton Registration
* Write Direct Unit Tests for Custom Middleware

---

---

## Decision 3: Lightweight vs Heavy Processing in terminate()

---

## Decision Context

Whether to perform operations in `terminate()` that involve I/O, network calls, or heavy computation.

---

## Decision Criteria

* Whether the operation is synchronous I/O (database, filesystem, HTTP)
* Whether the operation blocks the process from handling the next request
* Whether the operation can be deferred to a queue

---

## Decision Tree

Does the operation involve synchronous I/O (database writes, HTTP calls, file I/O)?
↓
NO → In-memory only (increment counter, append to array) → Lightweight — acceptable in `terminate()`
YES → Can the operation be deferred to a queue job?
    ↓
    YES → Queue job — don't block the web process; use `dispatch()` with `onQueue('low')`
    NO → Is the operation a single, fast cache/database write (<5ms)?
        ↓
        YES → Acceptable in `terminate()` — but document the risk; monitor for latency
        NO → Not acceptable in `terminate()` — restructure; use queue or event listener
NO → Is the operation complex computation (>100ms CPU time)?
    ↓
    YES → Queue job — heavy computation in `terminate()` blocks the worker
    NO → Lightweight computation — acceptable in `terminate()`

---

## Rationale

`terminate()` runs after the response is sent but IN the same process (PHP-FPM) or worker (Octane). Synchronous I/O in `terminate()` blocks the process from handling the next request. In PHP-FPM, this delays process reuse. In Octane, this blocks the entire worker from handling concurrent requests. Heavy processing defeats the purpose of "after response" by creating a new bottleneck.

---

## Recommended Default

**Default:** Keep `terminate()` lightweight — in-memory operations only (timers, counters, log writes to fast local storage). Send heavy processing to a queue.
**Reason:** The purpose of terminable middleware is to respond to the client quickly while doing non-blocking work. Heavy processing negates this benefit.

---

## Risks Of Wrong Choice

* Heavy I/O in `terminate()`: Blocks the web process; request throughput drops to `1 / terminate_duration`
* blocking API call in `terminate()`: External API latency blocks the entire process
* Memory-intensive computation: Peak memory usage includes request + termination data
* Queue dispatch in `terminate()`: Acceptable but adds latency to process reuse

---

## Related Rules

* Do Not Store Per-Request State on Middleware Instance Properties
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement Terminable Middleware with Singleton Registration
* Dispatch After Response Jobs for Heavy Post-Processing

---

---

## Decision 4: Per-Request State Management via spl_object_id vs Instance Properties

---

## Decision Context

How to manage per-request data in singleton terminable middleware when multiple requests may be in-flight concurrently.

---

## Decision Criteria

* Whether the middleware is registered as a singleton
* Whether the middleware runs in a concurrent environment (Octane, Swoole)
* Whether the middleware needs to accumulate per-request data

---

## Decision Tree

Is the middleware registered as a singleton?
↓
NO → No special handling — fresh instance per request; instance properties are safe
YES → Is the application running in Octane or concurrent request environment?
    ↓
    YES → Use `spl_object_id($request)` as key — key per-request data by request object identity
    NO → Simple instance property — PHP-FPM is single-threaded; no concurrent access
NO → Does the accumulate data across calls (counters, log buffers)?
    ↓
    YES → spl_object_id keying + cleanup in `terminate()` — clear entry after processing
    NO → Local variables in handle() — no instance state needed

---

## Rationale

Singleton middleware instance properties are shared across all requests. In concurrent environments (Octane/Swoole), request A sets `$this->startTime` and then request B overwrites it before A reaches `terminate()`. Keying by `spl_object_id($request)` ensures each request's data is isolated. The entry must be cleaned up in `terminate()` to prevent memory leaks.

---

## Recommended Default

**Default:** Local variables in `handle()` for data used only during execution. `spl_object_id($request)` keying for shared data in singleton middleware. Clear entries in `terminate()`.
**Reason:** Local variables are inherently safe. Request-keyed storage prevents concurrent access corruption. Cleanup prevents memory leaks.

---

## Risks Of Wrong Choice

* Instance property in singleton + Octane: Request timing data corrupted by concurrent requests
* Instance property accumulation in singleton: Unbounded array growth — memory leak until worker restart
* No cleanup in terminate(): Entry remains in array — stale data accumulates
* spl_object_id reuse: After request object is garbage collected, ID may be reused — cleanup prevents stale reads

---

## Related Rules

* Do Not Store Per-Request State on Middleware Instance Properties
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement Terminable Middleware with Singleton Registration
* Write Direct Unit Tests for Custom Middleware
