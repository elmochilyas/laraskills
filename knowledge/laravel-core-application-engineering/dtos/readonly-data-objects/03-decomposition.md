# Decomposition: Readonly Data Objects

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Readonly Data Objects
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: PHP Language-Level Immutability
- **Topics:** PHP 8.1 `readonly` properties, PHP 8.2 `readonly` classes, constructor promotion
- **Key Content:** Syntax, behavior (set once in constructor), inheritance rules, clone semantics
- **Learning Objectives:** Use PHP `readonly` keywords to enforce DTO immutability at the language level

### Chunk 2: Preventing Accidental Mutation
- **Topics:** Common mutation bugs eliminated by readonly, comparison with docblock-only immutability
- **Key Content:** Before/after patterns, mutation in collections, unintended side effects
- **Learning Objectives:** Explain the class of bugs that `readonly` prevents and why convention-based immutability is unreliable

### Chunk 3: Constructor Promotion with Readonly
- **Topics:** Combining `readonly` with `__construct()` promotion, typed properties, defaults
- **Key Content:** Clean DTO definition syntax, handling optional/nullable readonly properties, default values
- **Learning Objectives:** Write concise DTO classes using constructor promotion with readonly properties

### Chunk 4: Serialization with Readonly
- **Topics:** `toArray()` with readonly properties, JSON serialization, workarounds for mutable serialization
- **Key Content:** Readonly properties are still readable, creating modified copies via `with*()` methods, array spread workarounds
- **Learning Objectives:** Implement serialization and "modified copy" patterns that respect readonly semantics
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization