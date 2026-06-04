# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** Command bus patterns in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Sync vs async command dispatch
* Decision 2: Global vs per-command middleware selection
* Decision 3: Return aggregate ID vs void from command handlers

---

# Architecture-Level Decision Trees

---

## Decision: Sync vs Async Command Dispatch

---

## Decision Context

Choose whether a specific command should be dispatched synchronously (same request) or asynchronously (queued).

---

## Decision Criteria

* performance considerations: sync is fast (~1ms); async adds queue latency (~100-500ms)
* architectural considerations: async decouples request from execution; sync is simpler
* security considerations: async commands may need different auth (queued execution context)
* maintainability considerations: sync is easier to debug; async requires monitoring

---

## Decision Tree

Does the caller need the result of the command immediately?
↓
YES → Sync dispatch (caller waits for completion)
NO → Is eventual consistency acceptable for this use case?
    YES → Async dispatch (queue — faster response to caller)
    NO → Can the command be designed to return immediately with a polling mechanism?
        YES → Async dispatch with polling ID
        NO → Sync dispatch
            ↓
            Is the operation long-running (> 5 seconds)?
            YES → Async dispatch (don't block HTTP response that long)
            NO → Sync dispatch

---

## Rationale

Sync dispatch is simpler and provides immediate feedback. Async dispatch should be used when the operation doesn't need immediate completion or is too slow for sync processing. The default should be sync; use async only when there's a clear reason.

---

## Recommended Default

**Default:** Sync dispatch for most commands; async only for long-running or non-time-sensitive operations.

**Reason:** Sync dispatch is simpler to implement, debug, and test. Async adds queue infrastructure, monitoring, and error handling complexity.

---

## Risks Of Wrong Choice

Sync for long-running operations: slow HTTP responses, timeout errors, poor user experience. Async for time-sensitive operations: stale data, users see inconsistent state.

---

## Related Rules

- Rule 3: Handlers must be synchronous, stateless, and return void
- Rule 5: Wrap every command dispatch with transactional middleware

---

## Related Skills

- Implement a Command Bus
- Apply CQRS Selectively per Bounded Context

---

## Decision: Global vs Per-Command Middleware Selection

---

## Decision Context

Determine which middleware to apply universally vs specifically per command type.

---

## Decision Criteria

* performance considerations: every middleware layer adds processing time
* architectural considerations: global middleware ensures consistency; per-command middleware allows flexibility
* security considerations: authorization middleware should be per-command, not global
* maintainability considerations: too many global middleware creates rigid pipeline

---

## Decision Tree

Does the middleware apply to every write operation without exception?
↓
YES → Is it cross-cutting like logging, error handling, or DB transaction?
    YES → Global middleware (applies to every command dispatch)
    NO → Is it critical for data integrity (transactional wrapping)?
        YES → Global middleware (must never be skipped)
        NO → Per-command middleware (selective application)
NO → Does the middleware handle command-specific concerns (authorization, validation)?
    YES → Per-command middleware (varies by command type)
    NO → Is the middleware performance-sensitive (should not run on all commands)?
        YES → Per-command middleware (selective for hot paths)
        NO → Global middleware (low-enough overhead for universal application)

---

## Rationale

Global middleware is appropriate for truly cross-cutting concerns: logging, error handling, database transactions. Per-command middleware handles command-specific concerns: authorization, validation, idempotency checks. The default should be global for infrastructure concerns and per-command for business concerns.

---

## Recommended Default

**Default:** DB transaction wrapping as global middleware; authorization and validation as per-command middleware.

**Reason:** Transactions must never be accidentally skipped. Authorization and validation rules differ per command and should be applied selectively.

---

## Risks Of Wrong Choice

Too many global middleware: every command pays for middleware it doesn't need, pipeline becomes rigid. Too many per-command middleware: risks forgetting important cross-cutting concerns, inconsistent enforcement.

---

## Related Rules

- Rule 5: Wrap every command dispatch with transactional middleware

---

## Related Skills

- Implement a Command Bus
- Implement Event Bus Patterns

---

## Decision: Return Aggregate ID vs Void from Command Handlers

---

## Decision Context

Decide whether command handlers should return the created aggregate ID or return void.

---

## Decision Criteria

* performance considerations: negligible difference
* architectural considerations: returning ID blurs CQRS boundary slightly; void is pure CQRS
* security considerations: returning ID may leak information about other aggregates (sequential IDs)
* maintainability considerations: returning ID is pragmatic; void is architecturally pure

---

## Decision Tree

Does the caller need the created aggregate ID to continue the flow?
↓
YES → Return the aggregate ID (pragmatic exception to void rule)
NO → Is the command creating an aggregate that will be immediately queried?
    YES → Return the aggregate ID (caller needs it for next request)
    NO → Return void (pure CQRS — caller doesn't need response)
        ↓
        Can the caller obtain the ID through other means (client-generated UUID)?
        YES → Return void (ID already known to caller)
        NO → Return the aggregate ID (pragmatic compromise)

---

## Rationale

Pure CQRS says commands return void — the caller doesn't need a response. In practice, the caller often needs the created aggregate ID to navigate to the new resource. Returning the ID is a pragmatic exception that doesn't significantly compromise the pattern.

---

## Recommended Default

**Default:** Return void for most commands; return aggregate ID only for creation commands where the caller needs the new ID.

**Reason:** Most commands (update, delete, cancel) don't need a return value. Creation commands are the pragmatic exception where returning the ID significantly simplifies the caller.

---

## Risks Of Wrong Choice

Always returning ID: blurs CQRS, handlers look like queries. Always returning void: callers need to generate IDs client-side or make additional queries to discover the ID.

---

## Related Rules

- Rule 3: Handlers must be synchronous, stateless, and return void

---

## Related Skills

- Implement a Command Bus
- Implement Query Handlers
