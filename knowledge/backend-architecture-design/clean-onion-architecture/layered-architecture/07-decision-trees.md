# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Clean / Onion / Hexagonal Architecture
**Knowledge Unit:** Layered architecture comparative analysis
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Layered vs Vertical Slice vs Hexagonal architecture selection
* Decision 2: Layer enforcement approach — manual review vs automation
* Decision 3: When to evolve from Layered to Hexagonal/Clean Architecture

---

# Architecture-Level Decision Trees

---

## Decision: Layered vs Vertical Slice vs Hexagonal Architecture Selection

---

## Decision Context

Choose the primary architectural style for a Laravel application, balancing team maturity, business complexity, and long-term maintainability.

---

## Decision Criteria

* performance considerations: Hexagonal has highest indirection; Layered lowest overhead
* architectural considerations: Hexagonal has strongest boundary enforcement; Layered needs discipline
* security considerations: all styles isolate security at boundaries when properly implemented
* maintainability considerations: Layered is simplest to start; Hexagonal provides best long-term isolation

---

## Decision Tree

Is the application a simple CRUD system with minimal business logic?
↓
YES → Layered Architecture (simplest, lowest overhead, aligned with Laravel conventions)
NO → Does the application have complex business rules requiring framework-independent testing?
    YES → Is the team experienced with DIP and dependency injection?
        YES → Is the application expected to outlive the current framework?
            YES → Hexagonal or Clean Architecture (strongest isolation)
            NO → Hexagonal or Clean Architecture (testability alone justifies it)
        NO → Layered Architecture (less cognitive load; evolve later)
    NO → Are features developed by independent teams with different velocity?
        YES → Vertical Slice Architecture (feature autonomy, controlled duplication)
        NO → Are features likely to be extracted as microservices later?
            YES → Vertical Slice Architecture (natural extraction boundaries)
            NO → Layered Architecture (default, lowest risk)

---

## Rationale

Layered architecture is the safest default for most Laravel applications. Vertical Slices suit feature-team organizations. Hexagonal/Clean is reserved for complex domains where framework independence is critical. Evolve from simpler to more complex as the application demands it.

---

## Recommended Default

**Default:** Layered Architecture for most Laravel applications; evolve to Vertical Slices or Hexagonal as complexity grows.

**Reason:** Layered architecture aligns with Laravel conventions, has the lowest learning curve, and provides sufficient structure for the majority of applications.

---

## Risks Of Wrong Choice

Hexagonal for simple CRUD: YAGNI violation, slow development, team frustration. Layered for complex domain: framework coupling, untestable domain logic, difficult to evolve. Vertical Slices without feature teams: unnecessary duplication, coordination overhead.

---

## Related Rules

- Rule 1: Enforce strict layer dependency direction
- Rule 2: Isolate the Domain layer — zero framework or infrastructure imports

---

## Related Skills

- Implement a Layered Architecture
- Design a Hexagonal Architecture
- Implement Vertical Slice Architecture

---

## Decision: Layer Enforcement Approach — Manual Review vs Automation

---

## Decision Context

Choose how to ensure layer boundaries are respected in the codebase.

---

## Decision Criteria

* performance considerations: automation adds CI time but reduces reviewer cognitive load
* architectural considerations: manual enforcement degrades with team growth
* security considerations: layer violations can introduce security vulnerabilities
* maintainability considerations: automation catches violations before merge; manual catches violations too late

---

## Decision Tree

Is the team size 1-3 developers with strong architecture discipline?
↓
YES → Manual code review (low overhead, sufficient for small teams)
NO → Is the team growing (hiring, contractors)?
    YES → Is there CI pipeline capacity for static analysis?
        YES → Automated enforcement (PHPStan rules, Deptrac in CI)
        NO → Start with pre-commit hooks, graduate to CI
    NO → Does the team have a history of layer violations?
        YES → Automated enforcement (manual review has failed)
        NO → Automated enforcement (preventive, not reactive)

---

## Rationale

Manual enforcement degrades over time regardless of team quality. Automation encodes architectural rules as executable tests that run on every change. The investment in PHPStan custom rules or Deptrac configuration pays back quickly by preventing layer violations at merge time.

---

## Recommended Default

**Default:** Automated enforcement via PHPStan custom rules + Deptrac in CI pipeline.

**Reason:** Manual review discipline inevitably degrades. Automation provides consistent enforcement at low marginal cost per violation caught.

---

## Risks Of Wrong Choice

Manual enforcement only: violations creep in, codebase degrades, refactoring costs compound. No enforcement at all: guaranteed architectural decay.

---

## Related Rules

- Rule 1: Enforce strict layer dependency direction
- Rule 2: Isolate the Domain layer — zero framework or infrastructure imports

---

## Related Skills

- Implement a Layered Architecture
- Implement Architecture Fitness Functions

---

## Decision: When to Evolve from Layered to Hexagonal/Clean Architecture

---

## Decision Context

Determine the right time to transition from Layered Architecture to a stricter architectural style.

---

## Decision Criteria

* performance considerations: transition adds short-term slowdown; long-term improvement
* architectural considerations: the need for stronger isolation drives the transition
* security considerations: stricter boundaries improve security isolation
* maintainability considerations: transition when coupling pain exceeds transition cost

---

## Decision Tree

Does the team frequently encounter issues where framework changes break domain logic?
↓
YES → Transition to Hexagonal/Clean (framework coupling is causing real pain)
NO → Is the team spending significant time on slow integration tests for domain logic?
    YES → Is domain logic testable without Laravel bootstrapping?
        NO → Transition to Hexagonal/Clean (enables fast unit tests)
        YES → Continue with current approach
    NO → Is the application expected to outlive the current Laravel major version?
        YES → Plan transition (framework independence will pay off)
        NO → Does the team want to adopt Domain-Driven Design?
            YES → Transition to Hexagonal/Clean (DDD-friendly architecture)
            NO → Continue with Layered

---

## Rationale

The transition from Layered to Hexagonal/Clean should be driven by concrete pain points: framework coupling hurting upgrades, slow tests, or domain complexity outpacing the architecture's ability to isolate it. Premature transitions add ceremony without benefit.

---

## Recommended Default

**Default:** Stay with Layered Architecture until framework coupling or test speed becomes a measurable pain point.

**Reason:** Layered Architecture is sufficient for most Laravel applications. The ceremony of Hexagonal/Clean only pays off when the application's complexity justifies the investment.

---

## Risks Of Wrong Choice

Transition too early: YAGNI violation, wasted effort, team frustration with ceremony. Stay too long: framework lock-in, expensive upgrades, untestable domain logic.

---

## Related Rules

- Rule 1: Enforce strict layer dependency direction
- Rule 2: Isolate the Domain layer — zero framework or infrastructure imports

---

## Related Skills

- Implement a Layered Architecture
- Design a Hexagonal Architecture
- Apply the Dependency Inversion Principle
