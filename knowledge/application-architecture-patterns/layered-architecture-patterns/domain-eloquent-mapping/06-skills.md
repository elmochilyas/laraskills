# Skill: Map Domain Entities to Eloquent Models

## Purpose
Build explicit mapping infrastructure between Domain Entities (pure business objects with behavior) and Eloquent Models (database representation with persistence), isolating Domain from database concerns.

## When To Use
- Clean Architecture or DDD where Domain entities are separate from Eloquent models
- Database schema differs from Domain model structure
- Need to enforce Aggregate consistency boundaries
- Business logic must be testable without database

## When NOT To Use
- Simple CRUD where Domain entity equals database schema
- Active Record pattern is sufficient (Entity IS the Eloquent model)
- Mapping overhead is not justified by complexity

## Prerequisites
- Domain Entity classes (pure PHP) and Eloquent Model classes
- Repository interface for Aggregate persistence
- Understanding of Aggregate Root pattern

## Inputs
- Domain Entity/Aggregate definitions
- Eloquent Model (table schema) definitions
- Repository interface methods
- Mapping strategy preference

## Workflow
1. **Define mapping direction: Domain → Model (write) and Model → Domain (read).** Build separate methods or classes for each direction. Keep mapping logic in Infrastructure, not in Domain or Eloquent models.

2. **Implement Model → Domain mapping (hydrator).** In the Repository implementation, convert Eloquent Model(s) to Domain Entity/Aggregate. Handle related models, nested entities, and Value Objects. Recursively construct the full Aggregate.

3. **Implement Domain → Model mapping (extractor).** Extract data from Domain Entity into a format suitable for Eloquent. Flatten Value Objects to primitives. Handle nested entities for upsert.

4. **Handle persistence diffs.** Compare current Model state against Domain Aggregate changes. Apply only changed fields using `$model->fill()` or attribute-by-attribute assignment. Use Eloquent's `wasChanged()` for optimization.

5. **Handle Value Object mapping.** Convert between Value Object (Domain) and primitive/full-column (database). Provide explicit mapping in both directions. Use custom Eloquent casts as an alternative for simple Value Objects.

6. **Write mapping tests.** Test round-trip: create Domain Aggregate → map to Model → save → reload → map to Domain Aggregate → assert equality. Test partial updates. Test Value Object conversion.

## Validation Checklist
- [ ] Mapper exists in Infrastructure, not in Domain or Model
- [ ] Mapping is bidirectional (Domain → Model, Model → Domain)
- [ ] Value Objects are fully mapped in both directions
- [ ] Nested entities/relationships are mapped recursively
- [ ] Persistence diff is handled (full replace or field-level update)
- [ ] Round-trip tests pass (Domain → Model → Domain equals original)
- [ ] No Domain logic leaks into mapping code
- [ ] No Eloquent-specific code in Domain Entities
- [ ] Repository returns Domain Entities, not Eloquent Models

## Common Failures
- **Domain dependencies in mapping.** Mapper logic that invokes Domain behavior during mapping — mapping should be structural, not behavioral.
- **Eloquent in Domain.** Returning Eloquent collections from Repository interface. Repository must return Domain objects.
- **Circular mapping.** Related entities mapping back to parent creating infinite loops. Break cycles with reference IDs.
- **Over-mapping.** Mapping every single field even when entire Aggregate is never used. Map only what's consumed.
- **Identity mismatch.** Domain identity (UUID string) vs database identity (incrementing int). Maintain both if needed.

## Decision Points
- **Explicit mapper class vs Eloquent casts?** Use explicit mapper class for complex Aggregates with multiple nested entities; use Eloquent `casts` for simple Value Object mapping.
- **Full replacement vs Diff-based persistence?** Full replacement (delete all relations, re-insert) for small Aggregates; diff-based for performance-critical paths.

## Performance Considerations
- Mapping overhead: measure by profiling real-world aggregates, not micro-benchmarks.
- Lazy loading vs eager loading in hydrator: eager load known relationships to avoid N+1.
- Batch operations: map in bulk, persist in single transaction for throughput.

## Security Considerations
- Domain Entities control what data is exposed through behavior methods — use DTOs for API responses, never raw domain data.
- Ensure mapping does not expose internal Entity state to unauthorized callers.

## Related Rules
- Rule: Mapper in Infrastructure Layer (LAP-10/05-rules.md)
- Rule: Repository Returns Domain Entities (LAP-10/05-rules.md)
- Rule: Map Bidirectionally (LAP-10/05-rules.md)
- Rule: Handle Nested Entities Recursively (LAP-10/05-rules.md)
- Rule: Value Object Mapping Preserves Equality (LAP-10/05-rules.md)
- Rule: Mapping Is Structural, Not Behavioral (LAP-10/05-rules.md)
- Rule: Write Round-Trip Mapping Tests (LAP-10/05-rules.md)
- Rule: Explicit Mapper for Complex Aggregates (LAP-10/05-rules.md)

## Related Skills
- Apply Domain-Driven Design Tactical Patterns (LAP-06/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
- Implement Value Objects (LAP-07/06-skills.md)
- Apply Clean Architecture Layers (LAP-02/06-skills.md)

## Success Criteria
- Mapper classes convert Domain Entities ↔ Eloquent Models bidirectionally.
- Repository returns Domain objects, not Eloquent Models.
- Round-trip tests confirm Domain → Model → Domain produces identical Aggregates.
- No Eloquent-specific code exists in Domain classes.
