# Decomposition: Failure Taxonomy: Release / Exception / Fail

## Topic Overview

Laravel categorizes job failures into three distinct types with different behaviors: **release** (explicit re-queue with delay), **exception** (automatic retry up to `$tries`), and **fail** (terminal with permanent storage). Understanding this taxonomy is essential because each type triggers different code paths: release returns the job to the queue immediately, exception decrements the attempt counter and may release after backoff, and fail moves the job to `failed_jobs` and calls `$job->failed()`.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k016-failure-taxonomy/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Failure Taxonomy: Release / Exception / Fail
- **Purpose:** Laravel categorizes job failures into three distinct types with different behaviors: **release** (explicit re-queue with delay), **exception** (automatic retry up to `$tries`), and **fail** (terminal with permanent storage). Understanding this taxonomy is essential because each type triggers different code paths: release returns the job to the queue immediately, exception decrements the attempt counter and may release after backoff, and fail moves the job to `failed_jobs` and calls `$job->failed()`.
- **Difficulty:** Intermediate
- **Dependencies:** - K017 `$tries`, `$maxExceptions`, `retryUntil()`

## Dependency Graph

This KU depends on: - K017 `$tries`, `$maxExceptions`, `retryUntil()`
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Release**: Job calls `$this->release($delay)`. The job is returned to the queue with `attempts++`. No exception is thrown. Used for controlled retry under specific conditions. - **Exception**: `ha...
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