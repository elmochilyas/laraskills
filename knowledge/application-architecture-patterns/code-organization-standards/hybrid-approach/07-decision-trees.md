# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** Hybrid: domains inside default Laravel structure
**Generated:** 2026-06-03

---

# Decision Inventory

* Hybrid vs full domain isolation
* Consistent domain subdirectories across layers vs partial adoption
* Threshold-based domain creation vs ad-hoc domain grouping

---

# Architecture-Level Decision Trees

---

## Hybrid vs Full Domain Isolation

---

## Decision Context

The hybrid approach keeps Laravel's default top-level directories with domain subdirectories within. Full domain isolation creates separate directories with per-domain service providers and routes. The choice determines whether framework conventions remain unchanged.

---

## Decision Criteria

* performance considerations — hybrid has no additional cost; full isolation adds 50-100ms boot time with 10+ domains
* architectural considerations — hybrid is organizational; full isolation provides genuine boundaries
* security considerations — neither provides security boundaries
* maintainability considerations — hybrid requires no PSR-4 changes; full isolation requires configuration and enforcement

---

## Decision Tree

Architecture maturity?
↓
Team < 5 engineers?
YES → Stay with defaults — neither hybrid nor full isolation
NO → Team 5-15 with multiple domains?
    YES → Need contract-based boundaries or extraction readiness?
        YES → Full domain isolation
        NO → Hybrid approach
    NO → Team 15+ or formal domain ownership?
        YES → Full domain isolation
        NO → Hybrid approach

---

## Rationale

Hybrid is the recommended intermediate step between default flat structure and full domain isolation. It preserves framework convention compatibility while introducing domain grouping. Evolve to full domain isolation when domain enforcement and contract boundaries become necessary.

---

## Recommended Default

**Default:** Hybrid approach for teams of 5-15 engineers with multiple domains
**Reason:** Framework compatibility preserved (`artisan make:` works), no PSR-4 changes needed, and provides meaningful organizational structure without full isolation overhead.

---

## Risks Of Wrong Choice

Full isolation without enforcement degrades into hybrid with crossed boundaries. Hybrid without documentation becomes inconsistent — some domains grouped, others flat.

---

## Related Rules

- R01: Apply Domain Subdirectories Consistently Across All Technical Layers (COS-07/05-rules.md)
- R08: Use Hybrid as an Intermediate Step, Not a Final State (COS-07/05-rules.md)

---

## Related Skills

- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)

---

## Consistent Domain Subdirectories Across All Layers vs Partial Adoption

---

## Decision Context

Teams may apply domain grouping to some technical layers but not others — controllers get domain subdirectories, but models stay flat. This inconsistency creates confusion about file placement.

---

## Decision Criteria

* performance considerations — no performance impact
* architectural considerations — consistency creates predictability
* security considerations — no security impact
* maintainability considerations — inconsistency confuses developers; consistency enables clear placement rules

---

## Decision Tree

Apply domain subdirectories?
↓
Controllers have domain subdirectories?
YES → Models must also have matching domain subdirectories
    ↓
    Services must also have matching domain subdirectories
        YES → Consistent — apply to ALL technical layers
        NO → Inconsistent — fix before proceeding
NO → Choose: apply to all layers or none
    YES → Not ready for domain grouping — stay flat
    NO → Start with all layers simultaneously

---

## Rationale

Partial adoption creates confusion about where new files go. If Controllers have `Billing/` subdirectories but Models don't, developers don't know whether new billing models go in `app/Models/Billing/` or flat in `app/Models/`. Consistency across all layers eliminates ambiguity.

---

## Recommended Default

**Default:** Apply domain subdirectories consistently across ALL technical layers
**Reason:** Inconsistency creates confusion and unpredictability. All layers must have matching domain subdirectories for the organization to be predictable.

---

## Risks Of Wrong Choice

Partial adoption (layers with and without domain grouping) creates two inconsistent organizational systems. Developers cannot predict where new files go.

---

## Related Rules

- R01: Apply Domain Subdirectories Consistently Across All Technical Layers (COS-07/05-rules.md)
- R03: Keep Truly Shared Code Flat at the Technical Layer Root (COS-07/05-rules.md)

---

## Related Skills

- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)
- Create and Maintain File Placement Decision Trees (COS-12/06-skills.md)

---

## Threshold-Based Domain Creation vs Ad-Hoc Domain Grouping

---

## Decision Context

Teams need a rule for when to create a new domain subdirectory. Without a threshold, the decision is arbitrary — some developers create subdirectories for every entity, others never create them.

---

## Decision Criteria

* performance considerations — no performance impact
* architectural considerations — documented threshold ensures consistent application
* security considerations — no security impact
* maintainability considerations — threshold prevents premature or absent grouping

---

## Decision Tree

When to create domain subdirectory?
↓
3+ files related to a single business concept in one technical layer?
YES → Create domain subdirectory
NO → Is the concept clearly domain-specific (not cross-cutting)?
    YES → Leave file flat; create subdirectory when 3rd file arrives
    NO → Keep at root of technical layer (shared concept)

---

## Rationale

A documented threshold like "3+ files sharing a business concept → create subdirectory" ensures consistent application across the team. Without a threshold, some developers create subdirectories for every entity while others never create them.

---

## Recommended Default

**Default:** Create domain subdirectory when 3+ files relate to the same business concept in a single technical layer
**Reason:** Prevents premature grouping (1-file subdirectories) while ensuring structure exists when needed. Scalable across team members.

---

## Risks Of Wrong Choice

No threshold leads to inconsistency — some domains have subdirectories with 1-2 files, others have 20+ flat files. Too low a threshold creates unnecessary subdirectories. Too high a threshold results in unwieldy flat directories.

---

## Related Rules

- R02: Establish a Threshold for Creating Domain Subdirectories (COS-07/05-rules.md)
- R07: Use Code Review to Catch Misplaced Files (COS-07/05-rules.md)

---

## Related Skills

- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)
- Create and Maintain File Placement Decision Trees (COS-12/06-skills.md)
