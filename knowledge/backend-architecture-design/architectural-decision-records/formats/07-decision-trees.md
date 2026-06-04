# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Architectural Decision Records
**Knowledge Unit:** ADR formats (Nygard, MADR, Y-Statement)
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: ADR format selection — Nygard vs MADR vs Y-Statement
* Decision 2: When to supersede vs deprecate an ADR
* Decision 3: ADR storage location — code repo vs wiki vs dedicated tool

---

# Architecture-Level Decision Trees

---

## Decision: ADR Format Selection — Nygard vs MADR vs Y-Statement

---

## Decision Context

Choose the appropriate ADR format (Nygard, MADR, or Y-Statement) for documenting an architectural decision.

---

## Decision Criteria

* performance considerations: Y-Statement (~5 min), MADR (~30 min), Nygard (~20 min)
* architectural considerations: format should match decision complexity
* security considerations: MADR provides most structure for compliance
* maintainability considerations: format consistency across the ADR collection is more important than format choice

---

## Decision Tree

Does the decision require compliance documentation (SOC2, HIPAA, regulated industry)?
↓
YES → MADR (most structured, covers all required sections)
NO → Is this a simple, low-complexity decision with few alternatives?
    YES → Y-Statement (lightweight: "In the context of... we decided for... to achieve...")
    NO → Is this a medium-complexity decision with multiple alternatives?
        YES → Nygard (general purpose, well-balanced)
        NO → MADR for complex decisions with many tradeoffs

---

## Rationale

All three formats are valid; consistency matters more than the specific choice. MADR provides the most structure, Y-Statement the least, and Nygard sits in the middle. The team should pick one primary format and use lighter variants for less significant decisions.

---

## Recommended Default

**Default:** Nygard format as the team standard; Y-Statement as the lightweight alternative.

**Reason:** Nygard provides the right balance of structure and brevity for most decisions. It's the most widely adopted format with the most community examples.

---

## Risks Of Wrong Choice

MADR for every decision: overhead for simple choices, ADR fatigue. Y-Statement for complex decisions: insufficient detail, rationale lost over time. Mixed formats: harder to parse, inconsistent quality, automated processing difficult.

---

## Related Rules

- Rule 1: Write an ADR before or during implementation—never as a post-hoc exercise
- Rule 3: Reserve ADRs for decisions with significant, lasting impact

---

## Related Skills

- Write an Architecture Decision Record
- Run an Architecture RFC Review Process

---

## Decision: When to Supersede vs Deprecate an ADR

---

## Decision Context

When a decision changes, determine whether to mark the old ADR as superseded or deprecated.

---

## Decision Criteria

* performance considerations: supersede creates cleaner history but requires linking
* architectural considerations: supersede means the old decision is replaced; deprecate means it's no longer recommended
* security considerations: superseding security-related decisions must include explicit risk assessment
* maintainability considerations: clear status management prevents confusion about active decisions

---

## Decision Tree

Is the old decision completely replaced by a new one?
↓
YES → Does the old decision still apply in any bounded context or environment?
    YES → Deprecate (still valid in some contexts, not recommended for new work)
    NO → Supersede (old decision is fully replaced, link to new ADR)
NO → Is the old decision still valid but no longer recommended for new work?
    YES → Deprecate (current implementations may stay; no new adoption)
    NO → Is the old decision incorrect or harmful?
        YES → Supersede with explicit correction reasoning
        NO → Keep as active (decision still applies)

---

## Rationale

Supersede means "this is no longer the current decision." Deprecate means "this decision still applies in some contexts but shouldn't be used for new work." Using the correct status prevents confusion while maintaining accurate historical context.

---

## Recommended Default

**Default:** Supersede when the decision is fully replaced; deprecate when it's still partially applicable.

**Reason:** Supersede provides the clearest signal to readers. Deprecate is useful when the old decision remains valid in specific contexts (legacy modules, different bounded contexts).

---

## Risks Of Wrong Choice

Supersede when deprecate is appropriate: developers think old decision is entirely invalid, don't realize it's still in effect for legacy modules. Deprecate when supersede is appropriate: developers unsure whether the old decision is current or not.

---

## Related Rules

- Rule 2: Clearly supersede old ADRs when a decision changes

---

## Related Skills

- Write an Architecture Decision Record
- Run an Architecture RFC Review Process

---

## Decision: ADR Storage Location — Code Repo vs Wiki vs Dedicated Tool

---

## Decision Context

Choose where to store ADRs to maximize discoverability and maintainability.

---

## Decision Criteria

* performance considerations: code repo ADRs are visible during development
* architectural considerations: ADRs should be where developers work daily
* security considerations: wiki may have better access controls; code repo is transparent
* maintainability considerations: code repo ADRs get reviewed in PRs; wiki ADRs get stale

---

## Decision Tree

Will developers need to reference ADRs while writing code?
↓
YES → Code repository (`docs/adr/`) — most accessible during development, PR-reviewed
NO → Do multiple teams need to access ADRs without accessing the code repo?
    YES → Is text-based version control needed (diff, history, authorship)?
        YES → Dedicated ADR tool (e.g., log4brains) with git backend
        NO → Wiki (easy editing, less structure)
    NO → Code repository (simplest, co-located with code)

---

## Rationale

ADRs stored in the code repository are co-located with the code they govern, reviewed in PRs, and versioned alongside implementation changes. This is the strongest recommendation from ADR practitioners. Wikis and dedicated tools are secondary options.

---

## Recommended Default

**Default:** Store ADRs in `docs/adr/` in the code repository using Markdown files.

**Reason:** Co-location with code ensures ADRs are visible during development, reviewed in PRs, and versioned. This prevents the common failure of ADRs stored in external systems being invisible during coding.

---

## Risks Of Wrong Choice

Wiki storage: ADRs hidden from developers during coding, not reviewed in PRs, prone to becoming stale. Dedicated tool: added infrastructure, potential access friction, reduces visibility.

---

## Related Rules

- Rule 4: Store ADRs in the same repository as the code they govern

---

## Related Skills

- Write an Architecture Decision Record
- Model Architecture with C4 Diagrams
