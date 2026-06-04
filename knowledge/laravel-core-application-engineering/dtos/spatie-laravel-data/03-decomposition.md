# Decomposition: Spatie/laravel-data Integration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Spatie/laravel-data Integration
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Package Setup and Declarative DTOs
- **Topics:** Installation, `Data` base class, property attributes, type coercion rules
- **Key Content:** Moving from handwritten DTOs to spatie/laravel-data, attribute-based definitions, automatic casting
- **Learning Objectives:** Set up spatie/laravel-data and define a DTO using declarative property attributes

### Chunk 2: Automatic Type Casting
- **Topics:** `#`[FromRoute]`, `#[FromQuery]`, `#[CastWith]`, built-in casters
- **Key Content:** Request-to-DTO casting, model-to-DTO casting, custom caster creation
- **Learning Objectives:** Use built-in casting attributes and create custom casters for non-standard type conversions

### Chunk 3: Validation Integration
- **Topics:** `#[Validate]` attribute, rule objects, validation on construction
- **Key Content:** Defining validation rules on DTO properties, validation error handling, comparing with FormRequest validation
- **Learning Objectives:** Integrate validation rules into DTO definitions using spatie/laravel-data attributes

### Chunk 4: TypeScript Type Generation
- **Topics:** `php artisan data:typescript` command, shared type definitions, frontend type safety
- **Key Content:** Generating TypeScript interfaces from PHP DTOs, CI integration, keeping types in sync
- **Learning Objectives:** Generate and maintain TypeScript type definitions from DTOs for full-stack type safety
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization