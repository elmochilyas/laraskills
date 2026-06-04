# Decomposition: Repository vs Eloquent Decision

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Repository vs Eloquent Decision
- **Difficulty Level:** Intermediate

## Topic Overview
Decision framework for choosing between direct Eloquent usage and repository abstraction — ceremony threshold, extraction strategy, hybrid approaches.

## Decomposition Strategy
This KU synthesizes the decision logic. Repository design details are covered in Repository Pattern Design.

## Proposed Folder Structure
```
repository-vs-eloquent-decision/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Repository vs Eloquent Decision
- **Purpose:** Provide decision criteria for repository abstraction vs direct Eloquent
- **Difficulty:** Intermediate
- **Dependencies:** Repository Pattern Design, Eloquent Fundamentals

## Atomic Chunks

### Chunk 1: Direct Eloquent — When and Why
- **Topics:** Simple CRUD, minimal query logic, development speed, small teams
- **Key Content:** Direct Eloquent as the default productive path
- **Learning Objectives:** Identify entities that don't need repositories

### Chunk 2: Repository — When and Why
- **Topics:** Complex queries, multi-tenancy, caching, large teams, multiple data sources
- **Key Content:** Repository value proposition
- **Learning Objectives:** Identify entities that benefit from repositories

### Chunk 3: Hybrid Approach
- **Topics:** Repositories only where needed, extraction strategy, migration path
- **Key Content:** The pragmatic middle
- **Learning Objectives:** Design a hybrid data access strategy for an application

### Chunk 4: Migration from Direct to Repository
- **Topics:** Extraction steps, interface creation, binding setup, call site replacement
- **Key Content:** Migration is straightforward and low-risk
- **Learning Objectives:** Migrate a direct Eloquent entity to repository pattern

## Dependency Graph
Depends on: Repository Pattern Design, Eloquent Fundamentals. Related to: Layer Isolation Rules, When to Skip Layers.

## Boundary Analysis
**In scope:** Decision criteria, hybrid strategy, migration path, ceremony cost analysis.
**Out of scope:** Repository design details (covered in Repository Pattern Design), full abstraction stack (covered in Controller-Service-Repository Flow), Eloquent API (covered in Eloquent KUs).

## Future Expansion Opportunities
None — the decision framework is stable.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization