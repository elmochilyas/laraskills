# Conditional Validation Patterns

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-conditional-validation-patterns |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Advanced |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Conditional validation strategies: `sometimes` rules for optional fields, `Rule::when()` for rule set composition, `withValidator()` for after-validation hooks, and `Validator::sometimes()` for runtime condition checks. These patterns enable adaptive validation that responds to input values, creating decision trees for what constitutes valid input.

## Core Concepts

- **`sometimes` Rule**: Validates only when the field is present — skips validation entirely when absent.
- **`Rule::when()`**: Ternary operator for rule sets — condition ? applyRulesA : applyRulesB.
- **`withValidator()` Hook**: Access to the Validator instance before validation executes.
- **`after()` Hook**: Post-validation cross-field checks that run after all rules pass.
- **`required_if` / `prohibited_if`**: Conditional field presence rules based on other field values.
- **`exclude_if`**: Conditionally exclude a field from validated data.

## When To Use

- When field requirements depend on other field values
- For polymorphic payloads where shape depends on a type field
- For optional fields that only require validation when present
- For cross-field validation (start_date before end_date)
- For mutual exclusion scenarios (either field A or field B, not both)

## When NOT To Use

- For all-required payloads with no conditional logic
- When all fields are optional — use `nullable` instead of `sometimes`
- For validation that belongs in the service layer (use `Validator::make()`)
- For complex conditional logic that would be clearer in a Rule class

## Best Practices (WHY)

- **Use `Rule::when()` for simple conditions**: Inline, readable, composable.
- **Use `withValidator()` for complex conditions**: Full Validator access, `after()` hooks.
- **Use `sometimes` for presence-based conditions**: Simple, framework-native.
- **Use `after()` for cross-field validation**: Runs once after all rules pass — most efficient.
- **Use `prohibited_if` instead of `required_without`**: More explicit for mutual exclusion.
- **Document conditional branches**: Comment the state machine to help future developers.
- **Override error messages for conditional rules**: Context-specific messages improve DX.
- **Avoid nesting `Rule::when()` calls**: Extract to a named method for readability.

## Architecture Guidelines

- Keep simple conditions in `rules()` using `Rule::when()`.
- Move complex multi-field conditions to `withValidator()`.
- Use `after()` hook for cross-field rules that cannot be expressed as attribute rules.
- Use `$validator->sometimes()` for conditions based on multiple input values.
- Prefer `prohibited_if` over `required_without` for mutually exclusive fields.
- Test each conditional branch independently.

## Performance Considerations

- `sometimes` checks are cheap — presence check only.
- `Validator::sometimes()` with closure runs the closure per field.
- `after()` hooks run once per request, not per field — most efficient cross-field location.
- Complex `required_if` chains are slower than a single `after()` hook.
- Closures in `rules()` cannot be serialized — use Rule classes for cached routes.

## Security Considerations

- Conditional logic that depends on user input must not allow privilege escalation.
- `exclude_if` prevents fields from appearing in `validated()` — ensure this doesn't bypass authorization.
- Test all conditional branches — untested branches are security vulnerabilities.
- `required_if` conditions based on user type/role must be paired with authorization checks.
- `prohibited_if` prevents fields from being submitted — validate this on write endpoints.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Using `sometimes` instead of `nullable` | `sometimes` skips validation when absent; `nullable` allows null | Confusing similar concepts | Absent field skips all rules, including type checks | Use `nullable` for optional fields that should still validate type if present |
| Nesting `Rule::when()` calls | Unreadable conditional chains | Overusing Rule::when() | Hard to debug and maintain | Extract to a named method |
| `required_if` with wrong path | `required_if:type,product` without wildcard prefix | Wrong attribute path | Condition never matches | Use exact parent wildcard path |
| `after()` for field-level rules | `after()` adds errors to specific fields | Misunderstanding after() purpose | Runs even on failed validation | Use field rules for field checks; after() for cross-field |
| Closures in rules() with route caching | Serialization exception | Not using Rule classes | Route cache breaks | Use Rule::class or Rule::when() |

## Anti-Patterns

- **`after()` hook with no isEmpty() check**: `after()` runs even when validation fails — check errors first.
- **Conditional logic scattered across rules() and withValidator()**: Centralize decisions.
- **Single monolithic `withValidator()` with all conditions**: Hard to test individual branches.
- **`sometimes` on every field**: Overuse defeats the purpose — be explicit about optional vs conditional.
- **Over-nested conditionals**: More than 3 levels of `Rule::when()` is unreadable.

## Examples

```php
// Simple conditional with Rule::when()
'company_name' => Rule::when(
    $this->input('type') === 'business',
    ['required', 'string', 'max:255'],
    ['nullable', 'string', 'max:255']
),

// Required_if for conditional presence
'card_number' => ['required_if:payment_method,credit_card', 'string'],
'bank_account' => ['required_if:payment_method,bank_transfer', 'string'],

// Cross-field validation in after()
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($this->input('start_date') > $this->input('end_date')) {
            $validator->errors()->add('start_date', 'Start must be before end.');
        }
    });
}
```

## Related Topics

- Form Request Design for APIs (base request hosting conditional rules)
- Validation Rule Array Design (conditional rules within array wildcards)
- Custom Validation Rules (custom rules with conditional logic)
- After Validation Hooks (post-validation hooks for cross-field checks)
- Input Preparation (preparing input before conditional rules evaluate)

## AI Agent Notes

- Use `Rule::when()` for simple binary conditions; use `withValidator()` for complex multi-field logic.
- Use `sometimes` for presence-based conditions; use `nullable` for optional fields with type validation.
- Always add `after()` checks for cross-field validation that can't be done per-field.
- Extract complex conditional logic from `rules()` to dedicated methods.
- When generating conditional validation, test every branch independently.

## Verification

- [ ] Conditional rules use `Rule::when()` for simple conditions
- [ ] Complex multi-field conditions use `withValidator()` / `after()`
- [ ] `sometimes` is used correctly (presence check) vs `nullable` (allows null)
- [ ] `required_if` paths match the exact input structure with wildcards
- [ ] `after()` checks for errors before adding new ones
- [ ] Each conditional branch has test coverage
- [ ] No excessive nesting of `Rule::when()` calls
