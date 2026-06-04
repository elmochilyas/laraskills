# Decomposition: Defer Pattern (Laravel 12)

## Topic Overview

The defer pattern, introduced in Laravel 12 via `Bus::defer()`, provides a first-class mechanism for batching deferred work that executes after the HTTP response is sent but before the process terminates. Unlike `dispatchAfterResponse` which runs one job at a time, `Bus::defer()` collects multiple closures and jobs into a single batch that runs collectively during kernel termination.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k065-defer-pattern/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Defer Pattern (Laravel 12)
- **Purpose:** The defer pattern, introduced in Laravel 12 via `Bus::defer()`, provides a first-class mechanism for batching deferred work that executes after the HTTP response is sent but before the process terminates. Unlike `dispatchAfterResponse` which runs one job at a time, `Bus::defer()` collects multiple closures and jobs into a single batch that runs collectively during kernel termination.
- **Difficulty:** Advanced
- **Dependencies:** - K062 dispatchAfterResponse (single post-response job)

## Dependency Graph

This KU depends on: - K062 dispatchAfterResponse (single post-response job)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Deferred batch**: `Bus::defer()` returns a `DeferredBatch` instance. Closures and jobs appended to it are collected in-memory and executed collectively during kernel termination. - **Batch-wise ex...
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