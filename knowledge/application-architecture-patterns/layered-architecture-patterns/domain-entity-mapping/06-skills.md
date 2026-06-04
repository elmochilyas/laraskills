# Skill: Map Domain Entities to Eloquent Models with Bidirectional Mappers
## Purpose
Create and maintain explicit bidirectional mapping between pure Domain entities and Eloquent models in the Infrastructure layer — converting between business objects and database representations with complete field coverage, eager loading, roundtrip-tested symmetry, and intermediate DTOs for complex mappings.
## When To Use
- Full Clean Architecture with framework-independent Domain layer
- Domain entities significantly differ from database schema structure
- Applications requiring explicit separation between business objects and persistence
## When NOT To Use
- Laravel DDD approach (Domain entities ARE Eloquent models — accept the coupling)
- Simple mapping where Domain entity and database schema are nearly identical
- Projects where mapping overhead exceeds the benefit of framework independence
## Prerequisites
- LAP-05 Domain layer: pure PHP entities with identity, value objects, domain services
- LAP-07 Infrastructure layer: Eloquent models in Infrastructure namespace
- LAP-09 framework independence decision documented (full independence justifies mappers)
- Integration test database for roundtrip mapper tests
## Inputs
- Domain entity definition (class with typed properties, value objects, relations)
- Eloquent model definition (table columns, relationships, casts)
- Repository interface from Domain layer (which queries/operations need mapping)
## Workflow
1. Place mapper class in Infrastructure namespace (`App\Infrastructure\Persistence\InvoiceMapper`) — never in Domain or Application
2. Implement `toDomain(InvoiceModel $model): Invoice` — convert from Eloquent model to Domain entity, mapping each field explicitly
3. Implement `toEloquent(Invoice $invoice): array` — convert from Domain entity to array for Eloquent `updateOrCreate()`, mapping each field explicitly
4. Eager-load ALL needed relationships before calling `toDomain()`: `InvoiceModel::with('items.product.category', 'customer')->findOrFail($id)`
5. Map ALL fields between Domain entity and Eloquent model — no partial field mapping, no pass-through of unmapped fields
6. For complex mappings (nested objects, calculated conversions), use intermediate DTO: `modelToDto()` → `DtoToDomain()` — decouples mapping steps
7. Use mapper in repository implementation: `find()` loads model → calls `toDomain()`; `save()` calls `toEloquent()` → `updateOrCreate()`
8. Write roundtrip test: create Domain entity → `toEloquent()` → `toDomain()` → verify all fields identical (domain → model → domain)
9. Handle identity mapping: `updateOrCreate` based on Domain entity ID to update existing records rather than always creating new
10. Add architecture test: mapper class has zero imports from Domain that break dependency rule (mapper depends on both, which is acceptable in Infrastructure)
## Validation Checklist
- [ ] Mapper is in Infrastructure namespace, not Domain or Application
- [ ] `toDomain()` and `toEloquent()` map ALL fields explicitly (no partial mapping)
- [ ] Eager loading before mapping (no lazy loading triggered in `toDomain()`)
- [ ] Roundtrip test passes: domain → eloquent → domain preserves all fields
- [ ] Complex mappings use intermediate DTO (decoupled mapping steps)
- [ ] Identity handled correctly: update existing record, don't duplicate on save
- [ ] No transformation logic duplicated with Eloquent casts (single source of truth)
- [ ] Mapper doesn't expose sensitive data beyond what Domain entity defines
- [ ] Roundtrip test covers edge cases: null values, empty collections, special floats
- [ ] Architecture tests verify mapper location and imports
## Common Failures
- **Partial mapping:** Some fields mapped in mapper, others passed through directly. Fix: map all fields explicitly in the mapper.
- **Lazy loading in mapper:** Accessing `$model->items` triggers new query. Fix: eager-load all needed relationships before calling mapper.
- **Roundtrip failure:** domain → model → domain produces different object (timezone trunctation, float precision, null handling). Fix: test roundtrip with representative values.
- **Identity crisis:** Duplicated logic between Eloquent casts and mapper. Fix: keep transformations in one place (mapping handles domain-specific conversion, casts handle persistence format).
- **Skipping mapper under time pressure:** Direct Eloquent usage creeps in. Fix: document partial independence decision rather than inconsistently skipping mapping.
## Decision Points
- **Full mapper vs partial independence:** Domain and DB schema diverge significantly = full mapper. Nearly identical = consider Laravel DDD (partial independence, document decision).
- **Intermediate DTO vs direct mapping:** Complex transformations (nested objects, multiple value objects from one column) = intermediate DTO. Simple field copies = direct mapping.
- **Full vs minimal mapping:** Every field mapped explicitly = safe but verbose. Read-only queries that project specific fields = acceptable intentional partial mapping.
## Performance Considerations
- Each mapping operation creates new objects with memory allocation — profile if high throughput
- Mapper overhead is typically <1ms per operation for simple entities
- Deep object graphs (Order → LineItems → Product) create cascading mapping costs
- For high-volume read-only endpoints, consider caching mapped Domain entities or using direct Eloquent query DTOs
## Security Considerations
- Mapper should not transform or expose data beyond what Domain entity defines
- Ensure mapper doesn't accidentally expose internal model attributes (password hashes, internal flags)
- Sensitive fields (SSN, tokens) should be explicitly mapped and handled in Domain, not passed through via JSON columns
- Mapper tests should verify sensitive fields are never exposed in output DTOs
## Related Rules (from 05-rules.md)
- Maintain Mappers in Infrastructure Layer
- Write Bidirectional Mapper Tests
- Eager Load Before Mapping
- Avoid Partial Mapping
- Test Roundtrip for Every Aggregate
- Consider DTO as Intermediate Form
- Avoid Identity Crisis in Mappers
## Related Skills
- Domain Layer Modeling (LAP-05)
- Infrastructure Adapters (LAP-07)
- Framework Independence Decisions (LAP-09)
- Architecture Tests (LAP-13)
## Success Criteria
- Every aggregate root with framework-independent Domain has a dedicated mapper
- All mappers have passing roundtrip tests (domain → model → domain field equivalence)
- Zero lazy loading events during any mapper execution (verified by query count assertions)
- All fields explicitly mapped — no partial mapping gaps
- Mapper lives in Infrastructure, verified by architecture tests
