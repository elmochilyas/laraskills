# ECC Anti-Patterns — Response Schema Documentation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Response Schema Documentation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Omitting Server-Generated Response Fields
2. Undocumented Nullable Fields
3. Not Marking Read-Only Properties
4. Inconsistent Pagination Metadata Across Endpoints
5. Response Schema Not Validated Against Actual Response

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failures

---

## Anti-Pattern 1: Omitting Server-Generated Response Fields

### Category
Documentation

### Description
Excluding server-generated fields — `id`, `created_at`, `updated_at`, `deleted_at` — from response schemas because they are considered "obvious" or "auto-generated," leaving consumers without documented access to these important fields.

### Why It Happens
Server-generated fields feel like infrastructure concerns, not API contract elements. Developers document the "payload" fields (name, email, status) and assume consumers know that responses include `id` and timestamps. Auto-generation tools like Scramble sometimes miss fields that are not explicitly declared in API Resource `toArray()` methods.

### Warning Signs
- Response schema has only business fields (name, email, status)
- No `id`, `created_at`, `updated_at` properties in any response schema
- Consumers access `response.id` and get `undefined` in typed languages
- SDK codegen produces models without identifier fields
- Consumers discover documentation-only fields by inspecting raw HTTP responses
- Support tickets ask "does the response include the user ID?"

### Why It Is Harmful
Consumers building clients or using generated SDKs need every response field to create complete models. Omitted fields force consumers to discover them through trial and error. SDK generators cannot include undocumented fields, so generated client models are incomplete. Every missing field creates a deserialization gap.

### Real-World Consequences
The User response schema documents `name`, `email`, and `role` but omits `id`, `created_at`, and `updated_at`. A consumer generates a TypeScript SDK from the spec. The `User` type has only `name`, `email`, `role`. The consumer tries to access `user.id` to build a profile page link. TypeScript compilation fails because `id` does not exist on the type. The consumer must manually extend the generated type, defeating the purpose of SDK generation.

### Preferred Alternative
Include every response field — including `id`, `created_at`, `updated_at`, and other server-generated values — in the response schema with their types, formats, and descriptions.

### Refactoring Strategy
1. Audit every response schema for missing server-generated fields
2. Add `id` (integer, format: int64, readOnly), `created_at` (string, format: date-time, readOnly), `updated_at` (string, format: date-time, readOnly) to each resource
3. Mark these fields as `readOnly: true` so SDK generators make them immutable
4. Add descriptions for each field explaining its meaning and when it is set
5. Verify SDK codegen output now includes these fields in generated models

### Detection Checklist
- [ ] Check every response schema for `id` field
- [ ] Verify `created_at` and `updated_at` are present on all resources
- [ ] Confirm `readOnly: true` is set on server-generated fields
- [ ] Test SDK codegen output includes all server-generated fields
- [ ] Review actual API responses against documented schemas for missing fields

### Related Rules
- Document Every Response Field Including Server-Generated Ones (05-rules.md)

### Related Skills
- Document Response Schemas (06-skills.md)

### Related Decision Trees
- Response Structure — Wrapped vs Unwrapped (07-decision-trees.md)

---

## Anti-Pattern 2: Undocumented Nullable Fields

### Category
Documentation

### Description
Documenting properties that can be null without explicitly marking them as `nullable: true` and without describing when they are null, causing consumer code to crash on null-reference errors.

### Why It Happens
Developers document the field type (string, integer) and assume consumers will expect null. In code, nullable fields are obvious from `?string` type hints. In documentation, the nullability is invisible unless explicitly declared. Auto-generation tools may infer nullability from `whenLoaded()` calls but often miss conditional null states.

### Warning Signs
- Fields that are sometimes null have `nullable: false` or no `nullable` declaration
- Descriptions do not mention when a field is null
- Consumer code crashes with "Cannot read property of null" errors
- SDK generator produces non-nullable types for nullable fields
- Fields like `profile_photo_url`, `email_verified_at`, `deleted_at` are missing nullable annotations
- Support tickets cite "the API returned null but the docs don't mention it"

### Why It Is Harmful
Consumers cannot distinguish between "this field is null because it was excluded" and "this field is null because there's a bug." They either defensively null-check every field (wasting development effort) or assume fields are always present (crashing on null). Without explicit nullability documentation and conditions, both behaviors are rational guesses.

### Real-World Consequences
The `email_verified_at` field is documented as `type: string, format: date-time` with no `nullable: true`. A consumer builds a profile page that displays "Verified on: {{email_verified_at}}". When the user has not verified their email, the field is null. The template engine crashes on null formatting. The consumer blames the API for not documenting the nullable nature.

### Preferred Alternative
Set `nullable: true` on every property that can be null and include a description explaining exactly when and why it is null.

### Refactoring Strategy
1. Identify every property in response schemas that can be null
2. Add `nullable: true` to each
3. Add a description explaining the condition: "Null if the user has not uploaded a photo"
4. Update SDK codegen and verify nullable types are generated correctly
5. Add contract tests that verify nullable fields are actually null when expected

### Detection Checklist
- [ ] Search response schemas for missing `nullable` declarations
- [ ] Compare PHP type hints (?string, ?int) against schema nullability
- [ ] Verify every nullable field has a condition description
- [ ] Check SDK generator output for nullable vs non-nullable types
- [ ] Test consumer code handles null gracefully when documented as nullable

### Related Rules
- Mark Nullable Fields Explicitly With Conditions (05-rules.md)

### Related Skills
- Document Response Schemas (06-skills.md)

### Related Decision Trees
- Response Structure — Wrapped vs Unwrapped (07-decision-trees.md)

---

## Anti-Pattern 3: Not Marking Read-Only Properties

### Category
Design

### Description
Omitting `readOnly: true` on server-generated fields like `id`, `created_at`, `updated_at`, causing SDK generators to produce writable properties that consumers may attempt to send.

### Why It Happens
The concept of `readOnly` in OpenAPI is often overlooked. Developers document the field's type and description without considering its mutability. Auto-generated schemas from Scramble may infer readOnly from API Resource configuration but often miss it when fields are added manually.

### Warning Signs
- `id`, `created_at`, `updated_at` are documented without `readOnly: true`
- SDK generator produces setter methods for `id` and timestamps
- Consumer attempts to set `id` in a POST request and receives either silent ignore or a confusing error
- Code review does not check for `readOnly` on server-generated fields
- Some resources have `readOnly` and others don't — inconsistent

### Why It Is Harmful
Without `readOnly`, consumers cannot distinguish fields they should send from fields that are response-only. SDK generators produce writable properties for all fields, leading consumers to attempt sending server-controlled values. This creates subtle bugs where the server silently ignores the sent value (leaving the consumer thinking they set the ID) or rejects the request with a confusing validation error.

### Real-World Consequences
A consumer generates a Java SDK from the spec. The `UserResource` has `id`, `name`, `email` — all writable (no `readOnly`). The consumer creates a new User: `user.setId(42); user.setName("Jane");`. Their API client sends `id: 42` in the POST body. The server silently ignores the client-provided ID and auto-increments to 43. The consumer's subsequent code assumes the user has ID 42 but the actual ID is 43. The integration silently breaks.

### Preferred Alternative
Set `readOnly: true` on every server-generated field — `id`, `created_at`, `updated_at`, `deleted_at` — to distinguish them from consumer-settable fields.

### Refactoring Strategy
1. Review every response schema for server-generated fields
2. Add `readOnly: true` to `id`, `created_at`, `updated_at`, `deleted_at`
3. Verify SDK generator output marks read-only fields as immutable (no setters)
4. Add a CI lint rule that flags response schemas missing `readOnly` on timestamp fields
5. Document in the field description that it is server-generated

### Detection Checklist
- [ ] Check every response schema for `readOnly: true` on `id`
- [ ] Verify `created_at` and `updated_at` have `readOnly: true`
- [ ] Confirm SDK generator produces no setter for read-only fields
- [ ] Test that sending read-only fields in a request does not overwrite server values
- [ ] Add lint rule to enforce readOnly on timestamp fields

### Related Rules
- Mark Read-Only Properties With readOnly: true (05-rules.md)

### Related Skills
- Document Response Schemas (06-skills.md)

### Related Decision Trees
- Response Structure — Wrapped vs Unwrapped (07-decision-trees.md)

---

## Anti-Pattern 4: Inconsistent Pagination Metadata Across Endpoints

### Category
Code Organization

### Description
Using different pagination metadata field names across endpoints — `current_page` on one, `page` on another, `offset` on a third — preventing consumers from writing a generic pagination handler.

### Why It Happens
Pagination schemas are often defined inline per endpoint. Different developers write different names. Laravel's `LengthAwarePaginator` returns `current_page`, but manual pagination or cursor pagination implementations may use different keys. Without a shared schema component, each endpoint defines its own shape.

### Warning Signs
- Pagination metadata field names vary across endpoints
- Some endpoints return `page`, others return `current_page`
- Total count field is named `total`, `total_count`, or `count` inconsistently
- No reusable `PaginationMeta` component in the spec
- Consumer code has endpoint-specific pagination parsing logic
- Support tickets ask "why does the Users endpoint use different pagination fields than the Posts endpoint?"

### Why It Is Harmful
Consumers building generic pagination — iterate pages, accumulate results, check "has next" — must write fragile endpoint-specific code that maps each API's field names. Every new endpoint with a different pagination shape requires updating the consumer's code. Inconsistent pagination is one of the most common integration friction points.

### Real-World Consequences
The Users endpoint returns `{ current_page: 1, per_page: 20, total: 500 }`. The Posts endpoint returns `{ page: 1, limit: 20, total_count: 500, has_more: true }`. A consumer building a dashboard that paginates through both resources must write two separate pagination loops. When a third endpoint (Comments) uses yet another format, the consumer's code becomes a messy branching structure of pagination handlers.

### Preferred Alternative
Define the pagination metadata structure once in `components/schemas/PaginationMeta` and reference it in every paginated response.

### Refactoring Strategy
1. Define a single `PaginationMeta` schema with `current_page`, `per_page`, `total`, `last_page`, and `links`
2. Replace all inline pagination definitions with `$ref: '#/components/schemas/PaginationMeta'`
3. Update all controllers to return the standard pagination shape
4. Verify consumers can write a single pagination handler that works across all endpoints
5. Add a CI lint rule that flags any pagination schema not using the shared component

### Detection Checklist
- [ ] Compare pagination field names across 3+ endpoints
- [ ] Check for reusable `PaginationMeta` component
- [ ] Verify all paginated responses use `$ref` to the shared component
- [ ] Test consumer pagination loop works across multiple endpoints without special-casing
- [ ] Add lint rule to enforce shared pagination schema usage

### Related Rules
- Define A Reusable Pagination Schema (05-rules.md)

### Related Skills
- Document Response Schemas (06-skills.md)

### Related Decision Trees
- Response Structure — Wrapped vs Unwrapped (07-decision-trees.md)

---

## Anti-Pattern 5: Response Schema Not Validated Against Actual Response

### Category
Testing

### Description
Writing response schemas that look correct in the spec but differ from what the API actually returns, because no contract tests verify the documented schemas against real API output.

### Why It Happens
Documentation is written independently from implementation. Team members who write documentation are not always the ones who implement endpoints. Without automated validation, schemas and implementation drift. Contract testing is often reserved for success paths, leaving response structure unverified.

### Warning Signs
- No contract tests exist for response structure validation
- Response schemas have not been updated in multiple release cycles
- Consumer SDK deserialization fails on the first call
- Team discovers schema mismatches only when consumers report issues
- Response structure changes in API Resources but schemas are not updated
- Spec lint passes but actual API responses differ from spec

### Why It Is Harmful
A spec that does not match the actual API is worse than no spec. Consumers build integrations against documented schemas that are wrong. SDK codegen produces types that do not match actual payloads. Every consumer's first integration attempt fails on deserialization. The documentation team must rebuild trust through a painful cycle of bug reports and fixes.

### Real-World Consequences
The User response schema documents `full_name: string`. An API Resource change renamed the field to `display_name` two months ago. The schema was never updated. A new consumer generates a Go SDK from the spec. `User.FullName` is a string field. The API returns `display_name: "Jane Doe"`. Go deserialization silently drops `display_name` because it does not match any struct field. `User.FullName` is empty. The consumer's UI shows blank names. They assume the API has a bug.

### Preferred Alternative
Write contract tests that assert actual API response payloads match the documented response schemas for every endpoint and status code.

### Refactoring Strategy
1. Write contract tests for every endpoint that validate JSON structure against the documented schema
2. Include tests for all documented status codes, not just 200/201
3. Run these contract tests in the slow-check CI job
4. When schema changes are deployed, update both implementation and documentation simultaneously
5. Add response structure validation to the deployment checklist

### Detection Checklist
- [ ] Count contract tests that validate response structure
- [ ] Verify every endpoint has at least one response structure test
- [ ] Check that contract tests cover all documented status codes
- [ ] Run a diff between documented schemas and actual API responses
- [ ] Confirm contract tests fail when response structure changes without schema update

### Related Rules
- Validate Response Schemas Against Actual Responses In CI (05-rules.md)

### Related Skills
- Document Response Schemas (06-skills.md)

### Related Decision Trees
- Response Schema Source — Auto-Generated vs Manually Defined (07-decision-trees.md)

---

