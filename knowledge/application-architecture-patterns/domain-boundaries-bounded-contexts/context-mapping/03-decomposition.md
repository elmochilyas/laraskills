# Decomposition: Context mapping: relationships between contexts

## Topic Overview

Context mapping documents the relationships between bounded contexts. Common relationship types include: Partnership (teams coordinate changes), Shared Kernel (shared code with synchronized changes), Customer-Supplier (one context provides data the other needs), Conformist (one context conforms to another's model), Anti-Corruption Layer (translation between contexts), Open Host Service (published API), and Separate Ways (no integration).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
DBC-02-context-mapping/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Context mapping: relationships between contexts
- **Purpose:** Context mapping documents the relationships between bounded contexts. Common relationship types include: Partnership (teams coordinate changes), Shared Kernel (shared code with synchronized changes), Customer-Supplier (one context provides data the other needs), Conformist (one context conforms to another's model), Anti-Corruption Layer (translation between contexts), Open Host Service (published API), and Separate Ways (no integration).
- **Difficulty:** Advanced
- **Dependencies:** DBC-01 Context identification

## Dependency Graph

This KU depends on: DBC-01 Context identification
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Context map relationship types:** - **Partnership:** Two teams coordinate changes. Tight alignment, frequent communication. - **Shared Kernel:** A shared subset of the domain model. Changes are sync...
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