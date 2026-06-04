# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Request Lifecycle
**Knowledge Unit:** Lifecycle Events and Hooks
**Generated:** 2026-06-03

---

# Decision Inventory

1. Hook Mechanism: `$app->booting()`/`$app->booted()` callbacks vs event listeners
2. Phase Selection: `RequestHandled` vs `Terminating` for response-adjacent logic
3. Registration Timing: `register()` vs `boot()` for lifecycle hook registration

---

# Architecture-Level Decision Trees

---

## Decision Name: Hook Mechanism Selection

---

## Decision Context

Choosing between synchronous callbacks (`$app->booting()`, `$app->booted()`, `$app->terminating()`) and event dispatcher listeners (`Event::listen()`) for lifecycle extension points.

---

## Decision Criteria

* performance — callbacks execute immediately in call stack (~0.5-2µs); events go through dispatcher (~10-50µs)
* architectural — callbacks are fire-once per application lifecycle; events support multiple listeners and priority
* security — callbacks have full container access; events pass through the dispatcher
* maintainability — callbacks are simpler; events are more flexible

---

## Decision Tree

Is the logic a simple operation that runs once per lifecycle (no wildcards, no conditionals)?
↓
YES → Use `$app->booting()` or `$app->booted()` callback — simpler, lower overhead
NO → Does the logic need to support multiple independent listeners?
↓
YES → Use events — `Event::listen()` supports multiple listeners with priority
NO → Does the logic need wildcard matching or conditional dispatch?
↓
YES → Use events — the event dispatcher supports wildcard patterns and listener conditionals
NO → Does the logic need to be observable by third-party packages?
↓
YES → Use events — third-party packages can listen without modifying your code
NO → Use callbacks — simpler and more performant

---

## Rationale

Callbacks execute immediately in the current call stack without going through the event dispatcher. They are ideal for simple, one-off operations. Events support multiple listeners, wildcard matching, and priority ordering — necessary for extensible systems. The choice depends on whether the hook is internal (callback) or extensible (event).

---

## Recommended Default

**Default:** Callbacks (`$app->booted()`, `$app->terminating()`) for internal cleanup; events for extensible observer points.
**Reason:** Callbacks are simpler and faster; events are extensible.

---

## Risks Of Wrong Choice

- Using events for simple cleanup: unnecessary dispatcher overhead; harder to trace.
- Using callbacks for extensible hooks: third-party packages cannot observe without modifying your code.
- Registering callback in `boot()`: `booting()` callback fires immediately during boot — not at the expected time.

---

## Related Skills

- Manage Lifecycle Events and Hooks (06-skills.md)

---

## Decision Name: Lifecycle Phase for Response Logic

---

## Decision Context

Choosing `RequestHandled` (before send) vs `Terminating`/`terminating()` (after send) for response-adjacent operations.

---

## Decision Criteria

* performance — `RequestHandled` delays response; `Terminating` does not
* architectural — `RequestHandled` fires before `send()`; `Terminating` fires after
* security — response data accessible in both; mutations only work in `RequestHandled`
* maintainability — choosing wrong phase causes silent bugs

---

## Decision Tree

Does the logic need to modify the response or add headers?
↓
YES → Use `RequestHandled` event — fires before send, response is mutable
NO → Does the logic need to clean up request-scoped state (Octane flush)?
↓
YES → Use `Terminating` event — runs after response sent, before next request
NO → Does the logic perform monitoring or logging that shouldn't delay the client?
↓
YES → Use `Terminating` event — post-response, no client impact
NO → Does the logic need to prevent the response from being sent?
↓
YES → Use middleware — short-circuit the response before the controller runs
NO → Use `Terminating` for post-response cleanup; `RequestHandled` for pre-send modifications

---

## Rationale

`RequestHandled` fires inside `handle()`, before `send()` — the response is still mutable. `Terminating` fires after `send()` — the response is immutable. Choosing `RequestHandled` for post-send logic delays the client unnecessarily. Choosing `Terminating` for response modifications silently fails (modifications have no effect).

---

## Recommended Default

**Default:** `RequestHandled` for response modifications; `Terminating` for post-response cleanup.
**Reason:** Correct timing guarantees modifications work and cleanup does not delay the client.

---

## Risks Of Wrong Choice

- Response modification in `Terminating`: silently ignored — no error, no effect.
- State flushing in `RequestHandled`: flushes before response is sent — downstream code may break.
- Heavy logic in `RequestHandled`: directly delays time-to-first-byte.

---

## Related Skills

- Manage Lifecycle Events and Hooks (06-skills.md)
