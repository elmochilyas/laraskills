# Anti-Patterns — Conditional Validation Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Conditional Validation Patterns |
| Difficulty | Advanced |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| after Hook With No isEmpty Check | High | Medium | Code review: `after()` adds errors without checking `errors()->isEmpty()` |
| Conditional Logic Scattered Across Methods | Medium | High | Code review: conditions in `rules()`, `withValidator()`, and `after()` |
| Single Monolithic withValidator | High | Medium | Code review: one massive `withValidator()` with all conditions |
| Overusing sometimes on Every Field | Medium | Medium | Code review: `sometimes` used where `nullable` is appropriate |
| Over-Nested Rule::when Calls | Medium | Low | Code review: `Rule::when()` nested 3+ levels deep |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Using required_if Without Wildcard Path | `required_if:type,product` on array items without parent wildcard | Condition never matches; required fields are optional |
| Closures in rules With Route Caching | Closure rules used when route caching is enabled | Serialization exception on `php artisan route:cache` |
| Composing Validation via Conditional Strings | Pipe-delimited rules with string concatenation | Fragile, hard to maintain, no IDE support |

---

## Anti-Pattern Details

### AP-CVP-01: after Hook With No isEmpty Check

**Description**: The `Validator::after()` callback adds cross-field validation errors without first checking whether the primary validation already failed. Since Laravel 10+, `after()` callbacks run regardless of whether validation passed. Adding cross-field errors to an already-failing validation produces confusing error messages that obscure the root cause — a field-level validation failure.

**Root Cause**: Assuming `after()` only runs on validation pass. The developer followed older Laravel conventions.

**Impact**:
- Validation errors are mixed: field-level and cross-field errors appearing together
- Client cannot distinguish primary failures from secondary cross-field failures
- Log noise from after-hook failures on requests that already failed field validation
- Cross-field validation masking simpler, fixable field errors

**Detection**:
- Code review: `$validator->after(function ($validator) { ... })` without `isEmpty()` guard
- Integration tests: 422 response showing cross-field errors alongside unrelated field errors
- Bug reports: confusing validation error messages

**Solution**:
- Always guard `after()` callbacks with `$validator->errors()->isEmpty()`
- Return early if primary validation already failed
- Keep cross-field logic cleanly separated from field-level failures

**Example**:
```php
// BEFORE: No isEmpty check
$validator->after(function ($validator) {
    if ($this->input('start_date') > $this->input('end_date')) {
        $validator->errors()->add('start_date', 'Start must be before end.'); // ❌ adds error even when fields invalid
    }
});

// AFTER: Guarded
$validator->after(function ($validator) {
    if ($validator->errors()->isNotEmpty()) {
        return; // ✅ skip cross-field checks if primary validation failed
    }
    if ($this->input('start_date') > $this->input('end_date')) {
        $validator->errors()->add('start_date', 'Start must be before end.');
    }
});
```

---

### AP-CVP-02: Conditional Logic Scattered Across Methods

**Description**: Conditional validation logic is spread across `rules()`, `withValidator()`, `after()`, and sometimes even `passedValidation()`. A single conditional (e.g., "if payment_method is credit_card, require card_number") may be partially in `rules()` via `required_if` and partially in `withValidator()` via an `after()` callback. Understanding the full validation flow requires reading multiple methods.

**Root Cause**: Incremental development. The developer adds conditions one at a time, placing each in whichever method is most convenient at the moment.

**Impact**:
- Validation logic is hard to audit — conditions are scattered across 3-4 methods
- Adding a new condition risks missing existing related logic
- Testing requires exercising multiple methods to cover one scenario
- New developers cannot determine where a given condition lives

**Detection**:
- Code review: the same condition referenced in `rules()` and `withValidator()`
- Code review: `after()` callback logic that duplicates conditions from `rules()`
- Test review: test for a single condition spans multiple test methods

**Solution**:
- Keep simple conditions (field depends on another field) in `rules()` using `required_if`/`prohibited_if`
- Keep complex multi-field conditions in `withValidator()` with `after()`
- Comment the condition flow: "Lines 10-15: payment method condition; Lines 30-40: cross-field validation"
- Extract complex decision trees to named methods

**Example**:
```php
// BEFORE: Scattered logic
public function rules(): array
{
    return [
        'card_number' => ['required_if:payment_method,credit_card', 'string'], // condition A
        'bank_account' => ['required_if:payment_method,bank_transfer', 'string'], // condition A
    ];
}

public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($this->input('payment_method') === 'credit_card') { // condition A again
            // validate CVV
        }
    });
}

// AFTER: Centralized decision tree
public function rules(): array
{
    return $this->paymentMethodRules() + $this->standardRules();
}

protected function paymentMethodRules(): array
{
    return [
        'card_number' => ['required_if:payment_method,credit_card', 'string'],
        'bank_account' => ['required_if:payment_method,bank_transfer', 'string'],
    ];
}
```

---

### AP-CVP-03: Single Monolithic withValidator

**Description**: The `withValidator()` method contains every complex conditional rule in the entire FormRequest — cross-field checks, external service validation, computed field validation, and multi-condition branching all in one massive callback. This method becomes hundreds of lines long, untestable, and difficult to reason about.

**Root Cause**: Treating `withValidator()` as the designated place for "complex stuff." The developer puts everything that doesn't fit in `rules()` into `withValidator()`.

**Impact**:
- `withValidator()` becomes a black box of validation logic
- Individual conditions cannot be tested independently
- Adding one condition risks breaking existing ones
- Method exceeds cognitive load limits (100+ lines)

**Detection**:
- Code review: `withValidator()` exceeds 50 lines
- Code review: `withValidator()` contains multiple unrelated `after()` callbacks
- Test review: `withValidator()` tested as a single unit, not per-condition

**Solution**:
- Extract each distinct condition to a named method: `validatePaymentMethod()`, `validateDateRange()`, `validateFraudCheck()`
- Register each as a separate `after()` callback
- Keep `withValidator()` as a coordinator that calls named methods

**Example**:
```php
// BEFORE: Monolithic withValidator
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($validator->errors()->isNotEmpty()) return;
        // Payment method validation
        if ($this->input('payment_method') === 'credit_card') { /* ... */ }
        // Date range validation
        if ($this->input('start_date') > $this->input('end_date')) { /* ... */ }
        // Fraud check
        try { /* external API call */ } catch (Throwable $e) { /* ... */ }
    });
}

// AFTER: Named methods
protected function withValidator(Validator $validator): void
{
    $validator->after($this->validateDateRange(...));
    $validator->after($this->validateFraudCheck(...));
}

protected function validateDateRange(): Closure
{
    return function ($validator) {
        if ($validator->errors()->isNotEmpty()) return;
        if ($this->input('start_date') > $this->input('end_date')) {
            $validator->errors()->add('start_date', 'Start must be before end.');
        }
    };
}

protected function validateFraudCheck(): Closure
{
    return function ($validator) {
        if ($validator->errors()->isNotEmpty()) return;
        try {
            // external API check
        } catch (Throwable $e) {
            Log::warning('Fraud check failed', ['error' => $e->getMessage()]);
        }
    };
}
```

---

### AP-CVP-04: Overusing sometimes on Every Field

**Description**: The `sometimes` rule is applied to every field regardless of whether the field is genuinely conditional. `sometimes` bypasses validation when the field is absent — but for fields that SHOULD be present, `sometimes` masks missing-field bugs. Developers use `sometimes` as a default to avoid "field required" errors, rather than being explicit about which fields are optional vs conditionally required.

**Root Cause**: Confusion between `sometimes` and `nullable`. The developer uses `sometimes` to mean "allow this field to be missing," when `nullable` (with `required` absent) is more appropriate for optional fields.

**Impact**:
- Missing required fields pass validation silently
- Clients can omit mandatory fields without error
- Validation is weaker than intended — downstream code must check for missing keys
- Code review cannot distinguish "truly optional" from "accidentally optional"

**Detection**:
- Code review: `sometimes` on more than half of all fields
- Code review: `sometimes` used where a field should always be validated when present but isn't conditionally required
- Integration tests: omitted required fields pass validation

**Solution**:
- Use `sometimes` only for genuine conditional presence: "validate only when the field exists"
- Use `nullable` for optional fields that may be `null`
- Be explicit: `required` for mandatory fields, absent for truly optional, `sometimes` for conditional

**Example**:
```php
// BEFORE: Overusing sometimes
public function rules(): array
{
    return [
        'title' => ['sometimes', 'required', 'string', 'max:255'], // ❌ should be required
        'body' => ['sometimes', 'required', 'string'],              // ❌ should be required
        'status' => ['sometimes', Rule::in(['draft', 'published'])], // ❌ should be nullable
        'meta' => ['sometimes', 'array'],                           // ❌ should be nullable
    ];
}

// AFTER: Explicit field requirements
public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:255'],                   // ✅ always required
        'body' => ['required', 'string'],                               // ✅ always required
        'status' => ['nullable', Rule::in(['draft', 'published'])],     // ✅ optional, nullable
        'meta' => ['nullable', 'array'],                                // ✅ optional, nullable
        'coupon_code' => ['sometimes', 'string', 'max:50'],             // ✅ genuinely conditional
    ];
}
```

---

### AP-CVP-05: Over-Nested Rule::when Calls

**Description**: `Rule::when()` calls are nested three or more levels deep to handle complex conditional validation. The resulting rules array is unreadable: `Rule::when(cond1, [Rule::when(cond2, [ruleA], [ruleB])], [Rule::when(cond3, [ruleC], [ruleD])])`. Developers cannot trace through the condition tree to understand what rules apply in a given scenario.

**Root Cause**: Attempting to express complex state machines in a declarative rule array. The developer uses `Rule::when()` as a general-purpose conditional rather than extracting logic to `withValidator()`.

**Impact**:
- Rules method is unreadable beyond one level of nesting
- Adding a new branch requires untangling existing nesting
- Testing every condition combination is impractical
- Serialization for route caching may fail with deeply nested closures

**Detection**:
- Code review: `Rule::when()` nested 3+ levels deep
- Code review: `Rule::when()` inside `Rule::when()` inside `Rule::when()`
- Test review: untested condition branches in the nested tree

**Solution**:
- Use `Rule::when()` for simple binary conditions only (1 level)
- Extract complex decision trees to `withValidator()` with `after()` callbacks
- Move multi-branch logic to a dedicated validation method

**Example**:
```php
// BEFORE: Over-nested Rule::when
public function rules(): array
{
    return [
        'discount' => Rule::when(
            $this->input('type') === 'order',
            [Rule::when($this->input('subtotal') > 100, ['required', 'numeric'], ['prohibited'])],
            [Rule::when($this->input('type') === 'product', ['nullable', 'numeric'], ['prohibited'])]
        ), // ❌ 3 levels deep, unreadable
    ];
}

// AFTER: Extracted to withValidator
public function rules(): array
{
    return [
        'discount' => ['nullable', 'numeric'], // base rule, always valid type
    ];
}

public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($validator->errors()->isNotEmpty()) return;
        $this->validateDiscountForType($validator);
    });
}

protected function validateDiscountForType(Validator $validator): void
{
    $type = $this->input('type');
    $discount = $this->input('discount');

    if ($type === 'order' && $this->input('subtotal') <= 100 && $discount !== null) {
        $validator->errors()->add('discount', 'Discount not allowed for orders under $100.');
    }
    if ($type === 'product' && $discount !== null) {
        // product-type validation rules
    }
}
```
