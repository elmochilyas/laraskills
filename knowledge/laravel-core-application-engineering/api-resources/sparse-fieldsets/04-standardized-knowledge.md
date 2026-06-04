# Sparse Fieldsets

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Sparse Fieldsets
- **Difficulty:** Advanced
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Sparse fieldsets allow API clients to request only the fields they need, reducing response size and bandwidth. The client specifies which fields to include via the `fields[type]` query parameter: `fields[users]=name,email&fields[posts]=title`. The server returns only those fields in the response.

The engineering value is API efficiency — clients control response payload size. A mobile client that only needs `name` and `email` receives a smaller response than a desktop client that needs all fields. The cost is response schema instability — the same endpoint returns different shapes depending on the `fields` parameter.

## Core Concepts
- **`fields[type]` parameter:** Structed by resource type — `fields[users]=id,name,email`.
- **Response-level filtering:** Filter the resource's `toArray()` output to only requested fields.
- **Database-level selection:** Optionally select only requested columns from the database for performance.
- **Relationship field filtering:** When using `include`, each resource type's fields are independently filtered.
- **Default field set:** When the client does not specify fields, return a sensible default set.
- **Required fields:** Some fields (id, type) should always be included regardless of sparse fieldset.

## When To Use
- Mobile APIs where bandwidth is limited or costly.
- APIs consumed by multiple client types with different data needs.
- Public APIs where clients should control payload size.
- When paired with JSON:API (sparse fieldsets are part of the spec).

## When NOT To Use
- Internal APIs on fast networks where response size is not a concern.
- Simple CRUD APIs with fewer than 10 fields per resource.
- When cache efficiency is more important than bandwidth — each field combination creates a separate cache entry.
- When the API contract must be completely stable and predictable for every client.

## Best Practices (WHY)
- **Always include identifiers** (`id`, `type`) regardless of the sparse fieldset to ensure client-side data referencing works.
- **Validate requested fields** against an allowed list. Reject invalid fields with a 400 error to prevent silent misbehavior.
- **Combine response filtering with database column selection** for maximum performance — select only what will be returned.
- **Always include primary and foreign keys in database selection** — Eloquent relationships require them. `User::select(array_merge($fields, ['id']))` ensures relations still work.
- **Document available fields per resource type** so clients know what they can request.
- **Normalize field set keys** (sort alphabetically) to reduce cache variability.

## Architecture Guidelines
- Field filtering happens at two levels: query (controller, database column selection) and response (resource, `toArray` filtering).
- `JsonApiResource` handles response-level filtering automatically. For `JsonResource`, implement manually via `getRequestedFields()`.
- Each resource type in a compound response (with includes) must independently support sparse fieldsets. If `PostResource` ignores sparse fieldsets, the `include=posts` response returns all post fields.
- Default field sets should be curated for the common client use case. When in doubt, include all safe fields.
- Version the default field set — changing defaults can break clients that do not specify fields.

## Performance
- Response size reduction: 40-70% when clients request a subset of fields. For mobile clients, this directly improves time-to-interactive.
- Database-level selection reduces transfer from database to application server — meaningful for large result sets.
- Cache fragmentation: With 10 optional fields, there are 2^10 = 1024 possible combinations. Each is a separate cache entry. Use normalization (sort fields, standard TTL) to manage this.
- Response-level filtering is an `array_intersect_key` call — O(n) on the attribute count, negligible cost.

## Security
- Sparse fieldsets only filter fields defined in `toArray()`. If a field should never be exposed, it must not be in `toArray()` at all.
- Clients can request any field in `toArray()` — no additional authorization happens per field. Use conditional attributes or separate resources for authorization-based field restrictions.
- Always validate requested fields against an allowed list. Reject unknown fields to prevent confusion and potential injection through field names.
- Database-level selection with user-controlled field names could be used for information gathering through error messages. Validate before building the select clause.

## Common Mistakes

### Forgetting to Filter Nested Fields (desc)
Using `include=posts` with sparse fieldsets on the parent but not filtering child resource fields.
- **Cause:** Assuming sparse fieldsets cascade to related resources.
- **Consequence:** Related resources return all fields, defeating the purpose of sparse fieldsets.
- **Better:** Each resource type independently filters its own fields based on its `fields[type]` parameter.

### Over-Filtering Database Columns (desc)
Selecting only client-requested database columns without including required keys.
- **Cause:** Passing `$fields` directly to `Model::select()`.
- **Consequence:** Eloquent relationships break because foreign keys and primary keys are not selected.
- **Better:** Always include primary keys, foreign keys, and any columns needed for relationship mapping.

### Inconsistent Field Names (desc)
Field names in `fields[type]` do not match `toArray()` keys.
- **Cause:** Resource uses transformed keys (`full_name`) but client requests raw attribute names (`name`).
- **Consequence:** The requested field is missing from the response because the key does not exist in the filtered array.
- **Better:** Document the exact field names returned by `toArray()`.

## Anti-Patterns
- **Sparse fieldsets as authorization:** Using sparse fieldsets to hide sensitive fields that should be controlled by authorization. Sparse fieldsets are client-driven; sensitive fields must use conditional attributes or separate resources.
- **Unvalidated field names:** Passing client-provided field names directly to database `select()` without validation. This can leak internal column names through error messages.
- **No default field set:** Returning all fields when the client does not specify any, making the response unpredictable for clients that do not use sparse fieldsets.

## Examples

### Manual Sparse Fieldset Implementation
```php
class UserResource extends JsonResource
{
    protected array $defaultFields = ['id', 'name', 'email'];

    public function toArray($request): array
    {
        $fields = $this->getRequestedFields($request, 'users') ?? $this->defaultFields;
        $all = [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'bio' => $this->bio,
            'created_at' => $this->created_at,
        ];

        // Always include 'id'
        $fields = array_unique(array_merge($fields, ['id']));
        return array_intersect_key($all, array_flip($fields));
    }

    protected function getRequestedFields(Request $request, string $type): ?array
    {
        $fields = $request->input("fields.{$type}");
        return $fields ? explode(',', $fields) : null;
    }
}
```

### Database-Level Field Selection
```php
class UserController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $fields = $this->parseFields($request, 'users');
        $query = User::query();

        if ($fields) {
            $query->select(array_unique(array_merge($fields, ['id'])));
        }

        return UserResource::collection($query->paginate());
    }

    protected function parseFields(Request $request, string $type): array
    {
        $allowed = ['name', 'email', 'bio', 'created_at'];
        $requested = explode(',', $request->input("fields.{$type}", ''));
        return array_intersect($requested, $allowed);
    }
}
```

### Field Validation
```php
protected function validateFields(Request $request, string $type, array $allowed): array
{
    $requested = $this->parseFields($request, $type);
    $invalid = array_diff($requested, $allowed);

    if ($invalid) {
        abort(400, "Invalid fields for {$type}: " . implode(', ', $invalid));
    }

    return $requested;
}
```

## Related Topics
- JSON:API Resources — sparse fieldsets in JSON:API (built-in support)
- Conditional Attributes — field-level conditional inclusion
- Versioned Resources — field changes across API versions
- Resource Fundamentals — baseline resource structure

## AI Agent Notes
- **Generate:** For `JsonResource`, implement sparse fieldset filtering in `toArray()`. For `JsonApiResource`, it is built-in.
- **Key constraint:** Always include identifier fields (`id`, `type`) regardless of sparse fieldset.
- **Validation:** Validate requested field names against an allowed list before using them.
- **Common fix:** If a requested field is missing from the response, verify the field name matches the `toArray()` key exactly.
- **Testing pattern:** Test field filtering: `GET /api/users?fields[users]=name` → only `name` in response.

## Verification
- [ ] Sparse fieldsets are documented per resource type with available field names.
- [ ] Requested fields are validated against an allowed list.
- [ ] Identifier fields (`id`, `type`) are always included regardless of field selection.
- [ ] Each resource type in compound responses independently supports sparse fieldsets.
- [ ] Database-level selection includes primary and foreign keys for relationship integrity.
- [ ] A reasonable default field set is provided when the client does not specify fields.
