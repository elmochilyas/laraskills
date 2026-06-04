# Form Request Validation Logic

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** input-validation-architecture
- **Knowledge Unit:** Form Request Validation Logic
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary
Form Request Validation Logic encapsulates validation rules and authorization logic into dedicated request classes. This pattern keeps controllers clean, centralizes validation, and enables reusable, testable validation rules for API endpoints.

---

## Core Concepts
- **Form Request Classes**: Classes extending `FormRequest` that define `rules()` and `authorize()` methods
- **Automatic Validation**: Laravel automatically validates incoming requests before the controller is reached
- **Authorization Gates**: The `authorize()` method controls who can submit the request
- **Custom Validation Logic**: The `withValidator()` method for additional validation logic after rules are checked
- **After Validation Hooks**: `passedValidation()` and `failedValidation()` for post-validation actions
- **Error Message Customization**: The `messages()` method for custom error messages per rule

---

## Mental Models
1. **Security Checkpoint Model**: The form request is an airline security checkpoint. It checks identity (authorization) and luggage (validation) before the passenger (request) reaches the gate (controller).
2. **Contract Signing Model**: The form request defines the contract for accepted input. Both the API and consumer agree on this contract.

---

## Internal Mechanics
When a form request class is type-hinted in a controller method, Laravel's service container resolves it. Before the controller is called, the form request's `authorize()` is invoked — returns false triggers `403`. Then `rules()` is called and validation executes. If validation fails, a `ValidationException` with `422` status and error details is thrown automatically.

---

## Patterns

### Pattern 1: Per-Resource Form Request
**Purpose**: One form request per resource operation (e.g., `StoreUserRequest`, `UpdateUserRequest`)
**Benefits**: Clear, focused, easy to find; each request handles exactly one operation
**Tradeoffs**: Many classes; requires consistent naming conventions

### Pattern 2: Combined Store/Update Request
**Purpose**: A single form request handling both create and update via `$this->isMethod('post')` checks
**Benefits**: Fewer files; shared rules defined once
**Tradeoffs**: Conditional logic in rules makes the class harder to read

---

## Architectural Decisions
### When To Use
- All API endpoints with input validation
- Endpoints with authorization requirements
- Projects following thin controller patterns

### When To Avoid
- Trivial endpoints with no input validation
- Read-only endpoints (GET, HEAD)
- Prototypes where validation is defined inline

### Alternatives
- Controller-level `validate()` method for simple cases
- Inline validation in actions/services
- Spatie's `laravel-data` package for DTO-based validation

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Controllers stay clean | Many form request files | Organize by resource directory |
| Validation is reusable | Over-abstraction for simple rules | Use inline validation for single-use rules |
| Authorization integrated | Request grows with complex logic | Extract authorization to policies |
| Testable in isolation | Learning curve for new developers | Document custom methods clearly |

---

## Performance Considerations
- Form request resolution via the container adds ~2ms per request
- Complex `rules()` with closures or custom validators add execution time
- `withValidator()` closures run after rules validation, adding overhead for conditional checks

---

## Production Considerations
- Log validation failures at `debug` level for monitoring
- Return consistent error response shapes from all form requests
- Override `failedValidation()` to customize the response format
- Keep `authorize()` logic simple; use policies for complex authorization

---

## Common Mistakes
**Putting business logic in form requests**: Form requests should validate input, not execute business operations. Use actions or services for business logic.
**Inconsistent authorization across requests**: Some requests authorize, others don't. Check each request has an appropriate `authorize()` method.
**Ignoring update validation rules**: `sometimes` and `exclude_if` rules for partial updates on `PATCH` requests.

---

## Failure Modes
**Authorization bypass**: Form request without `authorize()` returns `true` by default. *Detection:* Security audit. *Mitigation:* Add a base form request that defaults `authorize()` to `false`.
**Validation rule drift**: Rules in form requests diverge from database constraints. *Detection:* Migration failures. *Mitigation:* Add architecture tests verifying rules match schema.

---

## Ecosystem Usage
Laravel's `FormRequest` base class extends `Request` and implements `ValidatesWhenResolved`. Artisan's `make:request` command generates skeleton form requests. The `authorize()` method integrates with Laravel's Gate facade.

---

## Related Knowledge Units
### Prerequisites
- Laravel validation basics
- Controller method injection

### Related Topics
- Validation rule composition
- Input sanitization techniques
- Authorization via policies

### Advanced Follow-up Topics
- Custom form request after-validation hooks
- Form request preprocessing and normalization
- Spatie laravel-data integration for validation + DTO

---

## Research Notes
- `FormRequest::validationData()` can be overridden to modify the data being validated
- `prepareForValidation()` runs before rules are applied for data normalization
- `passedValidation()` fires after successful validation for post-processing
- `failedValidation()` can be overridden to return a custom error response structure
