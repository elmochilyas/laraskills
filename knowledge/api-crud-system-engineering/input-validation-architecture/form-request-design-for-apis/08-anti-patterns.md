# Anti-Patterns — Form Request Design for APIs

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Form Request Design for APIs |
| Difficulty | Foundation |
| Category | Design Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Single FormRequest for Store and Update | High | High | Code review: `isMethod()` used to switch rules |
| Rules Method With DB Queries for Every Field | High | Medium | Code review: N+1 validation queries in rules() |
| FormRequest With No authorize Method | Critical | High | Code review: missing `authorize()` — defaults to false |
| Pipe-Delimited Rules | Medium | High | Code review: `'title' => 'required|string'` string syntax |
| FormRequest as a Dumping Ground | Medium | Medium | Code review: too many responsibilities beyond four-pillar interface |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Calling $this->all() in rules() | Reads from consumed JSON stream | Empty data; validation passes incorrectly |
| Using auth()->user() Instead of $this->user() | Couples to auth facade | Cannot mock user in tests |
| Not Overriding failedValidation() | Laravel's default web-oriented error shape | Inconsistent with API error contract |

---

## Anti-Pattern Details

### AP-FRD-01: Single FormRequest for Store and Update

**Description**: One FormRequest class handles both create and update operations, using `$this->isMethod('PUT')` or `$this->method()` to determine which rules apply. The result is a `rules()` method cluttered with conditionals, making it hard to read, test, and maintain. Adding a rule for one operation risks breaking the other.

**Root Cause**: DRY obsession. The developer sees shared rules between Store and Update and consolidates them into one class to avoid duplication.

**Impact**:
- `rules()` method grows complex with conditionals
- Testing must exercise both code paths in the same test class
- Adding a Store-specific rule requires careful Update-branch updates
- Authorization may differ between create and update but uses the same `authorize()` method

**Detection**:
- Code review: `if ($this->isMethod('PUT'))`, `if ($this->isMethod('PATCH'))`, or `match($this->method())` in `rules()`
- Code review: FormRequest named without action prefix (e.g., `PostRequest` instead of `StorePostRequest`)
- Test review: same test class covers both create and update scenarios

**Solution**:
- Create separate FormRequests per action: `StorePostRequest`, `UpdatePostRequest`
- Extract truly shared rules to a `BasePostRequest` with a shared rules method
- Keep each action's FormRequest focused and conditional-free

**Example**:
```php
// BEFORE: Single request with method sniffing
class PostRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'title' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'string', 'max:255'],
            'body' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'string'],
            'status' => ['sometimes', Rule::in(['draft', 'published'])],
        ];
    }
}

// AFTER: Separate requests
// StorePostRequest
public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:255'],
        'body' => ['required', 'string'],
        'status' => ['sometimes', Rule::in(['draft', 'published'])],
    ];
}

// UpdatePostRequest
public function rules(): array
{
    return [
        'title' => ['sometimes', 'string', 'max:255'],
        'body' => ['sometimes', 'string'],
        'status' => ['sometimes', Rule::in(['draft', 'published'])],
    ];
}
```

---

### AP-FRD-02: Rules Method With DB Queries for Every Field

**Description**: The `rules()` method executes database queries for each field — fetching existence data, checking uniqueness, or loading related models inline. This creates N+1 validation queries per request: one query per field that needs database access. For a form with 10 fields, 10+ queries run before validation completes.

**Root Cause**: Naive implementation. The developer writes `exists:table,column` rules or closure-based existence checks that each execute a separate query.

**Impact**:
- Validation latency proportional to number of database-backed rules
- Database connection pool pressure from validation queries
- Slow API response times, especially on forms with many fields
- Cached or batched queries could solve the same problem efficiently

**Detection**:
- Code review: `exists:`, `unique:`, or closure-based DB queries in `rules()`
- Code review: custom Rule classes that query the database in `__invoke()`
- Query log: multiple SELECT queries during validation for a single request

**Solution**:
- Batch existence checks using `whereIn` in the constructor of custom rules
- Use `Rule::unique()->ignore($id)` instead of manual existence checks
- Cache reference data (countries, currencies) that rarely changes

**Example**:
```php
// BEFORE: N+1 validation queries
public function rules(): array
{
    return [
        'product_id' => ['required', 'exists:products,id'],       // ❌ query 1
        'category_id' => ['required', 'exists:categories,id'],     // ❌ query 2
        'tax_rate_id' => ['required', 'exists:tax_rates,id'],      // ❌ query 3
        'tags.*' => ['exists:tags,id'],                            // ❌ query N
    ];
}

// AFTER: Batched existence validation
class AllIdsExistRule implements ValidationRule
{
    public function __construct(
        private readonly string $table,
        private readonly string $column,
        private readonly array $ids,
    ) {
        // Single batch query in constructor
        $this->existing = DB::table($table)->whereIn($column, $ids)->pluck($column)->all();
    }

    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        if (!in_array($value, $this->existing)) {
            $fail("The {$attribute} does not exist.");
        }
    }
}

// Or use a single batch validation in after() hook
```

---

### AP-FRD-03: FormRequest With No authorize Method

**Description**: The FormRequest class omits the `authorize()` method entirely. Since Laravel's FormRequest base class defaults `authorize()` to `false`, every endpoint using this FormRequest returns HTTP 403 Forbidden. The endpoint appears broken, and troubleshooting leads to a wild goose chase through routes, controllers, and middleware before discovering the missing method.

**Root Cause**: Copy-paste or forgetting. The developer creates the FormRequest and implements `rules()` but forgets to also implement `authorize()`.

**Impact**:
- All requests to the endpoint return 403
- Confusing: the route exists, the controller is correct, but requests are denied
- Time wasted debugging non-existent permission issues
- The default `false` behavior is a security footgun — the developer intended no authorization check

**Detection**:
- Code review: FormRequest class without `authorize()` method
- Integration tests: 403 response from an endpoint that should be accessible
- Linting: static analysis rules flagging missing `authorize()` override

**Solution**:
- Always include an explicit `authorize()` method in every FormRequest
- Return `true` if no authorization check is needed
- Add a PHPStan/Larastan rule to enforce the presence of `authorize()`

**Example**:
```php
// BEFORE: No authorize method
class StorePostRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
        ];
    }
    // ❌ authorize() defaults to false — all requests denied
}

// AFTER: Explicit authorize
class StorePostRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true; // ✅ explicitly public, no auth check needed
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
        ];
    }
}
```

---

### AP-FRD-04: Pipe-Delimited Rules

**Description**: Validation rules are written as pipe-delimited strings: `'title' => 'required|string|max:255'`. This syntax predates Laravel's array rule syntax and has several limitations: cannot use Rule objects, cannot use closures, harder to combine conditionally, and IDEs provide no autocompletion for rule names.

**Root Cause**: Outdated convention. The developer follows older Laravel tutorials or habits from Laravel 5.x.

**Impact**:
- Cannot use `Rule::unique()`, `Rule::in()`, `Rule::when()`, or other Rule objects
- Cannot use closures for custom validation
- Harder to programmatically inspect or combine rules
- Pipe character may conflict with values in some edge cases
- No IDE support for rule names

**Detection**:
- Code review: string values in the rules array with `|` characters
- Code review: `'required|string|email'` instead of `['required', 'string', 'email']`
- Linting: regex-based rule checking for pipe-delimited strings

**Solution**:
- Always use array syntax for validation rules
- Convert all existing pipe-delimited rules to array syntax
- Use Rule objects and closures where appropriate

**Example**:
```php
// BEFORE: Pipe-delimited strings
public function rules(): array
{
    return [
        'title' => 'required|string|max:255',           // ❌ can't use Rule objects
        'email' => 'required|email|unique:users,email', // ❌ can't use Rule::unique()->ignore()
        'status' => 'required|in:draft,published',      // ❌ can't use Rule::in()
    ];
}

// AFTER: Array syntax
public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', Rule::unique('users')->ignore($this->route('user'))],
        'status' => ['required', Rule::in(['draft', 'published'])],
    ];
}
```

---

### AP-FRD-05: FormRequest as a Dumping Ground

**Description**: The FormRequest class accumulates responsibilities beyond the four-pillar interface — data transformation, DTO construction, logging, audit trail creation, and sometimes even business logic. Methods like `prepareForValidation()`, `passedValidation()`, and custom helpers grow to dozens of lines, turning the FormRequest into a mini-service class.

**Root Cause**: Convenience. The FormRequest is already resolved via DI and has access to the request, auth, and validation — so developers add more logic there rather than creating dedicated classes.

**Impact**:
- FormRequest becomes hard to read and test
- Responsibilities blur: what belongs in the request vs the service layer?
- Logic in the FormRequest cannot be reused outside HTTP context
- Violates the Single Responsibility Principle

**Detection**:
- Code review: FormRequest has more than 4-5 methods beyond the four-pillar interface
- Code review: FormRequest exceeds 100 lines for a simple endpoint
- Code review: FormRequest calls services, repositories, or performs I/O

**Solution**:
- Keep FormRequests focused on the four-pillar interface: `rules()`, `authorize()`, `messages()`, `attributes()`
- Extract data transformation to `prepareForValidation()` and `passedValidation()` — but keep them focused
- Move complex logic (DTO construction, business rules) to dedicated service or action classes

**Example**:
```php
// BEFORE: Dumping ground
class StorePostRequest extends ApiRequest
{
    public function authorize(): bool { /* ... */ }
    public function rules(): array { /* ... */ }

    public function prepareForValidation(): void
    {
        // sanitization, defaults, coercion, logging...
    }

    public function passedValidation(): void
    {
        // slug generation, audit fields, DTO construction...
    }

    public function payload(): PostData { /* ... */ }

    public function logValidationSuccess(): void { /* ... */ }

    public function sendNotification(): void { /* ... */ } // ❌ notification logic
}

// AFTER: Focused on four-pillar interface
class StorePostRequest extends ApiRequest
{
    public function authorize(): bool { /* ... */ }
    public function rules(): array { /* ... */ }
    protected function prepareForValidation(): void { /* ... */ }
    protected function passedValidation(): void { /* ... */ }
    public function payload(): PostData { /* ... */ }
    // ✅ notification logic removed — belongs in service layer
}
```
