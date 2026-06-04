# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** PSR-4 autoloading configuration for custom directories
**Generated:** 2026-06-03

---

# Decision Inventory

* Single PSR-4 root vs multiple namespace roots
* Custom directories under app/ vs separate top-level directories
* autoload vs autoload-dev for test infrastructure

---

# Architecture-Level Decision Trees

---

## Single PSR-4 Root vs Multiple Namespace Roots

---

## Decision Context

The default PSR-4 mapping uses a single root (`App\` → `app/`). Multiple roots can provide namespace isolation for domains or modules but add configuration complexity. The choice affects autoloading, namespace clarity, and migration ease.

---

## Decision Criteria

* performance considerations — multiple roots add no runtime cost with optimized class maps; development-mode scanning may be slower
* architectural considerations — multiple roots enable clear domain identity and team ownership
* security considerations — no security impact from root count
* maintainability considerations — multiple roots require documentation and developer training

---

## Decision Tree

Need multiple namespace roots?
↓
Project has clearly separated domain modules with distinct identity?
YES → Use separate namespace roots per domain
NO → Team ownership requires distinct namespace prefixes?
    YES → Use separate namespace roots
    NO → Default `App\` → `app/` suffices
        YES → Keep single root
        NO → Use separate roots (document rationale)

---

## Rationale

A single root is sufficient for most projects. Multiple roots are useful when domains have distinct identity or team ownership. The cost is configuration complexity and developer training — every new team member must learn the namespace mapping.

---

## Recommended Default

**Default:** Keep single `App\` → `app/` root
**Reason:** The default mapping covers all subdirectories under `app/`. Multiple roots add configuration complexity without proportional benefit for most projects.

---

## Risks Of Wrong Choice

Unnecessary multiple roots add configuration complexity without benefit. Overlapping roots cause undefined autoloading behavior. Missing multiple roots at team scale causes namespace collisions and merge conflicts.

---

## Related Rules

- R02: Never Create Overlapping PSR-4 Roots (COS-03/05-rules.md)
- R05: Avoid Unnecessary Multiple PSR-4 Roots (COS-03/05-rules.md)

---

## Related Skills

- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)

---

## Custom Directories Under app/ vs Separate Top-Level Directories

---

## Decision Context

When creating custom directory structures, teams can place them under `app/` (e.g., `app/Domains/`) or as separate top-level directories (e.g., `src/`, `modules/`). The choice affects PSR-4 configuration, framework convention alignment, and tooling compatibility.

---

## Decision Criteria

* performance considerations — no runtime impact; separate roots add development-mode scanning overhead
* architectural considerations — top-level directories signal architectural significance; app/ subdirectories are framework-aligned
* security considerations — top-level directories must be protected from web access
* maintainability considerations — top-level directories require explicit PSR-4 mapping; app/ subdirectories use default mapping

---

## Decision Tree

Where to place custom code?
↓
Code is a framework-specific extension (Services, Actions, Events)?
YES → Place under app/ (uses default App\ mapping)
NO → Code represents a separate module or bounded context?
    YES → Module may be extracted to separate package?
        YES → Use top-level directory (modules/, src/) with separate PSR-4 root
        NO → Place under app/ with domain directory structure
    NO → Place under app/ with appropriate subdirectory

---

## Rationale

Placement under `app/` preserves framework convention compatibility and uses the default `App\` mapping. Top-level directories signal that the code is architecturally distinct and may be extracted later. The choice should reflect extraction potential.

---

## Recommended Default

**Default:** Place custom code under `app/` subdirectories
**Reason:** Uses the existing PSR-4 mapping without additional configuration. Framework conventions (`artisan make:`) remain compatible.

---

## Risks Of Wrong Choice

Top-level directories without extraction need add unnecessary PSR-4 configuration. Placing extractable modules under `app/` makes extraction harder because they share the `App\` namespace.

---

## Related Rules

- R01: Run `composer dump-autoload` After Every PSR-4 Mapping Change (COS-03/05-rules.md)
- R06: Keep Custom PSR-4 Mappings Stable After Release (COS-03/05-rules.md)

---

## Related Skills

- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)
- Plan Module Extraction Path from Monolith (MMD-11/06-skills.md)

---

## autoload vs autoload-dev for Test Infrastructure

---

## Decision Context

Composer's `autoload-dev` section registers classes that should only be available in development and testing environments. Misplacing test infrastructure in `autoload` adds unnecessary classes to the production class map.

---

## Decision Criteria

* performance considerations — autoload-dev classes excluded from production class map, reducing map size
* architectural considerations — clear separation between production and test infrastructure
* security considerations — test helpers with sensitive logic should never be in production class map
* maintainability considerations — autoload-dev mappings must be maintained alongside autoload

---

## Decision Tree

Class used in production?
↓
Class is only needed in test environment?
YES → Place in autoload-dev
NO → Class is a factory, seeder, or test support class?
    YES → Place in autoload-dev
    NO → Class is application code also used in tests?
        YES → Place in autoload (production + test)
        NO → Place in autoload

---

## Rationale

`autoload-dev` prevents test infrastructure from being included in the production optimized class map. This keeps production maps smaller and prevents test-only classes from being accidentally loaded in production.

---

## Recommended Default

**Default:** Place all test-only classes (factories, seeders, test support) in `autoload-dev`
**Reason:** Production deployments should not include test infrastructure. The optimized class map should only contain production classes.

---

## Risks Of Wrong Choice

Production autoload map includes unnecessary test classes — slightly larger map and potential for test code to be accidentally resolved in production.

---

## Related Rules

- R04: Use `autoload-dev` for Test Infrastructure Separately (COS-03/05-rules.md)
- R07: Document All Custom PSR-4 Mappings in Project README (COS-03/05-rules.md)

---

## Related Skills

- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)
