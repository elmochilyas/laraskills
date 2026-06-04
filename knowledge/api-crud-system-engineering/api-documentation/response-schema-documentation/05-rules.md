# Phase 5: Rules — Response Schema Documentation

## Document Every Response Field Including Server-Generated Ones
---
## Category
Documentation
---
## Rule
Include every response field — including `id`, `created_at`, `updated_at`, and other server-generated values — in the response schema. Never omit fields because they are "obvious."
---
## Reason
Consumers building clients or generated SDKs need every field available in the response. Omitted fields cause consumers to access undocumented properties, generate runtime warnings in typed languages, and produce incomplete client models.
---
## Bad Example
```yaml
UserResource:
  type: object
  properties:
    name: { type: string }
  # Missing: id, email, created_at, updated_at
```
---
## Good Example
```yaml
UserResource:
  type: object
  properties:
    id: { type: integer, readOnly: true, description: "Auto-increment ID" }
    name: { type: string }
    email: { type: string, format: email }
    created_at: { type: string, format: date-time, readOnly: true }
    updated_at: { type: string, format: date-time, readOnly: true }
```
---
## Exceptions
Binary stream responses (file downloads) where fields are not applicable.
---
## Consequences Of Violation
SDK models are incomplete; consumers discover undocumented fields only by inspecting raw HTTP responses.
---

## Mark Nullable Fields Explicitly With Conditions
---
## Category
Documentation
---
## Rule
Set `nullable: true` on every property that can be null and include a description explaining exactly when and why it is null.
---
## Reason
Consumers need to handle null in their code — nullable fields cause runtime errors if not checked. Without explicit nullability documentation, consumers either assume a field is always present (and get null-reference errors) or defensively null-check every field (wasting development effort).
---
## Bad Example
```yaml
profile_photo_url:
  type: string
  format: uri
  # Not marked nullable; consumer assumes always present
```
---
## Good Example
```yaml
profile_photo_url:
  type: string
  format: uri
  nullable: true
  description: "URL to the user's profile photo. Null if the user has not uploaded a photo."
```
---
## Exceptions
No common exceptions. Every nullable property must be explicitly marked.
---
## Consequences Of Violation
Consumer code crashes on null values; type-safe language SDKs produce non-nullable types that fail at runtime.
---

## Mark Read-Only Properties With readOnly: true
---
## Category
Design
---
## Rule
Set `readOnly: true` on server-generated fields — `id`, `created_at`, `updated_at`, `deleted_at` — to distinguish them from consumer-settable fields.
---
## Reason
Without `readOnly`, consumers cannot distinguish fields they should send from fields that are response-only. SDK generators produce writable properties for all fields, leading consumers to attempt sending server-controlled values and receiving errors or having them silently ignored.
---
## Bad Example
```yaml
UserResource:
  properties:
    id: { type: integer }
    name: { type: string }
  # No readOnly markers — id looks like a consumer-settable field
```
---
## Good Example
```yaml
UserResource:
  properties:
    id: { type: integer, readOnly: true }
    name: { type: string }
    created_at: { type: string, format: date-time, readOnly: true }
```
---
## Exceptions
No common exceptions. Every server-generated field must be `readOnly: true`.
---
## Consequences Of Violation
SDK models have writable id/timestamp properties; consumers attempt to set them; requests are ignored or rejected with confusing errors.
---

## Define A Reusable Pagination Schema
---
## Category
Code Organization
---
## Rule
Define the pagination metadata structure once in `components/schemas/PaginationMeta` and reference it in every paginated response.
---
## Reason
Inconsistent pagination metadata field names across endpoints (one uses `current_page`, another uses `page`) prevent consumers from writing a generic pagination handler. A single reusable schema enforces consistency across the entire API.
---
## Bad Example
```yaml
# Endpoint A
current_page: 1, per_page: 20, total: 100
# Endpoint B
page: 1, limit: 20, total_count: 100
# Consumers must special-case each endpoint
```
---
## Good Example
```yaml
components:
  schemas:
    PaginationMeta:
      type: object
      properties:
        current_page: { type: integer }
        per_page: { type: integer }
        total: { type: integer }
        last_page: { type: integer }
    UserCollection:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/UserResource'
        meta:
          $ref: '#/components/schemas/PaginationMeta'
```
---
## Exceptions
APIs with a single paginated endpoint; still use a shared schema for future consistency.
---
## Consequences Of Violation
Inconsistent pagination shapes across endpoints; consumers write fragile endpoint-specific pagination loops.
---

## Validate Response Schemas Against Actual Responses In CI
---
## Category
Testing
---
## Rule
Write contract tests that assert actual API response payloads match the documented response schemas for every endpoint and status code.
---
## Reason
Response schemas drift from implementation faster than any other documentation element. Controller, Resource, or transformer changes silently break documented schemas. Contract tests catch drift before consumers encounter mismatched response shapes.
---
## Bad Example
PR changes the `UserResource` to include a `full_name` field instead of `name`. The OpenAPI schema still documents `name`. No contract test catches it. Every consumer's deserialization breaks after deployment.
---
## Good Example
```php
public function test_user_list_response_matches_schema(): void
{
    $response = $this->actingAs($user)->getJson('/api/users');
    $response->assertStatus(200);
    $response->assertJsonStructure([
        'data' => [
            '*' => ['id', 'name', 'email', 'created_at']
        ],
        'meta' => ['current_page', 'per_page', 'total', 'last_page']
    ]);
}
```
---
## Exceptions
No common exceptions. Every documented response must have a corresponding contract test.
---
## Consequences Of Violation
Response documentation silently diverges from actual API output; consumer SDKs deserialize incorrect data; production incidents occur.
---

## Document Conditional Field Availability
---
## Category
Documentation
---
## Rule
Describe in the schema property description when a field is conditionally included — based on user permissions, sparse fieldset parameters, or relationship include flags.
---
## Reason
Consumers cannot distinguish between a field that is null and a field that was excluded due to permissions or parameters. Documenting conditions prevents consumers from building incorrect assumptions about field availability.
---
## Bad Example
```yaml
email_verified_at:
  type: string
  format: date-time
  nullable: true
  # No explanation of when it's present
```
---
## Good Example
```yaml
email_verified_at:
  type: string
  format: date-time
  nullable: true
  description: "Timestamp of email verification. Only present if the user has verified their email. Included when `?include=verification` is set."
```
---
## Exceptions
Fields that are always present on every response.
---
## Consequences Of Violation
Consumer code assumes fields are always present or always absent; permissions-gated features break at runtime with confusing error messages.
---
