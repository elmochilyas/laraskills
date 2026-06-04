# Decomposition: test suite profiling

## Topic Overview

Test suite profiling identifies slow tests, hot files, and performance bottlenecks in the test suite. Laravel's `--profile` flag and Pest's built-in profiler show per-test execution times, enabling targeted optimization. A 10-minute test suite with 3 slow tests spending 8 minutes of that time is common—profiling reveals which tests to optimize, split, or mark as slow. Without profiling, teams optimize blindly and miss the highest-impact changes.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
test-suite-profiling/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### test suite profiling
- **Purpose:** Test suite profiling identifies slow tests, hot files, and performance bottlenecks in the test suite. Laravel's `--profile` flag and Pest's built-in profiler show per-test execution times, enabling targeted optimization. A 10-minute test suite with 3 slow tests spending 8 minutes of that time is common—profiling reveals which tests to optimize, split, or mark as slow. Without profiling, teams optimize blindly and miss the highest-impact changes.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Pest/PHPUnit fundamentals, Test suite organization, **Related Topics**: N+1 query detection, Slow query identification, Parallel test execution, **Advanced Follow-up**: Xdebug profiling integration, and Tideways continuous profiling

## Dependency Graph
**Depends on:** **Prerequisites**: Pest/PHPUnit fundamentals, Test suite organization, **Related Topics**: N+1 query detection, Slow query identification, Parallel test execution, **Advanced Follow-up**: Xdebug profiling integration, and Tideways continuous profiling
**Depended on by:** Knowledge units that leverage or extend test suite profiling patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for test suite profiling.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization