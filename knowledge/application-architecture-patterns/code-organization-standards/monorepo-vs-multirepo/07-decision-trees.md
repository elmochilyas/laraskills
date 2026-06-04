# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** Monorepo vs. multi-repo organizational tradeoffs
**Generated:** 2026-06-03

---

# Decision Inventory

* Monorepo vs multi-repo for Laravel projects
* Path-based CI filtering vs full test suite execution
* Shared contracts package vs direct code sharing in multi-repo

---

# Architecture-Level Decision Trees

---

## Monorepo vs Multi-Repo for Laravel Projects

---

## Decision Context

The monorepo vs multi-repo decision determines how code is shared, versioned, and deployed. Laravel ecosystem is overwhelmingly monorepo-centric. Multi-repo becomes relevant only at significant organizational scale or when independent deployment is required.

---

## Decision Criteria

* performance considerations — monorepo CI can become slow; multi-repo CI is per-repo fast but cross-cutting changes are slow
* architectural considerations — monorepo enables atomic refactoring; multi-repo enables independent evolution
* security considerations — multi-repo reduces blast radius of compromised CI
* maintainability considerations — monorepo has simpler dependency management; multi-repo requires version coordination

---

## Decision Tree

Repository strategy?
↓
Team > 50 engineers?
YES → Multi-repo consideration — but only with shared contracts package
NO → Independent deployment required per module?
    YES → Multi-repo — but only if modules are truly independent services
    NO → Cross-module refactoring is frequent?
        YES → Monorepo — atomic changes across modules
        NO → Single deployment (modular monolith)?
            YES → Monorepo — default for Laravel
            NO → Monorepo — default for teams under 50

---

## Rationale

Monorepo is the clear default for Laravel projects. It enables atomic cross-module refactoring, single-command CI, shared tooling, and avoids dependency version hell. Multi-repo introduces version coordination, duplicated CI configuration, and cross-repo refactoring overhead.

---

## Recommended Default

**Default:** Monorepo with modular structure
**Reason:** Laravel ecosystem is monorepo-centric. Atomic cross-module refactoring, single CI, and no version coordination overhead. Multi-repo only at significant scale (50+ engineers) or when independent deployment is required.

---

## Risks Of Wrong Choice

Multi-repo too early multiplies operational costs 5x (CI, deployment, monitoring) without proportional benefit. Monorepo without module boundaries becomes an unmanageable single-mass codebase.

---

## Related Rules

- R01: Default to Monorepo for Laravel Projects Under 50 Engineers (COS-11/05-rules.md)
- R03: Enforce Module Boundaries Even Within a Monorepo (COS-11/05-rules.md)

---

## Related Skills

- Choose Between Monorepo and Multi-Repo Organization (COS-11/06-skills.md)
- Choose Between Modular Monolith and Microservices (MMD-17/06-skills.md)

---

## Path-Based CI Filtering vs Full Test Suite Execution

---

## Decision Context

As a monorepo grows, running the full test suite on every commit becomes slow. Path-based CI filtering runs only tests relevant to changed paths, keeping CI feedback loops fast.

---

## Decision Criteria

* performance considerations — full suite can exceed 30 minutes; path filtering keeps CI under 10 minutes
* architectural considerations — path filtering requires well-defined module boundaries
* security considerations — CI filtering must not skip tests for security-critical shared code
* maintainability considerations — path filters must be maintained as module structure evolves

---

## Decision Tree

CI strategy for monorepo?
↓
Full test suite runs under 10 minutes?
YES → Full suite on every commit — no filtering needed
NO → Module boundaries are clear and enforced?
    YES → Implement path-based CI filtering
    NO → Are cross-cutting changes (shared kernel) frequent?
        YES → Run full suite for shared kernel changes; filtered for module-only changes
        NO → Implement path-based CI filtering

---

## Rationale

Path-based CI filtering ensures that a change to `modules/billing/` only runs billing tests. This keeps CI feedback loops fast as the monorepo grows. Without filtering, CI times balloon to 30+ minutes and developers wait for unrelated test suites.

---

## Recommended Default

**Default:** Implement path-based CI filtering when full suite exceeds 10 minutes
**Reason:** CI feedback velocity is critical for developer productivity. Path-based filtering ensures changes only trigger relevant tests while maintaining coverage for shared code.

---

## Risks Of Wrong Choice

No filtering leads to 30+ minute CI times, reducing deployment velocity. Overly aggressive filtering may miss cross-cutting test failures. Always run full suite for shared kernel changes.

---

## Related Rules

- R02: Use Path-Based CI Filtering in Monorepos to Keep CI Under 10 Minutes (COS-11/05-rules.md)
- R03: Enforce Module Boundaries Even Within a Monorepo (COS-11/05-rules.md)

---

## Related Skills

- Choose Between Monorepo and Multi-Repo Organization (COS-11/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)

---

## Shared Contracts Package vs Direct Code Sharing in Multi-Repo

---

## Decision Context

When splitting into multiple repositories, code must be shared across repos. Shared contracts (interfaces, DTOs) as a Composer package prevents duplication and drift. Direct code sharing (copy-paste, git submodules) leads to inconsistency.

---

## Decision Criteria

* performance considerations — shared contracts add no runtime overhead
* architectural considerations — contracts provide versioned interfaces; direct sharing creates coupling
* security considerations — shared contracts must be carefully versioned to prevent breaking security boundaries
* maintainability considerations — shared contracts require semantic versioning; direct sharing requires manual sync

---

## Decision Tree

Code sharing in multi-repo?
↓
Do multiple repos need the same interfaces or DTOs?
YES → Use versioned shared contracts package with semantic versioning
NO → Do repos need to share utility code?
    YES → Extract utility as shared package, not direct copy
    NO → Do repos share nothing (truly independent services)?
        YES → No sharing needed — repos are independent
        NO → Use shared contracts package

---

## Rationale

Without shared contracts, multi-repo setups inevitably suffer code duplication and drift. A versioned contracts package ensures all repos depend on the same interfaces while allowing independent version evolution. Semantic versioning prevents breaking changes from propagating unexpectedly.

---

## Recommended Default

**Default:** Create a shared contracts package before splitting into multi-repo
**Reason:** Without shared contracts, code duplicates and drifts across repos. A versioned contracts package is the minimum infrastructure needed for multi-repo to function without coordination overhead.

---

## Risks Of Wrong Choice

Missing shared contracts leads to duplicated interfaces across repos — fixing a bug in a shared interface requires updates in N repos. Too many shared packages create version coordination hell.

---

## Related Rules

- R04: Never Split Into Multi-Repo Without a Shared Contracts Package (COS-11/05-rules.md)
- R07: Use Semantic Versioning for Shared Packages in Multi-Repo (COS-11/05-rules.md)

---

## Related Skills

- Choose Between Monorepo and Multi-Repo Organization (COS-11/06-skills.md)
- Plan Module Extraction Path from Monolith (MMD-11/06-skills.md)
