# ECC Standardized Knowledge — Resource Class Organization

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Resource Class Organization |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Resource classes (Laravel API Resources) transform Eloquent models into JSON responses. Version-specific resource organization ensures each API version can return different shapes, fields, and structures. This KU covers directory structure, resource inheritance, conditional attributes, and field deprecation in resources. The pattern follows `App\Http\Resources\V1\UserResource` and `App\Http\Resources\V2\UserResource` with V2 extending V1 and overriding only the changed fields. The biggest challenge in resource versioning is not creating the new version — it's remembering to update the old version's tests when the underlying model changes.

## Core Concepts

- **Versioned Resource Path**: `App\Http\Resources\V1\UserResource`, `App\Http\Resources\V2\UserResource`
- **Resource Inheritance**: V2 extends V1, overrides `toArray()` for changed fields only
- **Conditional Fields**: `$this->when()` for version-specific optional fields
- **Resource Collections**: Separate `UserCollection` per version for paginated responses
- **Field Deprecation**: Removing fields from V{n+1} while keeping them in V{n}
- **`$this->merge()`**: Combines parent resource fields with version-specific additions

## When To Use

- Any API with version-specific response shapes
- APIs where fields are added, renamed, or removed between versions
- APIs with version-specific pagination or metadata structures
- Teams maintaining multiple active API versions

## When NOT To Use

- Versions with identical response shapes (single resource shared across versions)
- Simple APIs where `dd()` or `toArray()` on models suffices
- When responses are entirely dynamic and unstructured

## Best Practices

- **Use inheritance with progressive field enhancement**: V2 extends V1, overrides `toArray()`.
- **Use `$this->when()` for conditional fields** that may not be present in all versions.
- **Use `$this->merge()` to combine parent fields with version-specific additions**.
- **Test each version's resource independently** — parent changes silently affect children.
- **Keep conditional field logic simple** — complex conditions belong in controllers.
- **Use `->additional()` for version-specific metadata** (deprecation warnings, pagination links).
- **Monitor response size growth** across versions to detect field bloat.
- **Automate schema diff in CI** when a PR modifies a resource file.

## Architecture Guidelines

- Resource resolution is O(1) with factory caching.
- Inheritance chain resolution is PHP-compiled — no runtime cost.
- Conditional `when()` calls are evaluated only when included.
- The biggest challenge is not creating the new version — it's remembering to update old version tests.
- Resource classes inevitably grow fields over time — track field-level metadata per version.

## Performance Considerations

- Resource resolution is O(1) with factory caching.
- Inheritance chain resolution is PHP-compiled — no runtime cost.
- Conditional `when()` calls are evaluated only when included.
- Resource collections loop over models — O(n) cost per page.

## Security Considerations

- Ensure that new version resources don't expose sensitive fields that were intentionally excluded in old versions.
- Resource coverage matrix: validate that every model has a resource in every active version (no raw model leaks).
- Field deprecation should include a `@deprecated` response hint to consumers.

## Common Mistakes

- Deep resource inheritance (V1 → V2 → V3 → V4) creating fragile override chains.
- Using `when()` for fields that are always included — adds useless condition checks.
- Forgetting that removing a field from V2+ is a breaking change for V1 consumers.
- Mixing version-specific and shared resources in the same directory.

## Anti-Patterns

- **Field bleed**: V2 resource accidentally inherits V1-only deprecated field.
- **N+1 in resources**: Version-specific eager loading not updated for new version — N+1 queries.
- **Resource mismatch**: Controller returns V1 resource for V2 endpoint.
- **Silent field removal**: V1 resource field removed without breaking change notice.

## Examples

```php
// V1 resource
class V1\PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'author_name' => $this->author->name,
            'created_at' => $this->created_at,
        ];
    }
}

// V2 resource — nested author object, adds excerpt
class V2\PostResource extends V1\PostResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'author' => [
                'id' => $this->author->id,
                'name' => $this->author->name,
            ],
            'excerpt' => $this->when($request->has('include_excerpt'), $this->excerpt),
        ]);
    }
}
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: form-request-organization, controller-inheritance
- **Advanced**: Response structure patterns, Resource version negotiation

## AI Agent Notes

- The biggest challenge in resource versioning is not creating the new version — it's remembering to update the old version's tests when the underlying model changes.
- Laravel 11 resources are identical to Laravel 10. `JsonResource` API unchanged.
- Use `$resource->response()->getData()` for schema extraction tools.

## Verification

- [ ] Version-specific resources in versioned namespaces
- [ ] Resource inheritance pattern used for progressive enhancement
- [ ] Conditional fields use `$this->when()` appropriately
- [ ] Each version's resource tested independently
- [ ] Resource coverage matrix validates all models have resources per version
- [ ] Schema diff automated in CI for resource changes
- [ ] Field deprecation across versions tracked and documented
