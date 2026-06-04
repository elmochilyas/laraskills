# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** File placement decision trees and team conventions
**Generated:** 2026-06-03

---

# Decision Inventory

* Domain-first vs layer-first organizational axis
* Complex decision tree vs simplified directory structure
* Automated enforcement via static analysis vs code review verification

---

# Architecture-Level Decision Trees

---

## Domain-First vs Layer-First Organizational Axis

---

## Decision Context

The primary organizational axis determines whether the first subdirectory in a file path is the domain name or the technical layer. Domain-first groups by business concept then layer (`app/Domains/Billing/Controllers/`). Layer-first groups by technical role then domain (`app/Http/Controllers/Billing/`).

---

## Decision Criteria

* performance considerations — no performance impact from axis choice
* architectural considerations — domain-first enables team ownership; layer-first preserves framework conventions
* security considerations — no security impact
* maintainability considerations — domain-first makes cross-cutting harder; layer-first scatters domain concepts

---

## Decision Tree

Primary organizational axis?
↓
Team ownership maps to domains (each team owns a domain)?
YES → Domain-first — domain is the top-level grouping
NO → Framework convention compatibility is critical?
    YES → Layer-first — technical layers as top-level grouping
    NO → Is the application primarily a UI with many cross-domain views?
        YES → Layer-first — views need quick access across domains
        NO → Domain-first — business concepts drive organization

---

## Rationale

The primary axis determines how developers navigate the codebase. Domain-first makes the answer to "where does billing code go?" immediate — `app/Domains/Billing/`. Layer-first makes "where are all controllers?" immediate — `app/Http/Controllers/`. The choice depends on what developers need to find first.

---

## Recommended Default

**Default:** Domain-first for most custom structures; layer-first for projects staying close to defaults
**Reason:** Domain-first aligns with team ownership and DDD practices. Layer-first preserves framework convention compatibility and is the natural starting point.

---

## Risks Of Wrong Choice

Wrong axis causes navigation friction — developers must remember two groupings instead of one. Domain-first with cross-cutting views makes view development harder. Layer-first at scale scatters domain concepts across 6+ folders.

---

## Related Rules

- R01: Apply the Three-Question Rule for Every New File (COS-12/05-rules.md)
- R02: Keep Decision Trees Under 5 Branches Maximum (COS-12/05-rules.md)

---

## Related Skills

- Create and Maintain File Placement Decision Trees (COS-12/06-skills.md)
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)

---

## Complex Decision Tree vs Simplified Directory Structure

---

## Decision Context

When file placement requires a complex decision tree (10+ branches), the directory structure itself may be too complex. A simplified structure reduces the need for documentation and eliminates placement uncertainty.

---

## Decision Criteria

* performance considerations — no performance impact
* architectural considerations — simple structures are self-documenting; complex structures require documentation
* security considerations — simple structures make security-sensitive code easier to find
* maintainability considerations — maintaining a complex decision tree is harder than simplifying the structure

---

## Decision Tree

Decision tree complexity?
↓
Decision tree has more than 5 top-level branches?
YES → Simplify the directory structure — the tree is too complex
NO → Do developers frequently ask "where does this go?"
    YES → Add branches for common cases — but stay under 5
    NO → Does the tree need a flowchart to be comprehensible?
        YES → Simplify the structure — flowcharts are a red flag
        NO → Tree is appropriately sized

---

## Rationale

A decision tree with 20+ branches is not useful — developers won't read it. They'll guess. If placement requires a flowchart, the directory structure is wrong. Simplify the structure so placement is obvious without a decision tree.

---

## Recommended Default

**Default:** Keep decision trees under 5 top-level branches; simplify the directory structure if the tree is larger
**Reason:** Complex trees indicate complex structures. Developers don't read long decision trees — they guess. Simple structures make placement obvious without documentation.

---

## Risks Of Wrong Choice

Complex trees are ignored — developers guess instead of reading. Overly simplistic trees don't cover edge cases, leading to inconsistent placement for non-standard file types.

---

## Related Rules

- R02: Keep Decision Trees Under 5 Branches Maximum (COS-12/05-rules.md)
- R04: Let Patterns Emerge Before Codifying the Decision Tree (COS-12/05-rules.md)

---

## Related Skills

- Create and Maintain File Placement Decision Trees (COS-12/06-skills.md)
- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)

---

## Automated Enforcement via Static Analysis vs Code Review Verification

---

## Decision Context

File placement rules can be enforced automatically (static analysis, architecture tests) or manually (code review checklist). The choice affects reliability and reviewer workload.

---

## Decision Criteria

* performance considerations — static analysis adds CI time but catches issues before review
* architectural considerations — automated enforcement is consistent; manual review depends on reviewer vigilance
* security considerations — placement enforcement doesn't directly affect security
* maintainability considerations — automated enforcement scales; manual review doesn't

---

## Decision Tree

Enforcement approach?
↓
Team > 5 engineers?
YES → Use static analysis / architecture tests for automated enforcement
NO → Can placement violations cause runtime errors?
    YES → Use automated enforcement regardless of team size
    NO → Cost of implementing automated check < cost of manual reviews?
        YES → Implement automated enforcement
        NO → Use code review checklist — but document it

---

## Rationale

Automated enforcement via architecture tests (Pest/PHPMD) is the only reliable way to maintain placement consistency over time. Code review alone degrades under pressure — reviewers miss violations during complex reviews. Automated checks catch violations before they reach production.

---

## Recommended Default

**Default:** Use architecture tests (Pest) for automated file placement enforcement
**Reason:** Automated enforcement catches violations before merge, requires zero reviewer effort, and is consistent across all PRs. It's the lowest-cost enforcement mechanism for teams of 5+.

---

## Risks Of Wrong Choice

Manual enforcement alone degrades under time pressure — reviewers miss violations. Overly strict automated enforcement may reject legitimate exceptions. Balance: automated enforcement with documented override process.

---

## Related Rules

- R06: Enforce Placement Rules via Code Review and Static Analysis (COS-12/05-rules.md)
- R07: Target 90%+ of Files Following the Standard Tree Without Discussion (COS-12/05-rules.md)

---

## Related Skills

- Create and Maintain File Placement Decision Trees (COS-12/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
