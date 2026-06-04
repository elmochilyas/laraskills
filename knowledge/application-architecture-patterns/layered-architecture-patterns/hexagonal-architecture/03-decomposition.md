# Decomposition: Hexagonal/Ports and Adapters architecture concept

## Topic Overview

Hexagonal Architecture (Alistair Cockburn, 2005), also called Ports and Adapters, models the application as a "hexagon" (core) with symmetric ports on each side for inbound and outbound communication. Ports are interfaces defined by the core; Adapters are implementations that connect the core to external systems.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-03-hexagonal-architecture/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Hexagonal/Ports and Adapters architecture concept
- **Purpose:** Hexagonal Architecture (Alistair Cockburn, 2005), also called Ports and Adapters, models the application as a "hexagon" (core) with symmetric ports on each side for inbound and outbound communication. Ports are interfaces defined by the core; Adapters are implementations that connect the core to external systems.
- **Difficulty:** Advanced
- **Dependencies:** LAP-01 Three-layer architecture

## Dependency Graph

This KU depends on: LAP-01 Three-layer architecture
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Port (interface):** A boundary defined by the core application. Input ports define how the outside world triggers the application (use cases). Output ports define how the application interacts with ...
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