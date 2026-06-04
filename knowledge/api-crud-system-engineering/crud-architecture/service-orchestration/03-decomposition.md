# Decomposition: Service Orchestration

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Service Orchestration
- **Difficulty Level:** Advanced

## Topic Overview
Coordinating multiple services in a workflow — orchestrator patterns, compensation strategies, cross-domain coordination, and when orchestration is needed.

## Decomposition Strategy
This KU covers the multi-service coordination level. Simpler coordination (action composition) is covered separately.

## Proposed Folder Structure
```
service-orchestration/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Service Orchestration
- **Purpose:** Define patterns for cross-domain service coordination
- **Difficulty:** Advanced
- **Dependencies:** Service Class Design

## Atomic Chunks

### Chunk 1: Orchestrator Role and Structure
- **Topics:** Orchestrator vs service, cross-domain coordination, sequential orchestration
- **Key Content:** Pure coordination with no domain logic
- **Learning Objectives:** Design an orchestrator that coordinates 3+ services

### Chunk 2: Orchestration Patterns
- **Topics:** Sequential, conditional, parallel, compensation
- **Key Content:** Different coordination strategies
- **Learning Objectives:** Implement each orchestration pattern

### Chunk 3: Error Handling and Compensation
- **Topics:** Transaction rollback, compensating actions, partial failure, audit logging
- **Key Content:** Keeping the system consistent across service boundaries
- **Learning Objectives:** Implement compensating actions for external systems

### Chunk 4: Orchestration vs Composition Decision
- **Topics:** When to orchestrate services vs compose actions, cross-domain thresholds
- **Key Content:** Choosing the right coordination level
- **Learning Objectives:** Decide between action composition and service orchestration

## Dependency Graph
Depends on: Service Class Design. Related to: Action Composition. Prerequisite for: Service vs Action Decision.

## Boundary Analysis
**In scope:** Orchestrator pattern, cross-domain coordination, compensation, error handling.
**Out of scope:** Action-level composition (covered in Action Composition), saga patterns (advanced follow-up), event-driven alternatives (advanced follow-up).

## Future Expansion Opportunities
Event-driven orchestration (choreography) could be a separate KU if the codebase adopts event-driven patterns.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization