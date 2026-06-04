# ECC Anti-Patterns — OpenAPI Spec Generation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | OpenAPI Spec Generation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Inline Schemas Instead of Component References
2. Missing operationId
3. Spec-Code Drift Without CI Validation
4. Untyped Object Properties
5. Unused Components and Dead Schema References

---

## Repository-Wide Anti-Patterns

- Divergent Change
- Copy-Paste Programming

---

## Anti-Pattern 1: Inline Schemas Instead of Component References

### Category
Code Organization

### Description
Defining data models directly in path operation request bodies and responses instead of in `components/schemas` with `$ref` references, creating duplication that drifts apart across endpoints.

### Why It Happens
Inline schemas are faster to write during initial development. Developers define the schema in the first endpoint that uses it, then copy it to the second endpoint instead of extracting to a shared component. Auto-generation tools may produce inline schemas by default if not configured for component extraction.

### Warning Signs
- Same schema structure appears in multiple path definitions as inline YAML/JSON
- Schema property changes require editing multiple path definitions
- SDK codegen produces duplicate type definitions for the same model
- Spec file has no `components/schemas` section or it is nearly empty
- Code review shows copy-pasted schema blocks across endpoints
- Schema changes propagate inconsistently — some endpoints updated, others stale

### Why It Is Harmful
Inline schemas guarantee drift. When the User model gains a `phone` field, one endpoint gets the updated inline schema and the other two don't. SDK codegen produces duplicate types (`CreateUserRequest1`, `CreateUserRequest2`). Spec file size grows unnecessarily. Every endpoint becomes a maintenance island instead of sharing a single source of truth.

### Real-World Consequences
The API has three POST endpoints that all accept a user payload: `/users`, `/users/invite`, `/users/import`. Each has an inline schema definition of the User type. When `role` is added to the User model, the `/users` endpoint schema is updated — the other two are missed. Consumers using the `/users/invite` endpoint receive 422 errors for valid payloads. Debugging reveals the inline schema for `/users/invite` rejects `role` because that field was never added to its copy.

### Preferred Alternative
Define every reusable data model in `components/schemas` and reference with `$ref`. Use inline schemas only for one-of wrapper schemas with zero reuse potential and fewer than 3 properties.

### Refactoring Strategy
1. Identify all inline schemas that appear in multiple path definitions
2. Extract each to a named component in `components/schemas`
3. Replace each inline definition with `$ref: '#/components/schemas/SchemaName'`
4. Run a CI lint rule that flags any `schema` block with more than 5 lines outside of `components/`
5. Verify SDK codegen now produces single type definitions

### Detection Checklist
- [ ] Count inline schema definitions vs. `$ref` references
- [ ] Search for duplicated schema blocks across path definitions
- [ ] Check `components/schemas` for corresponding entries
- [ ] Verify SDK generator output for duplicate types
- [ ] Add spec lint rule to reject inline schemas in path definitions

### Related Rules
- Define All Schemas In Components With $ref References (05-rules.md)

### Related Skills
- Implement OpenAPI Specification Generation (06-skills.md)

### Related Decision Trees
- Schema Approach — Schema-First vs Code-First (07-decision-trees.md)
- Spec Organization — Single-File vs Multi-File (07-decision-trees.md)

---

## Anti-Pattern 2: Missing operationId

### Category
Design

### Description
Omitting the `operationId` field from path operations, forcing SDK generators to create auto-names based on HTTP method and path — producing inconsistent, unreadable method names.

### Why It Happens
OpenAPI does not require `operationId`. Auto-generation tools may omit it. Developers may not know about its role in SDK naming. When the spec is only used for documentation rendering (Swagger UI), operationId seems optional.

### Warning Signs
- SDK generator output contains method names like `getUsersList`, `apiV1UsersIdGet`, `postNewUserEndpoint`
- No `operationId` field on path operations in the spec
- Generated client method names vary between generator runs
- Consumer developers ask "what method do I call for this endpoint?"
- `operationId` values are inconsistent when they do exist

### Why It Is Harmful
Without `operationId`, SDK generators create names from the HTTP method, path template, and parameter names — producing fragile, inconsistent identifiers. A path `/users/{id}` with GET becomes `apiV1UsersIdGet`. Renaming the path parameter from `id` to `userId` changes every generated method name. Consumer code that references these methods breaks on spec regeneration.

### Real-World Consequences
A consumer generates a PHP SDK from the spec. The `users.list` endpoint has no `operationId`. The SDK generator produces `$client->usersGet()` based on the path. The team adds a path prefix `/v2/`, changing the path. The SDK now generates `$client->v2UsersGet()`. Every consumer reference breaks. If `operationId: users.list` existed, the SDK method `$client->users()->list()` would never change.

### Preferred Alternative
Set `operationId` to `{resource}.{action}` format — `users.list`, `users.create`, `users.show`, `users.update`, `users.delete` — for every operation.

### Refactoring Strategy
1. Audit every path operation for missing `operationId`
2. Add `operationId` following `{resource}.{action}` convention
3. Verify uniqueness — every `operationId` must be different
4. Add a CI lint rule that requires `operationId` on every operation
5. Update any existing generated SDKs to use the new stable names

### Detection Checklist
- [ ] Count operations with missing `operationId`
- [ ] Verify existing operationIds follow a consistent naming pattern
- [ ] Check for duplicate operationId values
- [ ] Confirm SDK generator uses operationId for method names
- [ ] Add lint rule to enforce operationId presence and naming convention

### Related Rules
- Use `resource.action` operationId Convention (05-rules.md)

### Related Skills
- Implement OpenAPI Specification Generation (06-skills.md)

### Related Decision Trees
- Schema Approach — Schema-First vs Code-First (07-decision-trees.md)

---

## Anti-Pattern 3: Spec-Code Drift Without CI Validation

### Category
Testing

### Description
Maintaining an OpenAPI spec that describes a different API than what the code actually implements, because no CI pipeline validates spec accuracy against the running API.

### Why It Happens
Specs are typically written or generated once and then assumed to be correct. Code evolves — endpoints are added, renamed, removed, schemas change — but the spec update is an afterthought. Without CI validation, the spec silently diverges from reality until a consumer reports a mismatch.

### Warning Signs
- Spec describes endpoints that no longer exist in code
- Actual API accepts parameters not documented in the spec
- Response schemas in spec differ from actual response payloads
- Spec generation is not part of the CI pipeline
- PRs that modify routes do not trigger spec regeneration or validation
- Consumer reports "your spec says X but the API returns Y"

### Why It Is Harmful
A stale spec is worse than no spec. Consumers build integrations against documented contracts that don't match reality. SDK generators produce client code that fails on first use. Every consumer integration becomes a debugging exercise, and the documentation team loses credibility.

### Real-World Consequences
The spec says the User endpoint returns `{id: integer, name: string, email: string}`. Three months ago, the team split `name` into `firstName` and `lastName`. The spec was never updated. A new consumer generates a TypeScript SDK from the spec, types their integration around `name`, and their first API call returns `firstName` and `lastName`. Every integration fails.

### Preferred Alternative
Integrate spec generation and validation into CI. Regenerate the spec on every deployment, run lint validation, and add contract tests that verify actual API responses match the documented schemas.

### Refactoring Strategy
1. Add spec generation or regeneration to the CI deployment pipeline
2. Run `redocly lint` and `swagger-cli validate` on every PR
3. Write contract tests that call each endpoint and validate response structure against the spec
4. Block PRs that modify routes without regenerating the spec
5. Store validated specs as CI artifacts for traceability

### Detection Checklist
- [ ] Check if spec generation is in the CI pipeline
- [ ] Verify spec lint runs on every PR
- [ ] Confirm contract tests validate response schemas against the spec
- [ ] Test that a route modification without spec update is blocked by CI
- [ ] Compare spec endpoints against actual route list in code

### Related Rules
- Validate Spec In CI Before Deployment (05-rules.md)
- Bundle Multi-File Specs Before Deployment (05-rules.md)

### Related Skills
- Implement OpenAPI Specification Generation (06-skills.md)

### Related Decision Trees
- Schema Approach — Schema-First vs Code-First (07-decision-trees.md)
- Spec Delivery — Hosted Endpoint vs Downloadable File (07-decision-trees.md)

---

## Anti-Pattern 4: Untyped Object Properties

### Category
Design

### Description
Defining properties as `type: object` without specifying their internal structure (`properties`), forcing SDK generators to produce untyped `Map<string, any>` and consumers to guess the nested shape.

### Why It Happens
When a nested object structure is complex or still evolving, developers use `type: object` as a placeholder promising to "fill it in later." Scramble may generate untyped object placeholders for properties that have no matching validation rule. The placeholder becomes permanent because later never comes.

### Warning Signs
- Schema has `type: object` properties without `properties` definitions
- Nested object documentation is empty or contains only a description
- SDK codegen produces `Map<string, any>` or `mixed` for nested objects
- Consumers ask "what fields go in the address object?"
- Properties defined as `type: object` have no maxLength, format, or constraint hints

### Why It Is Harmful
Untyped `object` properties eliminate all the benefits of OpenAPI schema definition. SDK generators cannot create typed classes. Consumers must reverse-engineer the structure by reading API error messages or examining network responses. The type safety that OpenAPI enables for nested data is entirely lost.

### Real-World Consequences
The `CreateUserRequest` schema has `preferences: { type: object }` with no properties. A consumer building a TypeScript integration gets `preferences: Record<string, any>`. They guess that preferences include `language` and `notifications`. The actual API expects `language`, `timezone`, `marketing_consent`, and `theme`. The consumer's first API call returns a 422 because `timezone` is required. They iterate through four failed attempts before discovering all four fields.

### Preferred Alternative
Define every nested object with explicit `properties`, `required`, and constraint fields at all nesting levels. Use `additionalProperties: false` to prevent unexpected fields.

### Refactoring Strategy
1. Identify every `type: object` without `properties` in the spec
2. For each, determine the actual expected structure from the code or validation rules
3. Add complete `properties` definitions with types, constraints, and descriptions
4. Add `required` arrays for mandatory nested fields
5. Run SDK codegen to verify typed nested objects are produced

### Detection Checklist
- [ ] Search for `type: object` without `properties` in the spec
- [ ] Check SDK generator output for `Map` or `any` nested types
- [ ] Verify all nested objects have required field definitions
- [ ] Confirm `additionalProperties: false` on well-defined objects
- [ ] Test that consumers can construct valid nested payloads from docs alone

### Related Rules
- Define All Schemas In Components With $ref References (05-rules.md)

### Related Skills
- Implement OpenAPI Specification Generation (06-skills.md)

### Related Decision Trees
- Spec Organization — Single-File vs Multi-File (07-decision-trees.md)

---

## Anti-Pattern 5: Unused Components and Dead Schema References

### Category
Code Organization

### Description
Defining schemas in `components/schemas` that are never referenced by any path operation, bloating the spec file and confusing consumers with irrelevant type definitions.

### Why It Happens
Components accumulate over time. Old schemas are kept "just in case" they are needed again. Schemas are extracted to components during refactoring but the original inline definitions remain. Auto-generation tools may create component definitions that are never wired to endpoints.

### Warning Signs
- Components section has schemas that do not appear in any `$ref` usage
- Deleting a component causes no validation failures
- Spec contains deprecated model versions that are no longer used
- SDK generators produce types for unused models
- Consumer asks "what is the DeprecatedUserV1 schema for?"

### Why It Is Harmful
Dead components make the spec harder to navigate. Consumers must sift through irrelevant types to find the ones they need. SDK generators create unused type definitions, bloating generated client libraries. Every dead component is a maintenance trap — no one knows if it is safe to remove.

### Real-World Consequences
The spec contains 12 User-related schemas: `User`, `UserV2`, `UserV3`, `CreateUserRequestV1`, `CreateUserRequestV2`, `UpdateUserRequest`, `UserResponse`, `UserCollection`, `UserMeta`, `UserPreferences`, `DeprecatedUser`, `UserImportFormat`. Only 4 are actively used by endpoints. A consumer scanning the components section spends 15 minutes trying to understand which User schema to use, and picks `UserV2` — which is deprecated.

### Preferred Alternative
Run dead-component detection regularly. Remove any component that is not referenced by at least one path, response, or request body. Keep only what is actively used.

### Refactoring Strategy
1. Run `redocly lint` with the `no-unused-components` rule (or equivalent)
2. Review flagged unused components — some may be used indirectly via `allOf`/`oneOf`
3. Remove confirmed unused components from the spec
4. Archive removed schemas in version control history for reference
5. Add dead-component detection to CI validation

### Detection Checklist
- [ ] Count total components vs. referenced components
- [ ] Run dead-component detection tool
- [ ] Identify components that are not `$ref`-ed by any operation
- [ ] Verify removals do not break `allOf`/`oneOf` references
- [ ] Add CI rule to reject spec with unused components

### Related Rules
- Define All Schemas In Components With $ref References (05-rules.md)

### Related Skills
- Implement OpenAPI Specification Generation (06-skills.md)

### Related Decision Trees
- Spec Organization — Single-File vs Multi-File (07-decision-trees.md)

---

