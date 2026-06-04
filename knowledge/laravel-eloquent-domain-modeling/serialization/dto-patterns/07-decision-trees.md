# Decision Trees: DTO Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | DTO Patterns |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | DTO vs Eloquent model at boundaries | Primary |
| 2 | DTO immutability and construction | Architecture |
| 3 | DTO serialization shape | Architecture |

---

## Decision 1: DTO vs Eloquent Model at Boundaries

### Context
Application boundaries (controllers, queue, events) are where data enters or leaves. Returning Eloquent models at boundaries leaks internal structure. DTOs decouple the internal representation from the external contract.

### Criteria
- Is this an application boundary (controller, queue, event, CLI)?
- Is the data going to multiple channels (API + queue + broadcast)?
- Does the external consumer need a stable contract?
- Is the application size/DDD maturity warranting the overhead?

### Decision Tree
```
Is this data crossing an application boundary?
├── YES
│   └── Does the data go to multiple channels?
│       ├── YES → Use DTO (single contract for all channels)
│       └── NO (HTTP-only)
│           └── Is API Resource sufficient?
│               ├── YES → Use API Resource (simpler)
│               └── NO (multi-model, typed, or complex shape)
│                   └── Use DTO + optional Resource wrapping
└── NO (internal domain logic)
    └── Use Eloquent models directly (no DTO needed)
```

### Rationale
DTOs are the right tool when data crosses a boundary to an external consumer. They provide type safety, immutability, and a stable contract. For HTTP-only APIs, API Resources offer similar benefits with less boilerplate. For multi-channel applications, DTOs are essential to avoid duplicating serialization logic.

### Recommended Default
DTOs at all external boundaries for multi-channel applications. API Resources for HTTP-only APIs. Never return Eloquent models directly from controllers or service methods that cross boundaries.

### Risks
- DTO for every model: over-engineering for simple CRUD
- Eloquent model at boundary: coupling internal schema to external contract
- Missing DTO update when model changes: stale contract
- DTO in domain logic: unnecessary indirection

### Related Rules/Skills
- Boundary DTO Usage (05-rules.md)
- API Resource Alternative (05-rules.md)
- Multi-Channel Serialization (05-rules.md)

---

## Decision 2: DTO Immutability and Construction

### Context
DTOs should be immutable snapshots of data at a point in time. Promoted readonly constructor properties enforce this. Named constructors centralize creation from different sources.

### Criteria
- Are DTO properties immutable (set once, never changed)?
- Are there multiple creation sources (model, array, request)?
- Is the DTO constructed at a single point or multiple places?
- Are nested/complex types needed?

### Decision Tree
```
Are there multiple sources for DTO creation?
├── YES (model + request + array)
│   └── Use named constructors: fromModel(), fromArray(), fromRequest()
│       └── Are properties complex types (Carbon, enum, ValueObject)?
│           ├── YES → Handle conversions in named constructors
│           └── NO → Simple type mapping
└── NO (single source)
    └── Direct constructor is fine
        └── Use readonly promoted properties for immutability
```

### Rationale
Named constructors centralize mapping logic from different sources. If the model changes columns, only `fromModel()` needs updating. Promoted readonly constructor properties enforce immutability at the language level — no setter methods, no property modification after construction.

### Recommended Default
Promoted readonly constructor properties. Named constructors for each creation source. Immutability enforced by `readonly`.

### Risks
- Mutable DTO properties: risk of mutation-based data leaks
- No named constructors: mapping logic duplicated across callers
- Missing `readonly`: mutation possible after construction
- Business logic in named constructors: DTOs should only map, not compute

### Related Rules/Skills
- Readonly Promoted Properties (05-rules.md)
- Named Constructor Pattern (05-rules.md)
- Immutability Enforcement (05-rules.md)

---

## Decision 3: DTO Serialization Shape

### Context
DTO `toArray()` defines the external contract. The shape (key names, date format, null handling) must be consistent and documented. Changes to `toArray()` are breaking changes for consumers.

### Criteria
- Is the `toArray()` format documented and versioned?
- Are date formats consistent across all DTOs?
- Are nullable fields handled explicitly?
- Is the casing convention (snake_case vs camelCase) consistent?

### Decision Tree
```
Is there an existing API specification (OpenAPI, contract)?
├── YES
│   └── Does toArray() match the spec?
│       ├── YES → Proceed
│       └── NO → Update toArray() to match spec
└── NO
    └── Establish and document conventions:
        ├── Key casing → snake_case or camelCase (pick one)
        ├── Date format → ISO 8601 (recommended)
        └── Null handling → omit null or include with explicit null
```

### Rationale
`toArray()` IS the external contract for the DTO. Every change to `toArray()` is a potential breaking change. Consistent conventions (casing, date format, null handling) across all DTOs make the API predictable for consumers.

### Recommended Default
snake_case keys, ISO 8601 date format, omit null values (use `array_filter` with explicit filter). Document the convention in project standards.

### Risks
- Inconsistent key casing across DTOs: consumer confusion, bugs
- Different date formats across endpoints: parsing errors
- Null handling inconsistency: consumer can't distinguish "omitted" from null
- Breaking changes to `toArray()` without versioning: production failures

### Related Rules/Skills
- Serialization Convention (05-rules.md)
- API Versioning (05-rules.md)
- Null Handling Policy (05-rules.md)
