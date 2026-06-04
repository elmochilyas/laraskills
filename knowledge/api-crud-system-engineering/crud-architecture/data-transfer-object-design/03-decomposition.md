# Decomposition: Data Transfer Object Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Data Transfer Object Design
- **Difficulty Level:** Intermediate

## Topic Overview
Design of DTOs as immutable, typed data carriers — readonly properties, factory methods, serialization strategies, and the decision framework for when to introduce them.

## Decomposition Strategy
This KU covers the core DTO design principles. Related patterns (factories, nesting, packages) are split into separate KUs to keep each atomic.

## Proposed Folder Structure
```
data-transfer-object-design/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Data Transfer Object Design
- **Purpose:** Define DTO design with readonly properties, typed constructors, and factory patterns
- **Difficulty:** Intermediate
- **Dependencies:** PHP 8.1+ readonly properties

## Atomic Chunks

### Chunk 1: Immutability and Type Safety
- **Topics:** `readonly` properties/classes, typed constructor params, no setters
- **Key Content:** PHP type system enforcement for data integrity
- **Learning Objectives:** Construct a DTO with typed, readonly properties

### Chunk 2: Factory Methods (fromArray, fromRequest, fromModel)
- **Topics:** Named constructors, array-to-DTO mapping, key presence handling
- **Key Content:** Intention-revealing factory patterns
- **Learning Objectives:** Implement named constructors for different data sources

### Chunk 3: Serialization (toArray, JsonSerializable)
- **Topics:** Converting DTOs to arrays and JSON, property mapping, nested serialization
- **Key Content:** Serialization strategies for API responses
- **Learning Objectives:** Implement toArray and JsonSerializable on DTOs

### Chunk 4: When to Introduce a DTO
- **Topics:** 2-3 layer crossing threshold, data complexity, reuse across entry points
- **Key Content:** Decision framework for DTO vs validated array
- **Learning Objectives:** Decide when a DTO is warranted

## Dependency Graph
Depends on: PHP 8.1+ language features. Prerequisite for: All other DTO KUs (Construction Patterns, Nesting, Spatie Integration), Controller-DTO-Action Flow, Controller-DTO-Service Flow.

## Boundary Analysis
**In scope:** DTO design principles, immutability, type safety, factory methods, serialization, decision framework.
**Out of scope:** Advanced construction patterns (covered in DTO Construction Patterns), nested DTOs (covered in DTO Nesting Composition), Spatie package (covered in Spatie Laravel Data Integration), DTO vs Form Request (covered in Form Request related KUs).

## Future Expansion Opportunities
None — the core DTO design principles are stable across PHP versions.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization