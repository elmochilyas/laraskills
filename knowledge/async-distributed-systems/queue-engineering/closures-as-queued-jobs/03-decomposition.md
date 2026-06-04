# Decomposition: Closures as Queued Jobs

## Topic Overview

Laravel allows dispatching closures directly to the queue: `dispatch(function () { ... })`.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k078-closures-as-queued-jobs/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Closures as Queued Jobs
- **Purpose:** Laravel allows dispatching closures directly to the queue: `dispatch(function () { ... })`.
- **Difficulty:** Advanced
- **Dependencies:** - K004 Job Serialization and Payload Envelope (serialization mechanics)

## Dependency Graph

This KU depends on: - K004 Job Serialization and Payload Envelope (serialization mechanics)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Closure serialization**: PHP closures cannot be serialized natively. Laravel uses `Opis\Closure` to analyze the closure's AST, extract scope, bound variables, and context, then rebuild it on deser...
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