# Decomposition: When to Skip Layers

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** When to Skip Layers
- **Difficulty Level:** Intermediate

## Topic Overview
Pragmatic exceptions to layer isolation rules — when skipping is acceptable, decision framework, documentation requirements, exception creep prevention.

## Decomposition Strategy
This KU is the counterpart to Layer Isolation Rules. It defines the exceptions to the rules.

## Proposed Folder Structure
```
when-to-skip-layers/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### When to Skip Layers
- **Purpose:** Define pragmatic exceptions to layer isolation rules
- **Difficulty:** Intermediate
- **Dependencies:** Layer Isolation Rules

## Atomic Chunks

### Chunk 1: The Decision Framework for Skipping
- **Topics:** Questions to ask before skipping, read vs write, operation complexity
- **Key Content:** Not all operations need the full stack
- **Learning Objectives:** Apply the decision framework to determine if a skip is justified

### Chunk 2: Specific Exception Scenarios
- **Topics:** Simple reads, boolean toggles, scalar operations, lookup queries
- **Key Content:** Common patterns where skipping is acceptable
- **Learning Objectives:** Identify operations that qualify for layer skipping

### Chunk 3: Documentation and Safeguards
- **Topics:** @layer-skip annotations, bounded scope, quarterly review
- **Key Content:** Exceptions must be explicit and bounded
- **Learning Objectives:** Document layer skip exceptions properly

### Chunk 4: Exception Creep Prevention
- **Topics:** Regular review, enforcing the default, distinguishing exception from mistake
- **Key Content:** Preventing undocumented exceptions from normalizing rule-breaking
- **Learning Objectives:** Establish processes to prevent exception creep

## Dependency Graph
Depends on: Layer Isolation Rules. Related to: Repository vs Eloquent Decision, Service vs Action Decision.

## Boundary Analysis
**In scope:** When to skip, decision framework, exception documentation, creep prevention.
**Out of scope:** Standard layer rules (covered in Layer Isolation Rules), specific flow patterns (covered in individual flow KUs).

## Future Expansion Opportunities
None — the exception framework is stable.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization