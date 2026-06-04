# Rules: Form Request Validation

## Create One Form Request per Controller Method
---
## Category
Architecture
---
## Rule
Generate a dedicated Form Request class for each controller mutation method (`StorePostRequest`, `UpdatePostRequest`). Never reuse a single Form Request for both create and update.
---
## Reason
Create and update operations have different validation rules (create requires unique email, update excludes the current record's ID; update may allow partial data). A single Form Request with conditional logic is harder to read, test, and maintain.
---
## Bad Example
```php
// One Form Request for both create and update — full of conditionals
class PostRequest extends FormRequest {
    public function rules() {
        return [
            'title' => $this->route('post') ? 'required|string|max:255' : 'sometimes|string|max:255',
        ];
    }
}
```
---
## Good Example
```php
class StorePostRequest extends FormRequest {
    public function rules() { return ['title' => 'required|string|max:255']; }
}
class UpdatePostRequest extends FormRequest {
    public function rules() { return ['title' => 'sometimes|string|max:255']; }
}
```
---
## Exceptions
Trivially small resource updates (single field) — inline validation is acceptable.
---
## Consequences Of Violation
Complex, hard-to-read validation logic, brittle conditionals.
---

## Implement authorize() to Gate Access Before Validation
---
## Category
Security
---
## Rule
Override `authorize()` in Form Requests to check the user's permission for the action. Return `true` or call `$this->authorize()`.
---
## Reason
Authorization and validation belong together — a user should not be able to trigger validation errors for actions they are not authorized to perform. `authorize()` runs before `rules()`, so unauthorized requests fail fast without hitting validation.
---
## Bad Example
```php
// No authorization in Form Request — controller must handle it
class StorePostRequest extends FormRequest {
    public function authorize() { return true; } // No actual check
}
```
```php
// Controller handles authorization separately
public function store(StorePostRequest $request) {
    $this->authorize('create', Post::class);
}
```
---
## Good Example
```php
class StorePostRequest extends FormRequest {
    public function authorize() {
        return $this->user()->can('create', Post::class);
    }
}
```
---
## Exceptions
Public endpoints (registration, contact form) — no authorization needed.
---
## Consequences Of Violation
Unauthorized users trigger validation errors, authorization logic scattered.
---

## Use preparedForValidation() for Input Normalization
---
## Category
Architecture
---
## Rule
Override `prepareForValidation()` to normalize input (trim whitespace, convert booleans, format dates) before validation runs.
---
## Reason
Normalized input produces cleaner validation error messages and prevents edge cases (whitespace passing `required|email` when trimmed value is empty, or `null` failing when the user intended `false`). `prepareForValidation()` runs before validation rules are applied.
---
## Bad Example
```php
// Input not normalized — "  user@example.com  " passes required but fails email
```
---
## Good Example
```php
class StoreUserRequest extends FormRequest {
    protected function prepareForValidation() {
        $this->merge([
            'email' => trim($this->email),
            'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}
```
---
## Exceptions
No common exceptions — input normalization is always beneficial.
---
## Consequences Of Violation
Inconsistent input, unexpected validation failures.
---

## Add Custom Rule Objects for Reusable Validation
---
## Category
Architecture
---
## Rule
Create `Rule` objects (e.g., `Uppercase`, `PhoneNumber`) for validation logic that is reused across multiple Form Requests. Never duplicate inline closures.
---
## Reason
Inline `Rule::unique()` with closures or regex patterns duplicated across Form Requests violates DRY principles. Rule objects encapsulate the logic, are testable independently, and ensure consistent validation everywhere.
---
## Bad Example
```php
class StorePostRequest extends FormRequest {
    public function rules() {
        return ['phone' => ['required', 'regex:/^\+?[1-9]\d{1,14}$/']]; // Duplicated regex
    }
}
class UpdatePostRequest extends FormRequest {
    public function rules() {
        return ['phone' => ['required', 'regex:/^\+?[1-9]\d{1,14}$/']]; // Same regex duplicated
    }
}
```
---
## Good Example
```php
class StorePostRequest extends FormRequest {
    public function rules() {
        return ['phone' => ['required', new PhoneNumber]];
    }
}
// Rule object
class PhoneNumber implements Rule {
    public function passes($attribute, $value) {
        return preg_match('/^\+?[1-9]\d{1,14}$/', $value);
    }
    public function message() {
        return 'The :attribute must be a valid phone number.';
    }
}
```
---
## Exceptions
One-time validation that will never be reused.
---
## Consequences Of Violation
Duplicated validation logic, inconsistent rules, harder testing.
---

## Validate Nested and Array Input With . and *)
---
## Category
Architecture
---
## Rule
Use dot notation (`contacts.*.email`) to validate nested array input in Form Requests. Use `*` for array elements.
---
## Reason
Laravel's validation engine supports nested rule definitions for array and object input. Without `*`, nested validation requires manual iteration and error-prone logic. Dot notation with `*` handles variable-length arrays cleanly.
---
## Bad Example
```php
public function rules() {
    return ['contacts' => 'required|array|min:1']; // Does not validate individual contact fields
}
```
---
## Good Example
```php
public function rules() {
    return [
        'contacts' => 'required|array|min:1',
        'contacts.*.email' => 'required|email',
        'contacts.*.name' => 'required|string|max:255',
    ];
}
```
---
## Exceptions
No common exceptions — nested validation should use the `*` wildcard.
---
## Consequences Of Violation
Incomplete validation of nested data, silent data corruption.
---

## Return Consistent Validation Error Responses
---
## Category
Architecture
---
## Rule
Rely on Laravel's automatic validation error response (422 with error messages). Never override the validation error response format unless building a strict-format API.
---
## Reason
Laravel returns a consistent JSON error structure for validation failures. Overriding the format per-Form-Request creates inconsistent API responses. A single custom exception handler (`App\Exceptions\Handler`) should handle response formatting uniformly.
---
## Bad Example
```php
class StorePostRequest extends FormRequest {
    public function failedValidation(Validator $validator) {
        throw new HttpResponseException(response()->json([
            'message' => 'Validation failed', 'errors' => $validator->errors()
        ], 422));
    }
}
```
---
## Good Example
```php
// No override — Laravel's default 422 response is consistent
class StorePostRequest extends FormRequest {
    // relies on parent implementation
}
```
---
## Exceptions
API versioning with different error contract requirements.
---
## Consequences Of Violation
Inconsistent API error responses, client parsing issues.
---

## Use nullable Instead of sometimes for Optional Fields
---
## Category
Architecture
---
## Rule
Use `nullable` for optional fields that may be omitted or null. Reserve `sometimes` for fields that are conditionally required based on other input.
---
## Reason
`nullable` means the field can be `null` or missing. `sometimes` means validation runs only when the field is present. Using `sometimes` when the field should accept `null` leads to unexpected validation failures when clients send `null` explicitly.
---
## Bad Example
```php
public function rules() {
    return ['bio' => 'sometimes|string|max:1000']; // null fails string rule
}
```
---
## Good Example
```php
public function rules() {
    return ['bio' => 'nullable|string|max:1000']; // null allowed, string validated when present
}
```
---
## Exceptions
PATCH endpoints where `sometimes` correctly skips absent fields and `null` means "set to null."
---
## Consequences Of Violation
Unexpected validation failures when null is sent.
