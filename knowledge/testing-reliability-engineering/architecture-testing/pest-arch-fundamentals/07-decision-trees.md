# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Architecture Testing
**Knowledge Unit:** Pest Architecture Testing Fundamentals
**Generated:** 2026-06-03

---

# Decision Inventory

1. Namespace-level vs class-level expectations
2. Strict vs permissive enforcement strategy
3. Namespace targeting vs directory targeting
4. Arch tests in lint stage vs test stage

---

# Architecture-Level Decision Trees

---

## Decision Name: Namespace-Level vs Class-Level Expectations

---

## Decision Context

Choose whether to write architecture expectations targeting entire namespaces or individual classes.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Rule applies to all classes in a namespace/directory?
↓
YES → Use namespace-level: `arch()->expect('App\Services')->toExtend('BaseService')` (preferred)
NO → Rule applies to a specific class only?
↓
YES → Use class-level expectation with documented reason for uniqueness

---

## Rationale

Namespace-level contracts serve as source of truth for architectural rules. When new classes are added, they automatically inherit the contract's expectations. Individual class checks require updating every time a class is added.

---

## Recommended Default

**Default:** Namespace-level expectations for all broad architectural rules
**Reason:** Self-documenting, automatically applies to new classes, zero maintenance.

---

## Risks Of Wrong Choice

Per-class expectations grow without bound; new classes may bypass architectural rules until explicitly added.

---

## Related Rules

Rule 2: Write expectations as contracts, not individual checks

---

## Related Skills

Write Pest Architecture Tests for Custom Rules

---

## Decision Name: Strict vs Permissive Enforcement Strategy

---

## Decision Context

Choose how strictly to enforce architecture rules when adopting arch testing on an existing codebase.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Greenfield project (no legacy code)?
↓
YES → Start with full enforcement (strict from day one)
NO → Existing codebase with potential violations?
↓
YES → Start permissive with generous `ignoring()` list; tighten over time
NO → Apply strict enforcement

---

## Rationale

Immediate strict enforcement on existing codebases creates thousands of violations, making the test noise that developers ignore. Starting permissive allows the team to fix violations at a sustainable pace.

---

## Recommended Default

**Default:** Permissive start with ignoring() for legacy; tighten quarterly
**Reason:** Prevents noise that leads to ignored tests while preventing new violations.

---

## Risks Of Wrong Choice

Strict enforcement on legacy code creates noise and test fatigue. Overly permissive enforcement never catches violations.

---

## Related Rules

Rule 3: Start permissive, tighten over time

---

## Related Skills

Write Pest Architecture Tests for Custom Rules

---

## Decision Name: Arch Tests in Lint Stage vs Test Stage

---

## Decision Context

Choose where to place architecture tests in the CI pipeline.

---

## Decision Criteria

* performance

---

## Decision Tree

Arch tests require database or application boot?
↓
YES → Must run in test stage (unusual — arch tests normally don't need boot)
NO → Run in lint/static analysis stage (milliseconds, no external deps)

↓
CI pipeline has separate lint and test stages?
↓
YES → Add arch tests to lint stage (fastest feedback)
NO → Run as first job in test stage (before heavy tests)

---

## Rationale

Architecture tests complete in milliseconds with no external dependencies. Running them first gives the fastest possible feedback — a broken architectural rule is caught in seconds, not minutes.

---

## Recommended Default

**Default:** Run arch tests in CI lint stage before main test suite
**Reason:** Fastest feedback loop; no database or framework boot required.

---

## Risks Of Wrong Choice

Running arch tests alongside feature tests wastes time — arch violations are found only after database setup and migration execution.

---

## Related Rules

Rule 4: Place arch tests in CI lint stage

---

## Related Skills

Write Pest Architecture Tests for Custom Rules
