# Decision Trees: DTO Pattern

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** DTO pattern: structured data transfer between layers
- **Knowledge Unit ID:** SLP-05
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | DTO vs array for layer boundary data | Architecture | Data transfer design |
| 2 | Use-case-specific DTO vs shared entity-wide DTO | Architecture | DTO creation |
| 3 | Immutable DTO with behavior vs pure data container | Architecture | DTO design |

---

## Decision 1: DTO vs array for layer boundary data

### Context
DTOs provide type safety, documentation, and immutability for data crossing layer boundaries. Arrays are simpler but lack type safety — missing keys or wrong types are caught at runtime, not compile time. The choice depends on the operation type and performance requirements.

### Decision Tree

```
Is this a write operation (create, update, command)?
├── YES → Use typed DTO — type safety prevents runtime errors
│   Is the DTO construction overhead acceptable?
│   ├── YES → DTO is correct for this write operation
│   └── NO → DTO overhead still justified for write path safety
└── NO (read operation / list response)
    Is this a high-throughput list returning 1000+ items?
    ├── YES → Consider arrays for performance (avoid DTO allocation overhead)
    └── NO → DTO for single-item reads; array for moderate lists
```

### Rationale
DTOs provide compile-time type checking — PHPStan can catch a missing field before runtime. Arrays provide no such safety. For write operations, type safety is critical because incorrect data affects state. For read-heavy list responses, the DTO allocation overhead may justify using arrays.

### Recommended Default
DTOs for write operations; arrays for high-throughput list responses

### Risks
- Array for write operations: runtime errors from missing/wrong keys
- DTO for 1000+ item lists: allocation overhead, GC pressure
- Array for complex return types: no documentation or IDE autocompletion

### Related Rules
- DTOs Must Be Immutable (SLP-05/05-rules.md)
- No Behavior in DTOs (SLP-05/05-rules.md)
- Keep DTOs Use-Case-Specific (SLP-05/05-rules.md)

### Related Skills
- Implement Data Transfer Objects for Layer Boundaries (SLP-05/06-skills.md)
- Design Use Case Classes (SLP-06/06-skills.md)
- Implement Value Objects (LAP-07/06-skills.md)

---

## Decision 2: Use-case-specific DTO vs shared entity-wide DTO

### Context
Each use case should have its own specific input/output DTOs. A shared `UserDto` containing ALL possible user fields for ALL use cases becomes a god object — hard to construct, hard to read, and coupling all consumers to the union of all possible fields.

### Decision Tree

```
Does this DTO serve a single use case?
├── YES → Use-case-specific DTO (correct)
│   Name after the use case: RegisterUserInput, UpdateProfileOutput
└── NO → Shared across multiple use cases
    Are the fields identical across all consumers?
    ├── YES → Shared DTO may be acceptable (rare)
    │   Use consistent naming: UserData, OrderSummary
    └── NO → Split into use-case-specific DTOs
        Only common fields should be in a base/shared type
```

### Rationale
Use-case-specific DTOs are precise — they contain exactly the fields the use case needs. Shared DTOs inevitably grow to include all possible fields for all consumers, becoming a union type that's confusing and fragile. The cost of creating more DTOs is negligible; the cost of debugging a shared DTO with nullable fields is real.

### Recommended Default
Use-case-specific DTOs

### Risks
- Shared DTO: god object with 20+ nullable fields
- Shared DTO: every use case change affects all consumers
- Too many DTOs: bloat if every simple change creates new DTO files

### Related Rules
- Keep DTOs Use-Case-Specific (SLP-05/05-rules.md)
- DTOs Must Be Immutable (SLP-05/05-rules.md)
- No Behavior in DTOs (SLP-05/05-rules.md)

### Related Skills
- Implement Data Transfer Objects for Layer Boundaries (SLP-05/06-skills.md)
- Design Use Case Classes (SLP-06/06-skills.md)

---

## Decision 3: Immutable DTO with behavior vs pure data container

### Context
DTOs must be pure data containers — no business logic, no behavior methods. Immutability (readonly properties) ensures data cannot change after construction. Adding behavior to DTOs blurs the line between DTOs and value objects or entities.

### Decision Tree

```
Does the DTO have any methods beyond construction/static factories?
├── YES
│   Is the method a static factory (fromArray, fromRequest)?
│   ├── YES → Acceptable — construction logic is allowed
│   └── NO (business logic, calculation, validation)
│       → REFACTOR: Move behavior to domain entity or domain service
│           DTO: RegisterUserInput { name, email, password }
│           Domain: User::register(input) — behavior here, not in DTO
└── NO → Pure data container — correct
    Are all properties readonly?
    ├── YES → Immutable — correct DTO design
    └── NO → Make properties readonly for immutability
```

### Rationale
Adding behavior to DTOs violates their purpose as data transfer contracts. Business logic belongs in domain entities where it can be tested and reused. Immutability prevents accidental mutation bugs and makes DTOs safe to pass across any boundary.

### Recommended Default
DTOs are immutable pure data containers with readonly properties

### Risks
- Behavior in DTOs: domain logic scattered across DTOs instead of domain entities
- Mutable DTOs: accidental mutation bugs, unpredictable data flow
- Static factory only: no `fromRequest()` means HTTP construction leaks into use cases

### Related Rules
- DTOs Must Be Immutable (SLP-05/05-rules.md)
- No Behavior in DTOs (SLP-05/05-rules.md)
- Avoid HTTP Coupling (SLP-05/05-rules.md)
- Use fromRequest Factories (SLP-05/05-rules.md)

### Related Skills
- Implement Data Transfer Objects for Layer Boundaries (SLP-05/06-skills.md)
- Implement Value Objects (LAP-07/06-skills.md)
- Design Use Case Classes (SLP-06/06-skills.md)
