# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** Organizing by layer: app/Http, app/Models, app/Services
**Generated:** 2026-06-03

---

# Decision Inventory

* Layer-based vs feature-based organization
* Service class vs Action class for business logic
* Add catch-all directory vs name by specific concern

---

# Architecture-Level Decision Trees

---

## Layer-Based vs Feature-Based Organization

---

## Decision Context

Layer-based organization groups code by technical role (controllers in one folder, models in another). Feature-based organization groups by business capability (all checkout code in one folder). The choice determines the primary organizational axis of the codebase.

---

## Decision Criteria

* performance considerations — no direct performance impact; many small feature providers add boot overhead
* architectural considerations — layer organization is framework-aligned; feature organization enables team ownership
* security considerations — neither provides security boundaries
* maintainability considerations — layer organization scatters domain concepts; feature organization duplicates structural boilerplate

---

## Decision Tree

Primary organizational axis?
↓
Team < 5 engineers or simple CRUD?
YES → Layer-based organization
NO → Multiple distinct business capabilities (5+)?
    YES → Team ownership maps to features?
        YES → Feature-based organization
        NO → Layer-based with domain subdirectories (hybrid)
    NO → Layer-based organization

---

## Rationale

Layer-based is the default for a reason — it maps to how Laravel developers think and all framework conventions work unchanged. Feature-based is justified when team ownership aligns with features and the application has 5+ distinct capabilities.

---

## Recommended Default

**Default:** Layer-based organization
**Reason:** Framework conventions work unchanged, all Laravel developers recognize the structure, and it's the simplest starting point. Evolve toward feature-based only when specific pain emerges.

---

## Risks Of Wrong Choice

Layer-based at scale scatters domain concepts across 6+ folders — understanding "ordering" requires browsing multiple directories. Feature-based prematurely duplicates boilerplate across features without proven benefit.

---

## Related Rules

- R01: Keep Controllers Free of Business Logic Beyond HTTP Orchestration (COS-02/05-rules.md)
- R07: Use Sub-Layer Grouping Within Large Layer Directories (COS-02/05-rules.md)

---

## Related Skills

- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)
- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)

---

## Service Class vs Action Class for Business Logic

---

## Decision Context

Both Service and Action classes extract business logic from controllers. Services orchestrate multiple related operations for a domain entity. Actions execute a single discrete business operation. Choosing between them affects code organization, testability, and reuse.

---

## Decision Criteria

* performance considerations — no measurable difference between service and action dispatch
* architectural considerations — services group related operations; actions isolate single operations
* security considerations — no security impact
* maintainability considerations — actions prevent god services; services prevent action proliferation

---

## Decision Tree

Business operation characteristics?
↓
Operation orchestrates multiple steps (validate, calculate, persist, notify)?
YES → Use Service class
NO → Operation is a single discrete business rule?
    YES → Use Action class
    NO → Operation is query/fetch logic?
        YES → Use Query Object
        NO → Use Service class

---

## Rationale

Services handle orchestration — coordinating multiple operations, managing transactions, calling dependencies. Actions handle single business operations — one thing, one reason to change. Using actions within services is a common and effective pattern.

---

## Recommended Default

**Default:** Use Service classes for orchestration; use Action classes for single operations
**Reason:** Services are the natural first step. Actions emerge naturally when a service grows large or when a single operation needs standalone reuse.

---

## Risks Of Wrong Choice

Using services for everything creates god service classes. Using actions for everything creates scattered, hard-to-find classes. Find the balance: services for entity-oriented orchestration, actions for capability-oriented operations.

---

## Related Rules

- R05: Split Services When They Handle Multiple Unrelated Operations (COS-02/05-rules.md)
- R01: Use Verb-Noun Pattern for Action Classes (COS-08/05-rules.md)

---

## Related Skills

- Design a Service Class (SLP-01/06-skills.md)
- Create Action Classes for Business Operations (SLP-02/06-skills.md)

---

## Add Catch-All Directory vs Name by Specific Concern

---

## Decision Context

When developers don't know where to place a file, the temptation is to create catch-all directories like `app/Helpers/`, `app/Utilities/`, or `app/Common/`. These become dumping grounds with unrelated code that no team owns.

---

## Decision Criteria

* performance considerations — no performance impact
* architectural considerations — catch-all directories lack clear ownership criteria
* security considerations — no security impact
* maintainability considerations — catch-all directories degrade into unmaintained dumping grounds

---

## Decision Tree

New file doesn't fit existing directories?
↓
Is the code genuinely cross-cutting (usable by multiple domains)?
YES → Name by specific function: app/Support/, app/Audit/, app/Logging/
NO → Does it belong to an existing domain?
    YES → Place within that domain directory
    NO → Is it a single operation without clear home?
        YES → Create Action class in domain-adjacent location
        NO → Discuss with team — do not create catch-all

---

## Rationale

Catch-all directories lack clear ownership criteria. Any file that doesn't fit elsewhere ends up there, creating dumping grounds with unrelated code that no team maintains. Name directories by specific concern instead.

---

## Recommended Default

**Default:** Never create `app/Helpers/`, `app/Utilities/`, or `app/Common/` directories
**Reason:** These become dumping grounds. Name directories by specific concern or place code in existing domain directories.

---

## Risks Of Wrong Choice

Catch-all directories accumulate unrelated code that no team owns. Over time, the directory becomes a "black hole" where files go to be forgotten — duplicated logic, dead code, and abandoned utilities.

---

## Related Rules

- R03: Avoid Catch-All Directories Like `app/Helpers/` or `app/Common/` (COS-02/05-rules.md)
- R01: Apply Domain Subdirectories Consistently Across All Technical Layers (COS-07/05-rules.md)

---

## Related Skills

- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)
