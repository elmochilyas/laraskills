# Form Request Validation

## Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-12-form-request-validation
**Difficulty:** Intermediate
**Category:** Validation Pattern
**Last Updated:** 2026-06-04

## Overview

Form Request classes are dedicated validation objects that encapsulate all validation and authorization logic for each HTTP endpoint. They sit between the HTTP layer and the application layer, ensuring that only valid, authorized requests reach controllers and Use Cases.

Form Requests exist to solve the problem of scattered validation logic. Without them, validation rules appear in controllers (inline `$request->validate()`), middleware, service classes, and sometimes even models. Each location uses a slightly different pattern, making validation impossible to audit, test, or reuse. Form Requests centralize validation at the architectural boundary where HTTP input enters the application.

Engineers should care because Form Requests provide the single most effective mechanism for controller thinning. A controller with a Form Request injected has zero validation code, zero authorization logic, and zero input preparation — it receives validated, authorized, and prepared data ready for application processing.

## Core Concepts

**Authorization Gate:** The `authorize()` method determines if the authenticated user can perform this operation. This is the primary endpoint-level security gate. It returns a boolean, and the Form Request throws an `AuthorizationException` (403 response) if it returns false.

**Rule Definitions:** The `rules()` method returns an array of validation rules keyed by input field. Rules use Laravel's built-in rules, custom Rule objects, or `Rule::unique()` for database uniqueness. The method receives the validated data as a parameter, enabling dynamic rules based on input.

**Input Preparation:** The `prepareForValidation()` method transforms or sanitizes input before validation runs. Use this for normalizing phone numbers, trimming whitespace, converting date formats, or enriching input with server-side data.

**Error Customization:** The `messages()` method overrides default validation error messages. The `attributes()` method renames field names in error messages. These methods ensure user-facing errors are specific, actionable, and localization-ready.

**Failed Validation Handling:** The `failedValidation()` method customizes the response when validation fails. For APIs, you can return custom JSON error structures. For Inertia, errors are automatically available to the frontend.

**Validation After Hook:** The `afterValidating()` or `withValidator()` hooks run after all rules pass, enabling cross-field validation that cannot be expressed as single-field rules.

## When To Use

- Any endpoint with 3 or more validation rules
- Endpoints that need authorization checks specific to the operation
- Validation logic that is reused across similar endpoints
- API endpoints that require consistent error response structures
- Applications where validation must be independently tested and audited
- Teams implementing controller thinning systematically

## When NOT To Use

- Single-field validation where `$request->validate(['name' => 'required'])` suffices
- Prototyping stages where speed outweighs architectural purity
- Endpoints guaranteed to never need custom rules, error messages, or authorization
- CLI commands and queue jobs (Form Requests are HTTP-specific; use DTO validation instead)

## Best Practices

**One Form Request Per Distinct Operation:** Create dedicated Form Requests for each unique validation scenario. `StoreInvoiceRequest` and `UpdateInvoiceRequest` are separate classes with different rules.

**Define `authorize()` for All Non-Public Endpoints:** Every state-changing endpoint must have an `authorize()` method. Public read endpoints may skip this.

**Use Custom Rule Objects for Complex Validation:** Extract closure-based validation into dedicated Rule classes. Custom Rule objects are testable, reusable, and named for their purpose.

**Keep Rules Readable:** Break long rule arrays into organized groups. Use `Rule::when()` for conditional rules. Avoid inline closures in the rules array — extract to Rule objects.

**Test Form Requests Independently:** Create dedicated tests for each Form Request covering valid input, invalid input, authorization checks, and edge cases. Form Request tests are fast and focused.

**Don't Mix Validation and Business Logic:** Form Requests validate HTTP input format and structure. Business rule validation (e.g., "customer credit limit exceeded") belongs in domain objects, not Form Requests.

**Use `prepareForValidation` for Input Normalization:** The method exists for a reason — use it to trim, cast, and enrich input before rule evaluation.

## Architecture Guidelines

**Layer Placement:** Form Requests belong in the HTTP/Presentation layer, alongside controllers. Place them in `app/Http/Requests/` following Laravel convention.

**Dependency Direction:** Form Requests depend on the authenticated user, route parameters, and sometimes repositories for uniqueness checks. Prefer them without application service dependencies; injecting services for complex uniqueness or cross-field validation is acceptable.

**Relationship to Controllers:** Type-hint the Form Request in the controller method parameter. Laravel resolves and validates it before the controller method executes. The controller receives validated data via `$request->validated()`.

**Relationship to Use Cases:** Form Requests validate HTTP input format. Use Cases (or controllers) handle domain-level validation. The two are complementary — Form Requests check "is this email valid format?" while Use Cases check "is this email unique for this customer?"

**Integration with Authorization:** The `authorize()` method should delegate to Policy gates when complex authorization logic is needed. Simple ownership checks (user owns the resource) can stay in the Form Request.

## Performance Considerations

- Form Request validation overhead is negligible — typically 1-5ms per request including rule evaluation
- Database unique validation rules (`Rule::unique()`) execute a query on every validation — cache the table existence check
- Custom Rule objects are compiled once and reused — no measurable overhead difference from inline rules
- File upload validation (mimes, max size) prevents resource exhaustion — essential for security
- For batch API endpoints, consider validating all items before processing any to fail fast

## Security Considerations

- `authorize()` is the primary endpoint-level gate — every state-changing endpoint must have it
- SQL injection through validation rules is prevented by Laravel's parameterized query binding in Rule objects
- File upload rules (mimes, max:1024) prevent resource exhaustion and malicious file uploads
- Validation error messages must not leak internal structure (e.g., database error details)
- The `redirect` configuration should point to the correct route for validation error redirection
- Form Requests are called on every request — ensure `authorize()` is not expensive

## Common Mistakes

**Validation in Controllers:** Using `$request->validate()` inline instead of injecting a Form Request.

**Why developers make it:** It's faster to type `$request->validate([...])` than `php artisan make:request` and create a new file. For endpoints with 2-3 rules, it seems reasonable.

**Consequences:** Validation cannot be reused across endpoints. Controllers contain validation code that must change when validation changes. Testing validation requires HTTP tests instead of focused Form Request tests.

**Better approach:** Create a Form Request for any endpoint that has 3+ rules, authorization needs, or reuse potential. The 2-minute investment pays back when validation needs to change.

**Overly Permissive Rules:** Using `sometimes` or `nullable` when fields should be required. Being permissive "just in case" allows invalid data through.

**Why developers make it:** Developers want to avoid breaking existing integrations. They accept data that might not be needed yet.

**Consequences:** Incomplete data in the database. Business logic must handle missing fields. Data quality degrades over time.

**Better approach:** Require fields explicitly. Use `sometimes` only when the field's presence genuinely depends on another field's value.

**Authorization Logic in Controller:** Using middleware or `Gate::allows()` in the controller method when the Form Request's `authorize()` method is the correct location.

**Why developers make it:** Migration from existing code where authorization was in the controller. Unfamiliarity with Form Request authorization.

**Consequences:** Authorization logic is split between the Form Request and the controller. It's not obvious where to add new authorization checks.

**Better approach:** Centralize all endpoint-level authorization in the Form Request's `authorize()` method.

**Closure-Based Rules:** Using closures in the `rules()` array instead of extracting to Rule objects.

**Why developers make it:** Closures are convenient and don't require creating new files.

**Consequences:** Closure-based rules cannot be tested independently. They cannot be reused across Form Requests. They clutter the rules array.

**Better approach:** For any rule with 3+ lines of logic, extract to a custom Rule class.

## Anti-Patterns

**Giant Form Request:** A single Form Request handling validation for all operations on a resource. Symptoms: hundreds of lines, conditional rules based on HTTP method, complex `prepareForValidation`, shared `authorize` for different operations. Refactor into one Form Request per operation.

**Validation Leak:** Business rule validation in Form Requests. When a Form Request checks "does this customer have sufficient credit?" or "is this email unique for this account?" it crosses into domain territory. Refactor by keeping format validation in the Form Request and business validation in domain objects.

**Imperative Validation:** Using `$validator->after()` for primary validation rules. The `after` callback should be for cross-field validation only, not for rules that can be expressed in the `rules()` method.

**Authorize Bypass:** Returning `true` from `authorize()` for all endpoints, including destructive ones. Every state-changing operation must verify the user's permission.

**Unused Form Requests:** Creating Form Requests but not type-hinting them in controller methods. The controller still calls `$request->validate()` inline, rendering the Form Request dead code.

## Examples

### Basic Form Request
```php
class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Invoice::class);
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'exists:customers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'discount_code' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'An invoice must have at least one item.',
            'items.*.quantity.min' => 'Each item quantity must be at least 1.',
        ];
    }
}
```

### Form Request with Input Preparation
```php
class RegisterUserRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower($this->input('email')),
            'phone' => preg_replace('/[^0-9]/', '', $this->input('phone')),
        ]);
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', Rule::unique('users')],
            'phone' => ['required', 'string', 'size:10'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
```

## Related Topics

**Prerequisites:**
- Three-Layer Architecture (LAP-01)
- Controller Design (SLP-03)
- Laravel Validation Fundamentals

**Closely Related:**
- Use Case Classes (LAP-11) — validation boundary before Use Cases
- DTO Design (LAP-14) — alternative input contracts for non-HTTP delivery
- Input Preparation Patterns

**Advanced Follow-Up:**
- Custom Rule Objects
- Cross-Field Validation with `after()` callback
- Form Request Testing Strategies

**Cross-Domain Connections:**
- API Resource Validation — JSON:API validation patterns
- Inertia Form Handling — validation error binding on the frontend
- Livewire Validation — `#[Validate]` attributes vs Form Requests
