# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Ubiquitous Language Mapping
**Generated:** 2026-06-03

---

# Decision Inventory

* Terminology alignment (code vs domain)
* Rename vs alias strategy
* Glossary maintenance approach

---

# Architecture-Level Decision Trees

---

## Terminology Alignment

---

## Decision Context

Deciding whether existing code artifacts should be renamed to match domain terminology.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the code artifact name differ from the domain term used by stakeholders?
↓
YES → Is the current name actively causing confusion?
    YES → Rename the code artifact to match domain language
    NO → Is a migration plan feasible (no breaking external contracts)?
        YES → Rename with deprecation path
        NO → Document the mapping without renaming
NO → Code and domain language already match — no action needed

---

## Rationale

Ubiquitous language requires code and domain experts to use the same terms. Misaligned names cause confusion in conversations, requirements gathering, and code readability.

---

## Recommended Default

**Default:** Rename to match domain language
**Reason:** Clear communication between developers and domain experts is worth the refactoring effort.

---

## Risks Of Wrong Choice

Not aligning creates persistent confusion and translation overhead. Renaming without a deprecation strategy can break external integrations and API contracts.

---

## Related Rules

* Name code artifacts after domain terms
* Rename mismatched artifacts where feasible

---

## Related Skills

* Map Domain Terminology to Code Artifacts

---

## Rename vs Alias Strategy

---

## Decision Context

Choosing between renaming an artifact directly and adding an alias/comment while keeping the old name.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the artifact part of a public API (consumed by external systems)?
↓
YES → Add alias/deprecation — don't break external consumers
NO → Can the rename be done in a single commit with all references updated?
    YES → Direct rename — clean, no legacy baggage
    NO → Phased rename — alias old name, migrate consumers, remove alias

---

## Rationale

Public API changes require deprecation cycles. Internal renames can be done immediately if all references can be updated atomically.

---

## Recommended Default

**Default:** Direct rename for internal artifacts; deprecation path for public APIs
**Reason:** Cleaner codebase faster, without breaking external consumers.

---

## Risks Of Wrong Choice

Direct rename of public APIs breaks external integrations without warning. Avoiding renames of internal artifacts perpetuates confusion unnecessarily.

---

## Related Rules

* Add domain aliases where renaming is too disruptive

---

## Related Skills

* Map Domain Terminology to Code Artifacts

---

## Glossary Maintenance Approach

---

## Decision Context

Deciding how to maintain the domain glossary and keep it current.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Is the glossary living documentation (updated as the domain evolves)?
↓
YES → Is the glossary in the project repository (version-controlled)?
    YES → Correct — glossary evolves with the codebase
    NO → Move to repository — should be part of the codebase
NO → Glossary is outdated if not maintained — establish a review cadence
    YES → Add glossary and designate a maintainer
    NO → Without a glossary, ubiquitous language alignment is harder

---

## Rationale

A version-controlled glossary that evolves with the codebase ensures domain terms are consistently documented and accessible to all team members.

---

## Recommended Default

**Default:** Project repository glossary (`docs/glossary.md`) reviewed with domain experts
**Reason:** Version-controlled, accessible, and aligned with code changes.

---

## Risks Of Wrong Choice

An outdated glossary is worse than no glossary (it actively misleads). No glossary means domain terms are documented only in people's heads.

---

## Related Rules

* Document the domain-code mapping
* Review terminology with domain experts

---

## Related Skills

* Map Domain Terminology to Code Artifacts
