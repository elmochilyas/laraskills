# Decomposition: Modular monolith vs. microservices decision framework

## Topic Overview

The decision between a modular monolith and microservices is primarily organizational, not technical. The modular monolith is the recommended default for teams under 30 engineers because it provides domain isolation without distribution complexity.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
MMD-17-modular-vs-microservices-decision/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Modular monolith vs. microservices decision framework
- **Purpose:** The decision between a modular monolith and microservices is primarily organizational, not technical. The modular monolith is the recommended default for teams under 30 engineers because it provides domain isolation without distribution complexity.
- **Difficulty:** Advanced
- **Dependencies:** MMD-01 Module vs microservice

## Dependency Graph

This KU depends on: MMD-01 Module vs microservice
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Decision factors:** - **Team size:** <30 engineers → modular monolith. >50 → consider microservices. - **Team structure:** One team → modular monolith. Multiple independent teams → consider ...
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