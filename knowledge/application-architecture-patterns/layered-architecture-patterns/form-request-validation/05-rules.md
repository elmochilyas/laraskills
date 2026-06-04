# Rules: Form Request Validation

## Rule 1 — Form Request for 3+ Rules

**Rule Name:** form-request-for-three-plus-rules
**Category:** Always
**Rule:** Create a Form Request class for any endpoint with 3 or more validation rules.
**Reason:** Inline validation scatters logic, prevents reuse, and cannot be independently tested.
**Bad Example:**
```php
public function store(Request $request): RedirectResponse
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'password' => 'required|string|min:8',
    ]);
}
```
**Good Example:**
```php
public function store(StoreUserRequest $request): RedirectResponse
{
    // Validation handled by StoreUserRequest
}
```
**Exceptions:** Single-field or two-field validations that will never grow.

## Rule 2 — Define authorize() Method

**Rule Name:** define-authorize-method
**Category:** Always
**Rule:** Every Form Request for a state-changing endpoint must define an `authorize()` method.
**Reason:** Without explicit authorization, any authenticated user can trigger any operation.
**Bad Example:**
```php
class DeleteInvoiceRequest extends FormRequest
{
    public function rules(): array { /* ... */ }
    // No authorize() method — returns true by default
}
```
**Good Example:**
```php
class DeleteInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('delete', $this->route('invoice'));
    }
    public function rules(): array { /* ... */ }
}
```
**Exceptions:** Public read endpoints that should be accessible to all users.

## Rule 3 — Custom Rules for Complex Logic

**Rule Name:** custom-rules-for-complex-logic
**Category:** Always
**Rule:** Extract validation logic with 3+ lines into dedicated Rule classes.
**Reason:** Closure-based rules cannot be tested, reused, or named.
**Bad Example:**
```php
'coupon' => [
    'required',
    function ($attribute, $value, $fail) {
        $coupon = Coupon::where('code', $value)->first();
        if (!$coupon || $coupon->isExpired()) {
            $fail('The coupon is invalid or expired.');
        }
    },
],
```
**Good Example:**
```php
'coupon' => ['required', new ValidCoupon()],
```
**Exceptions:** Trivial one-line closures (e.g., `fn ($v) => strtoupper($v) !== $v`).

## Rule 4 — Test Form Requests Independently

**Rule Name:** test-form-requests-independently
**Category:** Always
**Rule:** Write dedicated unit tests for each Form Request covering rules and authorization.
**Reason:** HTTP integration tests cannot isolate validation logic and are slower.
**Bad Example:**
```php
// Only testing validation through HTTP
public function test_store_invoice(): void
{
    $response = $this->post('/api/invoices', []);
    $response->assertSessionHasErrors(['customer_id']);
}
```
**Good Example:**
```php
public function test_store_invoice_request_rules(): void
{
    $request = new StoreInvoiceRequest();
    $rules = $request->rules();
    
    expect($rules)->toHaveKey('customer_id');
    expect($rules['customer_id'])->toContain('required');
}
```
**Exceptions:** Integration tests for validation error response format may use HTTP tests.

## Rule 5 — Separate Form Requests per Operation

**Rule Name:** separate-form-requests-per-operation
**Category:** Prefer
**Rule:** Create separate Form Request classes for create and update operations.
**Reason:** Create and update typically have different validation rules and authorization requirements.
**Bad Example:**
```php
class InvoiceRequest extends FormRequest
{
    public function rules(): array
    {
        return match ($this->method()) {
            'POST' => ['customer_id' => 'required|exists:customers,id'],
            'PUT' => ['customer_id' => 'sometimes|exists:customers,id'],
            default => [],
        };
    }
}
```
**Good Example:**
```php
class StoreInvoiceRequest extends FormRequest { /* ... */ }
class UpdateInvoiceRequest extends FormRequest { /* ... */ }
```
**Exceptions:** When create and update rules are identical (rare in practice).

## Rule 6 — No Inline Validation in Controllers

**Rule Name:** no-inline-validation-in-controllers
**Category:** Always
**Rule:** Controllers must not contain `$request->validate()` calls.
**Reason:** Inline validation bypasses Form Request testing, reuse, and input preparation.
**Detection:** Search for `$request->validate(`, `$this->validate(`, `Validator::make(` in controller methods.
**Exceptions:** Prototyping or endpoints with 1-2 simple rules that are guaranteed to never grow.

## Rule 7 — Authorization Is Separate from Validation

**Rule Name:** authorization-separate-from-validation
**Category:** Always
**Rule:** The `authorize()` method must check permissions only — not perform validation.
**Reason:** Mixing authorization and validation creates confusion about responsibility.
**Bad Example:**
```php
public function authorize(): bool
{
    if (empty($this->input('email'))) {
        return false; // This is validation, not authorization
    }
    return $this->user()->can('update', $this->route('user'));
}
```
**Good Example:**
```php
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('user'));
}
```
**Exceptions:** None — authorization and validation are separate concerns.

## Rule 8 — Use prepareForValidation for Input Normalization

**Rule Name:** use-prepare-for-validation
**Category:** Prefer
**Rule:** Use `prepareForValidation()` for input normalization instead of modifying `$request->request` in controllers.
**Reason:** Centralized input preparation makes validation predictable and testable.
**Bad Example:**
```php
// Controller
public function store(Request $request): RedirectResponse
{
    $request->merge(['email' => strtolower($request->email)]);
    $validated = $request->validate([...]);
}
```
**Good Example:**
```php
// Form Request
protected function prepareForValidation(): void
{
    $this->merge(['email' => strtolower($this->input('email'))]);
}
```
**Exceptions:** None — this is the correct location for input normalization.
