# Decomposition: Controller Organization

## Topic Overview
Directory strategies and method organization for controllers — domain-based, architectural boundary, role-based, and feature-based subdirectory patterns, plus method ordering conventions.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
controller-organization/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Controller Organization
- **Purpose:** Directory strategies and method organization for controllers — domain-based grouping, architectural boundaries, and naming conventions.
- **Difficulty:** Intermediate
- **Dependencies:** Controller Architecture

## Dependency Graph
This KU depends on: Controller Architecture. It builds on resource-controllers and single-action-controllers.

## Boundary Analysis
**In scope:** Default directory structure, namespace resolution, controller-to-route mapping, domain-based subdirectory pattern, architectural boundary pattern (API/Web), role-based pattern (Admin/Public), feature-based pattern, method ordering (resource order, semantic order), naming conventions for resource and single-action controllers, Artisan generator conventions, flat vs grouped tradeoffs.

**Out of scope:** Controller dispatch mechanics (controller-architecture KU), specific resource controller method patterns (resource-controllers KU), action class directory conventions (action-naming-conventions KU), feature-based application structure (feature-based-structure domain).

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization