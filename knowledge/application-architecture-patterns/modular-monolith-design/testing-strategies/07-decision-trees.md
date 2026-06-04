# Decision Trees: Testing Strategies for Modular Monolith

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Testing strategies for modular monolith
- **Knowledge Unit ID:** MMD-16
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Contract tests vs E2E tests for boundary verification | Testing | Test strategy |
| 2 | In-memory adapters vs full Laravel boot for contract tests | Testing | Test implementation |
| 3 | Parallel per-module CI vs sequential test suites | CI/CD | CI configuration |

---

## Decision 1: Contract tests vs E2E tests for boundary verification

### Context
Cross-module boundary bugs should be caught by contract tests, not end-to-end tests. Contract tests verify that a module's contract implementation satisfies the interface contract. They are faster (partial boot, in-memory adapters) and more reliable than E2E tests. E2E tests should be reserved for only critical multi-module user journeys.

### Decision Tree

```
Are you testing a cross-module boundary?
├── YES
│   Is this a critical end-to-end user journey spanning 3+ modules?
│   ├── YES → E2E test (one per critical journey — keep minimal)
│   └── NO → Contract test (faster, more reliable, better feedback)
│       Does the contract have a contract test suite?
│       ├── YES → Run existing contract tests
│       └── NO → Create contract test suite before adding E2E tests
└── NO (within-module testing)
    → Unit tests or integration tests within the module
```

### Rationale
Contract tests provide faster, more focused feedback on boundary bugs than E2E tests. A single E2E test might take 5 seconds; a contract test takes milliseconds. Most cross-module bugs (wrong return types, behavioral mismatch, missing error handling) are caught by contract tests. E2E tests add coverage for integration of 3+ modules but are slow and flaky.

### Recommended Default
Contract tests for all cross-module boundaries; E2E for critical journeys only

### Risks
- No contract tests: boundary bugs caught late or by slow E2E tests
- Too many E2E tests: slow, flaky test suite that developers stop running
- Contract tests without in-memory adapters: slow contract tests that developers skip

### Related Rules
- Contract Test Every Interface (MMD-16/05-rules.md)
- Unit Test Domain Logic (MMD-16/05-rules.md)
- Use In-Memory Adapters (MMD-16/05-rules.md)
- Limit E2E Tests (MMD-16/05-rules.md)

### Related Skills
- Test a Modular Monolith Effectively (MMD-16/06-skills.md)
- Write Architecture Tests (LAP-13/06-skills.md)
- Test Service Layer (SLP-17/06-skills.md)

---

## Decision 2: In-memory adapters vs full Laravel boot for contract tests

### Context
Contract tests should use in-memory adapters instead of real infrastructure (database, queue, HTTP). In-memory adapters implement the same contract interface with in-memory storage. This makes contract tests fast, self-contained, and deterministic.

### Decision Tree

```
Does the contract test require infrastructure (database, queue, HTTP)?
├── YES
│   Can the dependency be replaced with an in-memory implementation?
│   ├── YES → Create in-memory adapter — fastest, most reliable
│   │   Use in all contract tests; keep real infrastructure tests minimal
│   └── NO → Test with real infrastructure
│       Is this the slowest test in the suite?
│       ├── YES → Consider creating an in-memory adapter despite effort
│       └── NO → Acceptable with careful infrastructure cleanup
└── NO (pure logic test) → Direct unit test (no Laravel boot either)
```

### Rationale
In-memory adapters are the key to fast contract tests. A test that would take 200ms with a database takes 2ms with an in-memory adapter. The adapter implements the same interface with in-memory storage, so it validates the contract without needing a database. This shifts most tests off the slow infrastructure path.

### Recommended Default
In-memory adapters for all contract tests; infrastructure tests only when unavoidable

### Risks
- No in-memory adapters: contract tests require database, making them slow
- In-memory adapter doesn't match real behavior: false confidence from passing in-memory tests
- Too many infrastructure tests: slow suite that discourages frequent running

### Related Rules
- Use In-Memory Adapters (MMD-16/05-rules.md)
- Contract Test Every Interface (MMD-16/05-rules.md)
- Run Module Tests in Parallel CI (MMD-16/05-rules.md)

### Related Skills
- Test a Modular Monolith Effectively (MMD-16/06-skills.md)
- Write Architecture Tests (LAP-13/06-skills.md)

---

## Decision 3: Parallel per-module CI vs sequential test suites

### Context
Each module's test suite should run as a separate parallel CI job because modules are independent. Sequential test running wastes CI capacity — adding more modules increases total test time linearly. Parallel CI keeps feedback time constant as the module count grows.

### Decision Tree

```
How many modules have test suites in this project?
├── 1-2 → Sequential may be acceptable (feedback time is short)
│   Plan for parallel when third module is created
├── 3-5 → Parallel CI strongly recommended
│   Can each module's tests run independently (own database, no shared state)?
│   ├── YES → Configure parallel CI jobs per module
│   └── NO → Refactor tests for parallel execution first
│       (shared database state prevents parallel runs)
└── 6+ → Parallel CI is required
    Sequential tests would take 5x+ longer
    Each module runs in its own CI job
```

### Rationale
Module independence is the defining feature of a modular monolith. Tests should reflect this independence. Parallel CI per module keeps feedback time at the duration of the slowest module's test suite, regardless of how many modules exist. Without parallel CI, test time grows linearly with module count.

### Recommended Default
Parallel CI jobs per module for 3+ modules

### Risks
- Sequential CI with 6+ modules: 30-minute test suite for a single-module change
- Shared test state: modules can't run in parallel because tests conflict on database
- Uneven test distribution: one module's 10-minute suite blocks all results

### Related Rules
- Run Module Tests in Parallel CI (MMD-16/05-rules.md)
- Unit Test Domain Logic (MMD-16/05-rules.md)
- Contract Test Every Interface (MMD-16/05-rules.md)

### Related Skills
- Test a Modular Monolith Effectively (MMD-16/06-skills.md)
- Configure CI Enforcement (AEG-02/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)
