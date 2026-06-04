# Decomposition: Action Composition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Action Composition
- **Difficulty Level:** Advanced

## Topic Overview
Building complex workflows by composing multiple action classes — coordinator actions, sequential/conditional/loop composition, error handling, and reusability.

## Decomposition Strategy
This KU covers composition patterns specifically. Individual action class design is covered in a separate KU.

## Proposed Folder Structure
```
action-composition/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Action Composition
- **Purpose:** Define patterns for composing actions into workflows
- **Difficulty:** Advanced
- **Dependencies:** Action Class Design

## Atomic Chunks

### Chunk 1: Coordinator Action Pattern
- **Topics:** Single action that calls sub-actions, sequencing, shared context
- **Key Content:** Coordinator responsibility (sequencing, not doing)
- **Learning Objectives:** Create a coordinator action that composes sub-actions

### Chunk 2: Composition Patterns
- **Topics:** Sequential, conditional, loop composition; passing results forward
- **Key Content:** Different composition strategies for different workflow needs
- **Learning Objectives:** Implement each composition pattern

### Chunk 3: Error Handling in Composed Actions
- **Topics:** Transaction rollback, compensating actions, partial failure handling
- **Key Content:** Keeping the system consistent when composition fails mid-way
- **Learning Objectives:** Handle failures in composed workflows with compensation

### Chunk 4: Composition Depth and Complexity Management
- **Topics:** Depth limits (3-4 levels), when to extract to a service, reusability assessment
- **Key Content:** Keeping composition manageable
- **Learning Objectives:** Recognize when composition depth is excessive

## Dependency Graph
Depends on: Action Class Design. Related to: Transactional Actions, Service Orchestration. Prerequisite for: Queued Actions.

## Boundary Analysis
**In scope:** Composition patterns, coordinator actions, error handling, depth management.
**Out of scope:** Single action design (covered in Action Class Design), queued action execution (covered in Queued Actions), transaction-specific patterns (covered in Transactional Actions), service-level orchestration (covered in Service Orchestration).

## Future Expansion Opportunities
Pipeline/middleware action composition could be a separate pattern if it becomes prevalent in the ecosystem.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization