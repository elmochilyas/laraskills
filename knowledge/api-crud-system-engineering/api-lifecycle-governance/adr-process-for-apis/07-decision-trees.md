# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Lifecycle & Governance
**Knowledge Unit:** ADR Process for APIs
**Generated:** 2026-06-03

---

# Decision Inventory

* ADR timing (before implementation vs after)
* ADR depth (single-page vs detailed)

---

# Architecture-Level Decision Trees

## ADR Timing — Before Implementation vs After

## Decision Context
When should an ADR be written relative to implementation? Arises when deciding the ADR workflow.

## Decision Criteria
* decision quality — writing before yields better rationale
* completeness — post-hoc ADRs may miss context
* time pressure — ADRs before design slow down initial development
* value — pre-decision ADRs prevent rework; post-hoc ADRs document history

## Decision Tree
Is this a significant, irreversible decision with multiple viable options?
↓
YES → Write ADR before or during design phase (decision tool)
NO → Trivial or highly reversible choice
    YES → Skip ADR or write post-implementation as historical record
    NO → Write before implementation (safe default)

## Recommended Default
**Default:** Write ADR during design phase, before implementation begins
**Reason:** ADR as decision tool prevents rework; captures rationale when fresh.

## Risks Of Wrong Choice
Post-hoc ADR: rationale forgotten, decision not reviewed, unaware of better alternatives.

## ADR Depth — Single-Page vs Detailed

## Decision Context
How much detail should an ADR contain?

## Decision Tree
Is the ADR for a complex decision with many options?
↓
YES → Detailed (up to 2 pages) with options comparison and tradeoffs table
NO → Simple decision with 2-3 clear options → Single-page ADR

## Recommended Default
**Default:** Keep to 1-2 pages
**Reason:** Longer ADRs are not read. Capture essence, not every detail.

## Risks Of Wrong Choice
Too long: nobody reads it, value lost. Too short: missing rationale, future team cannot understand.
