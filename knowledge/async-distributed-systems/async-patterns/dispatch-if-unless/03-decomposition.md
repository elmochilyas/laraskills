# Decomposition: dispatchIf/dispatchUnless Conditional Dispatch

## Topic Overview

`dispatchIf` and `dispatchUnless` are conditional dispatch methods on the `Bus` facade and `PendingDispatch` that gate job execution on a boolean condition evaluated at dispatch time. They eliminate if/else boilerplate in controllers and commands, making intent explicit.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k063-dispatch-if-unless/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### dispatchIf/dispatchUnless Conditional Dispatch
- **Purpose:** `dispatchIf` and `dispatchUnless` are conditional dispatch methods on the `Bus` facade and `PendingDispatch` that gate job execution on a boolean condition evaluated at dispatch time. They eliminate if/else boilerplate in controllers and commands, making intent explicit.
- **Difficulty:** Foundation
- **Dependencies:** - K062 dispatchAfterResponse (post-response alternative)

## Dependency Graph

This KU depends on: - K062 dispatchAfterResponse (post-response alternative)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **dispatchIf($condition, $job)**: Dispatches the job only when `$condition` is truthy. Returns a `PendingDispatch` or null. - **dispatchUnless($condition, $job)**: Dispatches the job only when `$con...
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