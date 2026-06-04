# Topic Overview
CI test execution encompasses how tests are run in CI pipelines: execution strategies (parallel, sequential), profiling for performance, caching for speed, and quality gates for enforcement. The topic is the operational layer that makes test suites practical in CI environments.

---

# Decomposition Strategy
Decompose by CI concern: execution strategy (how tests run), performance analysis (profiling), infrastructure (caching, matrix), and gates (quality enforcement). Each concern maps to a distinct sub-topic with its own conventions and tooling.

---

# Proposed Folder Structure
```
ku-05-ci-test-execution/
├── 02-knowledge-unit.md
├── 03-decomposition.md
├── 04-standardized-knowledge.md
├── parallel-sharding.md
├── matrix-testing.md
├── path-based-triggering.md
├── caching-strategies.md
├── quality-gates.md
├── slow-test-quarantine.md
├── profile-trend-tracking.md
└── ci-security.md
```

---

# Knowledge Unit Inventory

| Sub-Topic | Description | Priority | Maturity |
|-----------|-------------|----------|----------|
| Parallel Sharding | Splitting test files across CI runners | P0 | Stable |
| Matrix Testing | PHP version × DB engine combinations | P0 | Mature |
| Path-Based Triggering | Running tests only for changed paths | P1 | Mature |
| Caching Strategies | Vendor, view, config cache in CI | P0 | Mature |
| Quality Gates | Coverage, PHPStan, Pint enforcement | P0 | Stable |
| Slow Test Quarantine | Isolating slow tests to separate jobs | P1 | Emerging |
| Profile Trend Tracking | JUnit XML artifact analysis over time | P1 | Mature |
| CI Security | Secrets, artifact retention, access control | P2 | Mature |

---

# Dependency Graph
```
ku-05-ci-test-execution
├── depends on: ku-01-ci-cd-pipeline (base pipeline design)
├── depends on: ku-03-parallel-sharding (sharding mechanics)
├── depends on: ku-04-matrix-testing (matrix strategy)
├── extends:   ku-02-test-framework (Pest/PHPUnit commands)
└── supports:  ku-06-flaky-test-detection (flaky analysis in CI)
```

---

# Boundary Analysis
- **In scope:** GitHub Actions workflows, matrix strategies, parallel sharding, path-based triggers, caching, quality gates, slow test quarantine, profile trend analysis.
- **Adjacent:** ku-01-ci-cd-pipeline owns overall pipeline design (stages, deployment). ku-02-test-framework owns test runner commands. ku-06-flaky-test-detection owns flaky analysis and retry logic.
- **Out of scope:** Test framework internals, individual test writing patterns, deployment details beyond CI.

---

# Future Expansion Opportunities
- **AI-driven shard balancing:** Dynamically distribute tests across shards based on historical timing data instead of fixed file splits.
- **Performance regression gates:** Block PRs when P95 test time increases beyond a threshold.
- **Self-healing CI caches:** Auto-invalidate partial caches when dependency conflicts are detected.
- **Cross-repo CI orchestration:** Coordinating test execution across microservice boundaries in monorepo setups.
