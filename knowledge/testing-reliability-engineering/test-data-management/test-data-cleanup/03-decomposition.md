# Topic Overview
The minimal data principle governs how much test data to create and how to structure it. This KU covers the principle itself, record count guidelines, explicit attribute patterns, data budget monitoring, and code review practices for test data creation.

---

# Decomposition Strategy
Decompose by principle application level: per-test guidelines (how many records), attribute patterns (explicit vs Faker), monitoring (budget tracking), and enforcement (code review, CI alerts). Each level has distinct practices and tooling.

---

# Proposed Folder Structure
```
ku-03-test-data-cleanup/
├── 02-knowledge-unit.md
├── 03-decomposition.md
├── 04-standardized-knowledge.md
├── minimal-data-principle.md
├── record-count-guidelines.md
├── explicit-attribute-pattern.md
├── data-budget-monitoring.md
├── data-volumetrics.md
├── data-heavy-test-profiling.md
├── code-review-data-checklist.md
└── pagination-minimum-pattern.md
```

---

# Knowledge Unit Inventory

| Sub-Topic | Description | Priority | Maturity |
|-----------|-------------|----------|----------|
| Minimal Data Principle | Core philosophy: create only what's needed | P0 | Stable |
| Record Count Guidelines | 1-3 default, per_page+1 for pagination | P0 | Stable |
| Explicit Attribute Pattern | Deterministic values over Faker defaults | P0 | Stable |
| Data Budget Monitoring | Tracking total records per suite | P1 | Emerging |
| Data Volumetrics | Cost model for record creation (ms per record) | P1 | Mature |
| Data-Heavy Test Profiling | Using --profile to find data-heavy tests | P1 | Stable |
| Code Review Data Checklist | Reviewing test PRs for excess data | P2 | Stable |

---

# Dependency Graph
```
ku-03-test-data-cleanup
├── depends on: ku-01-test-data-factories (minimal use of factories)
├── depends on: ku-02-test-data-seeding (declarative methods scope)
├── depends on: ku-06-test-suite-profiling (identify data-heavy tests)
├── supports:   ku-05-test-data-lifecycle (cleanup strategy)
└── supports:  parallel test performance (less data = less contention)
```

---

# Boundary Analysis
- **In scope:** Minimal data principle guidelines, record count rules, explicit attribute patterns, data budget monitoring, profiling data-heavy tests, code review standards for test data.
- **Adjacent:** ku-01-test-data-factories defines how states create data. ku-05-test-data-lifecycle owns RefreshDatabase cleanup mechanics. ku-06-test-suite-profiling owns profile tooling that identifies data-heavy tests.
- **Out of scope:** How to write specific test assertions, CI/CD pipeline design, database connection configuration.

---

# Future Expansion Opportunities
- **Automated data budget analysis:** CI plugin that counts total records created per test run and alerts on increase.
- **Visual data heatmap:** Per-test record count visualization showing which files create the most data.
- **AI data minimization:** Tooling that suggests removing unnecessary factory calls from test Arrange sections based on assertion analysis.
