# Decomposition: Controller-DTO-Action Flow

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Controller-DTO-Action Flow
- **Difficulty Level:** Intermediate

## Topic Overview
Request processing flow: Controller constructs DTO from validated request → Action receives DTO → Action executes business logic → Controller builds response.

## Decomposition Strategy
This KU is well-bounded. The three-layer flow is a single pattern with variations in how the DTO is constructed and how the action returns results.

## Proposed Folder Structure
```
controller-dto-action-flow/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Controller-DTO-Action Flow
- **Purpose:** Define the three-layer delegation pattern for CRUD operations
- **Difficulty:** Intermediate
- **Dependencies:** Thin Controller Principle, DTO Design, Action Class Design

## Atomic Chunks

### Chunk 1: Flow Mechanics
- **Topics:** Request → Controller → DTO → Action → Response sequence
- **Key Content:** Layer responsibilities, DTO construction timing, container resolution
- **Learning Objectives:** Trace the complete data flow through all three layers

### Chunk 2: DTO Construction Patterns in the Flow
- **Topics:** `fromRequest()` factory, validated data to DTO mapping, type enforcement
- **Key Content:** DTO as the formal boundary between HTTP and business logic
- **Learning Objectives:** Construct DTOs from FormRequest validated data

### Chunk 3: Action Execution and Return Types
- **Topics:** Actions returning models, DTOs, void; response building in controller
- **Key Content:** Action signature conventions, response mapping
- **Learning Objectives:** Implement actions with different return types and map to HTTP responses

### Chunk 4: When to Use This Pattern vs Other Flows
- **Topics:** Decision criteria for Controller→DTO→Action vs Controller→DTO→Service vs Controller→Service→Repository
- **Key Content:** Complexity-based flow selection
- **Learning Objectives:** Choose the right flow pattern for a given operation's complexity

## Dependency Graph
Depends on: Thin Controller Principle, DTO Design, Action Class Design. Serves as prerequisite for: Transactional Actions, Queued Actions, Service Orchestration.

## Boundary Analysis
**In scope:** Three-layer flow mechanics, DTO construction in controller, action execution, response mapping.
**Out of scope:** Multi-action orchestration (covered in Service Orchestration), repository abstraction (covered in Repository Pattern Design), service layer patterns (covered in Controller-DTO-Service Flow).

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