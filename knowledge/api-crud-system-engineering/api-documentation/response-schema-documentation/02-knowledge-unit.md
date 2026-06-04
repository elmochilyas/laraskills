# Response Schema Documentation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Response Schema Documentation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Response schema documentation describes the structure, types, and semantics of data that API endpoints return to clients. In OpenAPI, this is represented under `responses` → status code → `content` → `application/json` → `schema`. The response schema documents every property that clients can expect, including nullable fields, nested relationships, pagination metadata, and links.

Well-documented response schemas enable type-safe client code generation, accurate API client development, and reliable contract testing. In Laravel, response schemas are derived from API Resources (via Scramble) or manually documented via `@response` annotations (via Scribe). The schema must match the actual JSON structure exactly, including key names, nesting, and types.

---

## Core Concepts

### Response Structure Types
APIs return several common response structures:

- **Single Resource** — `{ data: { id, name, ... } }` or bare `{ id, name, ... }`
- **Collection** — `{ data: [ { id, name, ... }, ... ] }`
- **Paginated Collection** — `{ data: [...], meta: { current_page, per_page, total, last_page } }`
- **Empty Response** — `204 No Content` with no body
- **Error Response** — `{ message: string, errors: object }`

### Property Documentation
Each response property should document:
- **Name** — JSON key name
- **Type** — JSON Schema type
- **Format** — Format qualifier (date-time, uuid, etc.)
- **Nullable** — Whether the property can be `null`
- **Description** — What the property represents
- **Example** — A concrete value
- **Read-only** — Whether the property is only present in responses (e.g., `created_at`)
- **Deprecated** — Whether the property will be removed

### Relationship and Inclusion
Documenting relationships in responses:

```yaml
UserResource:
  type: object
  properties:
    id: { type: integer }
    name: { type: string }
    posts:
      type: array
      items:
        $ref: '#/components/schemas/PostResource'
```

When relationships are conditionally included (sparse fields, includes), document the conditional mechanism.

### Pagination Metadata
Paginated responses need documented metadata shape:

```yaml
PaginatedUsersResponse:
  type: object
  properties:
    data:
      type: array
      items: { $ref: '#/components/schemas/UserResource' }
    meta:
      type: object
      properties:
        current_page: { type: integer }
        per_page: { type: integer }
        total: { type: integer }
        last_page: { type: integer }
    links:
      type: object
      properties:
        first: { type: string, format: uri }
        last: { type: string, format: uri }
        prev: { type: string, format: uri, nullable: true }
        next: { type: string, format: uri, nullable: true }
```

---

## Mental Models

### API Resources as Schema Definitions
Each Laravel API Resource class defines a response shape. The Resource's `toArray()` method is the authoritative source for what properties appear in responses. Documenting response schemas is documenting what the Resource returns.

### Consumer's View
Consumers see the JSON response, not the Eloquent model or API Resource code. Document the JSON shape as it appears on the wire — key names, nesting, types, and values must match the actual HTTP response exactly.

### Read-Only vs Writable Fields
Response schemas often include fields that cannot be sent in requests (id, created_at, updated_at). Document these as read-only to distinguish them from writable fields.

---

## Internal Mechanics

### API Resource → Schema Translation
Scramble reflects on API Resource classes to extract response schemas:

1. Inspects the Resource's `toArray()` method return type
2. Analyzes properties accessed on the model
3. Resolves relationship methods to nested Resource schemas
4. Maps PHP types to OpenAPI types

### Manual Schema Authoring
When writing response schemas manually in OpenAPI:

```yaml
components:
  schemas:
    UserResource:
      type: object
      properties:
        id: { type: integer, readOnly: true }
        name: { type: string }
        email: { type: string, format: email }
        created_at: { type: string, format: date-time, readOnly: true }
```

### Scribe's @response Annotation
Scribe documents response examples via annotations:

```php
/**
 * @response {
 *   "id": 1,
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "created_at": "2026-01-15T10:00:00Z"
 * }
 */
```

### Conditional Fields Documentation
When API Resources conditionally include fields (based on user permissions, sparse fieldsets), document the conditions:

```yaml
email:
  type: string
  format: email
  description: "Only included for admin users. Returns null for regular users."
  nullable: true
```

---

## Patterns

### Resource Wrapper Pattern
If using a `data` wrapper, define the wrapper in the schema:

```yaml
SingleUserResponse:
  type: object
  properties:
    data: { $ref: '#/components/schemas/UserResource' }
```

### Consistent Nullable Fields
Document nullable fields explicitly. Every property that can be `null` should have `nullable: true` and a description explaining when it is null.

### Read-Only Properties
Mark server-generated properties (id, timestamps) as `readOnly: true`. This signals to consumers that these values are determined by the server and should not be sent in requests.

### Response Examples Per Status Code
Provide different response examples for different status codes:
- `200` — Successful response with data
- `201` — Created resource response
- `422` — Validation error response shape
- `404` — Not found response shape

---

## Architectural Decisions

### Wrapped vs Unwrapped Responses
Wrapped responses (`{ data: {...} }`) provide room for metadata and links without polluting the resource namespace. Unwrapped responses (`{ id, name, ... }`) are simpler. Document whichever pattern the API uses.

### Sparse Fieldset Documentation
If the API supports sparse fieldsets (`?fields[users]=id,name`), document how fields are filtered and that the schema represents the full set of possible fields.

### Related Resource Inclusion
When related resources can be included (`?include=posts`), document the include parameter and the resulting expanded response schema.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Detailed schemas enable SDK generation | Maintaining schemas is time-consuming | Auto-generation reduces cost |
| Examples help consumers understand responses | Examples may become outdated | Validate examples in CI |
| Read-only markers prevent consumer confusion | Not all tools display readOnly correctly | Test in target documentation viewer |
| Pagination metadata clarity | Complexity in schema definition | Use reusable pagination schema component |

---

## Performance Considerations

### Response Schema File Size
Response schemas often form the largest portion of an OpenAPI spec. 30 resources with nested relationships can add 15,000-20,000 lines. Use `$ref` aggressively to reduce duplication.

---

## Production Considerations

### Schema-Response Validation
Use contract tests to verify that actual API responses match documented schemas. Tools like Dredd, Schemathesis, or PHP-based response assertion tests validate this in CI.

### Response Schema Versioning
When response structure changes in a new API version, create new Resource schemas. Old schemas remain in documentation for the old API version.

---

## Common Mistakes

### Documenting Only Successful Responses
Why it happens: Happy-path development focus. Why it's harmful: Consumers don't know error response shapes. Better approach: Document error responses alongside success responses, at minimum with `$ref` to a standard error component.

### Forgetting Read-Only Fields
Why it happens: API Resources automatically exclude certain fields; the documentation excludes them too. Why it's harmful: Consumers don't know what fields exist in responses. Better approach: Document all response fields, including server-generated ones.

### Inconsistent Nesting with Actual Response
Why it happens: The API Resource returns a different structure than documented. Why it's harmful: Consumers parse the wrong JSON path. Better approach: Validate documented schema against actual response in CI.

### Omitting Nullable Responses
Why it happens: Relationships that sometimes return null are documented as always present. Why it's harmful: Consumers don't handle null safely. Better approach: Document every nullable field explicitly.

---

## Failure Modes

### Schema Does Not Match Actual Response
A property is documented as `string` but returns `null` in some cases. Failure mode: Type-safe clients crash on null values. Mitigation: Always document nullable types correctly.

### Missing Response Fields
Documentation shows only 5 of 8 response properties. Failure mode: Consumers miss available data fields. Mitigation: Auto-generate response schemas from API Resources.

### Pagination Metadata Inconsistency
The `meta` object has different keys than documented. Failure mode: Consumers fail to parse pagination. Mitigation: Define a reusable pagination schema and reference it everywhere.

---

## Ecosystem Usage

### Stripe API Responses
Stripe documents every response property with type, description, and example. Nested objects are fully expanded. The `expand` parameter allows selective inclusion of nested resources, documented alongside the base response schema.

### GitHub API Responses
GitHub's response schemas include `readOnly` markers, clear descriptions for each field, and consistent pagination metadata across list endpoints. Response examples clearly show the full JSON structure.

### Laravel API Responses
Laravel's official API documentation (when using API Resources) emphasizes consistent response shapes: wrapped resources, documented meta objects, and clear relationship documentation.

---

## Related Knowledge Units

### Prerequisites
- Laravel API Resources — `toArray()`, relationships, resource collections
- JSON Schema — Type system, $ref, composition

### Related Topics
- Request Body Schema Documentation — Mirror documentation of request structures
- Error Response Documentation — Error shape documentation
- Endpoint Documentation Content — Where response schemas fit in endpoint docs

### Advanced Follow-up Topics
- Sparse Fieldset Documentation — Conditional field inclusion in responses
- Response Envelope Design — Consistent response wrapper across endpoints
- Pagination Metadata Design — Pagination structure in list responses

---

## Research Notes

### Source Analysis
- OpenAPI 3.1 Response Object: https://spec.openapis.org/oas/v3.1.0#response-object
- Laravel API Resources: https://laravel.com/docs/eloquent-resources — Official Laravel resource documentation

### Key Insight
Response schemas are the most important part of API documentation for client developers. They enable type-safe clients, automated testing, and reliable integration. Auto-generation from API Resources (via Scramble) is the most reliable way to keep response schemas accurate.

### Version-Specific Notes
- Laravel 11: API Resources unchanged from Laravel 10; `ResourceCollection` for collections
- Laravel 10: `JsonResource` and `ResourceCollection` as primary response formatting
- Scramble v0.8+: API Resource inspection for response schema extraction
