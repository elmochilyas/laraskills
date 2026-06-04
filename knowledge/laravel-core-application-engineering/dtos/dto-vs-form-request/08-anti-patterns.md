# ECC Anti-Patterns — DTO vs FormRequest

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | DTO vs FormRequest |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. The Conflated Object (FormRequest Passed Directly to Services)
2. The Echo Chamber (DTO Mirroring FormRequest Keys With No Transformation)
3. The Duplicated Rule Set (Same Rules in Both FormRequest and DTO)
4. DTO Without FormRequest for HTTP Endpoints
5. FormRequest DTO Method That Spreads $this->all()

---

## Repository-Wide Anti-Patterns

- Service Methods Accepting `Request` or FormRequest Type Hints
- DTO Authorization Replacing FormRequest Authorization
- No Explicit Bridge Between FormRequest and DTO
- FormRequest Validated Data Used Directly in Service Without DTO for Complex Flows
- Validation Rules Defined Only in DTO for HTTP Endpoints (Missing Authorization)

---

## Anti-Pattern 1: The Conflated Object

### Category
Architecture | Testing

### Description
Passing a FormRequest directly to a service or action method instead of extracting validated data to a DTO first.

### Why It Happens
Developers see FormRequest as the "validated input object" and pass it directly to services for convenience, not realizing this couples the service layer to HTTP.

### Warning Signs
- Service method parameter type-hints `StoreUserRequest` instead of `UserDto`
- Testing the service requires creating a mock HTTP request or FormRequest instance
- Service cannot be called from CLI or queue because it depends on HTTP request context
- Service code accesses `$request->user()`, `$request->header()`, or other HTTP-specific data

### Preferred Alternative
Services receive DTOs, not FormRequests. Use the bridging pattern — FormRequest produces a DTO via `payload()` or the DTO has a `fromRequest()` factory.

### Related Rules
- Rule: Never Pass FormRequest to Services

---

## Anti-Pattern 2: The Echo Chamber

### Category
Design | Maintainability

### Description
A DTO whose properties exactly mirror the FormRequest's validated keys with no transformation, renaming, or type conversion.

### Why It Happens
Developers create DTOs as a mandatory architectural step without considering what value the DTO adds. The DTO becomes a pass-through wrapper.

### Warning Signs
- DTO properties are identical to the FormRequest's field names
- No type conversion happens in the DTO factory (string stays string, int stays int)
- Removing the DTO and passing `$request->validated()` directly to the service changes nothing
- The DTO is used by exactly one method in one service

### Preferred Alternative
Either transform field names, flatten nested structures, or convert types in the DTO factory. If no transformation is needed, skip the DTO and pass validated data directly.

### Related Rules
- Rule: DTOs Must Transform or Rename Fields From HTTP Structure

---

## Anti-Pattern 3: The Duplicated Rule Set

### Category
Maintainability

### Description
Defining the same validation rules in both the FormRequest and the DTO's validation rules.

### Why It Happens
Teams implement validation in both layers for "defense in depth." Two sources of truth inevitably diverge over time.

### Warning Signs
- `'email' => ['required', 'email']` appears in both `StoreUserRequest` and `UserDto::rules()`
- One layer is updated for a new requirement; the other is forgotten
- Tests pass but validation behavior differs between HTTP and CLI paths
- Developers cannot confidently state where the canonical rules live

### Preferred Alternative
Choose one validation layer per application. FormRequest handles HTTP-specific concerns (authorization, input format). DTO handles non-HTTP paths (CLI, queue). Do not duplicate.

### Related Rules
- Rule: Define Validation in One Layer Only

---

## Anti-Pattern 4: DTO Without FormRequest for HTTP Endpoints

### Category
Security | Architecture

### Description
An HTTP endpoint that constructs a DTO directly from `$request->all()` without an intervening FormRequest, skipping authorization and input preparation.

### Why It Happens
Developers use DTO validation as the sole validation layer, not realizing that FormRequest provides authorization (`authorize()`) and input preparation (`prepareForValidation()`) that the DTO cannot.

### Warning Signs
- Controller action has no FormRequest parameter — type-hints `Request` instead
- DTO is constructed from `$request->all()` or `$request->input()`
- No `authorize()` check exists for the endpoint
- Authorization logic is missing or implemented inline in the controller

### Preferred Alternative
Every HTTP endpoint that receives input should have a FormRequest for authorization and input preparation. The DTO is constructed from the FormRequest's validated data.

### Related Rules
- Rule: Always Use FormRequest for HTTP Endpoints

---

## Anti-Pattern 5: FormRequest DTO Method That Spreads $this->all()

### Category
Security

### Description
A FormRequest's `payload()` or `toDto()` method that passes `$this->all()` instead of `$this->validated()` to the DTO constructor.

### Why It Happens
Developers confuse "all input" with "validated input." They use `$this->all()` for brevity, not realizing unvalidated fields can reach the DTO.

### Warning Signs
- `payload()` calls `new Dto(...$this->all())` instead of `$this->validated()`
- DTO receives fields that are not in the FormRequest's `rules()` array
- Unvalidated fields (is_admin, role_id) pass through to the service
- Mass-assignment vulnerabilities reach the service layer

### Preferred Alternative
Always use `$this->validated()` in `payload()` methods. This ensures only validated fields reach the DTO and downstream layers.

### Related Rules
- Rule: Always Use $request->validated() for DTO Construction
