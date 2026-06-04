# Pagination Parameter Validation — Rules

## Always Enforce a Hard per_page Maximum
---
## Category
Security | Performance | Scalability
---
## Rule
Set a hard `max` constraint on `per_page` for every paginated endpoint — typically 100, with per-resource overrides for larger or smaller rows.
---
## Reason
Without a `per_page` max, clients can request unlimited items, causing memory exhaustion, slow database queries, and oversized response bodies.
---
## Bad Example
```php
'per_page' => ['integer', 'min:1'], // No max — unbounded
```
---
## Good Example
```php
'per_page' => ['integer', 'min:1', 'max:' . $this->maxPerPage()],
```
---
## Exceptions
Admin endpoints with trusted consumers may have higher limits, but always enforce some maximum.
---
## Consequences Of Violation
Memory exhaustion attacks; slow queries with large LIMIT values; oversized JSON responses; bandwidth waste.

---

## Inject Defaults in prepareForValidation()
---
## Category
Reliability | Code Organization
---
## Rule
Inject default values for pagination parameters (`page`, `per_page`) in `prepareForValidation()` so clients can safely omit them.
---
## Reason
Paginated endpoints must have sensible defaults — a missing `per_page` should not cause an error. Defaults ensure consistent behavior and simplify client code.
---
## Bad Example
```php
// No defaults — client must always provide both
'page' => ['required', 'integer', 'min:1'],
'per_page' => ['required', 'integer', 'min:1', 'max:100'],
```
---
## Good Example
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'page' => max(1, (int) $this->input('page', 1)),
        'per_page' => min(
            max(1, (int) $this->input('per_page', 15)),
            $this->maxPerPage()
        ),
    ]);
}
```
---
## Exceptions
No common exceptions — always provide defaults for optional pagination parameters.
---
## Consequences Of Violation
Client error on first request without parameters; inconsistent behavior across endpoints.

---

## Validate page as Integer with min:1
---
## Category
Security | Framework Usage
---
## Rule
Validate the `page` parameter as `integer` with `min:1` to prevent SQL injection and negative OFFSET values.
---
## Reason
Unvalidated `page` values passed directly to `skip()` or `offset()` allow SQL injection via string parameters. Negative page values produce invalid SQL.
---
## Bad Example
```php
'page' => ['sometimes'], // No type or range validation
```
---
## Good Example
```php
'page' => ['integer', 'min:1', 'max:10000'],
```
---
## Exceptions
Cursor-based pagination does not use `page` — validate the cursor format instead.
---
## Consequences Of Violation
SQL injection via `page`; database errors from negative offsets; resource exhaustion from extremely large page values.

---

## Validate sort Against an Allowlist
---
## Category
Security
---
## Rule
Validate the `sort` parameter against a strict allowlist of valid column names — never pass user input directly to `orderBy()`.
---
## Reason
Passing user-provided column names to `orderBy()` enables SQL injection via column name manipulation. An allowlist constrains the user to only safe, sortable columns.
---
## Bad Example
```php
$query->orderBy($request->input('sort', 'created_at'));
// Direct user input in orderBy — SQL injection risk
```
---
## Good Example
```php
'sort' => [
    'sometimes', 'string',
    Rule::in(['title', 'created_at', '-title', '-created_at']),
],
```
---
## Exceptions
No common exceptions — always use an allowlist.
---
## Consequences Of Violation
SQL injection via column name; unauthorized data extraction through ORDER BY enumeration; database error exposure.

---

## Use a Reusable Pagination Trait
---
## Category
Maintainability | Code Organization
---
## Rule
Create a `HasPaginationValidation` trait with `paginationRules()` and `preparePagination()` methods, and reuse it across all index FormRequests.
---
## Reason
Every index endpoint requires the same pagination validation pattern. Without a shared trait, pagination rules are duplicated across dozens of FormRequests.
---
## Bad Example
```php
// Duplicated in 15 FormRequests
'page' => ['integer', 'min:1'],
'per_page' => ['integer', 'min:1', 'max:100'],
```
---
## Good Example
```php
trait HasPaginationValidation
{
    public function paginationRules(): array { ... }
    protected function preparePagination(): void { ... }
}

class IndexPostsRequest extends FormRequest
{
    use HasPaginationValidation;
    public function rules(): array
    {
        return array_merge(
            $this->paginationRules(),
            ['status' => ['sometimes']]
        );
    }
}
```
---
## Exceptions
Endpoints with no pagination (single resource, fixed collection) do not need the trait.
---
## Consequences Of Violation
Duplicated rules across endpoints; one endpoint missing pagination validation; inconsistent limit values.

---

## Use Per-Resource per_page Max Values
---
## Category
Performance | Scalability
---
## Rule
Define a `maxPerPage()` method per resource that returns a resource-appropriate limit — lightweight resources may allow 200, audit logs with large rows should limit to 25.
---
## Reason
A single global `per_page` max is either too high for large-row resources (memory pressure) or too low for small-row resources (limiting throughput).
---
## Bad Example
```php
// Same 100 limit for all resources — no flexibility
'per_page' => ['integer', 'min:1', 'max:100'],
```
---
## Good Example
```php
class IndexAuditLogsRequest extends FormRequest
{
    use HasPaginationValidation;
    protected function maxPerPage(): int { return 25; }
}

class IndexPostsRequest extends FormRequest
{
    use HasPaginationValidation;
    protected function maxPerPage(): int { return 100; }
}
```
---
## Exceptions
No common exceptions — always tune `per_page` to the resource's row size.
---
## Consequences Of Violation
Memory exhaustion from fetching audit logs with full JSON bodies; unnecessary pagination overhead for lightweight resources.

---

## Validate Cursor Format for Cursor Pagination
---
## Category
Security | Framework Usage
---
## Rule
Validate the `cursor` parameter format with a custom closure or Rule class — never pass unvalidated cursor strings to the query builder.
---
## Reason
Invalid or tampered cursors cause database errors when passed to `where()` or cursor decoders. Format validation prevents cursor injection and crashes.
---
## Bad Example
```php
'cursor' => ['sometimes', 'string'], // No format validation
```
---
## Good Example
```php
'cursor' => ['sometimes', function ($attr, $value, $fail) {
    if (!preg_match('/^[A-Za-z0-9\-_]{10,100}$/', $value)) {
        $fail('Invalid cursor format.');
    }
}],
```
---
## Exceptions
Internal-only endpoints where the cursor is always generated by the application and never exposed to clients.
---
## Consequences Of Violation
Invalid cursor causes 500 error; cursor manipulation enables enumeration; SQL errors from malformed cursor values.
