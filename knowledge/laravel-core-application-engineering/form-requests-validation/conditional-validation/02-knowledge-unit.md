# Conditional Validation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Form Requests & Validation
- **Knowledge Unit:** Conditional Validation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Conditional validation applies rules selectively based on the state of other fields, the authenticated user, database state, or external conditions. Laravel provides several mechanisms: declarative rules (`required_if`, `prohibited_if`, `exclude_if`), the `sometimes` method, `ConditionalRules` class, and `withValidator()` for complex conditions. Each approach operates at a different point in the validation lifecycle — some modify rules before validation, others inject callbacks that run during the validation pass.

---

## Core Concepts

### Declarative Conditional Rules

Built-in rules that change behavior based on other field values:

- `required_if:field,value` — makes a field required when another field equals a value
- `required_unless:field,value` — required unless another field equals a value
- `required_with:foo,bar` — required when any of those fields are present
- `prohibited_if:field,value` — field must be absent when condition is met (throws validation error if present)
- `exclude_if:field,value` — field is removed from validated data when condition is met
- `exclude_unless:field,value` — field is removed unless condition is met

These rules are order-independent — they evaluate at the per-attribute level during the `Validator::passes()` iteration.

### The sometimes() Method

The `sometimes` method adds conditional rules based on the validated input — useful when rules depend on validated values of other fields:

```php
$validator->sometimes('approver_email', 'required|email', function (Input $input) {
    return $input->amount >= 1000;
});
```

### ConditionalRules Class

`ConditionalRules` (Laravel 10+) defines rules that apply only when a condition passes:

```php
use Illuminate\Validation\ConditionalRules;

'email' => ConditionalRules::when(
    fn () => request()->isMethod('post'),
    ['required', 'email', 'unique:users'],
    ['sometimes', 'email']
)
```

The condition is evaluated at pipe-parse time during `ValidationRuleParser::filterConditionalRules()`.

---

## Mental Models

### The Validation Pass Structure

The Validator iterates attributes → rules. Declarative rules (`required_if`) are evaluated as part of the per-rule execution. `withValidator()` runs after the Validator is constructed but before `passes()` runs. `sometimes()` callbacks fire during the per-rule loop. Understanding where each mechanism fires is critical for correct conditional validation.

### Pre-Validation vs During-Validation

- `ConditionalRules`, `validationData()`, custom `validator()` → modify rules BEFORE the validator's `passes()` loop
- `required_if`, `required_with`, `prohibited_if` → evaluate DURING the loop as part of `validateAttribute()`
- `withValidator()->sometimes()` → adds rules DURING the loop via the `sometimes` callback mechanism

---

## Internal Mechanics

### ConditionalRules::filterConditionalRules()

`ConditionalRules` objects are resolved during `ValidationRuleParser::explode()`:

```php
public static function filterConditionalRules($rules, array $data = [])
{
    return (new Collection($rules))->mapWithKeys(function ($attributeRules, $attribute) use ($data) {
        if ($attributeRules instanceof ConditionalRules) {
            return [$attribute => $attributeRules->passes($data)
                ? array_filter($attributeRules->rules($data))
                : array_filter($attributeRules->defaultRules($data))];
        }

        if (is_array($attributeRules)) {
            return [$attribute => (new Collection($attributeRules))->map(function ($rule) {
                if (! $rule instanceof ConditionalRules) {
                    return [$rule];
                }
                return $rule->passes($data) ? $rule->rules($data) : $rule->defaultRules($data);
            })->filter()->flatten(1)->values()->all()];
        }

        return [$attribute => $attributeRules];
    })->all();
}
```

Key detail: `ConditionalRules::passes($data)` receives the current `$data` array at parse time — the data has NOT been validated yet. The condition necessarily operates on raw input, not validated values.

### The sometimes() Execution Model

`sometimes()` registers a callback that fires during the `passes()` loop:

```php
// Validator implementation
public function sometimes($attribute, $rules, callable $callback)
{
    $this->sometimes[$attribute][] = [$rules, $callback];
}
```

During `passes()`, after per-attribute validation, the `after` hook is called. `sometimes()` conditions fire per-attribute if the callback returns true, adding rules dynamically.

### The exclude_* Attribute Removal

Rules like `exclude_if` and `exclude_unless` trigger `shouldBeExcluded()` in the validator loop:

```php
protected function shouldBeExcluded($attribute)
{
    foreach ($this->excludeAttributes as $excludeAttribute) {
        if ($attribute === $excludeAttribute ||
            Str::startsWith($attribute, $excludeAttribute.'.')) {
            return true;
        }
    }
    return false;
}
```

When an attribute is excluded, it is removed from the validated data and skipped in output:

```php
// Result: 'secondary_email' is absent from validated()
$validated = $request->validate([
    'primary_email' => 'required|email',
    'secondary_email' => 'exclude_if:primary_email,null|email',
]);
```

### required_if and Nested Field Dots

`required_if` with nested fields uses dot notation:

```php
'shipping.address' => 'required_if:billing.same,false'
```

The parser uses `str_replace('.', '->', $key)` internally to prevent dot-notation collision in the `Validator::parseData()` method.

---

## Patterns

### withValidator() for Complex Conditions

When declarative rules are insufficient, use `withValidator()` for callback-based conditional logic:

```php
public function withValidator(Validator $validator): void
{
    $validator->sometimes('discount_percent', 'required|numeric|min:0|max:100', function (Input $input) {
        return $input->has_coupon && $input->coupon_type === 'percent';
    });

    $validator->sometimes('discount_flat', 'required|numeric|min:0', function (Input $input) {
        return $input->has_coupon && $input->coupon_type === 'flat';
    });
}
```

### Database-Driven Conditional Rules

For conditions based on database state:

```php
public function withValidator(Validator $validator): void
{
    $validator->after(function (Validator $validator) {
        if ($this->route('team')->members()->count() >= $this->route('team')->maxMembers) {
            $validator->errors()->add('members', 'Team is at maximum capacity.');
        }
    });
}
```

This uses `after()` rather than `sometimes()` because the condition depends on database query results, not input data.

### Cross-Field Validation

```php
public function rules(): array
{
    return [
        'start_date' => 'required|date|before:end_date',
        'end_date' => 'required|date|after:start_date',
    ];
}
```

Laravel's `before`/`after` rules accept other field names as parameters, enabling cross-field date comparison without closures.

---

## Architectural Decisions

### Declarative vs Callback-Based

| Approach | When to Use | Limitation |
|----------|------------|------------|
| `required_if`, `exclude_if` | Simple field → field dependency | Cannot query DB |
| `sometimes()` | Complex condition on input | Runs during validation, hard to test |
| `ConditionalRules` | Conditional at definition time | Evaluated at parse time, not validation time |
| `withValidator()` → `after()` | DB-dependent conditions | Manual error handling |
| `validationData()` override | Data transformation before rules | Cannot access validated state |

### ConditionalRules vs withValidator()

`ConditionalRules` is evaluated at rule parse time — before validation begins. `withValidator()` can mutate the validator object after construction. Use `ConditionalRules` for input-condition rules, `withValidator()` for external-state rules.

---

## Tradeoffs

### Declarative Rules vs Callback Control

Declarative rules (`required_if`, `exclude_if`) are concise and readable — they express conditions in a single line. The tradeoff is that they only support simple equality or presence checks. Callback-based approaches (`sometimes()`, `ConditionalRules`) handle complex conditions but spread validation logic across methods and closures. For teams with junior developers, declarative rules are more maintainable. For complex domain logic, callbacks provide necessary flexibility at the cost of readability.

### Pre-Validation vs During-Validation Evaluation

`ConditionalRules` evaluate at rule parse time (before validation), meaning the condition runs regardless of whether other field validation passes. `sometimes()` evaluates during validation, so the condition can depend on partially validated data. The tradeoff is correctness vs performance — pre-validation evaluation is faster but may run conditions on invalid data, while during-validation evaluation is more accurate but couples condition execution to the validation loop order.

---

## Production Considerations

### Conditional Rule Caching

In production, conditional rules that evaluate external state (database queries, API calls) should be cached for the request duration. A `ConditionalRules` closure that queries a configuration table on every request adds unnecessary database load. Use a memoized helper or cache the result in the FormRequest instance for the request lifecycle.

### Error Message Consistency with Excluded Fields

`exclude_if` and `exclude_unless` silently remove fields from validated data. In production, this can confuse API consumers who send a field and receive no error — the field is simply absent from the response. Document this behavior in your API contract, or use `prohibited_if` when the field should cause an explicit error rather than silent omission.

---

## Common Mistakes

### Using sometimes() When required_if Would Work

```php
// Over-engineered
$validator->sometimes('country', 'required', function (Input $input) {
    return true;
});

// Equivalent and simpler
'country' => 'required'
```

`sometimes()` is only needed when the condition cannot be expressed as a built-in rule parameter.

### Exclude vs Prohibit Confusion

- `exclude_if` — removes field from validated data (field can be absent)
- `prohibited_if` — field must be absent (validation fails if field is present)

Choose `exclude_if` when the field is optional based on conditions. Choose `prohibited_if` when the field must not be sent.

### ConditionalRules with Database State

`ConditionalRules` receives raw input array, not validated data. Database queries inside the condition closure will run before validation — wasted work if validation ultimately fails.

---

## Performance Considerations

### ConditionalRules Eager Evaluation

`ConditionalRules::passes($data)` evaluates the condition closure for EVERY attribute that uses a ConditionalRules instance. For high-traffic endpoints, evaluate expensive conditions once and cache the result:

```php
'email' => ConditionalRules::when(
    fn () => $cachedResult = $this->expensiveCheck(),
    ['required', 'email'],
    ['sometimes', 'email']
),
```

### Excluded Attributes Still Read

The Validator reads `$this->data` to get the field value before checking `shouldBeExcluded()`. The attribute's value IS accessed — it's just not included in the validated output.

---

## Failure Modes

### Circular Conditional Dependencies

`required_if:A,value1` and `required_if:B,value2` where both A and B reference each other creates a logical paradox. The Validator processes attributes in array order — the result depends on the order of rule definition, not on actual business logic.

### Input Mutation During Validation

`validationData()` override returns the data that validation sees. If the controller also accesses `$request->input()` directly (not through `validated()`), it may read pre-transformed data. Always use `validated()` or `safe()` to ensure data consistency.

---

## Ecosystem Usage

### Laravel Nova

Nova uses conditional validation extensively in its resource creation and update forms. The `required_if` rule is used to conditionally require fields based on resource type selections. Nova's flex fields and custom field panels rely on `exclude_if` to cleanly omit irrelevant fields from validated data, keeping the validated output focused on the active form configuration.

### Laravel Jetstream

Jetstream's team creation flow uses `required_with` to conditionally validate team member emails when the "invite members" option is toggled. The profile update forms use `exclude_unless` to prevent unnecessary profile fields from appearing in validated data when they haven't been changed.

### Laravel Spark

Spark's subscription plans use declarative conditional rules extensively — `required_if:plan,enterprise` adds validation for enterprise-specific fields only when the enterprise plan is selected. The `prohibited_if` rule prevents trial users from accessing billing-specific fields that should not be submitted from the trial interface.

---

## Related Knowledge Units

- **After Validation Hooks** (this subdomain) — withValidator() and after() for custom logic
- **Input Preparation** (this subdomain) — prepareForValidation() and merge()
- **Validation Rule Patterns** (this subdomain) — individual rule behavior
- **Form Request Fundamentals** (this subdomain) — where conditions fit in the pipeline

---

## Research Notes

### ConditionalRules and Request Lifecycle

`ConditionalRules` closures receive the raw input data array at rule parse time. This data has not been through `validationData()` — it is the data as it exists when the Validator is constructed. If `validationData()` is overridden, the `ConditionalRules` condition sees the overridden data, but individual rule validation still sees the same data. This is subtle — the condition and the validation always operate on the same data source.

### Future Direction — Expression Language for Rules

Future Laravel versions could introduce an expression language for conditional rules, replacing string-based `required_if:field,value` with structured expressions like `requiredIf(field === 'value')`. This would provide IDE autocompletion and static analysis while preserving the declarative readability of the current system.

### Framework Source Reference
- `Illuminate\Validation\ConditionalRules` — condition evaluation
- `Illuminate\Validation\Validator::sometimes()` — callback registration
- `Illuminate\Validation\ValidationRuleParser::filterConditionalRules()` — parse-time filtering
