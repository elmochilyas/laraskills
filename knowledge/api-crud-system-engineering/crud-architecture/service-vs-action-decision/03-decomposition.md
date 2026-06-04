# Decomposition: Service vs Action Decision

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Service vs Action Decision
- **Difficulty Level:** Intermediate

## Topic Overview
Decision framework for choosing between action classes and service classes — operation scope, dependency sharing, complexity thresholds, and team conventions.

## Decomposition Strategy
This KU synthesizes concepts from both Action Class Design and Service Class Design to produce a decision framework. It does not introduce new patterns — it guides the choice between existing patterns.

## Proposed Folder Structure
```
service-vs-action-decision/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Service vs Action Decision
- **Purpose:** Provide a decision framework for choosing between actions and services
- **Difficulty:** Intermediate
- **Dependencies:** Action Class Design, Service Class Design

## Atomic Chunks

### Chunk 1: Decision Framework
- **Topics:** Criteria matrix, threshold questions, default recommendations
- **Key Content:** Discrete ops → action; 3+ related ops with shared deps → service
- **Learning Objectives:** Apply the decision framework to a given operation

### Chunk 2: Hybrid Approaches
- **Topics:** Service as facade over actions, mixed codebase strategies
- **Key Content:** Both patterns can coexist
- **Learning Objectives:** Design a hybrid architecture that uses both patterns

### Chunk 3: Migration Paths
- **Topics:** Actions → Services (grouping), Services → Actions (extraction)
- **Key Content:** Refactoring between patterns is straightforward
- **Learning Objectives:** Refactor actions into a service and vice versa

### Chunk 4: Team Conventions and Consistency
- **Topics:** Documenting the decision, code review guidelines, avoiding inconsistency
- **Key Content:** Consistency trumps perfect choice
- **Learning Objectives:** Establish team conventions for action vs service decisions

## Dependency Graph
Depends on: Action Class Design, Service Class Design. Related to: Controller-DTO-Action Flow, Controller-DTO-Service Flow.

## Boundary Analysis
**In scope:** Decision framework, criteria, hybrid approaches, migration paths, team conventions.
**Out of scope:** Detailed action design (covered in Action Class Design), detailed service design (covered in Service Class Design), flow patterns (covered in respective flow KUs).

## Future Expansion Opportunities
None — the decision framework is stable and well-understood.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization