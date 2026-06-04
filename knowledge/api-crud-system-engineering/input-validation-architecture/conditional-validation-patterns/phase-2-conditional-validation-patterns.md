# Conditional Validation Patterns

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** conditional-validation, when-rules, sometimes, withValidator, laravel

## Executive Summary
Phase 2 covers conditional validation strategies: `sometimes` rules for optional fields, `when()` for rule set composition, `withValidator()` for after-validation hooks, and `Validator::sometimes()` for runtime condition checks. These patterns enable adaptive validation that responds to input values.

## Core Concepts

### The `sometimes` Rule
Marks a field as validated **only when present** in the input:
```php
'coupon_code' => ['sometimes', 'string', 'max:50', 'exists:coupons,code'],
```

If `coupon_code` is absent, all subsequent rules are skipped. If present, all rules apply.

### Conditional Rule Resolution
`Rule::when()` returns different rule sets based on a boolean condition:
```php
Rule::when(
    $this->input('type') === 'organization',
    ['required', 'string', 'max:255'],      // when true
    ['nullable', 'string', 'max:255']       // when false
)
```

## Internal Mechanics

### withValidator Hook
`withValidator()` gives access to the `Validator` instance before validation executes:
```php
protected function withValidator(Validator $validator): void
{
    $validator->sometimes('discount', 'required|numeric|min:0|max:100', function ($input) {
        return $input->coupon_code !== null;
    });
}
```

This is where conditional rules that depend on multiple input values belong.

### after() Hook on Validator
```php
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($this->input('start_date') > $this->input('end_date')) {
            $validator->errors()->add('start_date', 'Start must be before end.');
        }
    });
}
```

`after()` runs after all rules pass but before `validated()` returns.

## Patterns

### Required_if for Conditional Presence
```php
'payment_method' => ['required', Rule::in(['credit_card', 'bank_transfer', 'paypal'])],
'card_number' => ['required_if:payment_method,credit_card', 'string'],
'bank_account' => ['required_if:payment_method,bank_transfer', 'string'],
'paypal_email' => ['required_if:payment_method,paypal', 'email'],
```

### Prohibited_if for Mutual Exclusion
```php
'full_amount' => ['boolean'],
'installment_count' => ['prohibited_if:full_amount,true', 'integer', 'min:2', 'max:12'],
```

### Complex Multi-Field Conditions
```php
protected function withValidator(Validator $validator): void
{
    $validator->sometimes('shipping_address', 'required|array', function ($input) {
        return $input->is_physical === true && $input->delivery_method === 'shipping';
    });

    $validator->sometimes('pickup_location', 'required|string', function ($input) {
        return $input->delivery_method === 'pickup';
    });
}
```

### Exclude_if for Conditional Exclusion
```php
'password' => ['required', 'string', 'min:8', 'confirmed'],
'password_confirmation' => ['required_with:password', 'string'],
'current_password' => ['exclude_if:password_provided,false', 'required', 'current_password'],
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| Rule::when() for simple conditions | Inline, readable | If/else in rules() — procedural, harder to read |
| withValidator() for complex conditions | Full Validator access, after() hooks | rules() with closures — harder to debug |
| sometimes attribute | Built-in, no condition function needed | nullable — allows null but still validates |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Rule::when() | Fluent, composable | Adds dependency on Rule facade |
| withValidator() | Full control over validator | Separates rules from rules() method |
| sometimes | Simple, framework-native | Limited to presence-based conditions |
| after() hook | Post-validation cross-field checks | Runs even on failed validation? No — only if passes |

## Performance Considerations
- `sometimes` checks are cheap — presence check only.
- `Validator::sometimes()` with closure runs the closure per field — avoid expensive operations.
- `after()` hooks run once per request, not per field — the most efficient place for cross-field checks.
- Complex `required_if` chains are slower than a single `after()` hook.

## Production Considerations
- Document conditional branches in rules() to help future developers understand the state machine.
- Use `prohibited_if` instead of `required_without` for mutually exclusive fields.
- Override error messages for conditional rules with context:
  ```php
  'card_number.required_if' => 'Card number is required when paying by credit card.',
  ```

## Common Mistakes
- Using `sometimes` when `nullable` is intended — `sometimes` skips validation entirely when absent; `nullable` validates but allows null.
- Nesting `Rule::when()` calls — unreadable; extract to a method.
- Forgetting that `required_if` checks the **raw input**, not validated data.
- Using `after()` for field-level rules — belongs in rules(); after() is for cross-field logic.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| required_if with nested wildcard | Condition never matches | Use exact attribute path in condition |
| after() manipulates validator after failure | after() runs even when rules fail | after() only runs after rules pass — safe |
| Closures in rules() serialization | Exception with cached routes | Extract closures to Rule classes |
| Complex required_if chain | Validation rule confusion | Use a single after() hook instead |

## Ecosystem Usage

### Laravel Built-in Conditional Rules
```php
Rule::when($condition, [...rules if true...], [...rules if false...]);
Rule::whenHas('coupon_code');
Rule::when($request->isMethod('post'), ['required']);
```

### Spatie Laravel Data Conditional Validation
```php
class OrderData extends Data
{
    public function __construct(
        public string $type,
        public ?string $company_name = null,
        public ?string $vat_number = null,
    ) {}

    public static function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['personal', 'business'])],
            'company_name' => ['required_if:type,business', 'string', 'max:255'],
            'vat_number' => ['required_if:type,business', 'string', 'vat_number'],
        ];
    }
}
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — base request that hosts conditional rules.

### Related Topics
- **validation-rule-array-design** — conditional rules within array validation.
- **custom-validation-rules** — custom rules with conditional logic.

### Advanced Follow-up Topics
- **after-validation-hooks** — post-validation hooks that depend on conditional validation.
- **input-preparation** — preparing input before conditional rules evaluate.

## Research Notes

### Source Analysis
The `Validator::sometimes()` method checks the closure condition before adding rules. The condition receives the full input dataset via `$input` (a Fluent object). If the condition returns true, the rules are added; otherwise, they are skipped.

### Key Insight
Conditional validation creates a **decision tree** for input. Each branch represents a different valid input shape. Well-structured conditional validation makes the API contract explicit about what combinations of fields are valid.

### Version-Specific Notes
- Laravel 10: `Rule::when()` and `Rule::unless()` added.
- Laravel 11: `prohibited_if` and `prohibited_unless` available for mutual exclusion.
- PHP 8.1: First-class callable syntax works with `Validator::sometimes()`.
