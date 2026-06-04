# Decomposition: Spatie Laravel Data Integration

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Spatie Laravel Data Integration
- **Difficulty Level:** Advanced

## Topic Overview
Using the Spatie laravel-data package for automatic DTO construction, type casting, validation integration, and TypeScript generation.

## Decomposition Strategy
This KU is focused on package-specific patterns. Core DTO concepts are covered in separate KUs — this KU assumes that knowledge.

## Proposed Folder Structure
```
spatie-laravel-data-integration/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Spatie Laravel Data Integration
- **Purpose:** Define patterns for using the Spatie laravel-data package
- **Difficulty:** Advanced
- **Dependencies:** Data Transfer Object Design, DTO Construction Patterns

## Atomic Chunks

### Chunk 1: Data Class Definition
- **Topics:** Extending Data, constructor properties, type hints
- **Key Content:** Declarative DTO definitions vs imperative construction
- **Learning Objectives:** Define a Data class with typed properties

### Chunk 2: Automatic Construction and Casting
- **Topics:** `Data::from()`, property mapping, type casting (Carbon, Collection, enums)
- **Key Content:** The construction pipeline
- **Learning Objectives:** Construct Data objects from arrays and requests

### Chunk 3: Validation Integration
- **Topics:** `rules()` method on Data classes, nested validation, exception handling
- **Key Content:** Decoupling validation from FormRequests
- **Learning Objectives:** Add validation rules to Data classes

### Chunk 4: TypeScript Generation and Transformers
- **Topics:** Artisan command for TypeScript, output transformers, frontend integration
- **Key Content:** Keeping frontend types in sync
- **Learning Objectives:** Generate TypeScript types from Data classes

## Dependency Graph
Depends on: Data Transfer Object Design, DTO Construction Patterns. Related to: Controller-DTO-Action Flow (Data as the DTO layer), Controller-DTO-Service Flow.

## Boundary Analysis
**In scope:** Package features, Data class definition, casting, validation, TypeScript generation.
**Out of scope:** Manual DTO patterns (covered in DTO Design/Construction), FormRequest integration (covered in Validation KUs), decision framework for package vs manual (covered in Architectural Decisions section).

## Future Expansion Opportunities
As the package evolves, new features (like inline validation rules, additional casts) can be added to the relevant chunks.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization