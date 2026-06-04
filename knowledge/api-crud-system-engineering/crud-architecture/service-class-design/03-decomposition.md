# Decomposition: Service Class Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Service Class Design
- **Difficulty Level:** Intermediate

## Topic Overview
Designing multi-method service classes — entity-oriented vs capability-oriented, constructor injection, statelessness, and evolution from CRUD aggregator to multi-service orchestrator.

## Decomposition Strategy
This KU is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
service-class-design/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Service Class Design
- **Purpose:** Designing multi-method service classes
- **Difficulty:** Intermediate
- **Dependencies:** Controllers, Service Container

## Atomic Chunks

### Chunk 1: Entity-Oriented vs Capability-Oriented
- **Topics:** Noun-based vs verb-based service organization
- **Key Content:** Each approach's benefit and risk for navigation vs cohesion
- **Learning Objectives:** Choose the right organization strategy for a domain

### Chunk 2: Statelessness and Constructor Injection
- **Topics:** What to inject, what NOT to inject, singleton safety, testability
- **Key Content:** Statelessness as a requirement, not a preference
- **Learning Objectives:** Design services that are safe as singletons

### Chunk 3: Service Evolution Stages
- **Topics:** Thin CRUD → Business logic → Orchestrator → Split
- **Key Content:** Services grow predictably; recognize when to split
- **Learning Objectives:** Identify which evolution stage a service is in

### Chunk 4: Fat Service Detection
- **Topics:** Method count, dependency count, cohesion ratio
- **Key Content:** Quantitative signals for service bloat
- **Learning Objectives:** Detect and refactor fat services

## Dependency Graph
Depends on: Controllers, Service Container. Prerequisite for: Service Orchestration, Service vs Action Decision, Repository Pattern Design.

## Boundary Analysis
**In scope:** Entity vs capability design, statelessness, constructor injection, evolution stages, fat service detection.
**Out of scope:** Action class design (covered in Action Class Design), naming conventions (covered in Naming Conventions), transaction management (covered in Transactional Actions or Transaction Management KUs).

## Future Expansion Opportunities
None — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization