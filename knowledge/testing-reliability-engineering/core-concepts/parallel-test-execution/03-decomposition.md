# Decomposition: parallel test execution

## Topic Overview

Parallel test execution (via Paratest or Pest's `--parallel`) splits the test suite across multiple PHP processes, reducing CI wall-clock time proportionally to worker count. For a suite that takes 10 minutes sequentially, 4 workers can reduce it to ~3 minutes. Laravel's parallel infrastructure handles process isolation, database naming, and test output aggregation. Without parallelism, test suites beyond ~500 tests become a CI bottleneck that slows development feedback loops.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
parallel-test-execution/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### parallel test execution
- **Purpose:** Parallel test execution (via Paratest or Pest's `--parallel`) splits the test suite across multiple PHP processes, reducing CI wall-clock time proportionally to worker count. For a suite that takes 10 minutes sequentially, 4 workers can reduce it to ~3 minutes. Laravel's parallel infrastructure handles process isolation, database naming, and test output aggregation. Without parallelism, test suites beyond ~500 tests become a CI bottleneck that slows development feedback loops.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Pest/PHPUnit fundamentals, Database testing lifecycle, **Related Topics**: CI/CD pipeline integration, Parallel sharding in CI, Matrix CI testing, **Advanced Follow-up**: Custom `ParallelTesting` hooks, and Database provisioning for parallel runs

## Dependency Graph
**Depends on:** **Prerequisites**: Pest/PHPUnit fundamentals, Database testing lifecycle, **Related Topics**: CI/CD pipeline integration, Parallel sharding in CI, Matrix CI testing, **Advanced Follow-up**: Custom `ParallelTesting` hooks, and Database provisioning for parallel runs
**Depended on by:** Knowledge units that leverage or extend parallel test execution patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for parallel test execution.
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