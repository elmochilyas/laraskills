# Anti-Patterns: Form Request Validation

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | 02-layered-architecture-patterns |
| **Knowledge Unit** | LAP-12-form-request-validation |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. Giant Form Request — One Class for All Operations
2. Validation in Controllers — Inline $request->validate()
3. Overly Permissive Rules — Required Fields as Optional
4. Authorization Bypass — No authorize() on State-Changing Endpoints
5. Closure Sprawl — Complex Logic in Inline Closures
6. Business Logic in Form Request — Domain Validation in HTTP Layer
7. Silent Validation Failure — Unhandled Validation Exceptions
8. Missing Input Preparation — Raw Input Passed Without Normalization

---

## Repository-Wide Anti-Patterns

- No Form Request Tests (validation only covered by HTTP tests)
- Mixing Form Request Usage (some endpoints use them, others inline)
- Form Requests with Side Effects (authorize() making database queries)

---

## Anti-Pattern 1: Giant Form Request — One Class for All Operations

### Category
Architecture | Maintainability

### Description
A single Form Request class that handles validation for all HTTP operations on a resource (create, update, delete, list).

### Why It Happens
Developer creates one Form Request per resource for convenience. The class grows as operations are added.

### Warning Signs
- Form Request contains conditional logic based on `$this->method()` or `$this->route()->getName()`
- `rules()` method exceeds 50 lines with conditional branches
- Same class is type-hinted in multiple controller methods doing different operations
- Changes to create validation accidentally affect update validation

### Why It Is Harmful
Conditional rules create hidden coupling between operations. Testing one operation's rules requires understanding all branches. The class becomes a maintenance burden.

### Real-World Consequences
A developer adds a `middleware` field requirement for store but doesn't realize the `sometimes` condition also affects update. Updates now unexpectedly require the field. The bug takes 2 days to debug because the conditional logic is buried in a 100-line rules method.

### Preferred Alternative
One Form Request per distinct HTTP operation. Share a base class for truly common rules.

### Refactoring Strategy
1. Create separate Form Requests for each operation
2. Extract shared rules to a base class or trait
3. Remove conditional logic from the original class
4. Update controller method signatures to use operation-specific Form Requests
5. Delete the monolithic Form Request

### Detection Checklist
- [ ] Form Request uses `$this->method()` or route name for conditional rules
- [ ] Form Request exceeds 100 lines
- [ ] Same Form Request used in store, update, and delete

---

## Anti-Pattern 2: Validation in Controllers — Inline $request->validate()

### Category
Architecture | Maintainability

### Description
Using `$request->validate([...])` directly in controller methods instead of creating Form Request classes.

### Why It Happens
Inline validation is faster to write. Developers skip Form Requests for endpoints with "just a few rules."

### Warning Signs
- Controller methods contain `$request->validate()` calls
- Same validation rules duplicated across multiple controllers
- Changing validation rules requires modifying controller files
- No dedicated validation tests exist

### Why It Is Harmful
Validation logic is scattered across controllers, cannot be reused, and cannot be independently tested. Authorization checks are either missing or duplicated.

### Preferred Alternative
Create a Form Request for every endpoint with 3+ rules or any authorization requirement.

### Refactoring Strategy
1. Run `php artisan make:request` for each endpoint with inline validation
2. Move rules from `$request->validate()` to the Form Request's `rules()` method
3. Add `authorize()` method
4. Replace `Request $request` with the Form Request in the controller signature
5. Update tests to cover the Form Request directly

### Detection Checklist
- [ ] Search for `$request->validate(` in controllers
- [ ] Search for `$this->validate(` in controllers
- [ ] Validation rules scattered across multiple controllers

---

## Anti-Pattern 3: Overly Permissive Rules — Required Fields as Optional

### Category
Data Integrity | Reliability

### Description
Using `sometimes` or `nullable` instead of `required` for fields that must be present.

### Why It Happens
Developers want to avoid breaking existing API clients. They accept incomplete data rather than enforcing contracts.

### Warning Signs
- Required business fields marked as `nullable|string` instead of `required|string`
- Missing data in production for supposedly required fields
- Application code has fallback values for fields that should always be present
- Data quality reports show null values for critical fields

### Why It Is Harmful
Incomplete data accumulates in the database. Business logic must handle missing fields defensively. Data quality degrades.

### Preferred Alternative
Be explicit about requirements. Use `required` unless the field is genuinely optional.

### Refactoring Strategy
1. Audit all `nullable` and `sometimes` rules
2. Determine which fields are genuinely optional
3. Change to `required` for mandatory fields
4. Update API clients that omit required fields
5. Monitor for new missing data

### Detection Checklist
- [ ] Fields marked `nullable` that are never null in business requirements
- [ ] `sometimes` used on fields that are always provided in normal operation
- [ ] Null values in production for fields that should be required

---

## Anti-Pattern 4: Authorization Bypass — No authorize() on State-Changing Endpoints

### Category
Security | Compliance

### Description
Form Request for a state-changing operation that omits the `authorize()` method, defaulting to `true`.

### Why It Happens
Developers forget to add authorization. The default is permissive, not restrictive.

### Warning Signs
- Form Request classes for POST/PUT/DELETE endpoints without `authorize()` method
- Authorization handled only in middleware or controllers
- Multiple Form Requests on the same resource have inconsistent authorization patterns

### Why It Is Harmful
Any authenticated user can trigger destructive operations without permission checks.

### Preferred Alternative
Every state-changing Form Request must define `authorize()`. Use policies for complex checks.

### Refactoring Strategy
1. Audit all Form Requests for state-changing endpoints
2. Add `authorize()` method delegating to the appropriate policy
3. Test authorization with unauthorized users
4. Add CI check requiring `authorize()` on state-changing Form Requests

### Detection Checklist
- [ ] Form Requests for POST/PUT/DELETE without `authorize()`
- [ ] `authorize()` returns `true` unconditionally on destructive endpoints
- [ ] No policy or gate check in the Form Request

---

## Anti-Pattern 5: Closure Sprawl — Complex Logic in Inline Closures

### Category
Maintainability | Testability

### Description
Using inline closures in the `rules()` array for validation logic exceeding 3 lines.

### Why It Happens
Closures are convenient. Extracting to a Rule class requires creating a new file.

### Warning Signs
- Closure in `rules()` array exceeds 5 lines
- Inline closure calls external services or repositories
- Same closure logic appears in multiple Form Requests
- Closures cannot be tested without running the full Form Request

### Why It Is Harmful
Closure logic is invisible to static analysis, untestable in isolation, and unreusable.

### Preferred Alternative
Extract complex validation to custom Rule classes that implement `Illuminate\Contracts\Validation\ValidationRule`.

### Refactoring Strategy
1. Identify closures with 3+ lines in Form Requests
2. Create a Rule class for each
3. Replace closure with `new RuleClass()`
4. Write unit tests for the Rule class
5. Use the Rule class in any Form Request needing that validation

### Detection Checklist
- [ ] Closures in `rules()` array exceeding 3 lines
- [ ] Closure logic duplicated across multiple Form Requests
- [ ] No standalone tests for closure validation logic

---

## Anti-Pattern 6: Business Logic in Form Request — Domain Validation in HTTP Layer

### Category
Architecture | Layer Violation

### Description
Form Request performing business rule validation that belongs in domain objects.

### Why It Happens
Developers find it convenient to add "just one more check" in the Form Request since it already validates input.

### Warning Signs
- Form Request queries business data for validation purposes
- Form Request checks domain rules (credit limits, eligibility, status transitions)
- Business rule changes require modifying Form Requests
- Domain objects remain anemic because all "validation" happens in Form Requests

### Why It Is Harmful
Business logic becomes coupled to HTTP. The same validation cannot be reused in CLI commands or queue jobs.

### Preferred Alternative
Form Requests check input format. Domain objects enforce business rules.

### Refactoring Strategy
1. Identify business rule checks in Form Requests
2. Move them to domain methods that throw domain exceptions
3. Keep format validation (required, email, min, max, exists) in the Form Request
4. Update tests to verify domain exceptions at the appropriate layer

### Detection Checklist
- [ ] Form Request contains business calculations or eligibility checks
- [ ] Same business logic would be needed in CLI or queue context
- [ ] Domain objects have no validation of their own invariants
