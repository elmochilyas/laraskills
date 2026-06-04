# Decomposition: `PendingDispatch` Lifecycle

## Topic Overview

`PendingDispatch` is the fluent wrapper object returned by a job's `dispatch()` method. It holds the job instance and allows method chaining (`onQueue()`, `onConnection()`, `delay()`, `afterCommit()`) before the job is actually pushed to the queue.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k007-pending-dispatch-lifecycle/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `PendingDispatch` Lifecycle
- **Purpose:** `PendingDispatch` is the fluent wrapper object returned by a job's `dispatch()` method. It holds the job instance and allows method chaining (`onQueue()`, `onConnection()`, `delay()`, `afterCommit()`) before the job is actually pushed to the queue.
- **Difficulty:** Advanced
- **Dependencies:** - K003 Queue Manager and Connector Pattern (where `dispatchToQueue` resolves)

## Dependency Graph

This KU depends on: - K003 Queue Manager and Connector Pattern (where `dispatchToQueue` resolves)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`PendingDispatch`**: A `Illuminate\Foundation\Bus\PendingDispatch` object returned by `dispatch()`. - **Deferred dispatch**: The `PendingDispatch` destructor calls `$bus->dispatchToQueue($this->jo...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent queue/event patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization