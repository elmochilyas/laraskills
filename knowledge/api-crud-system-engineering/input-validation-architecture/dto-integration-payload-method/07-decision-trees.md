# Decision Trees — DTO Integration: payload() Method

## Tree 1: payload() vs validated() Direct

**Decision Context**: Whether to add a `payload()` method to a FormRequest or use `$request->validated()` directly in the controller.

**Decision Criteria**:
- DTO usage (does the endpoint use a typed DTO?)
- Number of validated fields
- Need for server-generated fields

**Decision Tree**:
```
Does the endpoint use a typed DTO for business logic?
├── YES → Add payload() method — returns typed DTO, compile-time safety
└── NO → Does the controller need server-generated fields merged with validated data?
    ├── YES → Add payload() method — keeps merging logic with the request, not the controller
    └── NO → Is the validated data passed directly to Model::create()?
        ├── YES → Use $request->validated() directly — no DTO needed
        └── NO → Use $request->validated() — simple enough for direct use
```

**Rationale**: `payload()` is valuable when DTOs are used or when server-generated fields must be merged. Simple CRUD without DTOs can use `validated()` directly.

**Recommended Default**: Add `payload()` when using DTOs. Use `validated()` directly for simple CRUD.

**Risks**: Adding `payload()` without a DTO adds unnecessary method. Using `validated()` directly with DTOs bypasses type safety.

---

## Tree 2: payload() Data Source

**Decision Context**: What data to include in the DTO returned by `payload()`.

**Decision Criteria**:
- Data source (validated input vs server-generated)
- Security implications
- Audit requirements

**Decision Tree**:
```
Does the data come from user input?
├── YES → Use $this->validated() only — never $this->input() or $this->all()
└── NO → Is the data server-generated (user ID, IP, timestamps)?
    ├── YES → Merge from authenticated context — $this->user()->id, $this->ip()
    └── NO → Is the data derived from validated input (slug, total)?
        ├── YES → Compute in payload() from validated data only
        └── NO → Don't include — data doesn't belong in the DTO
```

**Rationale**: Only validated input and server-generated fields should enter the DTO. Raw input bypasses validation rules.

**Recommended Default**: `$this->validated()` + server-generated fields from authenticated context.

**Risks**: Including unvalidated data (`$this->input()`) bypasses validation rules and creates a security gap.
