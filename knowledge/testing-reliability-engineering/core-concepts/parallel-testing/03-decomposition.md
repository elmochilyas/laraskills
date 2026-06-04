# Decomposition: Parallel Testing

## Topic Overview
Parallel test execution splits the test suite across multiple PHP processes to reduce CI wall-clock time. Understanding process isolation, database naming, and worker management is essential for scaling Laravel test suites beyond 500 tests.

## Decomposition Strategy
This knowledge unit breaks down into four areas: (1) parallel execution architecture and Paratest internals, (2) database isolation and token-based resource naming, (3) worker count tuning and CI configuration, and (4) coverage collection in parallel mode.

## Proposed Folder Structure
```
ku-03-parallel-testing/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| Paratest architecture | concept | Process spawning, queue-based file distribution, output aggregation |
| Database isolation | concept | `ParallelTesting::token()` for process-specific databases |
| Worker count tuning | practice | Matching workers to CPU cores and IO/CPU profile |
| Coverage in parallel | practice | Pcov-based coverage collection and merging |
| Port allocation | practice | Using `ParallelTesting::token()` for unique ports |
| Large file splitting | practice | Identifying and splitting imbalanced test files |

## Dependency Graph
```
Parallel Testing
├── Requires: PHPUnit/Pest configuration basics
├── Depends on: Paratest package
├── Related: Database testing lifecycle
├── Related: CI/CD pipeline integration
└── Related: Test suite profiling
```

## Boundary Analysis
This KU does not cover CI sharding strategies (covered in CI/CD pipeline), matrix testing, or specific database driver configuration. It focuses on the parallel execution mechanics within the test runner itself.

## Future Expansion Opportunities
- Custom Paratest extensions
- Parallel execution in Docker-based CI environments
- GPU-parallelized test execution
- Hybrid parallel-sequential coverage strategies
