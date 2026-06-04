# Form Request Validation

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-12-form-request-validation
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Form Request classes are dedicated validation objects that encapsulate all validation and authorization logic for each HTTP endpoint. They sit between the HTTP layer and the application layer, ensuring only valid, authorized requests reach controllers and Use Cases. Form Requests centralize validation at the architectural boundary where HTTP input enters the application, eliminating scattered validation logic across controllers, middleware, services, and models.

---

## Core Concepts
- **Authorization Gate**: The `authorize()` method determines if the authenticated user can perform this operation — the primary endpoint-level security gate
- **Rule Definitions**: The `rules()` method returns validation rules keyed by input field, using Laravel's built-in rules, custom Rule objects, or `Rule::unique()`
- **Input Preparation**: The `prepareForValidation()` method transforms or sanitizes input before validation runs
- **Error Customization**: The `messages()` and `attributes()` methods override default error messages and field names
- **Failed Validation Handling**: The `failedValidation()` method customizes the response when validation fails
- **Validation After Hook**: The `withValidator()` hook runs after all rules pass for cross-field validation

---

## Mental Models
1. **Validation as Gatekeeper at the Castle Gate**: The Form Request is the gatekeeper at the entrance to the application. It checks identity (authorization), inspects parcels (validates data), and prepares items (input normalization). Only after passing the gate does data enter the application proper. If the gate fails, the visitor (HTTP request) is turned away immediately.
2. **Single Source of Truth for Input Rules**: Instead of validation rules scattered across controllers (inline `$request->validate()`), middleware, services, and models, the Form Request is the single location where input rules are defined. Changes to validation require changing one file, not five.

---

## Internal Mechanics
When a controller method type-hints a Form Request, Laravel's Service Container resolves it before the controller method executes. The Form Request extends `FormRequest` which extends `Request`. Laravel calls `authorize()` first — if it returns false, a 403 response is thrown. Then `prepareForValidation()` runs for input normalization. Then `rules()` evaluates and validates the input. If validation fails, `failedValidation()` customizes the error response. If all passes, the controller receives the validated data via `$request->validated()`.

---

## Patterns
### One Form Request Per Operation Pattern
- **Purpose**: Dedicated validation class for each distinct operation
- **Mechanism**: Separate `StoreInvoiceRequest` and `UpdateInvoiceRequest` with different rules
- **Benefits**: Clear separation of validation concerns, rules specific to each operation
- **Tradeoffs**: More classes than a single "resource request" — but avoids conditional rule logic

### Authorize-and-Validate Combined Pattern
- **Purpose**: Centralize both authorization and validation in one class
- **Mechanism**: `authorize()` delegates to Policy gates; `rules()` contains field validation
- **Benefits**: Single location for all entry-point security, authorization checked before validation
- **Tradeoffs**: `authorize()` should remain simple — delegate complex logic to Policy classes

---

## Architectural Decisions
- **Choose Form Requests when**: 3+ validation rules, endpoint needs authorization checks, validation is reused, or consistent error responses are needed
- **Choose inline validation when**: Single-field validation, prototyping, or endpoints with no reuse potential
- **Key decision**: Form Requests validate HTTP input format and structure — business rule validation belongs in domain objects

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized validation logic per endpoint | One class per operation — more files | Makes validation independently testable and auditable |
| Authorization at the endpoint boundary | `authorize()` can grow complex if not delegated | Delegate to Policy classes for complex logic |
| Automatic error handling for Inertia/API | Must configure for custom response formats | `failedValidation()` override handles custom formats |
| Input preparation before validation | Must remember to call `prepareForValidation()` | Essential for normalizing input (trimming, casting) |

---

## Performance Considerations
Form Request validation overhead is negligible — typically 1-5ms per request including rule evaluation. Database unique validation rules (`Rule::unique()`) execute a query on every validation — cache the table existence check. Custom Rule objects are compiled once and reused with no measurable overhead difference from inline rules. File upload validation (mimes, max size) prevents resource exhaustion — essential for security. For batch API endpoints, consider validating all items before processing any to fail fast.

---

## Production Considerations
`authorize()` is the primary endpoint-level gate — every state-changing endpoint must have it. Form Requests are called on every request — ensure `authorize()` is not expensive. Validation error messages must not leak internal structure (e.g., database error details). SQL injection through validation rules is prevented by Laravel's parameterized query binding in Rule objects. File upload rules (mimes, max size) prevent resource exhaustion and malicious file uploads.

---

## Common Mistakes
1. **Validation in Controllers**: Using `$request->validate()` inline instead of injecting a Form Request — validation cannot be reused, controllers contain validation code, testing requires HTTP tests.
2. **Overly Permissive Rules**: Using `sometimes` or `nullable` when fields should be required — allows invalid data through. Require fields explicitly.
3. **Authorization Logic in Controller**: Using middleware or `Gate::allows()` in the controller when `authorize()` is the correct location — centralize all endpoint-level authorization in the Form Request.
4. **Closure-Based Rules**: Using closures in `rules()` instead of extracting to Rule objects — closures cannot be tested independently or reused.
5. **Business Logic in Form Requests**: Checking "does this customer have sufficient credit?" — format validation stays in Form Requests; business validation goes in domain objects.

---

## Failure Modes
- **Authorization bypass**: Returning `true` from `authorize()` for destructive operations — every state-changing endpoint must verify user permission
- **Validation leak**: Business rule validation in Form Requests crosses into domain territory — keep format validation in Form Requests, business validation in domain objects
- **Unused Form Requests**: Creating Form Requests but not type-hitting them in controllers — dead code that wastes maintenance effort
- **Overly permissive rules**: Accepting data that should be rejected — degrades data quality over time

---

## Ecosystem Usage
Laravel's Form Request system is the standard HTTP input validation mechanism. It integrates with Inertia (validation errors automatically sent to frontend), API resources (custom JSON error structures), and authorization (Policy delegation). Packages like `spatie/laravel-data` provide additional validation layers for DTOs. Pest architecture tests can verify Form Request usage consistency across controllers.

---

## Related Knowledge Units
### Prerequisites
- Three-Layer Architecture (LAP-01)
- Controller Design (SLP-03)
- Laravel Validation Fundamentals

### Related Topics
- Use Case Classes (LAP-11) — validation boundary before Use Cases
- DTO Design (LAP-14) — alternative input contracts for non-HTTP delivery
- Input Preparation Patterns

### Advanced Follow-up Topics
- Custom Rule Objects
- Cross-Field Validation with `after()` callback
- Form Request Testing Strategies

---

## Research Notes
Create a Form Request for any endpoint with 3+ rules, authorization needs, or reuse potential. The 2-minute investment pays back when validation needs to change. One Form Request per distinct operation — not one per resource. Always implement `authorize()` for state-changing endpoints. Use custom Rule objects for any rule with 3+ lines of logic.
