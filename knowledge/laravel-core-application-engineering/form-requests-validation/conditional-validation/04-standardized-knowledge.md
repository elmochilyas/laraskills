# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Form Requests & Validation |
| Knowledge Unit | Conditional Validation |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Conditional validation applies rules selectively based on the state of other fields, the authenticated user, database state, or external conditions. Laravel provides several mechanisms: declarative rules (`required_if`, `prohibited_if`, `exclude_if`), the `sometimes` method, `ConditionalRules` class, and `withValidator()` for complex conditions. Each approach operates at a different point in the validation lifecycle — some modify rules before validation, others inject callbacks that run during the validation pass.

---

## Core Concepts

- **Declarative rules**: `required_if`, `required_unless`, `required_with`, `prohibited_if`, `exclude_if`, `exclude_unless` — order-independent, evaluate during per-attribute validation
- **sometimes()**: Adds conditional rules based on validated input — callbacks fire during the `passes()` loop
- **ConditionalRules class**: `ConditionalRules::when(condition, ifRules, elseRules)` — condition evaluated at parse time
- **withValidator() hook**: Mutate the validator before passes() — add conditional rules programmatically
- **exclude_* rules**: Remove field from validated data when condition is met — useful for conditional fields in forms

---

## When To Use

- Forms where field requirements change based on other field values
- Multi-step forms where later steps depend on earlier choices
- Profile forms where different fields are required for different user types
- Admin forms where some fields are only relevant under specific conditions

## When NOT To Use

- Simple required fields that don't depend on other values
- When the same effect can be achieved with separate FormRequests per scenario
- When conditional logic makes the rules harder to understand than separate requests

---

## Best Practices

- **Use declarative rules first** — `required_if`, `prohibited_if` are clearest for simple conditions
- **Use `ConditionalRules::when()` for complex conditions** that depend on input data or request state
- **Use `withValidator()` with `sometimes()`** for conditions that depend on validated values of other fields
- **Use `exclude_if`/`exclude_unless`** to prevent unwanted fields from appearing in validated data
- **Prefer separate FormRequests** when the validation rules differ dramatically between scenarios
- **Avoid deep nesting** of conditional rules — extract into separate methods or classes

---

## Architecture Guidelines

- `ConditionalRules::when()` condition evaluated at parse time — operates on raw input, not validated values
- `sometimes()` callbacks fire during the `passes()` loop — access to current `Input` instance
- `exclude_if` triggers `shouldBeExcluded()` in the validator loop — removes attribute from validated data
- `required_if` with nested fields uses dot notation: `required_if:parent.child,value`
- Multiple conditions use array syntax: `required_if:field1,value1,field2,value2` (OR logic)
- Custom `validator()` method override provides complete control for complex conditional scenarios

---

## Performance

Declarative conditional rules add negligible overhead — they're simple string comparisons. `ConditionalRules::when()` adds parse-time overhead proportional to condition complexity. `sometimes()` callbacks fire during the per-attribute loop — keep callbacks lightweight. Complex conditions with database queries should be cached.

---

## Security

Conditional rules should not make authorization decisions — they determine which fields are valid, not who can access them. Use `exclude_if` carefully to avoid accidentally exposing sensitive fields. Conditions that depend on user roles should use `authorize()`, not conditional validation.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Overwriting `required_if` values | Same field in array overwritten | Last rule wins, unexpected behavior | Use array syntax to group rules |
| Using `sometimes()` with non-existent fields | Field name typo | Callback never fires | Verify field names match request input |
| Complex conditions in `required_if` | Too many values | Rule becomes unreadable | Use `ConditionalRules::when()` |
| `exclude_if` instead of `prohibited_if` | Confusing the two | Field silently removed instead of error | Use `prohibited_if` when field should cause error |
| Conditional rules on non-existent data | Condition references missing field | PHP warning or null reference | Use `filled()` or `present()` to check existence first |

---

## Anti-Patterns

- **Deeply nested conditional logic**: `required_if:type,A,required_if:subtype,B,required_if:status,C` — extract into method
- **Conditions that make rules unreadable**: 10-line condition expressions inline in rules array
- **Using `sometimes()` when `required_if` suffices**: Over-complicating simple conditional requirements
- **User role in conditional rules**: Role-based field requirements belong in separate FormRequests per role

---

## Examples

**Declarative conditional:**
```php
'coupon_code' => 'required_if:has_coupon,true|string|max:50'
'secondary_email' => 'exclude_if:primary_email,null|email'
```

**ConditionalRules::when():**
```php
'email' => ConditionalRules::when(
    fn () => request()->isMethod('post'),
    ['required', 'email', 'unique:users'],     // create
    ['sometimes', 'email']                      // update
)
```

**sometimes() with withValidator():**
```php
public function withValidator(Validator $validator): void
{
    $validator->sometimes('approver_email', 'required|email', function (Input $input) {
        return $input->amount >= 1000;
    });
}
```

**exclude_if on primary/secondary email:**
```php
$validated = $request->validate([
    'primary_email' => 'required|email',
    'secondary_email' => 'exclude_if:primary_email,null|email',
]);
// 'secondary_email' absent from $validated when primary_email is null
```

---

## Related Topics

- validation-rule-patterns — Rule syntax fundamentals
- custom-validation-rules — Creating reusable conditional rules
- after-validation-hooks — Post-validation processing
- input-preparation — Preparing data before conditional checks
- form-request-fundamentals — FormRequest integration

---

## AI Agent Notes

- `ConditionalRules::passes($data)` receives raw input at parse time — data is NOT validated yet
- `sometimes()` registers a callback array in the Validator's `$sometimes` property
- `exclude_if` triggers `shouldBeExcluded()` check during the validator loop
- `required_if` with multiple values uses OR logic: `required_if:field,val1,val2`
- `prohibited_if` throws validation error when the field IS present
- `exclude_unless` keeps the field only when the condition is met

---

## Verification

- [ ] Declarative rules used for simple field-dependent conditions
- [ ] `ConditionalRules::when()` for conditions based on input/request state
- [ ] `sometimes()` for conditions based on validated values
- [ ] `exclude_if`/`exclude_unless` used for field removal when appropriate
- [ ] No deep nesting of conditional rules
- [ ] Separate FormRequests created when rules differ dramatically
- [ ] Unit tests cover all conditional rule paths
- [ ] Conditions readable and maintainable (not complex inline logic)
