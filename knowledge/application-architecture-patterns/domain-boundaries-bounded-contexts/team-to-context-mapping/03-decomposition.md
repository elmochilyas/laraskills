# Decomposition: Team-to-context mapping: Conway's Law in practice

## Topic Overview

Conway's Law states: "Organizations design systems that mirror their communication structure." In practice, this means each team should own one or more bounded contexts, and each bounded context should be owned by exactly one team. Misaligned ownership—where a bounded context is shared by multiple teams, or a team owns unrelated contexts—causes coordination overhead, conflicting priorities, and architectural degradation.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
DBC-09-team-to-context-mapping/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Team-to-context mapping: Conway's Law in practice
- **Purpose:** Conway's Law states: "Organizations design systems that mirror their communication structure." In practice, this means each team should own one or more bounded contexts, and each bounded context should be owned by exactly one team. Misaligned ownership—where a bounded context is shared by multiple teams, or a team owns unrelated contexts—causes coordination overhead, conflicting priorities, and architectural degradation.
- **Difficulty:** Advanced
- **Dependencies:** DBC-01 Context identification

## Dependency Graph

This KU depends on: DBC-01 Context identification
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Team owns context:** The team has authority over the context's model, implementation, and schema. They can make changes without coordinating with other teams (subject to contract stability). **Conte...
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