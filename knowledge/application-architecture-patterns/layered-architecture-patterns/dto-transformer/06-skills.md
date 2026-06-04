# Skill: Implement Data Transfer Objects and Transformers

## Purpose
Create immutable DTOs for structured data transfer between layers and Transformers to convert Domain/Application objects into API response formats, keeping layer boundaries clean and responses consistent.

## When To Use
- Passing data between layers (presentation → application → domain)
- API response formatting differs from internal representation
- Multiple callers need different views of the same data
- Need to decouple internal objects from API contracts

## When NOT To Use
- Direct Eloquent serialization is sufficient (simple CRUD APIs)
- Response format matches internal structure exactly
- Prototyping where speed is priority over API contract stability

## Prerequisites
- PHP 8.1+ for readonly properties and promoted constructor
- Defined layer structure (Application layer for DTOs)
- API response structure documentation

## Inputs
- Data contracts between layers
- API response specifications
- Current JSON response structure
- Domain object structure

## Workflow
1. **Identify DTO boundaries.** Determine where data crosses layer boundaries: Controller → Use Case (input), Use Case → Controller (output), API response formatting. Each crossing is a DTO candidate.

2. **Create input DTOs for Use Case methods.** Create readonly classes with typed properties. Use named constructors for creation from HTTP Request or CLI input. Never pass Request objects to Application/Domain layers.

3. **Create output DTOs for Use Case responses.** Define readonly DTOs representing return data. Use only primitives and other DTOs — no Domain objects. Include only data the caller needs.

4. **Create Transformers for API responses.** Build transformer classes or `JsonResource` classes for converting Domain/Application objects to API response arrays. One transformer per entity/response type.

5. **Implement `toArray()` on Transformers.** Return structured arrays matching the API contract. Handle relationship inclusion (`include`, `with`). Support sparse fieldsets if needed.

6. **Handle collections.** Create a collection transformer for paginated or multi-item responses. Maintain consistent JSON envelope (`data`, `meta`, `links`).

7. **Test DTO creation and transformation.** Test DTO construction from valid input, errors from invalid input, and Transformer output structure. Assert the exact API response format.

## Validation Checklist
- [ ] DTOs are readonly (PHP 8.1+ readonly class or immutable)
- [ ] DTOs contain only primitives and other DTOs
- [ ] No Domain objects passed as DTOs
- [ ] DTOs exist in Application layer (not Domain, not Presentation)
- [ ] No Request objects passed to Use Cases
- [ ] Transformers output consistent API structure
- [ ] Transformers handle relationships correctly
- [ ] Tests verify exact API response format
- [ ] Transformers are stateless (no session/dependency on request state)

## Common Failures
- **DTOs as anemic data bags.** DTOs with no self-validation. Validate input before or during DTO construction.
- **Domain objects in DTO roles.** Passing Domain Entities directly as response data — use Transformers or JSON Resources.
- **Shared mutable DTOs.** DTOs modified after creation — enforce immutability with readonly properties.
- **Transformer coupled to Eloquent.** Transformers requiring Eloquent models — they should accept Domain objects or DTOs.
- **Over-fragmentation.** Too many DTO types for the same data — one DTO per use case boundary is sufficient.

## Decision Points
- **readonly class vs final class with private readonly props?** Use `readonly class` (PHP 8.2+) for simplicity; `final class` for more control.
- **JsonResource vs custom Transformer?** Use `JsonResource` for simple API responses integrated with Laravel; custom Transformers when independent of Laravel's serialization.
- **Manual DTO vs spatie/data-transfer-object?** Manual DTO for most cases; third-party package for complex DTO hierarchies.

## Performance Considerations
- DTO construction and copying is cheap — negligible overhead.
- For high-throughput endpoints, minimize DTO transformation by reusing cached response representations.
- JsonResource wrapping adds overhead proportional to relationship depth — profile for deeply nested responses.

## Security Considerations
- Transformers must not expose sensitive fields (passwords, tokens, internal IDs). Explicitly list fields in `toArray()`, never use `$this->all()` or `$this->toArray()` from Model.
- DTOs should strip sensitive data before crossing layer boundaries.
- API response envelope consistency prevents information leakage through varying structures.

## Related Rules
- Rule: DTOs Are Readonly (LAP-14/05-rules.md)
- Rule: DTOs Are Primitive-Only (LAP-14/05-rules.md)
- Rule: No Domain Objects as DTOs (LAP-14/05-rules.md)
- Rule: No Request Objects in Use Cases (LAP-14/05-rules.md)
- Rule: Transformers Produce Consistent API Structure (LAP-14/05-rules.md)
- Rule: Test Response Format (LAP-14/05-rules.md)
- Rule: Transformers Must Not Expose Sensitive Fields (LAP-14/05-rules.md)

## Related Skills
- Design Use Case Classes (LAP-11/06-skills.md)
- Build Form Request Validation Boundaries (LAP-12/06-skills.md)
- Build API Resources (SLP-12/06-skills.md)
- Implement Value Objects (LAP-07/06-skills.md)

## Success Criteria
- DTOs are readonly with typed properties and exist in the Application layer.
- Use Case methods accept DTOs (not Request objects) and return DTOs (not Domain objects).
- Transformers produce consistent, tested API response structures.
- No sensitive fields are exposed through response formatting.
