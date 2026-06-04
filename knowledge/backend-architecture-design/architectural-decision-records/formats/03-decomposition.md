# Decomposition: ADR formats (Nygard, MADR, Y-Statement)

## Topic Overview

Architecture Decision Records (ADRs) capture architectural decisions with context, options, rationale, and consequences. Multiple formats exist for different needs: Nygard (general purpose), MADR (structured, detailed), Y-Statement (lightweight, quick).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
adr-formats/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### ADR formats (Nygard, MADR, Y-Statement)
- **Purpose:** Architecture Decision Records (ADRs) capture architectural decisions with context, options, rationale, and consequences. Multiple formats exist for different needs: Nygard (general purpose), MADR (structured, detailed), Y-Statement (lightweight, quick).
- **Difficulty:** Intermediate
- **Dependencies:** Architecture documentation |

## Dependency Graph

This KU depends on: Architecture documentation |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** adr-formats is built on foundational concepts that govern its application in backend architecture. | Concept | Description | Relevance | |---------|-------------|-----------|
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent design patterns covered in related KUs.

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