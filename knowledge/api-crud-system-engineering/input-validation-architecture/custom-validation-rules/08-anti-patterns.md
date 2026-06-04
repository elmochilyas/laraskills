# Anti-Patterns — Custom Validation Rules

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Custom Validation Rules |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Returning bool Instead of Calling $fail | Critical | Medium | Code review: `__invoke()` returns `true`/`false` |
| Stateful Rule Instances | High | Low | Code review: instance properties modified during `__invoke()` |
| Injecting Request Into Rules | High | Medium | Code review: `Request` injected into Rule constructor |
| Throwing Exceptions Inside Rules | High | Medium | Code review: `throw` instead of `$fail()` in rule |
| One Gigantic Rule Class | Medium | Medium | Code review: Rule class with multiple validation concerns |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Validator::extend in ServiceProvider | Global rule registration using `Validator::extend()` | Rules applied globally to all validators; cannot be scoped |
| Rules That Call External APIs Synchronously | HTTP requests inside `__invoke()` without timeout or caching | Blocks validation; slow response times |
| Closure Rules in Reusable Contexts | Closures used in rules that need to be cached | Route caching fails; serialization exception |

---

## Anti-Pattern Details

### AP-CVR-01: Returning bool Instead of Calling $fail

**Description**: The rule's `__invoke()` method returns `true` or `false` instead of calling the `$fail` closure for invalid values. This is compatible with the old `passes()` API but silently passes validation when returning `false` without calling `$fail` — the validator interprets the return value differently depending on context, leading to inconsistent results.

**Root Cause**: Following older Laravel documentation or examples that used the `passes()` API. The developer migrated to the `ValidationRule` interface but kept the return-value pattern.

**Impact**:
- Invalid data may pass validation silently (return `false` without `$fail` skips the rule)
- Inconsistent behavior across different Laravel versions
- Cannot control the error message — it's generated automatically
- Rules cannot provide specific, contextual error messages

**Detection**:
- Code review: `return true;` or `return false;` at the end of `__invoke()`
- Code review: no calls to `$fail()` anywhere in the rule class
- Integration tests: invalid data passing validation with custom rules

**Solution**:
- Always call `$fail()` for invalid values
- Never return a value from `__invoke()` — the return value is ignored
- Call `$fail()` multiple times for multiple errors if needed

**Example**:
```php
// BEFORE: Returning bool
class ValidCurrencyRule implements ValidationRule
{
    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if (!in_array($value, ['USD', 'EUR', 'GBP'])) {
            return false; // ❌ no $fail called — may pass silently
        }
        return true;
    }
}

// AFTER: Using $fail
class ValidCurrencyRule implements ValidationRule
{
    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if (!in_array($value, ['USD', 'EUR', 'GBP'])) {
            $fail("The {$attribute} must be a valid currency (USD, EUR, GBP)."); // ✅ explicit failure
        }
    }
}
```

---

### AP-CVR-02: Stateful Rule Instances

**Description**: A custom rule class uses instance properties to track state across multiple calls to `__invoke()`. Since the validator may call `__invoke()` multiple times during validation (once per field or per array element), stateful rules produce wrong results — counts accumulate, sets grow, and flags toggle unpredictably.

**Root Cause**: Attempting to optimize by caching intermediate results across invocations. The developer stores data in instance variables that persist between calls.

**Impact**:
- Cross-field state leaks: first field's validation affects second field's result
- Array element count discrepancies: `__invoke()` called N times but state reflects N+1
- Non-deterministic validation: test order affects results
- Hard-to-debug validation bugs that only appear in specific request scenarios

**Detection**:
- Code review: `$this->something` modified inside `__invoke()`
- Code review: constructor initializes counters or collections that are mutated during validation
- Flaky tests: validation passes or fails depending on test execution order

**Solution**:
- Keep rules stateless — don't use instance properties that change between `__invoke()` calls
- Use constructor injection for immutable dependencies only
- For cross-index checks (distinct), use the `after()` hook on the validator instead

**Example**:
```php
// BEFORE: Stateful rule
class UniqueEmailInBatchRule implements ValidationRule
{
    private array $seen = []; // ❌ shared state across invocations

    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if (in_array($value, $this->seen)) {
            $fail("Duplicate email: {$value}.");
        }
        $this->seen[] = $value; // ❌ mutates state
    }
}

// AFTER: Stateless rule — use after() hook instead
// In FormRequest:
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        $emails = $this->input('emails', []);
        $duplicates = array_diff_assoc($emails, array_unique($emails));
        foreach ($duplicates as $index => $email) {
            $validator->errors()->add("emails.{$index}", "Duplicate email: {$email}.");
        }
    });
}
```

---

### AP-CVR-03: Injecting Request Into Rules

**Description**: The `Request` (or `Illuminate\Http\Request`) object is injected into a custom rule class's constructor. The rule then accesses input data, headers, or user information from the request within `__invoke()`. This couples the rule to the HTTP layer, making it unusable in non-HTTP contexts (CLI commands, queued jobs, service-layer validation) and impossible to test without simulating a full HTTP request.

**Root Cause**: Convenience. The developer injects the Request because it's immediately available in the FormRequest context where the rule is used.

**Impact**:
- Rule cannot be used in CLI commands, jobs, or service-layer validation
- Unit tests must create a fake Request object to test the rule
- Rule violates the Single Responsibility Principle — it validates AND accesses HTTP context
- Coupling to Request prevents reuse across different input sources

**Detection**:
- Code review: `Illuminate\Http\Request` or `Request` in the constructor of a Rule class
- Code review: `$this->request->input()` or `request()->input()` inside `__invoke()`
- Test review: test creates `Request` instance to instantiate the rule

**Solution**:
- Pass only the data the rule needs, not the entire Request
- Use constructor injection for dependencies (services, repositories) — not HTTP objects
- Pass contextual data as constructor parameters when constructing the rule

**Example**:
```php
// BEFORE: Injecting Request
class UniqueSkuRule implements ValidationRule
{
    public function __construct(
        private readonly Request $request, // ❌ HTTP coupling
    ) {}

    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        $existing = Sku::where('sku', $value)
            ->where('product_id', $this->request->input('product_id')) // ❌ accesses request
            ->exists();
        if ($existing) {
            $fail("SKU already exists.");
        }
    }
}

// AFTER: Pass only needed data
class UniqueSkuRule implements ValidationRule
{
    public function __construct(
        private readonly SkuRepository $skus,
        private readonly ?int $productId = null, // ✅ explicit dependency
    ) {}

    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if ($this->skus->exists($value, $this->productId)) {
            $fail("SKU already exists.");
        }
    }
}

// Usage in FormRequest:
new UniqueSkuRule(app(SkuRepository::class), $this->input('product_id'))
```

---

### AP-CVR-04: Throwing Exceptions Inside Rules

**Description**: A custom rule throws an exception when validation fails instead of calling the `$fail` closure. The exception propagates up as an unhandled `ValidationException` with a generic message, bypassing the rule's intended error message and potentially crashing the entire validation pipeline instead of reporting a field-level error.

**Root Cause**: Exception-oriented thinking. The developer treats validation failure as an exceptional condition rather than a normal validation result.

**Impact**:
- Validation fails with a 500 error instead of a 422 with field errors
- The rule's error message is lost — the catch block generates a generic one
- Remaining validation rules for other fields don't execute
- Stack trace may leak internal details in the error response

**Detection**:
- Code review: `throw new \Exception()` or `throw new ValidationException()` inside `__invoke()`
- Code review: `throw_if()` or `throw_unless()` used in rule logic
- Error monitoring: 500 errors from rule classes that should return 422

**Solution**:
- Always use `$fail()` for validation failures — never throw
- Call `$fail()` multiple times if multiple error messages are needed
- Use try/catch for internal operations and convert failures to `$fail()` calls

**Example**:
```php
// BEFORE: Throwing exceptions
class ValidSkuRule implements ValidationRule
{
    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if (!preg_match('/^[A-Z]{3}-\d{4}$/', $value)) {
            throw new \InvalidArgumentException("Invalid SKU format: {$value}"); // ❌ throws instead of $fail
        }
    }
}

// AFTER: Using $fail
class ValidSkuRule implements ValidationRule
{
    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if (!preg_match('/^[A-Z]{3}-\d{4}$/', $value)) {
            $fail("The {$attribute} must be in format XXX-1234."); // ✅ proper validation failure
        }
    }
}
```

---

### AP-CVR-05: One Gigantic Rule Class

**Description**: A single rule class validates multiple constraints — format, existence, uniqueness, and business logic — all in one `__invoke()` method. For example, a `ValidProductRule` that checks SKU format, validates the product exists in the database, confirms it's not archived, and verifies it belongs to the current user's organization.

**Root Cause**: Convenience. The developer creates one rule per "concept" rather than one rule per "validation concern," leading to a rule that does too much.

**Impact**:
- Rule validates N concerns but only one field — can't reuse individual checks
- Error message is generic and covers all failure modes
- Testing requires exercising all concerns at once
- Adding a new constraint requires modifying the existing rule

**Detection**:
- Code review: rule class name suggests multiple concerns (`ValidProductRule`)
- Code review: `__invoke()` has multiple `if` blocks for different types of validation
- Code review: rule accepts many constructor parameters (3+)

**Solution**:
- Follow the Single Responsibility Principle: one rule validates one constraint
- Compose multiple rules on the field: `['required', new ValidSkuFormat(), new UniqueSku(), new ActiveProduct()]`
- Name rules after the specific constraint they validate

**Example**:
```php
// BEFORE: Gigantic rule class
class ValidProductRule implements ValidationRule
{
    public function __construct(
        private readonly ProductRepository $products,
        private readonly User $user,
    ) {}

    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        // Checks format
        if (!preg_match('/^[A-Z]{3}-\d{4}$/', $value)) {
            $fail("Invalid SKU format.");
            return;
        }
        // Checks existence
        $product = $this->products->findBySku($value);
        if (!$product) {
            $fail("Product not found.");
            return;
        }
        // Checks ownership
        if ($product->user_id !== $this->user->id) {
            $fail("Product does not belong to you.");
            return;
        }
    }
}

// AFTER: Separate rules per concern
'sku' => [
    'required',
    new ValidSkuFormat(),        // ✅ format check
    new UniqueSku($skus),        // ✅ uniqueness check
    new OwnedByUser($user),      // ✅ ownership check
];
```
