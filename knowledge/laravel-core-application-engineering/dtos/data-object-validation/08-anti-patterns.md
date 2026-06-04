# ECC Anti-Patterns — Data Object Validation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | Data Object Validation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. The Double Validation (Same Rules in Both FormRequest and DTO)
2. The Validating DTO (Heavy Validation With Database Queries)
3. The Silent Pass-Through (DTO With No Validation From Unvalidated Input)
4. Validation Bypass via fromRaw or Direct Constructor
5. Complex Cross-Field Validation in DTOs

---

## Repository-Wide Anti-Patterns

- Validating DTO With Side Effects (API Calls, Logging)
- Rules With Database Queries in DTO Validation
- `Data::fromRaw()` Used to Bypass Validation for Performance
- DTO Validation Rules Duplicated Across Entry Points
- Context Parameter Trusted Without Validation

---

## Anti-Pattern 1: The Double Validation

### Category
Maintainability | Architecture

### Description
Defining the same validation rules in both the FormRequest and the DTO, creating two sources of truth that diverge over time.

### Why It Happens
Teams implement validation in the FormRequest as a standard practice, then add the same rules to the DTO for "defense in depth." The rules inevitably diverge as requirements change.

### Warning Signs
- `'email' => ['required', 'email']` appears in both `StoreUserRequest` and `UserData`
- Updating a validation rule requires two file changes, but only one gets updated
- CI tests pass but some validation paths are inconsistent between layers
- Developers cannot answer "where is email validated?"

### Preferred Alternative
Pick one validation layer per application. Use FormRequest for HTTP-specific rules (authorization, input format). Use DTO validation for domain-level rules (business constraints). Do not overlap.

### Related Rules
- Rule: Validate in One Layer Only (FormRequest or DTO)

---

## Anti-Pattern 2: The Validating DTO (Heavy Validation)

### Category
Architecture | Performance

### Description
A DTO that performs heavy validation — database lookups, API calls, or complex computation — during construction.

### Why It Happens
Developers put all validation on the DTO for consistency across entry points, including expensive checks that should be deferred to the service layer.

### Warning Signs
- DTO constructor or factory calls `User::where()`, `DB::table()`, or external APIs
- DTO validation rules include `unique:users,email` or similar database queries
- Constructing a DTO takes 50ms+ due to validation overhead
- Tests must mock database calls to construct DTOs

### Preferred Alternative
Keep DTO validation to format checks (required, email, min, max). Defer database-dependent validation (unique checks, existence checks) to the service layer.

### Related Rules
- Rule: Keep DTO Validation Lightweight — Defer Database Checks

---

## Anti-Pattern 3: The Silent Pass-Through

### Category
Security | Architecture

### Description
A DTO with no validation rules that is constructed directly from unvalidated input (e.g., from a CLI argument, queue payload, or raw request data).

### Why It Happens
Developers assume input is already validated by the entry point, or they simply forget to add validation to the DTO.

### Warning Signs
- DTO has empty `rules()` or no validation mechanism
- DTO is constructed from `$request->all()`, CLI input, or queue payload without prior validation
- A CLI command or queue job passes unchecked data to a service via a "validated" DTO
- Invalid data reaches the service layer without raising any validation errors

### Preferred Alternative
Every DTO that receives external input must have validation rules. For CLI/queue entry points where no FormRequest exists, the DTO's validation is the sole validation layer — it must be comprehensive.

### Related Rules
- Rule: Every Input DTO Must Have Validation

---

## Anti-Pattern 4: Validation Bypass via fromRaw

### Category
Security | Reliability

### Description
Using `Data::fromRaw()` or `new Data(...)` directly to bypass the validation pipeline for performance or convenience.

### Why It Happens
The pipeline (authorization → validation → casting) is slower than direct construction. Developers bypass it for "simple" or "internal" DTO construction.

### Warning Signs
- `Data::fromRaw()` or `new Data(...)` is used outside test files
- Direct construction of a Data object that bypasses `fromRequest()` or `from()`
- No documentation or justification for why the pipeline was bypassed
- Invalid data enters the system through the bypass path

### Preferred Alternative
Always use `Data::from()` or `Data::fromRequest()` to ensure the pipeline runs. Audit all DTO construction points for bypass patterns.

### Related Rules
- Rule: Never Bypass the Data Pipeline With fromRaw

---

## Anti-Pattern 5: Complex Cross-Field Validation in DTOs

### Category
Maintainability | Architecture

### Description
Implementing cross-field validation rules (e.g., "end_date must be after start_date") inside the DTO's validation rules.

### Why It Happens
Developers want "complete" validation on the DTO for every entry point. Cross-field rules are added to the DTO without considering that they are better placed in the service layer.

### Warning Signs
- DTO validation contains `end_date` compared with `start_date`
- Cross-field rules in DTO use `Context` parameter to access other DTO properties
- Service layer re-validates the same cross-field rules because the DTO's context is insufficient
- DTO validation rules require complex conditional logic (`required_if`, `prohibited_if`)

### Preferred Alternative
Place cross-field validation in the FormRequest (HTTP entry point) or service layer (business logic). DTO validation should validate individual field format, not cross-field constraints.

### Related Rules
- Rule: Keep DTO Validation to Per-Field Format Checks
