# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Monorepo Management
**Knowledge Unit:** Shared Library Extraction Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | When to extract shared code into a library? | Usage count, API stability | Rule of three (3 usages before extraction) |
| 2 | Monorepo package vs separate repository? | Consumers, distribution | Monorepo for internal; separate for external distribution |

---

# Architecture-Level Decision Trees

---

## Decision 1: When to Extract Shared Code?

---

## Decision Context

Extracting shared libraries too early creates unstable APIs and maintenance burden. Extracting too late allows duplicated code to proliferate. The rule-of-three provides a decision framework.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

How many independent consumers use this code?
↓
1 → Do NOT extract; code isn't proven as reusable
2 → Consider extraction; wait for third usage if API is unstable
3+ → ↓
Is the code stable (unchanged for 3+ months)?
↓
NO → Wait for stabilization; early extraction creates API churn
YES → ↓
Is this technical infrastructure (not business logic)?
↓
NO (business logic) → **Do NOT extract**; business logic rarely generalizes well
YES → **Extract** — move to shared library with tests, docs, SemVer
Regardless:
- Move tests alongside production code
- Minimize public API surface
- Document migration path for consumers
- Assign a maintainer

---

## Rationale

The rule of three ensures enough pattern evidence to design a stable API. Early extraction creates abstractions that don't fit real use cases. Late extraction lets duplicated code proliferate. The three-usage threshold balances these forces.

---

## Recommended Default

**Default:** Extract after 3 independent usages of stable, infrastructure-level code
**Reason:** Three usages provide enough pattern confidence for API design; avoids premature abstraction

---

## Risks Of Wrong Choice

- **Extract too early:** API changes multiple times; consumer churn; library abandoned
- **Extract too late:** 10+ copies of similar code across projects; inconsistency; technical debt

---

## Related Rules

- GP-RULE-016: No baked-in credentials
- GP-RULE-017: Pin dependency versions

---

## Related Skills

- Manage Golden Path Lifecycle and Adoption

---

## Decision 2: Monorepo Package vs Separate Repository?

---

## Decision Context

Extracted libraries can live in the monorepo or in their own repository. The choice depends on who consumes the library and whether they have access to the monorepo.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Who consumes this library?
↓
**Only teams within the organization (with monorepo access)**
↓
**Monorepo package** — easier to develop, atomic cross-package changes
↕
**External consumers or org teams without monorepo access**
↓
**Separate repository** — independent distribution, clear public API
↕
**Both internal and external**
↓
**Monorepo with split testing** — develop in monorepo, publish via split
Regardless:
- Ensure the extracted package has complete `composer.json`
- Include CI, tests, and documentation in the extracted library
- Assign a clear maintainer before extraction

---

## Rationale

Monorepo packages are easier to develop across shared codebases. Separate repos are necessary for external distribution. Split testing bridges both approaches but adds CI complexity.

---

## Recommended Default

**Default:** Monorepo package for internal-only use; separate repo or split for external
**Reason:** Monorepo development is more efficient; external distribution requires independent repos

---

## Risks Of Wrong Choice

- **Monorepo for external:** External consumers can't access or have to clone the entire monorepo
- **Separate repo for internal:** Cross-package refactoring requires coordinated PRs across repos

---

## Related Rules

- GP-RULE-018: Path execution under 5 minutes
- GP-RULE-019: 3+ Laravel apps

---

## Related Skills

- Manage Golden Path Lifecycle and Adoption

