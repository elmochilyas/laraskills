# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture
**Knowledge Unit:** Directory Conventions
**Generated:** 2026-06-03

---

# Decision Inventory

* When to Create New Top-Level Directories
* Directory Depth Management
* Organizational Strategy Selection

---

# Architecture-Level Decision Trees

---

## Decision 1: When to Create New Top-Level Directories

---

## Decision Context

Whether to proactively create directories (e.g., `app/Services/`, `app/Actions/`, `app/DTOs/`) or add them only when concrete files exist.

---

## Decision Criteria

* Number of files that would logically belong in the directory
* Team convention
* Whether the directory name reflects an actual pattern used in the codebase
* Anticipated vs actual need

---

## Decision Tree

Do you have at least one concrete file to place in the directory?
↓
YES → Create the directory and place the file
NO → Is the project following domain-driven or modular patterns from day one?
    YES → Create the full directory tree (bounded contexts already defined)
    NO → Do NOT create the directory — wait until the first file exists
NO → Would the directory be empty at creation time?
    YES → Do NOT create — empty directories invite speculation about naming/placement
    NO → Create it

---

## Rationale

Premature directory creation adds empty namespaces, architectural decisions made without context, and navigation overhead without benefit. Conventions should be earned by codebase complexity. The exception is domain-driven/modular patterns that require their full tree from the start.

---

## Recommended Default

**Default:** Create directories only when you have the first file to place in them
**Reason:** Empty directories signal architectural intent without architectural substance. They invite debate about naming and placement before the codebase provides context.

---

## Risks Of Wrong Choice

* Creating directories early: Empty folders, speculation-driven architecture, team disagreement about purpose
* Never creating directories: All code in root `app/`, no organization, files are hard to find

---

## Related Rules

* Start with Default Laravel Directory Structure (05-rules.md)
* Prevent Premature Top-Level Directory Creation (05-rules.md)

---

## Related Skills

* Skill: Establish Directory Conventions

---

## Decision 2: Directory Depth Management

---

## Decision Context

How many levels of directory nesting to allow under `app/` for a given code organization pattern.

---

## Decision Criteria

* Organizational pattern (technical, domain, modular, hybrid)
* Namespace verbosity tolerance
* Team familiarity with deep vs shallow structures
* IDE performance

---

## Decision Tree

What organizational pattern is used?
↓
Technical-layer or Hybrid?
YES → Maximum depth: 3 levels (e.g., `app/Http/Controllers/Api/`)
NO → Domain-driven?
    YES → Maximum depth: 3 levels per domain (e.g., `app/Domain/Billing/Controllers/`)
NO → Modular?
    YES → Maximum depth: 4 levels (e.g., `app/Modules/Billing/Http/Controllers/`)
    YES → (Modular inherently creates deeper nesting)

Is any single directory exceeding 4 levels?
YES → Restructure — flatten subdirectories or rename to reduce depth
NO → Acceptable

---

## Rationale

Deep nesting creates verbose namespace prefixes (`App\Http\Controllers\Api\V2\Users\Admin\`), makes imports harder to read, and slows IDE file tree rendering. Modular patterns are the exception because the module root necessarily adds an extra level.

---

## Recommended Default

**Default:** Maximum 3 levels for technical/hybrid, 4 levels for modular
**Reason:** Beyond these depths, the namespace prefix becomes unwieldy and navigation suffers without proportional organizational benefit.

---

## Risks Of Wrong Choice

* Excessive depth (>4 levels): Verbose imports, slower IDE navigation, perception of complexity
* Too shallow (everything at 1 level): No categorization, files are hard to find in large projects

---

## Related Rules

* Keep Directory Depth at Maximum 3 Levels (05-rules.md)

---

## Related Skills

* Skill: Establish Directory Conventions

---

## Decision 3: Organizational Strategy Selection

---

## Decision Context

Choosing the top-level organizational approach for code in `app/`: technical-layer, hybrid, domain-driven, or modular.

---

## Decision Criteria

* Model count
* Team size
* Bounded context clarity
* Artisan compatibility needs
* Future extraction plans

---

## Decision Tree

What is the model count?
↓
< 20?
YES → Technical-layer (default, full Artisan compatibility)
NO → 20-50?
    YES → Are bounded contexts clear?
        YES → Team size > 8?
            YES → Modular
            NO → Domain-driven or Hybrid
        NO → Hybrid (Artisan-compatible, with domain subdirs within layers)
NO → 50+?
    YES → Multiple teams?
        YES → Modular (module per team, strong isolation)
        NO → Domain-driven with sub-features

---

## Rationale

Technical-layer is the framework default and has full Artisan compatibility. Hybrid is a pragmatic middle ground that maintains Artisan compatibility while offering domain grouping within each layer. Domain-driven provides clear bounded contexts but requires manual file moves. Modular has the highest overhead and is justified only for multi-team setups.

---

## Recommended Default

**Default:** Technical-layer for new projects; evolve when navigation friction becomes measurable
**Reason:** Default structure is well-known, Artisan-compatible, and has no overhead. Organizational changes should be driven by demonstrated need.

---

## Risks Of Wrong Choice

* Technical-layer for 100+ models: Files scattered, navigation difficulty, no ownership boundaries
* Modular for single team: Unnecessary overhead, per-module boilerplate, autoloading complexity
* Mixed patterns: Ambiguity about file placement, scattered code, onboarding confusion

---

## Related Rules

* Never Mix Organizational Strategies (05-rules.md)
* Do Not Organize by Developer Role (05-rules.md)
* Maintain Case Consistency Between Namespace and Directory (05-rules.md)

---

## Related Skills

* Skill: Establish Directory Conventions
