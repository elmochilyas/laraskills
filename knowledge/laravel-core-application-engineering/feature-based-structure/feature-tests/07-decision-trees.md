# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Module Extractability
**Generated:** 2026-06-03

---

# Decision Inventory

* Per-Feature Test Directory vs Flat tests/ Directory
* Per-Feature PHPUnit Suite vs Single Test Suite
* CI Path Filtering Per Changed Feature vs Full Test Suite Run

---

# Architecture-Level Decision Trees

---

## Decision 1: Per-Feature Test Directory vs Flat tests/ Directory

---

## Decision Context

Whether to organize tests into per-feature directories mirroring the source structure or keep tests in a flat directory structure.

---

## Decision Criteria

* Number of test files in the project
* Number of features that need test coverage
* Whether test ownership by feature is important for the team
* Whether the project has clear feature boundaries

---

## Decision Tree

Does the project use feature-based source organization?
↓
YES → Mirror the source structure — `tests/Features/Billing/` mirrors `app/Features/Billing/`
NO → Does the project have 50+ test files?
    YES → Are tests organized by domain concept?
        YES → Create per-domain test directories — e.g., `tests/Domain/Billing/`
        NO → Flat directory — structure isn't needed at this scale
NO → Does the team need clear test ownership per feature?
    YES → Per-feature test directories — ownership is explicit
    NO → Flat `tests/` directory — simpler, follows Laravel default

---

## Rationale

Per-feature test directories provide unambiguous test ownership. A developer working on `app/Features/Billing/Services/InvoiceService.php` immediately knows tests are in `tests/Features/Billing/Services/InvoiceServiceTest.php`. For layer-based projects, flat `tests/` or `tests/Feature/` follows Laravel conventions and is simpler.

---

## Recommended Default

**Default:** Mirror source structure for feature-based projects. Use flat `tests/` for layer-based projects.
**Reason:** Mirroring makes test ownership unambiguous. Flat structure is simpler and follows Laravel defaults while the project is small.

---

## Risks Of Wrong Choice

* Flat tests for feature-based project: 100+ test files in one directory — impossible to find tests for a specific feature
* Per-feature tests for layer-based project: Tests mirror source — but source is layer-based, so tests are scattered
* No mirror structure: Test files don't match source — "where does this test go?" confusion
* Per-feature tests with no feature boundary: Artificial feature divisions in tests — confusion

---

## Related Rules

* Mirror Source Structure Exactly In Tests
* Feature Test Case Convention

---

## Related Skills

* Create Feature Test Structure

---

---

## Decision 2: Per-Feature PHPUnit Suite vs Single Test Suite

---

## Decision Context

Whether to configure PHPUnit with per-feature test suites (enabling running tests for a single feature) or use a single suite that runs all feature tests.

---

## Decision Criteria

* Whether CI needs to run tests for only changed features (selective testing)
* Whether the test suite takes >10 minutes to run fully
* Whether feature development teams need to run only their feature's tests locally
* Whether the project has 10+ features with substantial test coverage

---

## Decision Tree

Does the CI pipeline need to run tests for only changed features?
↓
YES → Create per-feature PHPUnit suites — CI detects changed files and runs only affected suites
NO → Does the full test suite take >10 minutes to run?
    YES → Do developers need to run only their feature's tests during development?
        YES → Create per-feature suites for local development — full suite runs in CI only
        NO → Create per-feature suites — >10 minute suite needs parallelization or splitting
NO → Does the project have 10+ features with substantial test coverage?
    YES → Create per-feature suites — enables focused test execution
    NO → Single test suite — simpler configuration, run all tests

---

## Rationale

Per-feature PHPUnit suites enable selective test execution — running only the billing tests when the billing feature changes. This saves time in CI and local development. The overhead is PHPUnit XML configuration for each suite. At 10+ features or >10 minute test runs, the time savings justify the configuration overhead.

---

## Recommended Default

**Default:** Single PHPUnit suite for small-medium projects (<10 features). Per-feature suites for larger projects with long test runs.
**Reason:** Single suite is simpler. Per-feature suites are an optimization for scale — don't configure them until the test run time is a bottleneck.

---

## Risks Of Wrong Choice

* Single suite at 30-minute run: Every CI push takes 30 minutes — terrible developer experience
* Per-feature suites for 3 features: Configuration overhead without meaningful time savings
* No path filtering: A billing-only PR runs all 10,000 tests
* Incomplete suite coverage: Test file added but not included in any suite — never runs

---

## Related Rules

* Mirror Source Structure Exactly In Tests
* CI Path-Based Test Execution

---

## Related Skills

* Create Feature Test Structure

---

---

## Decision 3: CI Path Filtering Per Changed Feature vs Full Test Suite Run

---

## Decision Context

Whether to configure the CI pipeline to run only the tests for features that changed, or always run the full test suite.

---

## Decision Criteria

* Whether the CI pipeline has the tooling for path filtering (GitHub Actions paths, GitLab only:changes)
* Whether the project has 10+ features with separate test suites
* Whether the full test suite takes >15 minutes
* Whether feature changes are isolated (low risk of cross-feature breakage)

---

## Decision Tree

Does the full test suite take <5 minutes?
↓
YES → Run full suite on every push — simpler, no filtering logic needed
NO → Does the CI tool support path-based test filtering?
    YES → Do features have clear boundaries with tested cross-feature contracts?
        YES → Run only changed feature tests — risk of cross-feature breakage is low
        NO → Run full suite — cross-feature breakage is likely without tested contracts
NO → Run full suite on main branch merge — reduce to changed-feature tests on PR branches if CI tooling supports it
    YES → Run only changed feature tests on PR — run full suite on merge to main
    NO → Run full suite always — CI doesn't support selective execution

---

## Rationale

Path filtering runs only the test suites for features that changed, reducing CI time from 30 minutes to 2 minutes for most PRs. The risk is missing cross-feature breakage — a change in billing's data contract could break users' reports. Mitigate this by running the full suite on merge to main and ensuring cross-feature contracts are tested.

---

## Recommended Default

**Default:** Run only changed-feature tests on PR branches. Run full suite on merge to main.
**Reason:** This provides fast feedback during development (2 minute PR CI) while catching cross-feature breakage before deployment (30 minute full suite on main).

---

## Risks Of Wrong Choice

* Full suite every push: 30 minute CI for every PR — developers pile up changes, merge conflicts increase
* Only changed tests on PR to main: Cross-feature breakage goes undetected — broken main
* No pipeline for full suite: Merged PRs never validated against full suite — broken deployment
* Path filtering with no test contracts: Changes pass PR but break other features silently

---

## Related Rules

* CI Path-Based Test Execution
* Full Suite on Merge to Main

---

## Related Skills

* Create Feature Test Structure
