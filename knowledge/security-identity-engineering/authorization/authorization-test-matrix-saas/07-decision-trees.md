# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** SaaS Authorization Test Matrix for Roles and Entitlements
**Generated:** 2026-06-22

---

# Decision Inventory

* Decision 1: Test coverage depth — full combinatorial matrix vs targeted sampling
* Decision 2: Pest datasets vs manual test cases for authorization combinations
* Decision 3: Architecture test enforcement strategy for policy method coverage

---

# Architecture-Level Decision Trees

---

## Decision: Full Combinatorial Matrix vs Targeted Sampling

---

## Decision Context

When building an authorization test suite for a multi-tenant SaaS, determine whether to test every role x plan x action combination (full matrix) or test a representative sample (targeted sampling). Full matrices scale factorially with each new axis; targeted sampling reduces test count but risks coverage gaps.

---

## Decision Criteria

* coverage considerations: full matrices guarantee no untested combinations; targeted sampling leaves gaps
* maintainability considerations: full matrices with Pest datasets add no maintenance overhead per combination; targeted sampling requires manual tracking of coverage
* performance considerations: full matrices can produce 1000+ tests; targeted sampling may run 10x faster
* risk considerations: authorization bugs are combinatorial — the most dangerous bugs hide in untested combinations

---

## Decision Tree

How many authorization axes does the system have?
↓
TWO AXES (roles x plans, no team isolation, no degradation):
    How many combinations?
    ≤ 20 → **FULL MATRIX** — trivially testable, no reason to sample
    > 20 → **FULL MATRIX** — Pest datasets make this free; maintenance cost is zero
↓
THREE AXES (roles x plans x team isolation):
    Always → **FULL MATRIX** — cross-team isolation is too critical to sample
    Test cross-team separately, use matrix for role x plan within a single team
↓
FOUR+ AXES (roles x plans x statuses x resource types x actions):
    How many total combinations?
    ≤ 200 → **FULL MATRIX** — parallel testing handles this easily
    200-1000 → **FULL MATRIX WITH SPLITTING** — split test files by resource type; run in parallel
    > 1000 → **TIERED APPROACH**:
        Tier 1 (full matrix): Destructive actions (create, update, delete) for all combinations
        Tier 2 (sampled): Read actions — test each role against one plan, each plan against one role
        Tier 3 (spot checks): Edge cases — right-role-wrong-plan, right-plan-wrong-role as explicit tests
    ↓
Is the application subject to compliance audits (SOC2, GDPR, HIPAA)?
    YES → **FULL MATRIX** for all compliance-relevant resource types — auditors expect exhaustive coverage
    NO → The tiered approach is acceptable for non-compliance applications
    ↓
What is the cost of an authorization bug in production?
    DATA BREACH (cross-team access) → **FULL MATRIX** for all destructive actions and cross-team tests
    REVENUE LOSS (plan bypass) → **FULL MATRIX** for premium features across all roles
    UX DEGRADATION (wrong 403) → targeted sampling acceptable
    ↓
How often do roles or plans change?
    FREQUENTLY (monthly or more) → **FULL MATRIX** — datasets auto-propagate new combinations
    RARELY (quarterly or less) → targeted sampling is sufficient; review on each change

---

## Rationale

Authorization bugs are combinatorial by nature — they hide in the intersections you don't test. Full matrices with Pest datasets have zero marginal maintenance cost per combination (adding a role is one line in the dataset). The only real cost is test execution time, which parallel testing largely eliminates. The risk of untested combinations — silent authorization bypass, cross-team data access, revenue loss — far outweighs the cost of running 200 more tests.

---

## Recommended Default

**Default:** Full combinatorial matrix for all destructive actions (create, update, delete). Sampled matrix for read actions. Cross-team isolation always tested exhaustively regardless of matrix strategy.

**Reason:** Destructive actions and cross-team access are the highest-risk authorization boundaries. A missed combination here means data breach or data loss. Read actions are lower risk — a viewer who can read when they shouldn't can still is problematic, but the exposure is limited. Sampling reads with targeted edge cases provides adequate coverage.

---

## Risks Of Wrong Choice

Targeted sampling for destructive actions: untested role x plan combination allows unauthorized deletion. Full matrix with no parallelization: test suite takes 30 minutes, developers skip running it locally, CI becomes the bottleneck.

---

## Related Rules

- Rule 1 (05-rules.md): Test Every Role x Plan Combination for Every Protected Action
- Rule 2 (05-rules.md): Test Cross-Team Isolation Explicitly and Separately
- Rule 3 (05-rules.md): Test Subscription Degradation States

---

## Related Skills

- Build SaaS Authorization Test Matrices (06-skills.md)

---

## Decision: Pest Datasets vs Manual Test Cases for Authorization Combinations

---

## Decision Context

When defining role x plan combinations in authorization tests, determine whether to use Pest's `dataset()` function for declarative, shared data definitions or to write each combination as an explicit, manual test case.

---

## Decision Criteria

* maintainability considerations: datasets centralize role and plan definitions; manual tests scatter them across files
* readability considerations: explicit test names are self-documenting; dataset test names are auto-generated
* flexibility considerations: datasets are uniform (same assertion for all combinations); manual tests can vary assertions per combination
* debugging considerations: dataset failures reference the dataset name (not the specific combination); manual test failures are immediately specific

---

## Decision Tree

Do all combinations in the matrix have the same expected behavior for a given action?
↓
YES → Does the matrix have more than 6 combinations?
    YES → **PEST DATASET** — one test method with `->with('dataset_name')` covers all combinations
        ↓
        Where to define the dataset?
        Shared across test files → `tests/Datasets/Authorization.php`
        Used in one file only → Define inline in the test file
        ↓
        Dataset type:
        Simple list → `dataset('roles', [['viewer'], ['member'], ['admin'], ['owner']])`
        Cross-product → `dataset('role_x_plan', /* computed from roles x plans */)`
        Named entries → `dataset('roles', ['viewer' => ['viewer'], 'admin' => ['admin']])`
    NO → **MANUAL TESTS** — 6 or fewer combinations are readable as individual tests
        Each test name documents the specific combination: "viewer on free plan cannot delete"
NO → Do some combinations have different expected outcomes (e.g., viewer always denied, admin always allowed)?
    YES → **GROUPED DATASETS WITH CONDITIONALS** — use datasets but branch assertions based on role
        ```php
        test('role x plan matrix for delete', function ($role, $plan) {
            // ...
            if (in_array($role, ['admin', 'owner'])) {
                $response->assertNoContent();
            } else {
                $response->assertForbidden();
            }
        })->with('role_x_plan');
        ```
    NO → Are the differences subtle enough that a single assertion logic can't capture them?
        YES → **MANUAL TESTS FOR BOUNDARIES** — use datasets for the uniform cases, manual tests for intersections
            Example: Dataset for "all roles can read in their team," manual test for "right-role-wrong-plan"
        NO → Re-evaluate: the combinations likely do have uniform behavior for that specific action
    ↓
    Are there cross-cutting concerns (cross-team, subscription degradation) that span multiple combinations?
    YES → **SEPARATE TEST FILES** — `CrossTeamIsolationTest.php`, `SubscriptionDegradationTest.php`
        These test specific axes independently of the role x plan matrix
    NO → Include in the matrix with conditionals

---

## Rationale

Pest datasets eliminate duplication and make adding new roles or plans a one-line change. A dataset defined in `tests/Datasets/Authorization.php` is a single source of truth — all matrix tests automatically include new roles when the dataset is updated. Manual tests are more readable for small sets (< 6 combinations) and for edge cases that require unique assertions not expressible in a uniform test body.

---

## Recommended Default

**Default:** Pest datasets for all role x plan matrices with 6+ combinations. Manual tests for cross-team isolation, subscription degradation, and boundary cases (right-role-wrong-plan, right-plan-wrong-role). Shared dataset file at `tests/Datasets/Authorization.php`.

**Reason:** Datasets scale without maintenance overhead. Manual tests for boundaries provide clarity where the logic is non-uniform. The hybrid approach gives both scalability and readability.

---

## Risks Of Wrong Choice

Datasets for everything: complex conditional assertions become unreadable; debugging failures requires decoding dataset indices. Manual tests for everything: 50 tests per resource x 8 resources = 400 tests with hardcoded role names — adding a role requires updating 8 files.

---

## Related Rules

- Rule 4 (05-rules.md): Use Pest Datasets for Declarative Matrix Definitions

---

## Related Skills

- Build SaaS Authorization Test Matrices (06-skills.md)

---

## Decision: Architecture Test Enforcement Strategy for Policy Method Coverage

---

## Decision Context

Determine how to enforce that every Policy method (`viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`) has corresponding test coverage in the authorization test suite. The goal is to catch new Policy methods added without tests at CI time.

---

## Decision Criteria

* enforcement strength: should uncovered policy methods block merges (error) or warn (notice)?
* test granularity: should architecture tests check method existence, test existence, or coverage percentage?
* maintainability: should the enforcement strategy scale as new resource types are added?

---

## Decision Tree

What is the maturity of the authorization test suite?
↓
NEW (just building out tests) → **WARN, DON'T BLOCK** — use Pest architecture tests that warn but don't fail
    ```php
    arch('policies have required methods')
        ->expect('App\Policies')
        ->toHaveMethods(['viewAny', 'view', 'create', 'update', 'delete']);
    ```
    This verifies Policy structure but doesn't block on missing tests yet
↓
ESTABLISHED (tests exist for most resources) → **BLOCK ON MISSING METHODS** — fail CI if a Policy is missing any required method
    Also add: verify no Policy blindly returns `true` for all methods
    ```php
    arch('no policy allows everything')
        ->expect('App\Policies')
        ->not->toBeAbstract();
    ```
↓
MATURE (full matrix for all resources) → **BLOCK ON MISSING TEST FILES** — fail CI if a Policy has no corresponding test file
    Convention: `App\Policies\DocumentPolicy` must have `tests/Feature/Authorization/DocumentPolicyMatrixTest.php`
    Implement via custom Pest architecture check or CI script:
    ```php
    arch('every policy has a matrix test file')
        ->expect('App\Policies')
        ->toHaveTests(); // or manual: scan tests/Feature/Authorization/ for matching files
    ```
    ↓
    Should the enforcement check method-level coverage within each test file?
    YES, if tooling supports it → Use PHPUnit coverage reports gated at 90% for Policy classes
    NO, if tooling is limited → Use naming convention + manual code review checklist
    ↓
    What about custom Policy methods beyond the standard 7?
    STANDARD METHODS ONLY → Architecture test checks for `viewAny`, `view`, `create`, `update`, `delete`
    CUSTOM METHODS TOO → Manual review or custom PHPStan rule that flags custom methods without `@test` annotations
    ↓
HOW STRICT should the enforcement be in CI?
    PULL REQUEST → Block on missing standard Policy methods. Warn on missing test files.
    MERGE TO MAIN → Block on both missing methods AND missing test files.
    NIGHTLY BUILD → Full coverage report. Block if Policy coverage < 90%.

---

## Rationale

Architecture tests are the safety net that catches process failures. A developer adds a new Policy method (e.g., `archive()`) without a test — the architecture test catches it at CI time. The enforcement should escalate with project maturity: start with warnings, progress to blocking errors as the test suite stabilizes. The goal is to make it impossible to add authorization logic without corresponding test coverage.

---

## Recommended Default

**Default:** Start with Pest architecture tests that verify Policy structure (`toHaveMethods`). Add test file existence checks once the matrix is established. Set coverage gates at 90% for Policy classes. Block on missing standard methods at merge time; block on missing test files at nightly build.

**Reason:** Incremental enforcement prevents CI from becoming a bottleneck during early development while still preventing authorization regression in production. The escalating enforcement matches the natural progression of test suite maturity.

---

## Risks Of Wrong Choice

Blocking too early: developers cannot iterate quickly; test writing becomes a chore; tests are written to satisfy CI rather than exercise real scenarios. Warning forever: authorization tests are never enforced; new Policies ship without test coverage; regression bugs accumulate.

---

## Related Rules

- Rule 1 (05-rules.md): Test Every Role x Plan Combination for Every Protected Action

---

## Related Skills

- Build SaaS Authorization Test Matrices (06-skills.md)
