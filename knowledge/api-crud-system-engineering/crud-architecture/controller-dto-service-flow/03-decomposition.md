# Decomposition: Controller-DTO-Service Flow

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Controller-DTO-Service Flow
- **Difficulty Level:** Intermediate

## Topic Overview
Request processing flow where controller constructs DTO and delegates to a multi-method service class for business logic coordination.

## Decomposition Strategy
This KU covers the four-layer flow (Controller → DTO → Service → Response) with variations in how services coordinate internal logic.

## Proposed Folder Structure
```
controller-dto-service-flow/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Controller-DTO-Service Flow
- **Purpose:** Define the delegation pattern with a service layer between controller and data access
- **Difficulty:** Intermediate
- **Dependencies:** Thin Controller Principle, DTO Design, Service Class Design

## Atomic Chunks

### Chunk 1: Flow Mechanics
- **Topics:** Controller→DTO→Service→Response sequence, layer responsibilities
- **Key Content:** DTO construction in controller, service method dispatch
- **Learning Objectives:** Trace data through the four-layer flow

### Chunk 2: Service as Coordinator
- **Topics:** Service methods per operation, internal delegation to sub-actions/repositories
- **Key Content:** Service as facade over domain operations
- **Learning Objectives:** Design service methods that coordinate multiple sub-operations

### Chunk 3: When to Choose Service Flow vs Action Flow
- **Topics:** Decision criteria — shared dependencies, entity orientation, operation count
- **Key Content:** Complexity-based flow selection
- **Learning Objectives:** Select the appropriate flow pattern for entity complexity

### Chunk 4: Testing Services in the Flow
- **Topics:** Direct testing without HTTP, mocking sub-dependencies
- **Key Content:** Service test patterns
- **Learning Objectives:** Write integration tests for service methods

## Dependency Graph
Depends on: Thin Controller Principle, DTO Design, Service Class Design. Prerequisite for: Service Orchestration, Service vs Action Decision.

## Boundary Analysis
**In scope:** Service layer insertion between controller and data, DTO boundary, service method design, flow decision criteria.
**Out of scope:** Repository pattern (covered in Repository Pattern Design), single-action flow (covered in Controller-DTO-Action Flow), multi-action orchestration (covered in Service Orchestration).

## Future Expansion Opportunities
None — the pattern is well-established.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization