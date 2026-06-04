# Decomposition: Incremental migration from MVC to layered architecture

## Topic Overview

Migrating from Laravel's default MVC structure to a layered architecture (Clean/Hexagonal) is best done incrementally, not as a big-bang rewrite. The migration path follows a progression: start with services (extract business logic from controllers), then add actions (isolate operations), then introduce interfaces (decouple from framework), and finally restructure into layers (domain, application, infrastructure).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-12-incremental-migration/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Incremental migration from MVC to layered architecture
- **Purpose:** Migrating from Laravel's default MVC structure to a layered architecture (Clean/Hexagonal) is best done incrementally, not as a big-bang rewrite. The migration path follows a progression: start with services (extract business logic from controllers), then add actions (isolate operations), then introduce interfaces (decouple from framework), and finally restructure into layers (domain, application, infrastructure).
- **Difficulty:** Expert
- **Dependencies:** LAP-01 Three-layer architecture

## Dependency Graph

This KU depends on: LAP-01 Three-layer architecture
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** The migration has four phases: 1. **Controller thinning:** Extract business logic from controllers into Service classes. This is the lowest-cost, highest-value first step. 2. **Action isolation:** Bre...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization