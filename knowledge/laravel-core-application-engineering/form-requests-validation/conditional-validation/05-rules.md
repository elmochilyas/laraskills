# Conditional Validation — Engineering Rules

---

## Rule 1: Use Declarative Rules for Simple Field-Dependent Conditions

---

## Category

Framework Usage

---

## Rule

Prefer declarative rules (`required_if`, `prohibited_if`, `required_unless`, `required_with`) for simple conditions based on other field values. Reserve `ConditionalRules::when()` and `sometimes()` for complex logic.

---

## Reason

Declarative rules are order-independent, self-documenting, and require no additional code. They are parsed and applied by the validation engine without callbacks or closures, keeping the rules array clean and readable.

---

## Bad Example

```php
public function rules(): array
{
    return [
        'coupon_code' => ConditionalRules::when(
            fn () => $this->has_coupon,
            ['required', 'string', 'max:50'],
            ['prohibited']
        ),
    ];
}
```

---

## Good Example

```php
public function rules(): array
{
    return [
        'coupon_code' => 'required_if:has_coupon,true|string|max:50',
    ];
}
```

---

## Exceptions

When the condition involves multiple fields with complex logic, computed values, or external data (database, API), use `ConditionalRules::when()` or `sometimes()`.

---

## Consequences Of Violation

Maintenance risks: simple conditions hidden behind verbose callback syntax. Readability: rules harder to scan and understand at a glance.

---

## Rule 2: Use ConditionalRules::when() for Complex Conditions on Input State

---

## Category

Architecture

---

## Rule

Use `ConditionalRules::when(condition, ifRules, elseRules)` when the condition depends on raw input data, the request method, the authenticated user, or other request-level state available at parse time.

---

## Reason

`ConditionalRules::when()` evaluates the condition at parse time, before validation runs. This makes it suitable for conditions based on request state (e.g., HTTP method for create vs update), not on validated field values.

---

## Bad Example

```php
// Using sometimes() for a condition that could be evaluated at parse time
$validator->sometimes('email', 'required|unique:users', function (Input $input) {
    return request()->isMethod('post');
});
```

---

## Good Example

```php
'email' => ConditionalRules::when(
    fn () => request()->isMethod('post'),
    ['required', 'email', 'unique:users'],
    ['sometimes', 'email']
),
```

---

## Exceptions

For conditions that depend on validated values of other fields (not raw input), use `sometimes()` inside `withValidator()`.

---

## Consequences Of Violation

Performance risks: `sometimes()` callbacks fire during the validation loop instead of parse time, adding per-attribute overhead. Readability: intent is less clear than `ConditionalRules`.

---

## Rule 3: Use sometimes() Inside withValidator() for Conditions on Validated Values

---

## Category

Framework Usage

---

## Rule

Use `$validator->sometimes()` when the condition depends on the validated value of another field — not the raw input. Register this inside `withValidator()`.

---

## Reason

`sometimes()` callbacks fire during the `passes()` loop and have access to the current `Illuminate\Validation\Input` instance, which contains validated values of already-processed fields. This enables conditions like "approver_email is required if the approved amount >= 1000."

---

## Bad Example

```php
// Condition evaluated on raw input, but we need validated value
'approver_email' => ConditionalRules::when(
    fn () => $this->amount >= 1000, // Raw input, not validated
    ['required', 'email'],
    ['nullable', 'email']
),
```

---

## Good Example

```php
public function withValidator(Validator $validator): void
{
    $validator->sometimes('approver_email', 'required|email', function (Input $input) {
        return $input->amount >= 1000; // Validated value
    });
}
```

---

## Exceptions

Use `ConditionalRules::when()` when the condition is based on raw input only (input that does not need prior validation).

---

## Consequences Of Violation

Reliability risks: conditional rules based on unvalidated input may pass invalid data or fail on unverified values.

---

## Rule 4: Avoid Deep Nesting of Conditional Rules

---

## Category

Maintainability

---

## Rule

Do not chain more than two conditional rules on a single field. Extract deeply nested conditional logic into separate methods or dedicated FormRequests.

---

## Reason

Deeply nested conditions (e.g., `required_if:type,A,required_if:subtype,B,required_if:status,C`) become unreadable, untestable, and impossible to debug. The combination of multiple conditions creates combinatorial complexity that is better handled by separating scenarios into different request classes.

---

## Bad Example

```php
'field_x' => 'required_if:type,A|required_if:subtype,B|prohibited_if:status,archived|exclude_if:draft,true|string|max:255'
```

---

## Good Example

```php
// Separate FormRequests per scenario
// DraftPostRequest.php
class DraftPostRequest extends FormRequest
{
    public function rules(): array
    {
        return ['field_x' => ['nullable', 'string', 'max:255']];
    }
}

// PublishedPostRequest.php
class PublishedPostRequest extends FormRequest
{
    public function rules(): array
    {
        return ['field_x' => ['required', 'string', 'max:255']];
    }
}
```

---

## Exceptions

When the conditions are truly simple AND logic (all must be true) with at most 2-3 values, inline declarative rules are acceptable.

---

## Consequences Of Violation

Maintenance risks: impossible to reason about which condition applies. Testing risks: combinatorial explosion of test cases. Reliability risks: unexpected rule interactions.

---

## Rule 5: Use Separate FormRequests When Rules Differ Dramatically

---

## Category

Architecture

---

## Rule

Create separate FormRequests when the validation rules for different scenarios share less than 50% common rules or involve fundamentally different field sets. Do not use conditional rules to merge them.

---

## Reason

A single FormRequest with heavy conditional logic violates the Single Responsibility Principle. Separate requests are independently testable, self-documenting, and prevent the accidental cross-pollination of rules between scenarios.

---

## Bad Example

```php
class UserRequest extends FormRequest
{
    public function rules(): array
    {
        return ConditionalRules::when(
            fn () => $this->isMethod('post'),
            ['name' => 'required|string', 'email' => 'required|email|unique:users', 'password' => 'required|min:8'],
            ['name' => 'sometimes|string', 'email' => 'sometimes|email|unique:users,email,' . $this->route('user')]
        );
    }
}
```

---

## Good Example

```php
class StoreUserRequest extends FormRequest { /* ... */ }
class UpdateUserRequest extends FormRequest { /* ... */ }
```

---

## Exceptions

When the rules differ by only 1-2 optional fields (e.g., password required on create, optional on update), a shared base class with minor conditional additions is acceptable.

---

## Consequences Of Violation

Maintenance risks: growing conditional complexity over time. Testing risks: every test must set up the correct scenario state.

---

## Rule 6: Use exclude_if / exclude_unless for Conditional Field Removal

---

## Category

Framework Usage

---

## Rule

Use `exclude_if` and `exclude_unless` to conditionally remove fields from the validated data array. Use `prohibited_if` when the field's presence should cause a validation error instead.

---

## Reason

`exclude_if` silently omits the field from `validated()` output when the condition is met — useful for optional fields in conditional form sections. `prohibited_if` rejects the entire request if the field is present — useful for mutually exclusive fields.

---

## Bad Example

```php
// Using required_if when the field should be excluded entirely
'secondary_email' => 'required_if:has_second,false|nullable|email'
// secondary_email is still in validated() with null value
```

---

## Good Example

```php
'secondary_email' => 'exclude_if:primary_email,null|email'
// secondary_email absent from validated() when primary_email is null
```

---

## Exceptions

Use `prohibited_if` when the application must reject the request if a field is submitted (e.g., admin-only fields submitted by regular users).

---

## Consequences Of Violation

Security risks: sensitive fields leak into validated data. Data integrity risks: null or default values for fields that should not exist.
