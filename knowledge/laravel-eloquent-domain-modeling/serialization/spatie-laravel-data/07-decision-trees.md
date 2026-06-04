# Decision Trees: Spatie Laravel Data

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | Spatie Laravel Data |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | DTO approach selection | Primary |
| 2 | Input validation strategy | Architecture |
| 3 | Partial update handling | Architecture |
| 4 | Output transformation approach | Architecture |

---

## Decision 1: DTO Approach Selection

### Context
`spatie/laravel-data` provides automatic casting, validation integration, nested data, and transformers. Manual DTOs offer lighter weight with less magic. The choice affects boilerplate, type safety, and learning curve.

### Criteria
- Is the project already using DTO patterns?
- Does the team know DTO patterns?
- Is automatic type casting from PHP declarations sufficient?
- Are nested data objects needed?
- Is the API input-heavy (validation integration matters)?

### Decision Tree
```
Is the team familiar with DTO patterns?
├── YES
│   └── Are the data structures complex with nesting/casting needs?
│       ├── YES → spatie/laravel-data (reduces boilerplate significantly)
│       └── NO → Manual DTOs (simpler, no dependency)
└── NO → spatie/laravel-data or manual?
    └── Is there willingness to learn DTO patterns?
        ├── YES → spatie/laravel-data (better DX, more features)
        └── NO → API Resources only (no DTOs)
```
```
Is the serialization multi-channel (API + queue + events)?
├── YES → spatie/laravel-data (typed, immutable, channel-agnostic)
└── NO → Are API Resources sufficient?
    ├── YES → Skip DTOs entirely
    └── NO → spatie/laravel-data or manual
```
```
Is automatic casting from PHP type declarations valuable?
├── YES → spatie/laravel-data (casts string → int, string → Carbon, etc.)
└── NO → Manual DTOs (explicit casting in constructors)
```

### Rationale
`spatie/laravel-data` excels when automatic casting, nested data, and validation integration save significant boilerplate. Manual DTOs are sufficient for simple data contracts. The package adds a dependency and a learning curve, so it's worth the cost only when its features are genuinely used.

### Recommended Default
Use `spatie/laravel-data` for multi-channel applications with complex/typed data contracts. Use manual DTOs for simple typed contracts in smaller projects. Use API Resources (no DTOs) for HTTP-only CRUD.

### Risks
- Package dependency for simple use: unnecessary complexity
- Manual DTOs with complex nesting: boilerplate overhead
- Missing custom caster: Uncastable exception at runtime
- Reflection overhead in hot paths: measurable at high throughput
- Team unfamiliarity: DTO avoidance or misuse

### Related Rules/Skills
- spatie/laravel-data for Complex DTOs (05-rules.md)
- Manual DTO for Simple (05-rules.md)
- Caster Registration (05-rules.md)

---

## Decision 2: Input Validation Strategy

### Context
`spatie/laravel-data` Data classes can define `rules()` for input validation. This overlaps with Form Requests. Choosing one validation layer prevents duplication and confusion.

### Criteria
- Is the same Data class used for both input and output?
- Does the validation need conditional rules based on request context?
- Are validation messages customized extensively?
- Are validation rules complex (nested, array, unique with ignored ID)?

### Decision Tree
```
Is the Data class used for both input (from()) and output (toArray())?
├── YES
│   └── Are input validation rules OUTPUT-applicable?
│       ├── YES → Define rules() on Data class (single source of truth)
│       └── NO → Split into InputData (with rules) and OutputData (no rules)
└── NO → Only input or only output
    └── Input → rules() on Data class
    └── Output → No rules() needed; validation irrelevant
```
```
Does the validation need request context (auth, route params)?
├── YES → Form Request (has access to $request, route, auth)
│   └── Data class: no rules(); use Form Request for validation
└── NO → rules() on Data class is sufficient
```
```
Are the validation rules reused across multiple endpoints?
├── YES → rules() on Data class (reusable)
└── NO → Form Request (endpoint-specific rules)
```

### Rationale
`rules()` on Data classes provides reusable validation tied to the data structure. Form Requests provide request-context-aware validation. They overlap but serve different reuse patterns. Using both for the same payload creates two sources of truth. Choose one per input boundary.

### Recommended Default
Use `rules()` on Data classes for pure data validation without request context. Use Form Requests when validation depends on authentication, route parameters, or other request state. Never define `rules()` on a Data class AND use a Form Request for the same endpoint.

### Risks
- rules() + Form Request duplication: validation logic drifts
- rules() without input guarding: invalid data passes silently
- rules() on output-only Data: wasted validation on serialization
- No rules() on input Data: security risk from unvalidated data
- Complex rules in Data class: difficult to test in isolation

### Related Rules/Skills
- rules() for Input Data (05-rules.md)
- Form Request for Context (05-rules.md)
- No Duplicate Validation (05-rules.md)

---

## Decision 3: Partial Update Handling

### Context
PATCH endpoints send only the fields to update. `spatie/laravel-data`'s `Optional` type distinguishes "not provided" from `null`, preventing overwrites of omitted fields.

### Criteria
- Does the endpoint accept partial updates (PATCH)?
- Should omitted fields remain unchanged or be set to null?
- Are there fields that can legitimately be set to null?

### Decision Tree
```
Does the endpoint accept partial updates (PATCH)?
├── YES → Use Optional for all optional fields
│   └── Can a field be explicitly set to null?
│       ├── YES → null|Optional (distinguishes omitted vs null)
│       └── NO → Optional (fields are either present or absent)
└── NO (PUT/POST — full replacement)
    └── Use explicit nullable types where applicable
```
```
Are all fields optional in the PATCH request?
├── YES → All fields use Optional
└── NO → Required fields are typed without Optional; rest use Optional
```
```
Is there a dedicated UpdateData class or the same as CreateData?
├── Dedicated UpdateData → Optional fields, no required rules
└── Same as CreateData → All fields required (problematic for PATCH)
    └── Refactor: create UpdateData with Optional fields
```

### Rationale
Without `Optional`, all fields are required by default. Passing only changed fields means missing fields are interpreted as `null`, overwriting existing data. `Optional` preserves omitted fields. `null|Optional` handles the three-state case: present (value), present-as-null (null), absent (Optional).

### Recommended Default
Create a dedicated `UpdateData` class where all mutable fields use `Optional`. Use `null|Optional` only for fields that accept explicit null values. Never use the same Data class for create and update without Optional handling.

### Risks
- No Optional on PATCH fields: omitted fields become null, overwriting data
- Optional on every field: required fields not enforced on PATCH
- Missing null|Optional: cannot distinguish "set to null" from "not provided"
- Same class for create and update: required rules conflict with PATCH semantics

### Related Rules/Skills
- Use Optional for PATCH (05-rules.md)
- Dedicated UpdateData (05-rules.md)

---

## Decision 4: Output Transformation Approach

### Context
Data objects serialize via `toArray()` and `toJson()`. Transformers customize per-property output. The approach to transformation affects serialization flexibility and complexity.

### Criteria
- Does the output format differ from the input format?
- Are there computed fields at serialization time?
- Is the serialization format consistent across all Data classes?

### Decision Tree
```
Does the output need property transformation (rename, format, compute)?
├── NO → Default toArray() is sufficient
└── YES
    └── Is the transformation per-property or per-class?
        ├── Per-property → Transformer class or closure
        │   └── Is the transformation reusable across Data classes?
        │       ├── YES → Register a global transformer in ServiceProvider
        │       └── NO → Inline transformer closure on the property
        └── Per-class → Override toArray() on the Data class
```
```
Is the transformation complex (nested, conditional, computed)?
├── YES → Consider hybrid: Data class with manual toArray() override
└── NO → Transformers or default toArray()
```
```
Are output-only fields needed (derived, aggregated)?
├── YES → Add read-only properties populated in the constructor
└── NO → No derived fields

### Rationale
Transformers handle fine-grained per-property transformation (e.g., date formatting, enum labels). `toArray()` overrides handle class-level reshaping. Global transformers (registered in a ServiceProvider) ensure consistent cross-cutting transformations (e.g., all Carbon dates → ISO 8601).

### Recommended Default
Use global transformers for consistent cross-cutting formats (dates, enums). Use per-property transformers for specific formatting needs. Override `toArray()` only for structural changes that affect the whole Data class.

### Risks
- Many per-property transformers: performance overhead on serialization
- Overriding toArray() without calling parent: loses global transformations
- Transformer in wrong location: inconsistent formatting across Data classes
- Global transformer side effects: affects all Data classes unexpectedly

### Related Rules/Skills
- Global Transformers for Consistency (05-rules.md)
- Per-Property Transformers (05-rules.md)
- toArray() Override for Structure (05-rules.md)
