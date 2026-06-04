# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Request Lifecycle
**Knowledge Unit:** Response Sending and Termination
**Generated:** 2026-06-03

---

# Decision Inventory

1. Post-Response Work Strategy: Synchronous termination vs queued jobs vs afterResponse
2. Terminable Middleware: Class-based vs closure middleware for termination
3. Response Modification Timing: `RequestHandled` vs `Terminating` event

---

# Architecture-Level Decision Trees

---

## Decision Name: Post-Response Work Strategy

---

## Decision Context

Choosing between synchronous termination handlers, queued `afterResponse` jobs, or dispatch-to-queue for post-response processing.

---

## Decision Criteria

* performance — synchronous termination blocks FPM worker; queue jobs are fully async
* architectural — termination runs after response sent; queue jobs run in separate process
* security — termination has access to request/response context; queue jobs do not
* maintainability — queues require infrastructure; termination is in-process

---

## Decision Tree

Is the post-response work heavy (DB writes, API calls, file I/O > 5ms)?
↓
YES → Use queue job (`dispatch()->afterResponse()` or standard queue dispatch) — heavy work must not block FPM worker
NO → Is the post-response work lightweight (logging, metrics, cache invalidation < 5ms)?
↓
YES → Use terminable middleware or `Terminating` event — lightweight in-process cleanup is acceptable
NO → Does the post-response work need access to the original request and response objects?
↓
YES → Use terminable middleware — receives both request and response after send
NO → Does the work need to run after EVERY request (not just slow ones)?
↓
YES → Use `Terminating` event listener — lightweight, runs on every request
NO → Use queue job for non-trivial work; `afterResponse()` for lightweight request-scoped cleanup

---

## Rationale

Synchronous termination blocks the FPM worker until all handlers complete. Heavy work in termination reduces concurrent request capacity. Queue jobs are fully asynchronous — the worker is freed immediately. `afterResponse()` dispatches a job that runs after the response is sent but still within the same process (if using the sync queue driver).

---

## Recommended Default

**Default:** Queue jobs for heavy work (`dispatch()->afterResponse()`); terminable middleware for lightweight request-scoped cleanup (< 5ms).
**Reason:** Heavy work belongs in queues; lightweight cleanup can safely run in termination.

---

## Risks Of Wrong Choice

- Heavy work in termination: FPM worker blocked for 200ms+ — reduces concurrent request capacity.
- Queue job for simple logging: unnecessary infrastructure overhead for a simple `Log::info()` call.
- Not catching exceptions in termination: uncaught exception crashes the terminate phase (response already sent, but process may terminate).

---

## Related Skills

- Manage Response Sending and Termination (06-skills.md)

---

## Decision Name: Response Modification Timing

---

## Decision Context

Choosing between `RequestHandled` event (before send) and `Terminating` event (after send) for response-related logic.

---

## Decision Criteria

* performance — `RequestHandled` delays TTFB; `Terminating` does not
* architectural — `RequestHandled` fires before send, can modify response; `Terminating` fires after send, cannot
* security — avoid logging sensitive response data in termination
* maintainability — correct timing choice prevents silent logic failures

---

## Decision Tree

Does the logic need to modify the response (add headers, change content)?
↓
YES → Use `RequestHandled` event — fires before `send()`, response is still mutable
NO → Does the logic need to run AFTER the response is sent (to avoid client-visible delay)?
↓
YES → Use `Terminating` event or terminable middleware — runs after response sent, no client impact
NO → Does the logic need access to both request and response for cleanup?
↓
YES → Use terminable middleware — `terminate()` receives both request and response
NO → Does the logic need to run on every request for monitoring?
↓
YES → Use `Terminating` event listener for post-send monitoring; `RequestHandled` for pre-send modifications
NO → Use middleware for request-time logic; `Terminating` for post-response cleanup

---

## Rationale

`RequestHandled` fires in `Kernel::handle()`, before `send()`. Modifications here are included in the response. `Terminating` fires after `send()` — modifications are silently ignored. Choose `RequestHandled` when you need to modify the response; choose `Terminating` for post-response cleanup that must not increase client-visible latency.

---

## Recommended Default

**Default:** `RequestHandled` for response modifications; `Terminating` for post-response cleanup.
**Reason:** Correct timing — modifications before send, cleanup after.

---

## Risks Of Wrong Choice

- Modifying response in `Terminating`: modifications silently ignored — no error, no effect.
- Heavy work in `RequestHandled`: delays time-to-first-byte — client waits for handler to complete.
- Using `Terminating` for Octane state flushing: correct — fires after every request, before the next.

---

## Related Skills

- Manage Response Sending and Termination (06-skills.md)
