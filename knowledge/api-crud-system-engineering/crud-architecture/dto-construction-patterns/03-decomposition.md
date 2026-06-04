# Decomposition: DTO Construction Patterns

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** DTO Construction Patterns
- **Difficulty Level:** Intermediate

## Topic Overview
Named constructors (fromArray, fromRequest, fromModel), collection construction, hydration strategies, and factory patterns for building DTOs from various data sources.

## Decomposition Strategy
This KU is focused on how DTOs are built, not what they contain (covered in DTO Design). Each construction source is a distinct pattern.

## Proposed Folder Structure
```
dto-construction-patterns/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### DTO Construction Patterns
- **Purpose:** Define patterns for constructing DTOs from different data sources
- **Difficulty:** Intermediate
- **Dependencies:** Data Transfer Object Design

## Atomic Chunks

### Chunk 1: Named Constructors
- **Topics:** fromArray, fromRequest, fromModel static factories
- **Key Content:** Each named constructor encapsulates source-specific mapping
- **Learning Objectives:** Implement named constructors for different data sources

### Chunk 2: Collection Construction
- **Topics:** array_map for DTO arrays, typed collection wrappers, variadic constructors
- **Key Content:** Building arrays of typed DTOs from nested data
- **Learning Objectives:** Implement collection construction for nested DTOs

### Chunk 3: Factory Classes for Complex Construction
- **Topics:** Separate factory classes with DI, database lookups in factories
- **Key Content:** When to move from static factories to injectable factories
- **Learning Objectives:** Create a factory class for DTOs that require dependency resolution

### Chunk 4: Error Handling and Missing Keys
- **Topics:** Key presence validation, type coercion, explicit vs implicit errors
- **Key Content:** Handling missing/invalid input in factory methods
- **Learning Objectives:** Implement robust factory methods with proper error handling

## Dependency Graph
Depends on: Data Transfer Object Design. Serves as prerequisite for: DTO Nesting Composition, Spatie Laravel Data Integration.

## Boundary Analysis
**In scope:** Named constructors, collection construction, factory classes, error handling in construction.
**Out of scope:** Core DTO design principles (covered in Data Transfer Object Design), nesting/composition (covered in DTO Nesting Composition), package-specific patterns (covered in Spatie Laravel Data Integration).

## Future Expansion Opportunities
None — the construction patterns are well-established.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization