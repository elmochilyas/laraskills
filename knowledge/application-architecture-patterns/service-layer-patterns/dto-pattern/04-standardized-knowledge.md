# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: DTO pattern: structured data transfer between layers
Knowledge Unit ID: SLP-05
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Data Transfer Objects (DTOs) are immutable objects that carry data between architectural layers. They ensure type safety, provide explicit contracts, and decouple layers by preventing raw arrays or framework-specific objects from passing through boundaries. In the Service Layer pattern, DTOs are used as input (request → DTO → use case) and output (use case → DTO → response). They replace associative arrays with typed, documented, and validated value containers.

---

# Core Concepts

- **DTOs are immutable**: `readonly` properties, no setters, no behavior.
- **DTOs are not entities**: No identity, no business logic, no behavior. Pure data containers.
- **Input DTO + Output DTO**: Each use case has specific input/output DTOs.

---

# When To Use

- Passing arrays between layers causes errors from missing keys or wrong types.
- Application has multiple delivery mechanisms (HTTP + CLI + queue sharing same use cases).
- Team values type safety at layer boundaries.

---

# When NOT To Use

- Simple application where `$request->validated()` directly in the service is acceptable.
- Read-heavy list responses where DTO allocation overhead is significant.

---

# Best Practices

- **Use PHP 8.1+ promoted constructors with `readonly` properties.** WHY: Concise DTO definitions without boilerplate. Framework DTO packages are less necessary now.
- **Never add behavior to DTOs.** WHY: Behavior belongs in entities or domain services. DTOs are pure data containers — adding methods violates their purpose.
- **Keep DTOs use-case-specific, not entity-wide.** WHY: A `UserDto` containing ALL possible user fields for ALL use cases becomes a god object. Each use case needs its own specific DTO.
- **Avoid HTTP coupling in DTOs.** WHY: DTOs should contain only plain PHP types — no `Illuminate\Http\Request` or `UploadedFile`.

---

# Architecture Guidelines

- DTOs constructed from request data via `fromRequest()` static factory.
- DTOs can contain nested DTOs.
- Input DTO → Use Case → Output DTO — clean contract between layers.
- For collection responses, use DTO arrays or typed DTO collections.

---

# Performance Considerations

- DTO creation allocates objects. For high-throughput endpoints returning large collections, DTO allocation can be significant.
- Consider arrays for read-heavy list responses, DTOs for write operations.

---

# Security Considerations

- DTOs contain no security logic. They are data containers only.
- Validation occurs before DTO creation (Form Requests).

---

# Common Mistakes

1. **DTO with behavior:** Adding business logic methods. Cause: convenience. Consequence: DTO is no longer a pure data container. Better: keep behavior in domain objects.

2. **DTO as god object:** A `UserDto` containing ALL fields for ALL use cases. Cause: reusing one DTO everywhere. Consequence: hard to construct, hard to read. Better: per-use-case DTOs.

3. **HTTP coupling:** Importing `Illuminate\Http\Request` into a DTO. Cause: convenience. Consequence: DTO can only be constructed from HTTP context. Better: use plain PHP types only.

---

# Anti-Patterns

- **DTO bloat**: 50+ near-identical DTOs. Share DTOs across similar use cases.
- **DTO serialization issues**: DTOs with `DateTimeImmutable` or nested objects not serializing correctly. Implement `JsonSerializable`.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-04 Pyramid architecture | SLP-06 Use Case classes | CPC-01 Interface contracts |
| COS-08 Naming conventions | SLP-09 Dependency injection | LAP-10 Domain entity mapping |

---

# AI Agent Notes

- Generate read-only DTOs with promoted constructors.
- Each use case gets its own input/output DTOs.
- DTOs should have `fromRequest()` factory methods.
- Never add behavior or HTTP coupling to DTOs.

---

# Verification

- [ ] DTOs are immutable (readonly properties)
- [ ] DTOs contain no business logic
- [ ] DTOs contain no HTTP framework imports
- [ ] Each use case has specific input/output DTOs
- [ ] DTOs serialize/deserialize correctly
