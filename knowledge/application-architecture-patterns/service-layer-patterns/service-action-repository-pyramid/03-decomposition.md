# Decomposition: Service-Action-Repository pyramid architecture

## Topic Overview

The Service-Action-Repository pyramid organizes business logic into three layers with specific responsibilities: Services orchestrate workflows and manage transactions, Actions execute single business operations, and Repositories handle data access. The call chain flows from Controller → Service → Action → Repository.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-04-service-action-repository-pyramid/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Service-Action-Repository pyramid architecture
- **Purpose:** The Service-Action-Repository pyramid organizes business logic into three layers with specific responsibilities: Services orchestrate workflows and manage transactions, Actions execute single business operations, and Repositories handle data access. The call chain flows from Controller → Service → Action → Repository.
- **Difficulty:** Intermediate
- **Dependencies:** SLP-01 Service classes

## Dependency Graph

This KU depends on: SLP-01 Service classes
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Controller:** Accepts HTTP, delegates to service, returns response. **Service (top layer):** Orchestrates business workflows. Coordinates multiple actions. Manages transactions. Handles cross-cuttin...
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