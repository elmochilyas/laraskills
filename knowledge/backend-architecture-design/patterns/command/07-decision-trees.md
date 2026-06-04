# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Command pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Command vs direct service call
* Decision 2: Command payload size — minimal vs complete state
* Decision 3: Command dispatch — sync bus vs queue

---

# Architecture-Level Decision Trees

---

## Decision: Command vs Direct Service Call

---

## Decision Context

Choose whether to encapsulate an operation as a Command object or call a service method directly.

---

## Decision Criteria

* performance considerations: Command adds serialization overhead for queue; service call is direct
* architectural considerations: Command encapsulates the full operation (what + data); service call separates data from action
* security considerations: Command can centralize authorization in middleware; service call needs per-method auth
* maintainability considerations: Command adds files (command + handler) but enables middleware pipeline

---

## Decision Tree

Does the operation benefit from cross-cutting concerns (logging, transactions, auth) applied consistently?
↓
YES → Command bus with middleware (consistent cross-cutting enforcement)
    ↓
    Are there 3+ cross-cutting concerns that apply to every command?
    YES → Command bus pipeline pays off (middleware stack handles them all)
    NO → Direct service call with manual cross-cutting (simpler for few operations)
NO → Does the operation need to be queued (deferred execution)?
    YES → Command (commands are naturally serializable for queue dispatch)
    ↓
    Does the operation need retry capability?
    YES → Command on queue (queue provides retries)
    NO → Command (still needed for serialization, but sync dispatch is possible)
NO → Is the operation a simple CRUD with no cross-cutting concerns?
    YES → Direct service call (Command adds unnecessary indirection)
    ↓
    Does the operation already have a dedicated service method?
    YES → Direct call (the service method is the action)
    NO → Consider: is the operation complex enough to warrant a dedicated class?
        YES → Command (single responsibility, testable, discoverable)
        NO → Direct service call (simplest approach)

---

## Rationale

Commands are justified when (1) cross-cutting concerns benefit from a middleware pipeline, (2) the operation needs queue dispatch, or (3) the operation is complex enough to warrant its own class. Direct service calls are simpler and appropriate for simple CRUD operations with no middleware requirements.

---

## Recommended Default

**Default:** Direct service call for simple operations. Command pattern for operations needing middleware, queue dispatch, or dedicated encapsulation.

**Reason:** Commands add file overhead (command + handler) but provide middleware support, serialization, and SRP. Direct calls are simpler and sufficient for trivial operations.

---

## Risks Of Wrong Choice

Command for every operation: file proliferation, unnecessary abstraction for simple CRUD. Direct call for queued operations: cannot dispatch to queue, no retry support. Command with too large payload: serialization performance issues.

---

## Related Rules

- Rule 1: Commands encapsulate requests as objects — one command per operation
- Rule 2: Use Commands when you need middleware (logging, transactions, auth) applied consistently

---

## Related Skills

- Design Command Objects
- Implement Command Bus

---

## Decision: Command Payload Size — Minimal vs Complete State

---

## Decision Context

Choose how much data the Command object carries — only identifiers or the complete state needed for execution.

---

## Decision Criteria

* performance considerations: minimal payload serializes faster; complete payload may be large
* architectural considerations: minimal payload defers data loading to handler; complete payload is self-contained
* security considerations: minimal payload reduces data exposure in the command
* maintainability considerations: minimal payload requires handler to know data sources; complete payload is self-sufficient

---

## Decision Tree

Is the command dispatched to a queue (async)?
↓
YES → Prefer minimal payload (identifiers only, handler loads data)
    ↓
    Does the handler have access to the same data sources as the command originator?
    YES → Minimal payload (IDs only — handler re-queries for fresh data)
    ↓
    Re-querying ensures the handler works with current data, not potentially stale data
    ↓
    Exception: data that may not exist by the time the queue processes (newly created records)
    YES → Include the essential data that may be gone by execution time
    NO → Include the data as DTO in the payload (handler can't requery)
NO → Is the command executed synchronously?
    YES → Complete payload is acceptable (data is current, no serialization concern)
    ↓
    Does the command carry data that may be stale by execution time?
    YES → Pass IDs and let handler requery (fresh data at execution time)
    NO → Complete payload is acceptable (convenient, self-contained)
NO → Is the payload larger than 10KB when serialized?
    YES → Refactor to minimal payload (IDs only)
    ↓
    Large payloads cause queue storage pressure and serialization latency
    NO → Payload size is acceptable

---

## Rationale

Commands should carry the minimum data needed to identify and execute the operation. For async commands, prefer identifiers — the handler reloads data from the database at execution time, ensuring freshness. For sync commands, complete state is more convenient but risks stale data. The rule: if the handler can requery, pass IDs only.

---

## Recommended Default

**Default:** Minimal payload (identifiers/IDs). Handler requeries data at execution time. Include additional data only if the source may be unavailable at execution time.

**Reason:** Minimal payloads serialize faster, ensure data freshness, and reduce coupling between the command originator and the handler's data requirements.

---

## Risks Of Wrong Choice

Complete state in async command: stale data by execution time, large payload, tight coupling between dispenser and handler. Minimal payload for transient data: handler can't find the record because it was deleted between dispatch and execution.

---

## Related Rules

- Rule 3: Pass only necessary data — IDs are preferred over full model instances
- Rule 4: Commands must be serializable — avoid Closures, resources, or non-serializable objects

---

## Related Skills

- Design Command Payloads
- Serialize Commands for Queue

---

## Decision: Command Dispatch — Sync Bus vs Queue

---

## Decision Context

Choose whether commands execute synchronously (in-process) or asynchronously (on the queue).

---

## Decision Criteria

* performance considerations: sync dispatch is instant; queue dispatch adds serialization + queue latency (1-5ms)
* architectural considerations: sync commands execute in the current transaction; queue commands are eventually consistent
* security considerations: sync commands have the same security context; queue commands need re-authentication
* maintainability considerations: sync commands are easier to debug; queue commands need monitoring

---

## Decision Tree

Does the response depend on the command's outcome?
↓
YES → Sync dispatch (must wait for result)
    ↓
    Is the result needed to formulate the response?
    YES → Sync command bus or direct call (blocking)
    NO → Async dispatch (response doesn't need the result)
NO → Does the command need to be transactional with the current request?
    YES → Sync dispatch (same database transaction)
    ↓
    Does the command modify data that the response includes?
    YES → Sync (data must be committed before response)
    NO → Could the command be async with eventual consistency?
        YES → Async (eventual consistency is acceptable)
        NO → Keep sync
NO → Is the command an independent side effect (send email, update cache)?
    YES → Async on queue (free the request, dispatch to worker)
    ↓
    Does the command have a time constraint (<5 seconds to execute)?
    YES → Consider sync if the queue latency would violate the constraint
    NO → Async is appropriate

---

## Rationale

Sync dispatch is for commands where the response depends on the outcome or where transactional consistency is required. Async dispatch (queue) is for independent side effects and non-critical operations. The decision follows the same reasoning as sync vs async event listeners — if the response doesn't need the result, go async.

---

## Recommended Default

**Default:** Sync dispatch for commands that modify data the response includes. Async dispatch for independent side effects.

**Reason:** Sync commands maintain transactional consistency and immediate feedback. Async commands free the request thread and improve user experience. Mixed dispatch (some sync, some async) is appropriate — not everything should use the same dispatch strategy.

---

## Risks Of Wrong Choice

Sync for all commands: slow responses for operations that could be async, blocked on side effects. Async for transactional commands: eventual consistency surprise, response may be inconsistent with unprocessed command. Inconsistent ShouldQueue implementation: some commands sync, some async without clear rationale.

---

## Related Rules
- Rule 6: Use the Bus facade for both sync and async command dispatch
- Rule 5: Commands are for write operations (use Query objects for reads)

---

## Related Skills

- Configure Command Bus
- Implement Queue Command Dispatch
