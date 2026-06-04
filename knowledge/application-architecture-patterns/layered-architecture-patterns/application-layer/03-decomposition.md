# Decomposition: Application layer: use cases, DTOs, application services

## Topic Overview

The Application layer is the orchestration layer of Clean Architecture. It defines how the system is used: it receives input from the outside world (via ports), coordinates domain objects to fulfill the use case, and returns results.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-06-application-layer/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Application layer: use cases, DTOs, application services
- **Purpose:** The Application layer is the orchestration layer of Clean Architecture. It defines how the system is used: it receives input from the outside world (via ports), coordinates domain objects to fulfill the use case, and returns results.
- **Difficulty:** Advanced
- **Dependencies:** LAP-05 Domain layer

## Dependency Graph

This KU depends on: LAP-05 Domain layer
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Use Case (Interactor):** A class that represents a single user goal. `CreateInvoice`, `ProcessRefund`, `RegisterUser`. Each has one public method (typically `execute()` or `handle()`) that receives ...
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