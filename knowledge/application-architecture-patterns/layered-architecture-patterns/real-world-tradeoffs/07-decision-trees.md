# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Real-world tradeoffs: when Clean Architecture pays off
**Generated:** 2026-06-03

---

# Decision Inventory

* Clean Architecture vs Service Layer vs Default MVC for a new project
* Incremental adoption: pilot on one feature vs full codebase
* Quantified cost-benefit calculation for architectural decisions

---

# Architecture-Level Decision Trees

---

## Clean Architecture vs Service Layer vs Default MVC for a New Project

---

## Decision Context

Three architectural approaches for new Laravel projects: Default MVC (framework conventions), Service Layer (controllers → services → models), and Clean Architecture (Domain, Application, Infrastructure, Presentation). Each has different cost structures and payoffs.

---

## Decision Criteria

* performance considerations — Clean Architecture adds 2-4x files; Service Layer adds 1.5x; MVC is leanest
* architectural considerations — Clean Architecture provides framework independence; Service Layer provides testability; MVC is fastest
* security considerations — all three can be secure; Clean Architecture has cleaner security boundaries
* maintainability considerations — Clean Architecture has highest initial cost but lowest long-term risk

---

## Decision Tree

Architecture for new project?
↓
Project is simple CRUD with minimal business logic?
YES → Default MVC — no architectural overhead justified
NO → Project has complex business rules (fintech, healthcare, compliance)?
    YES → Clean Architecture — business logic is primary asset
    NO → Project has multiple delivery mechanisms (HTTP + CLI + Queue)?
        YES → Clean Architecture — share domain across mechanisms
        NO → Standard web application with moderate complexity?
            YES → Service Layer — best cost-benefit for most Laravel apps
            NO → Service Layer

---

## Rationale

The "Architecture Tax" for Clean Architecture is 2-4x more files and 1.5-3x initial development time. This tax is worth paying only when business logic is the primary asset or when framework independence is required. For most Laravel applications, the Service Layer provides an optimal balance.

---

## Recommended Default

**Default:** Service Layer (Controller → Service → Model) for most new Laravel projects
**Reason:** Service Layer provides testability and separation without the full overhead of Clean Architecture. It's the sweet spot for most applications. Default MVC is sufficient for simple CRUD.

---

## Risks Of Wrong Choice

Clean Architecture for simple CRUD wastes development time. Default MVC for complex domains creates untestable, fat controllers. Service Layer not being enough for fintech/healthcare domains.

---

## Related Rules

- Rule: Start with Service Layer and Evolve (LAP-14/05-rules.md)
- Rule: Start with Defaults — Never Deviate Without Measured Pain (COS-09/05-rules.md)

---

## Related Skills

- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Implement Three-Layer Architecture (LAP-01/06-skills.md)

---

## Incremental Adoption: Pilot on One Feature vs Full Codebase

---

## Decision Context

When adopting Clean Architecture, the scope can be feature-by-feature pilot or full codebase restructuring. The choice affects risk, learning curve, and disruption.

---

## Decision Criteria

* performance considerations — pilot has lower immediate overhead
* architectural considerations — pilot proves value; full commitment has highest risk
* security considerations — pilot allows focused security review
* maintainability considerations — pilot creates temporary architectural inconsistency

---

## Decision Tree

Adoption scope?
↓
Can you identify one complex feature suitable as pilot?
YES → Pilot on one feature — prove value before committing
NO → Is the team experienced with Clean Architecture?
    YES → Broader adoption possible — but still incremental
    NO → Must pilot — Clean Architecture requires significant learning curve

---

## Rationale

A pilot feature demonstrates the value of Clean Architecture (faster tests, cleaner separation, framework independence) before committing to codebase-wide adoption. The learning curve is significant — a pilot allows the team to learn without disrupting the entire codebase.

---

## Recommended Default

**Default:** Pilot on one complex feature before codebase-wide adoption
**Reason:** Clean Architecture has a significant learning curve and development overhead. A pilot proves value, identifies friction points, and builds team expertise before broader adoption. Team buy-in depends on seeing concrete benefits.

---

## Risks Of Wrong Choice

Codebase-wide adoption without pilot risks months of overhead without proven benefit. Pilot without follow-through leaves the architecture inconsistent — some features in Clean Architecture, others not.

---

## Related Rules

- Rule: Pilot Before Committing Codebase-Wide (LAP-14/05-rules.md)
- Rule: Quantify Costs Before Deciding (LAP-14/05-rules.md)

---

## Related Skills

- Migrate Incrementally from MVC to Layered Architecture (LAP-12/06-skills.md)
- Evaluate When to Deviate from Laravel Defaults (COS-09/06-skills.md)

---

## Quantified Cost-Benefit Calculation for Architectural Decisions

---

## Decision Context

Architectural decisions should be quantified, not based on fashion. Clean Architecture's costs (file count, development time, onboarding) and benefits (test speed, framework independence) should be measured against project-specific factors.

---

## Decision Criteria

* performance considerations — cost: 2-4x files, 1.5-3x dev time; benefit: tests in ms vs seconds
* architectural considerations — benefit: framework migration possible; cost: team expertise required
* security considerations — no quantified difference
* maintainability considerations — quantify: onboarding days, PR cycle time, bug rate

---

## Decision Tree

Architecture cost-benefit?
↓
Project expected lifespan > 5 years?
YES → Full Clean Architecture costs may be justified — long amortization period
NO → Development team > 10 engineers?
    YES → Clean Architecture costs shared across larger team — lower per-engineer impact
    NO → Do you need to test business logic without Laravel bootstrap?
        YES → Clean Architecture benefit realized in test speed
        NO → Cost of Clean Architecture likely exceeds benefit

---

## Rationale

Clean Architecture's costs are front-loaded (setup, learning curve) while benefits accrue over time. The payback period depends on project lifespan, team size, and the value of framework independence. For projects under 3 years or teams under 5, the costs rarely justify the benefits.

---

## Recommended Default

**Default:** Only adopt Clean Architecture when quantified analysis shows benefit > cost
**Reason:** Clean Architecture imposes a measurable tax on every change. This tax is worth paying only for complex, long-lived, or multi-delivery-mechanism projects. Quantify the specific benefits (test speed, framework independence) against the costs (file count, development time) before deciding.

---

## Risks Of Wrong Choice

Adopting without quantification leads to architectural fashion-following. Rejecting without analysis may miss legitimate benefits for complex domains.

---

## Related Rules

- Rule: Quantify Costs Before Deciding (LAP-14/05-rules.md)
- Rule: Document Architectural Choice in ADR (LAP-14/05-rules.md)

---

## Related Skills

- Evaluate When to Deviate from Laravel Defaults (COS-09/06-skills.md)
- Document Architecture Decisions with ADRs (AEG-06/06-skills.md)
