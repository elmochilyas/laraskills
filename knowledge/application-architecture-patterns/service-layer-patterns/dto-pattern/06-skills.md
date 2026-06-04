# Skill: Implement Data Transfer Objects for Layer Boundaries

## Purpose
Create immutable, typed DTOs using PHP 8.1+ readonly promoted constructors for structured data transfer between architectural layers. Keep DTOs use-case-specific, free of business logic and HTTP coupling.

## When To Use
- Passing arrays between layers causes errors from missing keys or wrong types
- Multiple delivery mechanisms (HTTP + CLI + queue) share the same use cases
- Team values type safety at layer boundaries

## When NOT To Use
- Simple application where `$request->validated()` directly in the service is acceptable
- Read-heavy list responses where DTO allocation overhead is significant

## Prerequisites
- PHP 8.1+ for readonly promoted constructor properties
- Understanding of layer boundaries (controller ↔ service ↔ repository)

## Inputs
- Data contracts between layers
- Identified input and output data shapes per use case

## Workflow
1. **Create DTOs using PHP 8.1+ promoted constructors with `readonly` properties.** Use `public function __construct(public readonly string $name, ...)`. This ensures immutability with minimal boilerplate.

2. **Keep DTOs use-case-specific, not entity-wide.** Create `RegisterUserInput` and `UpdateProfileInput` — not a single `UserDto` with 20+ nullable fields. Each use case gets its own specific DTO.

3. **Never add behavior to DTOs.** DTOs are pure data containers with no business logic. Static factory methods (`fromRequest()`, `fromArray()`) are acceptable — they are construction logic, not behavior.

4. **Avoid HTTP coupling in DTOs.** Use only plain PHP types. No `Illuminate\Http\Request`, `UploadedFile`, or other framework-specific imports.

5. **Implement `JsonSerializable` for complex DTOs.** For DTOs with nested objects, `DateTimeImmutable`, or custom types, implement `JsonSerializable` to ensure correct serialization.

6. **Use `fromRequest()` factory methods for HTTP construction.** Provide a static `fromRequest()` method that maps validated request data to DTO properties. This centralizes construction logic.

7. **Consider performance for read-heavy lists.** Avoid DTO allocation overhead for high-throughput endpoints returning large collections. Use plain arrays or dedicated read models for read-heavy list responses.

## Validation Checklist
- [ ] DTOs are immutable (readonly properties, no setters)
- [ ] DTOs contain no business logic (only construction/validation)
- [ ] DTOs contain no HTTP framework imports
- [ ] Each use case has specific input/output DTOs
- [ ] DTOs serialize correctly (JsonSerializable if needed)
- [ ] fromRequest() factory methods exist for HTTP construction
- [ ] Read-heavy lists avoid DTO allocation overhead

## Common Failures
- **DTO with behavior.** Adding business logic methods — DTO becomes a hybrid data-behavior object.
- **DTO as god object.** A `UserDto` containing ALL possible fields for ALL use cases.
- **HTTP coupling.** Importing `Illuminate\Http\Request` into a DTO — prevents construction outside HTTP.

## Decision Points
- **DTO vs array for return types?** Use DTOs for write operations and single-item responses; use arrays for read-heavy list endpoints.

## Performance Considerations
- DTO creation allocates objects. For endpoints returning thousands of rows, DTO allocation can be significant.
- Consider arrays for read-heavy list responses, DTOs for write operations.

## Security Considerations
- DTOs contain no security logic. Validation occurs before DTO creation (Form Requests).

## Related Rules
- Rule: DTOs Must Be Immutable (SLP-05/05-rules.md)
- Rule: No Behavior in DTOs (SLP-05/05-rules.md)
- Rule: Keep DTOs Use-Case-Specific (SLP-05/05-rules.md)
- Rule: Avoid HTTP Coupling (SLP-05/05-rules.md)
- Rule: Use Promoted Constructor Properties (SLP-05/05-rules.md)
- Rule: Implement JsonSerializable (SLP-05/05-rules.md)
- Rule: Use fromRequest Factories (SLP-05/05-rules.md)

## Related Skills
- Design Use Case Classes (SLP-06/06-skills.md)
- Implement Value Objects (LAP-07/06-skills.md)
- Build Form Request Validation (LAP-12/06-skills.md)

## Success Criteria
- DTOs are immutable with readonly properties and use-case-specific shapes.
- No business logic or HTTP coupling exists in DTOs.
- DTOs serialize correctly and have `fromRequest()` factory methods.
- Read-heavy list endpoints use arrays to avoid allocation overhead.
