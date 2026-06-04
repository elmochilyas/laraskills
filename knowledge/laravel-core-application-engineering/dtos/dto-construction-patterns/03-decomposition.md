# Decomposition: DTO Construction Patterns

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO Construction Patterns
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Named Static Factory Pattern
- **Topics:** `fromRequest()`, `fromModel()`, `fromArray()` static methods
- **Key Content:** Per-source named constructors, encapsulating mapping logic, type safety per source
- **Learning Objectives:** Implement named static factories for each source type (HTTP request, Eloquent model, array)

### Chunk 2: Single fromArray with Internal Mapping
- **Topics:** Universal `fromArray()` with internal switch/dispatch, source discrimination
- **Key Content:** Tradeoffs (simplicity vs clarity), handling different key formats, validation at construction
- **Learning Objectives:** Implement and evaluate the single-entry-point construction strategy

### Chunk 3: Constructor Injection with Named Arguments
- **Topics:** Direct `new DTO(...)` with PHP 8 named arguments, no factory
- **Key Content:** When constructor injection is appropriate (simple DTOs, internal callers), skipping factories for clarity
- **Learning Objectives:** Identify scenarios where direct constructor invocation is preferable to factory methods

### Chunk 4: Decision Framework for Construction Strategy
- **Topics:** Comparing all three patterns, team conventions, mixed strategies
- **Key Content:** Tradeoff matrix: source variety, validation needs, serialization requirements, codebase consistency
- **Learning Objectives:** Select and enforce a consistent construction strategy based on project-specific requirements
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization