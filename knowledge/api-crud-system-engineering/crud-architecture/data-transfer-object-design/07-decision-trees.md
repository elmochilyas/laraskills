# Decision Trees — Data Transfer Object Design

## Tree 1: DTO Granularity — Per-Operation vs Per-Entity

**Decision Context**: Choosing between creating separate DTOs per operation (CreateUserDto, UpdateUserDto) or a single DTO per entity (UserDto).

**Decision Criteria**:
- Field overlap between create and update operations
- Number of optional/nullable fields
- Validation rule differences per operation

**Decision Tree**:
```
Do create and update operations use significantly different fields (<70% overlap)?
├── YES → Per-operation DTOs: CreateUserDto, UpdateUserDto — avoids nullable fields for required data
└── NO → Do create and update have different validation rules or field requirements?
    ├── YES → Per-operation DTOs — keeps validation intent clear per operation
    └── NO → Per-entity DTO: UserDto — single DTO for all operations, simpler
```

**Rationale**: Per-operation DTOs prevent nullable field proliferation and keep each operation's contract precise.

**Recommended Default**: Per-operation DTOs for larger codebases (>50k LOC). Per-entity DTOs for smaller codebases where create/update fields rarely diverge.

**Risks**: Per-entity DTO with many nullable fields (`?string $field` for create but required for update) creates confusing contracts.

---

## Tree 2: Immutability Strategy

**Decision Context**: Whether to enforce DTO immutability via readonly classes, readonly properties, or mutable with convention.

**Decision Criteria**:
- PHP version (8.1+ for readonly properties, 8.2+ for readonly classes)
- Framework compatibility
- Serialization needs
- Team preference

**Decision Tree**:
```
Is the project on PHP 8.2+?
├── YES → Use readonly class — simplest, all properties implicitly readonly
└── NO → Is the project on PHP 8.1+?
    ├── YES → Use public readonly properties on a regular class
    └── NO → Use immutable convention — private/protected with getters only (legacy PHP)
```

**Rationale**: Readonly classes (PHP 8.2+) are the clearest and most concise immutability declaration.

**Recommended Default**: `readonly class CreateUserDto` on PHP 8.2+. `public readonly` properties on PHP 8.1.

**Risks**: No immutability enforcement leads to DTOs being modified in unexpected places. Readonly limitations (no lazy properties, no __wakeup issues) may require mutation in edge cases.
