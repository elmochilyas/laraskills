# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** When to deviate from defaults: decision criteria
**Generated:** 2026-06-03

---

# Decision Inventory

* Deviate from defaults vs stay with defaults
* Pre-emptive architecture vs pain-first architecture evolution
* Documented enforcement vs cultural conventions

---

# Architecture-Level Decision Trees

---

## Deviate from Defaults vs Stay with Defaults

---

## Decision Context

The decision to deviate from Laravel's default structure is one of the most consequential in a project's lifecycle. Community consensus is clear: start with defaults, deviate only when measurable pain emerges.

---

## Decision Criteria

* performance considerations — most deviations don't affect performance; per-domain providers add boot time
* architectural considerations — deviations address specific friction but add setup and ongoing costs
* security considerations — deviations can hide security-sensitive code if undocumented
* maintainability considerations — deviations require documentation, enforcement, and developer training

---

## Decision Tree

Consider deviation from defaults?
↓
Can you name specific, measurable friction caused by defaults?
NO → Stay with defaults — no deviation without demonstrated pain
YES → Does the proposed deviation directly address that friction?
    NO → Find another solution — the deviation won't help
    YES → Does the benefit exceed setup + ongoing costs?
        NO → Stay with defaults — costs exceed benefits
        YES → Is there a less invasive option available?
            YES → Use the less invasive option first — hybrid before full domain
            NO → Plan incremental migration with enforcement

---

## Rationale

Deviations create setup costs (restructuring, PSR-4 config, tooling) and ongoing costs (training, framework mismatch, package compatibility). They are justified only when benefits exceed both costs over the project's expected lifetime.

---

## Recommended Default

**Default:** Stay with Laravel's defaults
**Reason:** Defaults are optimized for productivity. You cannot know which deviations are needed until you experience the friction. The six-month rule: wait before making significant structural changes.

---

## Risks Of Wrong Choice

Pre-emptive deviation wastes effort on structures for problems that may never exist. Deviation without enforcement degrades within months. Half-migration (some code in new structure, some in old) is the worst outcome.

---

## Related Rules

- R01: Start with Defaults — Never Deviate Without Measured Pain (COS-09/05-rules.md)
- R02: Document Every Deviation with an Architecture Decision Record (COS-09/05-rules.md)

---

## Related Skills

- Evaluate When to Deviate from Laravel Defaults (COS-09/06-skills.md)
- Document Architecture Decisions with ADRs (AEG-06/06-skills.md)

---

## Pre-emptive Architecture vs Pain-First Architecture Evolution

---

## Decision Context

Teams can build architectural structure in advance (pre-emptive) or wait until specific pain emerges (pain-first). The choice affects how well the architecture matches actual needs.

---

## Decision Criteria

* performance considerations — pre-emptive abstractions may later prove wrong, requiring refactoring
* architectural considerations — pain-first evolves naturally; pre-emptive anticipates unknown needs
* security considerations — pre-emptive architecture may miss security concerns that only emerge from real usage
* maintainability considerations — pre-emptive abstractions often don't match actual usage patterns

---

## Decision Tree

Architecture approach?
↓
Can you articulate specific current pain that defaults cause?
YES → Pain-first — address the known problem with targeted deviation
NO → Can you confidently predict domain boundaries that will be needed?
    YES → Pre-emptive may be acceptable — document the assumptions
    NO → Is the project less than 6 months old?
        YES → Apply Six-Month Rule — wait for patterns to emerge
        NO → Apply Pain-First — wait for specific friction

---

## Rationale

Pre-emptive architecture builds solutions for problems that may not exist. The six-month rule: for new projects, wait at least six months before making significant structural deviations. Domain boundaries, team structure, and architectural needs reveal themselves organically.

---

## Recommended Default

**Default:** Pain-first architecture evolution
**Reason:** You cannot know which deviations are needed until you experience the friction. Pre-emptive architecture builds wrong abstractions for problems that may never materialize.

---

## Risks Of Wrong Choice

Pre-emptive architecture wastes 40%+ of initial sprint time on unused structure. Pain-first without any planning can lead to architectural debt. The balance: start with defaults, evolve with demonstrated need.

---

## Related Rules

- R03: Apply the Six-Month Rule for New Projects (COS-09/05-rules.md)
- R04: Deviate One Level at a Time — No Leapfrogging (COS-09/05-rules.md)

---

## Related Skills

- Evaluate When to Deviate from Laravel Defaults (COS-09/06-skills.md)
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)

---

## Documented Enforcement vs Cultural Conventions

---

## Decision Context

Architectural rules can be enforced through automated checks (architecture tests, static analysis) or cultural conventions (code review, team norms). The choice affects reliability and scalability.

---

## Decision Criteria

* performance considerations — architecture tests add CI time but prevent costly structural degradation
* architectural considerations — automated enforcement is reliable; cultural conventions degrade under pressure
* security considerations — security-critical rules must always have automated enforcement
* maintainability considerations — automated enforcement catches violations before merge; cultural conventions rely on reviewer vigilance

---

## Decision Tree

Enforcement strategy?
↓
Team size > 5 engineers?
YES → Use automated enforcement (architecture tests, static analysis)
NO → Can the convention cause production issues if violated?
    YES → Use automated enforcement regardless of team size
    NO → Can the convention be verified in code review (< 1 min)?
        YES → Cultural convention may suffice — document and review
        NO → Use automated enforcement

---

## Rationale

Automated enforcement is the only reliable way to maintain architectural boundaries over time. Cultural conventions work for small teams but degrade under pressure — the "just this once" exception becomes the norm. Architecture tests in CI prevent violations before they reach production.

---

## Recommended Default

**Default:** Use architecture tests (Pest/PHPMD) for automated enforcement
**Reason:** Cultural conventions degrade under time pressure. Automated enforcement in CI catches violations before merge and requires zero reviewer effort. Architecture tests are the lowest-cost enforcement mechanism.

---

## Risks Of Wrong Choice

Cultural conventions without enforcement lead to progressive architectural degradation. Automated tests without team buy-in may be removed during "CI speed optimization." Balance both: automated enforcement plus documented conventions.

---

## Related Rules

- R05: Never Deviate Without Automated Enforcement (COS-09/05-rules.md)
- R06: Evaluate Deviations Against Five Questions (COS-09/05-rules.md)

---

## Related Skills

- Evaluate When to Deviate from Laravel Defaults (COS-09/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
