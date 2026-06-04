# Decomposition: parallel sharding ci

## Topic Overview

Parallel test sharding splits the test suite across multiple CI jobs, each running a subset of tests simultaneously, to reduce total wall-clock time. Pest and PHPUnit support sharding natively via `--shard` flag. The standard approach uses GitHub Actions matrix strategy to define shard jobs, with static or dynamic splitting of test files. Sharding reduces a 30-minute test suite to 5-10 minutes depending on shard count and parallelism efficiency. The key challenges are balanced test distributi...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
parallel-sharding-ci/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### parallel sharding ci
- **Purpose:** Parallel test sharding splits the test suite across multiple CI jobs, each running a subset of tests simultaneously, to reduce total wall-clock time. Pest and PHPUnit support sharding natively via `--shard` flag. The standard approach uses GitHub Actions matrix strategy to define shard jobs, with static or dynamic splitting of test files. Sharding reduces a 30-minute test suite to 5-10 minutes depending on shard count and parallelism efficiency. The key challenges are balanced test distributi...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: GitHub Actions CI/CD fundamentals, Parallel test execution (Paratest), PHPUnit configuration, **Related Topics**: Matrix testing (PHP × DB), Coverage reporting, CI pipeline optimization, **Advanced Follow-up**: Dynamic shard distribution algorithms, Two-level parallelism optimization, and Shard cost analysis

## Dependency Graph
**Depends on:** **Prerequisites**: GitHub Actions CI/CD fundamentals, Parallel test execution (Paratest), PHPUnit configuration, **Related Topics**: Matrix testing (PHP × DB), Coverage reporting, CI pipeline optimization, **Advanced Follow-up**: Dynamic shard distribution algorithms, Two-level parallelism optimization, and Shard cost analysis
**Depended on by:** Knowledge units that leverage or extend parallel sharding ci patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for parallel sharding ci.
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