# Decomposition: Action Class Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Action Class Design
- **Difficulty Level:** Intermediate

## Topic Overview
Single-purpose action classes — invokable vs execute convention, constructor injection, DTO input, and action as the building block of business logic.

## Decomposition Strategy
This KU covers the core action class pattern. Related patterns (composition, transactions, queuing) are split into separate KUs.

## Proposed Folder Structure
```
action-class-design/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Action Class Design
- **Purpose:** Define single-purpose action class patterns
- **Difficulty:** Intermediate
- **Dependencies:** Service Container, DTO Design

## Atomic Chunks

### Chunk 1: Action Structure
- **Topics:** Single method class, execute vs __invoke, constructor DI, return types
- **Key Content:** Action class anatomy and conventions
- **Learning Objectives:** Create an action class with proper structure

### Chunk 2: Action Dependencies
- **Topics:** Constructor injection of repositories/services, why no HTTP dependencies
- **Key Content:** Actions are transport-agnostic
- **Learning Objectives:** Inject appropriate dependencies into action classes

### Chunk 3: Action Input (DTO)
- **Topics:** DTO as action input, typed parameters, what NOT to pass
- **Key Content:** DTO as the formal contract between controller and action
- **Learning Objectives:** Design action signatures that accept DTOs

### Chunk 4: Action as Transaction Boundary
- **Topics:** DB::transaction in actions, failure handling, rollback
- **Key Content:** Each action is a natural transaction boundary
- **Learning Objectives:** Wrap action logic in transactions

## Dependency Graph
Depends on: Service Container, DTO Design. Prerequisite for: Action Composition, Transactional Actions, Queued Actions, Controller-DTO-Action Flow.

## Boundary Analysis
**In scope:** Action class structure, conventions, dependencies, input patterns, transaction boundaries.
**Out of scope:** Multi-action composition (covered in Action Composition), queued execution (covered in Queued Actions), transactional patterns (covered in Transactional Actions), service vs action decision (covered in Service vs Action Decision).

## Future Expansion Opportunities
None — the action class pattern is well-established.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization