# ECC Standardized Knowledge — Backward-Compatible Changes

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Backward-Compatible Changes |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Backward-compatible changes allow API evolution without creating a new version. This KU covers concrete implementation patterns for safe additions: adding optional fields, expanding enums, relaxing validation, and extending response shapes without breaking existing consumers. The core principle is Postel's Law: "be conservative in what you send, be liberal in what you accept." Most changes are backward-compatible if you add rather than modify.

## Core Concepts

- **Non-Breaking Additions**: Adding fields, endpoints, parameters, or enum values that don't break existing clients
- **Relaxation**: Making previously required fields optional, expanding accepted values
- **Response Extension**: Adding JSON properties that clients ignore via Postel's Law
- **Idempotent Defaults**: New fields must have sensible defaults that don't alter existing behavior
- **`$this->when()`**: Conditionally include fields in API resources based on context
- **Enum Expansion (Append-Only)**: New values added; existing values never removed or reordered

## When To Use

- Adding new optional fields to existing responses
- Adding new endpoints alongside existing ones
- Expanding enum values
- Relaxing validation rules (required → optional)
- Adding new query parameters with default behavior

## When NOT To Use

- Removing or renaming existing fields
- Changing field types or semantics
- Making optional fields required
- Changing error response format
- Modifying existing endpoint behavior without defaults

## Best Practices

- **Add fields with `null` default** — universally understood by clients.
- **Use `$this->when()` in API resources** for conditional field inclusion.
- **New query parameters must default to existing behavior** — existing clients don't send them.
- **Enum expansion is append-only** — never reorder or remove existing values.
- **Add new endpoints alongside existing ones** — no route changes to existing routes.
- **Use `nullable|sometimes` for newly optional fields** in form requests.
- **Document new fields as "added in version X"** in API documentation.

## Architecture Guidelines

- The discipline is recognizing when an "improvement" is actually a breaking change in disguise.
- Laravel resources use `$this->when()` to conditionally include new fields based on request.
- Form requests use `nullable|sometimes` for newly optional fields.
- PHP 8.1+ enum `tryFrom()` handles new values gracefully for old clients.
- `$this->whenHas()` on resources is useful for conditionally including fields only when present.

## Performance Considerations

- `$this->when()` adds negligible overhead (~0.01ms per condition).
- New query parameters don't affect request processing unless explicitly read.
- New endpoints don't impact existing route lookups.
- Enum `tryFrom()` is O(1) — no performance concern.

## Security Considerations

- New fields with `null` defaults are safe — they don't expose unintended data.
- Ensure new query parameters are validated to prevent injection through new code paths.
- Never add a new field that contains sensitive data without explicit authentication checks.

## Common Mistakes

- Adding a field without a default value — clients get `null` but expected it to exist.
- Adding a required query parameter — existing clients don't send it, they get 422.
- Removing a field from documentation but keeping it in the response — confused consumers.
- Adding a field with a non-null default that changes existing behavior.

## Anti-Patterns

- **Silent behavior change**: Adding a new field that, when present, changes the behavior of existing fields.
- **Validation tightening**: New validation rule accidentally applied to all requests, breaking existing clients.
- **No documentation**: New feature added but not documented — consumers invent their own solution.

## Examples

```php
// Backward-compatible: adding optional field with null default
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'excerpt' => $this->when($request->has('include_excerpt'), $this->excerpt),
        ];
    }
}

// Backward-compatible: new optional query parameter
Route::get('/posts', [PostController::class, 'index']); // Existing - no change
// Adding a new filter endpoint alongside existing
Route::get('/posts/filter', [PostController::class, 'filter']); // New endpoint
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: breaking-change-identification, when-to-create-new-version
- **Advanced**: Consumer-driven contracts, Tolerance-based client libraries

## AI Agent Notes

- Most changes are backward-compatible if you add rather than modify. The discipline is recognizing when an "improvement" is actually a breaking change.
- Stripe's backward compatibility policy is the industry gold standard: new fields always nullable, new parameters always optional.
- Laravel 11's `whenHas()` method on resources is useful for conditionally including fields only when present.

## Verification

- [ ] New fields added with `null` defaults (not required)
- [ ] New query parameters have default behavior matching existing
- [ ] Enum expansions are append-only
- [ ] New endpoints don't modify existing route structures
- [ ] Documentation updated with "added in version X" notes
- [ ] Existing consumer tests pass without modification against the new endpoint version
