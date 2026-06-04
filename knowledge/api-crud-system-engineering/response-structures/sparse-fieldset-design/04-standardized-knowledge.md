# sparse-fieldset-design

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: sparse-fieldset-design
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Sparse fieldset design allows API clients to request specific fields per resource type via `fields[resourceType]=field1,field2` query parameters. This reduces over-fetching, bandwidth usage, and client processing time by returning only the attributes the client needs. Formalized in the JSON:API specification but implementable in any REST API.

In Laravel, sparse fieldsets require combining request-parameter parsing with conditional field inclusion in resources. The server defines a whitelist of available fields; clients select from it. Sparse fieldsets control response column visibility but not database query columns — Eloquent still loads all model attributes unless combined with `Model::select()`.

## Core Concepts
- **Fieldset Parameter**: `fields[resourceType]=field1,field2` — per-resource-type field selection.
- **Per-Resource-Type Selection**: Each type in the response gets its own fieldset.
- **Client-Controlled Scope**: Client decides which fields to receive from the server-defined whitelist.
- **Server-Defined Allowlist**: Whitelist of available fields per resource type.
- **Default Fieldset**: When no fieldset is specified, return a default set (usually all public fields).
- **Relationship Field Restriction**: Fieldsets can restrict which fields appear on included relationships too.
- **Validation Layer**: Requested field names should be validated against the whitelist.

## When To Use
- Public APIs serving diverse clients with different data requirements.
- Mobile APIs where bandwidth is at a premium.
- APIs with large resource objects (20+ fields) where most clients need only a subset.
- JSON:API-compliant APIs (sparse fieldsets are a spec requirement).
- Any API where reducing over-fetching is a design goal.

## When NOT To Use
- Internal APIs with a single known consumer that always needs all fields.
- Extremely simple resources (3-4 fields) where fieldset parsing adds complexity without benefit.
- Endpoints where response caching must be simple — fieldsets fragment cache keys significantly.
- When the majority of clients always request all available fields.

## Best Practices (WHY)
- **Always validate against a whitelist**: Without validation, clients can request internal model attributes (timestamps, `_pivot`, etc.).
- **Apply fieldsets across all included types**: Supporting `fields[users]` but ignoring `fields[posts]` when posts are included creates inconsistency.
- **Combine with `Model::select()` for DB optimization**: Sparse fieldsets alone don't reduce query column loading — Eloquent still hydrates all attributes.
- **Use consistent field names**: The fieldset parameter names must match the JSON response key names exactly.
- **Document available fields**: Maintain a machine-readable list for each resource type.

## Architecture Guidelines
- Decide strict mode (return 400 for unknown fields) vs lenient mode (silently ignore). Strict is better for public APIs.
- Implement sparse fieldset logic as a reusable trait rather than duplicating across resources.
- Cache parsed fieldsets per-request to avoid re-parsing across nested resources.
- Pagination metadata should not be affected by sparse fieldsets — `meta` and `links` remain complete.
- Fieldset on compound documents: applying a fieldset to a primary type also affects the same type in `included`.

## Performance
- Sparse fieldsets reduce response size but not query cost by default — combine with `Model::select()` for true optimization.
- Fieldset parsing and validation adds ~0.1ms per request.
- Cache keys must include the fieldset parameter to avoid serving wrong data.
- With sparse fieldsets, the resource skips serialization for omitted fields, reducing CPU time in `toArray()`.

## Security
- Fieldset whitelist prevents exposure of internal model attributes — never allow clients to request arbitrary fields.
- Sensitive fields (internal notes, financial data) should not be in the whitelist at all — not just excluded from defaults.
- Field aliases that expose internal column names should be avoided.
- If using lenient mode, invalid fields are silently ignored — this can mask client bugs.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| No whitelist validation | Accepting any field name from clients | Assuming all fields are safe | Clients access internal model attributes | Validate against a defined whitelist |
| Single-type fieldsets only | Supporting `fields[users]` but missing `fields[posts]` | Focusing only on primary resource | Clients can't restrict included resources | Apply fieldsets recursively to all types |
| Assuming query optimization | Sparse fieldsets don't speed up queries by default | Confusing serialization with query | Eloquent still loads all columns | Combine with `Model::select()` |
| Inconsistent default fields | Different endpoints return different defaults for same type | No centralized default definition | Clients can't rely on default shape | Consistent defaults across all endpoints |
| Field names not matching JSON keys | `fields[users]=full_name` but JSON has `fullName` | Misalignment between parameter and response keys | Fieldset silently fails to match | Always align parameter names with JSON output keys |

## Anti-Patterns
- **Blacklist Instead of Whitelist**: Blocking certain fields but allowing all others. Whitelist is safer.
- **Fieldset on Every Tiny Resource**: For 3-field resources, fieldset parsing overhead exceeds bandwidth savings.
- **Exposing Database Column Names**: Using raw column names as field names — creates coupling.
- **No Caching Strategy for Fieldsets**: Caching responses without fieldset in the cache key — serves wrong data.
- **Fieldset-Only Design**: Making all fields optional via fieldset and documenting no defaults.

## Examples
```php
// Request: GET /users?fields[users]=id,name,email&fields[posts]=id,title

// Resource implementation
class UserResource extends JsonResource
{
    protected static array $availableFields = ['id', 'name', 'email', 'role', 'created_at'];

    public function toArray($request)
    {
        $fields = $this->getRequestedFields($request, 'users');

        return [
            'id' => $this->id,
            'name' => in_array('name', $fields) ? $this->name : null,
            'email' => in_array('email', $fields) ? $this->email : null,
            // Only include fields that were requested
        ];
    }

    protected function getRequestedFields($request, string $type): array
    {
        $fields = $request->input("fields.{$type}");
        if (!$fields) {
            return static::$availableFields; // default: all
        }
        $requested = explode(',', $fields);
        return array_intersect($requested, static::$availableFields);
    }
}
```

## Related Topics
- **Prerequisites**: conditional-field-inclusion
- **Related**: conditional-relationship-inclusion, json-api-resource-structure
- **Advanced**: json-api-compound-documents, response-compression

## AI Agent Notes
- Implement sparse fieldsets as a reusable trait across all resources for consistency.
- Always combine with a whitelist — never trust client-supplied field names directly.
- For performance, cache parsed fieldset values per request scope.
- Include fieldset parameter in cache keys when using response caching.
- Document available fields per resource type in the API specification.

## Verification
- Each resource type has a defined whitelist of available fields.
- Requesting invalid field names returns 400 (strict) or silently ignores (lenient).
- Fieldset parameter applies to included/related resource types, not just the primary.
- `meta` and `links` keys are not affected by sparse fieldsets.
- Integration tests verify that sparse fieldsets reduce response payload size appropriately.
