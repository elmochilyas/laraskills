# ECC Standardized Knowledge — Not Found Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Not Found Testing |
| Difficulty | Foundation |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Not found tests verify that requests for non-existent resources return 404 responses. Every endpoint that accepts a resource identifier (show, update, destroy, restore) must prove it returns 404 when the resource does not exist. Tests cover implicit route-model binding failure, explicit `findOrFail()`, soft-deleted resource access, and invalid ID shapes. 404 testing is the cheapest way to validate route-model binding configuration.

## Core Concepts

- **Trigger mechanisms**: Implicit route binding (`ModelNotFoundException`), `findOrFail()`, `firstOrFail()`, `abort(404)`.
- **Default error body**: `{"message": "Not Found."}`.
- **assertNotFound()**: Shorthand for `assertStatus(404)`.
- **Testing with non-existent ID**: Typically `999999` or UUID that doesn't exist.
- **Soft-delete testing**: Deleted resource ID exists in DB but excluded by default query scope -> 404.
- **Empty collection vs not-found**: Index returns 200 with `data: []`, not 404.

## When To Use

- Every resource-member route (show, update, destroy, restore)
- Endpoints using implicit or explicit route model binding
- Endpoints with `findOrFail()` or `firstOrFail()` calls

## When NOT To Use

- Non-existent route paths (404 is expected but not resource-specific)
- Collection index endpoints (empty collection returns 200, not 404)
- Endpoints without resource identifier parameters

## Best Practices

- **Use non-existent ID**: Typically `999999` or UUID that doesn't exist in database.
- **Test each CRUD member endpoint**: show, update, destroy, restore each need a 404 test.
- **Test invalid ID shapes**: String passed for integer ID may cause 500 instead of 404.
- **Assert error body**: `assertNotFound()->assertJson(['message' => 'Not Found.'])`.
- **Verify no DB mutation**: For update/destroy with bad ID, assert no records changed.

## Architecture Guidelines

- 404 tests validate both the binding mechanism and error response format in one assertion.
- Every resource-member route must have a 404 test — enforce via architecture tests.
- Consistent 404 error shape across API is critical. Customize globally in exception handler.
- Test soft-delete behavior: deleted resource IDs exist in DB but are excluded by default scope.

## Performance Considerations

- 404 tests are among the cheapest feature tests — no seed data needed, fail early in middleware chain.
- Maximize coverage by testing 404 with a single PestPHP dataset iterating all resource endpoints.

## Security Considerations

- 404 responses must not reveal whether a resource ID once existed or was never created.
- Use consistent 404 messages for both missing and soft-deleted resources.
- Don't leak table-specific information in 404 messages.

## Common Mistakes

- Not testing 404 with soft-delete: deleted resource's ID exists in DB — implicit binding may succeed but query scope excludes it.
- Testing 404 with ID that doesn't match route key type (string UUID vs integer) — may throw 500 cast error.
- Confusing empty collection (200 with []) with resource not found (404).
- Not testing invalid ID shapes — string UUID for integer binding causes 500.

## Anti-Patterns

- **Silent fallback to 200 with null data**: Endpoint catches ModelNotFoundException and returns 200 with null.
- **Inconsistent 404 error shapes**: Some endpoints return `{"message": "Not Found."}`, others `{"error": "Resource not found"}`.

## Examples

- Basic 404: `$this->getJson('/api/posts/999999')->assertNotFound()->assertJson(['message' => 'Not Found.'])`.
- Update 404: `$this->putJson('/api/posts/999999', ['title' => 'Test'])->assertNotFound()`.
- Soft-delete 404: Create and delete post, then `getJson("/api/posts/{$post->id}")->assertNotFound()`.

## Related Topics

- **Prerequisites**: Laravel Route Model Binding, Feature Test Structure
- **Closely Related**: Error Response Shape Testing, Response Status Code Testing
- **Advanced**: Custom 404 responses by resource type, Global vs resource-specific 404 formatting, Eloquent soft-delete route binding

## AI Agent Notes

When testing 404 responses: test every member route (show/update/destroy/restore) with non-existent ID, test invalid ID shapes, test soft-deleted resource access, assert error body not just status, verify no DB mutation, use consistent 404 shape across API.

## Verification

Sources: `Illuminate\Database\Eloquent\ModelNotFoundException`, Laravel route model binding, domain-analysis.md.
