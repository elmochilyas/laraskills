# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Form Request Validation Logic
**Difficulty:** Intermediate
**Category:** Input Validation
**Last Updated:** 2026-06-03

---

# Overview

Form Request Validation Logic is the practice of defining, organizing, and maintaining validation rules within Laravel Form Request classes — covering rule definitions, conditional validation, authorization checks, after-validation hooks, and error message customization. Form Requests exist as the dedicated validation layer for API endpoints, separating input validation from controller logic.

Engineers must care because Form Requests are the primary mechanism for maintaining data integrity at the API boundary. Well-designed Form Requests serve as self-documenting input specifications, enforce consistent validation across endpoints, and prevent business logic contamination from input handling concerns. Poorly designed Form Requests lead to duplicated rules, inconsistent validation, and authorization gaps.

---

# Core Concepts

**rules() Method:** Returns an array of validation rules for the incoming request. This is the primary validation specification.

**authorize() Method:** Determines if the authenticated user is authorized to perform the request. Returns boolean.

**Conditional Validation:** Rules that depend on other field values, request context, or application state — implemented via `required_if`, `required_with`, `prohibited_if`, `Rule::when()`, or closure rules.

**After-Validation Hooks:** The `withValidator()` method allows modifying the validator after rules are applied but before validation runs. Used for complex cross-field validation.

**Custom Error Messages:** The `messages()` method overrides default validation messages per rule or field.

**Input Preparation:** The `prepareForValidation()` method normalizes input data before validation rules are applied.

**Failed Validation Response:** Form Requests automatically redirect back or return JSON error responses with 422 status.

---

# When To Use

- Every API endpoint that accepts user input
- Endpoints requiring authorization checks tied to input
- Complex validation logic that should not live in controllers or models
- Reusable validation rule sets shared across multiple endpoints

---

# When NOT To Use

- Simple, one-off validation in prototypes (inline validator is acceptable)
- Validation that is purely structural (type casting, normalization) — use DTOs or input preparation
- Server-side validation that mirrors database constraints — enforce at database level

---

# Best Practices

**Define rules as arrays, not strings.** `['required', 'email', 'max:255']` is more readable and extensible than `'required|email|max:255'`.

**Use rule objects for complex validation.** `new UniqueEmailRule()` encapsulates reusable validation logic.

**Separate create and update rules.** Use a method or conditional logic to return different rules based on the HTTP method or route parameter.

**Keep authorize() focused.** Authorization logic should check permissions against the authenticated user and the input data. Don't mix business logic.

**Use withValidator() for cross-field validation.** Start date before end date, password confirmation, or field interdependencies.

**Extract reusable rule arrays.** Shared validation rules (like `$nameRules`) reduce duplication across Form Requests.

---

# Architecture Guidelines

**Form Requests belong in `App\Http\Requests`.** Name by endpoint: `StoreUserRequest`, `UpdateUserRequest`, `ListUsersRequest`.

**One Form Request per endpoint action.** A single request class for store and another for update allows different rules and authorization.

**Authorization lives in Form Requests, not controllers.** The `authorize()` method keeps auth checks with the input they protect.

**Validation rules should not contain business logic.** Rules validate format and presence. Business rules belong in actions/services.

**Form Requests are the input boundary.** After a Form Request passes, controllers and actions can assume valid, safe input.

---

# Performance Considerations

**Form Request validation is fast (~1-5ms).** Rule parsing has negligible overhead.

**Closure rules are slower than string/array rules.** Use closure rules sparingly for complex logic that can't use built-in rules.

**Database validation rules (unique, exists) add query overhead.** Each `Rule::unique()` or `Rule::exists()` performs a database query.

**Validation caching is not needed** — rules are simple arrays parsed in microseconds.

---

# Security Considerations

**Form Requests validate input, not authorize actions.** Use `authorize()` for permission checks but don't skip service-layer authorization.

**SQL injection through validation input.** Validated input is safe from injection, but `exists` rules should use bound parameters.

**Mass assignment protection.** Form Requests validate which fields are present but don't prevent mass assignment. Use `$fillable` or DTOs.

**Rate limiting is separate from validation.** Form Requests don't prevent brute force or excessive requests.

---

# Common Mistakes

**Duplicating rules across create and update.** Copy-pasting rule arrays instead of extracting shared rules to a method.

**No authorization check.** `authorize()` returns `true` by default — unprotected endpoints pass through.

**Business logic in rules().** Validation rules that check business state (e.g., "can this user be assigned to this project") belong in actions, not Form Requests.

**Ignoring after-validation hooks.** Complex cross-field validation ends up in controllers because `withValidator()` is underused.

**Hardcoded messages in messages().** Error messages should be in language files for localization, not hardcoded in Form Requests.

---

# Anti-Patterns

**God Form Request:** A single Form Request that handles validation for multiple endpoints by checking the route name or HTTP method.
**Better approach:** One Form Request per endpoint action. Create and Update have separate classes.

**Missing Authorization:** Form Request with `authorize()` returning hardcoded `true` when the endpoint requires authentication.
**Better approach:** Every protected endpoint's Form Request should check `auth()->check()` or specific permissions.

**Validation in Controller:** Defining validation rules inline in controller methods instead of using Form Requests.
**Better approach:** Always use Form Requests for API input validation. Controllers should not contain validation logic.

---

# Examples

**Form Request for user creation:**
```
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->can('create-users');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['sometimes', 'string', Rule::in(['admin', 'editor', 'user'])],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'This email is already registered.',
        ];
    }
}
```

---

# Related Topics

**Prerequisites:**
- Laravel Validation Fundamentals
- Custom Validation Rules

**Closely Related Topics:**
- Form Request Organization — structuring requests by endpoint
- Conditional Validation Patterns — complex rule logic
- Authorization in Form Requests — permission checks

**Advanced Follow-Up Topics:**
- Form Request Testing — testing validation logic
- Form Request Customization Points — extending Form Request behavior

**Cross-Domain Connections:**
- Validation Error Shape Design — error response format
- DTO Integration — passing validated data to actions
