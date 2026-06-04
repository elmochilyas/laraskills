# Decomposition: Layer Isolation Rules

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Layer Isolation Rules
- **Difficulty Level:** Intermediate

## Topic Overview
Rules governing which layers may communicate with which other layers — dependency direction, skip prevention, circular dependency avoidance, enforcement strategies.

## Decomposition Strategy
This KU is a ruleset — it defines constraints rather than patterns. Each rule is a separate chunk.

## Proposed Folder Structure
```
layer-isolation-rules/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Layer Isolation Rules
- **Purpose:** Define communication rules between architectural layers
- **Difficulty:** Intermediate
- **Dependencies:** Thin Controller Principle, All Flow Patterns

## Atomic Chunks

### Chunk 1: The Dependency Direction Rule
- **Topics:** Downward-only dependencies, controller→service→repository→DB
- **Key Content:** Data flows down, never up
- **Learning Objectives:** Identify correct vs incorrect dependency directions

### Chunk 2: The Skip Rule
- **Topics:** Controllers must not bypass services, services must not bypass repositories
- **Key Content:** Each layer only talks to adjacent layers
- **Learning Objectives:** Identify and fix layer-skipping violations

### Chunk 3: Circular Dependency Prevention
- **Topics:** Service A → Service B ≠ Service B → Service A, extraction strategies
- **Key Content:** Extracting shared logic resolves circular dependencies
- **Learning Objectives:** Refactor circular dependencies

### Chunk 4: Enforcement Strategies
- **Topics:** Code review checklists, PHPStan/Larastan rules, onboarding
- **Key Content:** Layer rules are not framework-enforced — they require team discipline
- **Learning Objectives:** Set up automated layer violation detection

## Dependency Graph
Depends on: Thin Controller Principle, All Flow Patterns. Related to: When to Skip Layers.

## Boundary Analysis
**In scope:** Dependency direction, skip prevention, circular dependency rules, enforcement.
**Out of scope:** Specific flow implementations (covered in individual flow KUs), when to make exceptions (covered in When to Skip Layers).

## Future Expansion Opportunities
Tooling for automated layer violation detection could be expanded in a separate guide.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization