# Pagination Parameter Validation

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-pagination-parameter-validation |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Validating pagination parameters — `page`, `per_page`, `cursor`, and related meta-parameters — ensures efficient query generation, prevents resource exhaustion, and provides predictable bounded responses. Pagination parameters are performance controls, not just UI concerns; unvalidated pagination is a resource exhaustion vulnerability.

## Core Concepts

- **`page`**: Page number for offset pagination — integer, min: 1, optional max bound.
- **`per_page`**: Items per page — integer, min: 1, max enforced (typically 15-100).
- **`cursor`**: Cursor for cursor-based pagination — string, format-validated opaque token.
- **Pagination as Performance Control**: Bounds query result sets, memory usage, and response size.
- **Defaults as Safety Nets**: Sensible defaults protect the system when clients omit parameters.
- **Per-Resource Max**: Different resources have different `per_page` limits based on row size.

## When To Use

- For every index/list endpoint that returns paginated results
- For collection endpoints with `per_page` parameter
- For cursor-paginated endpoints with `cursor` parameter
- For any endpoint that accepts pagination-related query parameters

## When NOT To Use

- For non-paginated endpoints (single resource, fixed collection)
- For endpoints using simple paginate without parameters
- For internal endpoints where pagination is fixed server-side

## Best Practices (WHY)

- **Always set a hard `per_page` max**: Bounds query cost and memory — 100 is a common maximum.
- **Inject defaults in `prepareForValidation()`**: Clients safely omit pagination parameters.
- **Validate `page` as integer with `min:1`**: Prevents injection and negative offset queries.
- **Validate `cursor` format**: Prevents invalid cursor injection attacks.
- **Use per-resource `per_page` max**: Audit logs (large rows) need lower limits than lightweight items.
- **Use a reusable Pagination trait**: Consistent validation across all index endpoints.
- **Set `per_page` default matching UI expectations**: 15-25 items is typical.
- **Document pagination limits in OpenAPI schema**.

## Architecture Guidelines

- Create a `HasPaginationValidation` trait with `paginationRules()` and `preparePagination()`.
- Override `maxPerPage()` per request for resource-specific limits.
- Inject default values for `page`, `per_page`, and `direction` in `prepareForValidation()`.
- Validate cursor format with a custom closure or rule class.
- Validate sort parameters against an allowlist to prevent SQL injection.
- Apply role-based `per_page` limits for admin vs regular users.
- Monitor `per_page` distribution to detect clients requesting max excessively.

## Performance Considerations

- Enforce `per_page` max to bound query result sets and memory usage.
- Deep `page` values (>10000) cause OFFSET performance issues — consider cursor pagination.
- Validating cursor format adds trivial overhead.
- Default `per_page` should match expected page size for the resource type.
- For high-traffic endpoints, cap `per_page` lower to reduce database load.

## Security Considerations

- Validate `page` and `per_page` as integers to prevent SQL injection via string parameters.
- Validate `cursor` format to prevent tampering and injection.
- Validate `sort` against an allowlist — never pass user input directly to `orderBy()`.
- Set `per_page` max to prevent memory exhaustion attacks.
- Log pagination anomalies (page > 10000, per_page at max) for abuse detection.
- Apply rate limiting to paginated endpoints to prevent deep traversal attacks.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| No per_page max | Unbounded result sets | Oversight | Memory exhaustion, slow queries | Always enforce hard max |
| Not validating page as integer | String injection through page | No integer rule | SQL injection risk | Use `integer` rule |
| No default for per_page | Missing parameter causes error | No prepareForValidation | Client error on first request | Inject defaults in prepareForValidation() |
| Same per_page for all resources | JSON:API lightweight vs audit logs heavy | Global limit | Expensive audit log queries | Per-resource max via maxPerPage() |
| No cursor format validation | Invalid cursor causes 500 | No validation | Poor error handling | Validate cursor format with closure |

## Anti-Patterns

- **No pagination validation at all**: Unbounded queries are a vulnerability.
- **Hardcoded per_page in controller**: Request parameter ignored.
- **Same max for all user tiers**: Admins may need higher limits than regular users.
- **Cursor stored without format validation**: Accepting any string as cursor.
- **Allowing `per_page=0`**: Database error on LIMIT 0.

## Examples

```php
trait HasPaginationValidation
{
    public function paginationRules(): array
    {
        return [
            'page' => ['integer', 'min:1', 'max:10000'],
            'per_page' => ['integer', 'min:1', 'max:' . $this->maxPerPage()],
        ];
    }

    protected function maxPerPage(): int
    {
        return 100;
    }

    protected function preparePagination(): void
    {
        $this->merge([
            'page' => max(1, (int) $this->input('page', 1)),
            'per_page' => min(max(1, (int) $this->input('per_page', 15)), $this->maxPerPage()),
        ]);
    }
}

class IndexPostsRequest extends FormRequest
{
    use HasPaginationValidation;

    public function rules(): array
    {
        return array_merge($this->paginationRules(), [
            'status' => ['sometimes', Rule::in(['draft', 'published'])],
            'sort' => ['sometimes', 'string', Rule::in(['title', 'created_at', '-title', '-created_at'])],
        ]);
    }

    protected function prepareForValidation(): void
    {
        $this->preparePagination();
    }
}
```

## Related Topics

- Form Request Design for APIs (the request class design pattern)
- Pagination Strategies (broader pagination architecture)
- Input Preparation (default injection for pagination params)
- Validation Rule Array Design (sorting and filtering array validation)
- Rate Limiting by Authentication Tier (role-based per_page limits)

## AI Agent Notes

- Always use a reusable `HasPaginationValidation` trait for consistency.
- Always set a hard `per_page` max — different per resource type.
- Inject defaults via `prepareForValidation()` for optional params.
- Validate `page` as integer with `min:1`.
- Validate `sort` against an allowlist, never pass directly to query builder.
- Apply role-based `per_page` limits when appropriate.

## Verification

- [ ] All index endpoints validate pagination parameters
- [ ] `per_page` has a hard max enforced (per-resource)
- [ ] Default values are injected in `prepareForValidation()`
- [ ] `page` and `per_page` are validated as integers
- [ ] `sort` parameter is validated against an allowlist
- [ ] `cursor` parameter (if used) has format validation
- [ ] Pagination trait is used across all index endpoints for consistency
