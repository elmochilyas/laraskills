# Decomposition: Team-scale organizational strategies (10+ engineers)

## Topic Overview

At 10+ engineers, organizational strategies shift from "where does this file go" to "how do multiple teams work in the same codebase without colliding." The primary concerns become: namespace ownership (which team owns which namespaces), merge conflict reduction (how to minimize teams touching the same files), and code review scalability (how to review changes without blocking progress). The answer is almost always domain-based or module-based organization with clear team-to-domain mapping.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
COS-10-team-scale-strategies/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Team-scale organizational strategies (10+ engineers)
- **Purpose:** At 10+ engineers, organizational strategies shift from "where does this file go" to "how do multiple teams work in the same codebase without colliding." The primary concerns become: namespace ownership (which team owns which namespaces), merge conflict reduction (how to minimize teams touching the same files), and code review scalability (how to review changes without blocking progress). The answer is almost always domain-based or module-based organization with clear team-to-domain mapping.
- **Difficulty:** Advanced
- **Dependencies:** COS-09 When to deviate

## Dependency Graph

This KU depends on: COS-09 When to deviate
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** At team scale, the default Laravel structure becomes harmful because: - Multiple teams can't all own `app/Http/Controllers/` - Merge conflicts spike when 10+ engineers modify files in the same directo...
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