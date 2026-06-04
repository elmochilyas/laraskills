# Decomposition: `$tries`, `$maxExceptions`, `retryUntil()` Configuration

## Topic Overview

Three properties control when a job stops retrying and becomes permanently failed: `$tries` (max retry attempts), `$maxExceptions` (max exceptions before failing even if `$tries` remains), and `retryUntil()` (time-based cutoff). These form a three-dimensional retry policy: a job fails when it exceeds `$tries` attempts, OR when it exceeds `$maxExceptions` exceptions per attempt window, OR when `retryUntil()` returns a past timestamp.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k017-tries-max-exceptions-retry-until/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `$tries`, `$maxExceptions`, `retryUntil()` Configuration
- **Purpose:** Three properties control when a job stops retrying and becomes permanently failed: `$tries` (max retry attempts), `$maxExceptions` (max exceptions before failing even if `$tries` remains), and `retryUntil()` (time-based cutoff). These form a three-dimensional retry policy: a job fails when it exceeds `$tries` attempts, OR when it exceeds `$maxExceptions` exceptions per attempt window, OR when `retryUntil()` returns a past timestamp.
- **Difficulty:** Intermediate
- **Dependencies:** - K018 Backoff Strategies (how delay between retries works)

## Dependency Graph

This KU depends on: - K018 Backoff Strategies (how delay between retries works)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`$tries`**: Integer. Maximum number of times the job's `handle()` will be attempted. Default `null` (no limit unless set). - **`$maxExceptions`**: Integer. Maximum number of unhandled exceptions a...
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