# ECC Anti-Patterns — SDK Generation from OpenAPI

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | SDK Generation from OpenAPI |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Direct Modification of Generated SDK Code
2. Missing Error Models — No Typed Error Handling
3. Missing operationId — SDK Method Names from Paths
4. No SDK Testing Before Publishing
5. Untyped Object Properties — Generic Map Types

---

## Repository-Wide Anti-Patterns

- Divergent Change
- Premature Optimization
- Silent Failures

---

## Anti-Pattern 1: Direct Modification of Generated SDK Code

### Category
Maintainability

### Description
Editing the output files of SDK code generators directly (e.g., modifying `generated/php/UsersApi.php`), knowing that regeneration will overwrite the changes.

### Why It Happens
The generated SDK has a bug or missing feature. Fixing it in the generated file is faster than filing a ticket, upstreaming a fix to the spec, or writing a custom template. The developer intends to fix it "properly later" but never does. The manual fix becomes permanent — until someone regenerates.

### Warning Signs
- Git history shows modifications to files with "DO NOT EDIT" headers
- Comments or code style inconsistencies in generated files
- Regenerating the SDK produces different code — bugs reappear
- Developer says "we have a custom fix in the generated file"
- No custom templates or post-processing scripts exist
- CI regeneration overwrites manual fixes and tests fail

### Why It Is Harmful
Every direct modification is a time bomb. The next regeneration overwrites all manual edits without warning. Bugs that were fixed reappear. Features that were added disappear. The team either stops regenerating (letting the SDK drift from the spec) or accepts recurring bugs. Both outcomes harm consumers.

### Real-World Consequences
A developer manually edits `generated/php/UsersApi.php` to fix a serialization bug where the `date_of_birth` field is not formatted correctly. The fix works. Three months later, a new developer runs `openapi-generator generate` to add the new `PATCH /users/{id}` endpoint. The regeneration overwrites the serialization fix. The `date_of_birth` bug reappears in production. Consumer support tickets spike before anyone traces the issue.

### Preferred Alternative
Use codegen extension points — custom templates, post-generation scripts, or configuration files — for any customization. Never edit generated files.

### Refactoring Strategy
1. Identify all direct modifications in generated files by diffing against a fresh generation
2. Move each modification to an appropriate extension point:
   - Schema/spec fixes → update the OpenAPI spec
   - Serialization fixes → custom codegen template (mustache/handlebars)
   - Additional methods → post-generation script that appends to generated files
3. Test that regenerating + applying extension points produces the same result as the current modified files
4. Add CI check: fail if any generated file differs from the output of `generate + post-process`

### Detection Checklist
- [ ] Check for any hand-edited files with "DO NOT EDIT" or "auto-generated" headers
- [ ] Verify custom templates and post-processing scripts exist for all modifications
- [ ] Test that fresh regeneration + post-processing matches the current state
- [ ] Add CI check that detects modifications to generated files
- [ ] Confirm no "custom fix in generated file" conversations exist on the team

### Related Rules
- Never Modify Generated SDK Code Directly (05-rules.md)

### Related Skills
- Generate SDKs from OpenAPI Specs (06-skills.md)

### Related Decision Trees
- Codegen Tool Selection — OpenAPI Generator vs Fern vs Speakeasy (07-decision-trees.md)

---

## Anti-Pattern 2: Missing Error Models — No Typed Error Handling

### Category
Design

### Description
Documenting only success response schemas in the spec without defining error response models, so generated SDKs have no typed error handling — consumers must catch generic exceptions and parse error payloads manually.

### Why It Happens
Error models require explicit definition in `components/schemas` and referencing in error status code responses. Teams focus on success responses because they represent the "happy path." Error schemas are seen as extra work for "edge cases."

### Warning Signs
- Spec has schemas only for success responses (200/201)
- No `ErrorResponse` or equivalent schema in `components/schemas`
- Error status codes (401, 422, 500) exist in path definitions but reference no schema
- Generated SDKs have no error classes — all errors are `ApiException` or `RuntimeException`
- Consumer code has `catch (Exception $e)` blocks with manual JSON parsing
- SDK documentation shows no error type hierarchy

### Why It Is Harmful
Without typed error models, consumers cannot write type-safe error handling. Every error response must be manually parsed from a generic exception or response object. Type-safe languages lose compile-time error handling guidance. The consumer's error handling code is fragile, stringly-typed, and prone to bugs.

### Real-World Consequences
A consumer generates a TypeScript SDK from a spec with no error models. Every API call throws a generic `ApiError` with a `response` property. The consumer writes: `catch (e) { const body = JSON.parse(e.response); if (body.code === 'VALIDATION_ERROR') { ... } }`. The `code` field name is wrong (actual field is `error`), a consumer accidentally types `body.code` instead of `body.error`, and the error handling silently breaks. If the SDK had a typed `ValidationError` class, this bug would be caught at compile time.

### Preferred Alternative
Define error response schemas in `components/schemas` and reference them in error status code responses so generated SDKs have typed error handling.

### Refactoring Strategy
1. Define an `ErrorResponse` schema with `message`, `code`, and `errors` properties
2. Create specific error type schemas using `allOf` to extend the base: `ValidationError`, `UnauthorizedError`, `NotFoundError`
3. Reference these error schemas in every endpoint's error status code responses
4. Regenerate SDKs and verify typed error classes are produced
5. Update SDK documentation to show error type hierarchy

### Detection Checklist
- [ ] Check for error schemas in `components/schemas`
- [ ] Verify every error status code references an error schema
- [ ] Confirm generated SDKs have typed error classes
- [ ] Test consumer can write `catch (ValidationError $e)` style handling
- [ ] Review SDK documentation for error type hierarchy

### Related Rules
- Include Error Response Models In The Spec (05-rules.md)
- Define Every Schema In Components With $ref References (05-rules.md)

### Related Skills
- Generate SDKs from OpenAPI Specs (06-skills.md)

### Related Decision Trees
- SDK Versioning Strategy — Aligned with API vs Independent (07-decision-trees.md)

---

## Anti-Pattern 3: Missing operationId — SDK Method Names from Paths

### Category
Design

### Description
Omitting `operationId` on path operations, forcing SDK generators to derive method names from HTTP method + path template, producing inconsistent, unreadable names.

### Why It Happens
OpenAPI does not require `operationId`. Auto-generation tools may omit it. Teams that manually write specs may not know about its role in SDK naming. The spec is first used for documentation rendering (Swagger UI), where operationId is invisible.

### Warning Signs
- Generated SDK method names like `getUsersIdGet`, `apiV1UsersIdGet`, `postNewUserEndpoint`
- No `operationId` field on path operations
- Method names change when paths are modified
- SDK documentation lists inconsistent method naming patterns
- Consumer developers ask "what method should I call for this endpoint?"
- Codegen configuration requires manual method name overrides

### Why It Is Harmful
SDK generators derive all client method names from `operationId`. Without it, generators fall back to generating names from the HTTP method, path template, and parameter names — producing fragile, inconsistent identifiers. A path `GET /users/{id}` becomes `getUsersIdGet`. Renaming the path parameter from `id` to `userId` changes every generated method name. Consumer code that references these methods breaks on spec regeneration.

### Real-World Consequences
An API has `GET /users/{id}` and `GET /users/{id}/posts/{postId}`. No operationIds. The first generates `getUsersIdGet`. The second generates `getUsersIdPostsPostIdGet`. A consumer writes `client.getUsersIdGet(42)`. The team later renames the path to `GET /members/{id}`. The generated method name changes to `getMembersIdGet`. Every consumer's code breaks. If `operationId: users.get` and `operationId: users.posts.get` existed, method names would never change.

### Preferred Alternative
Set `operationId` to `{resource}.{action}` format — `users.list`, `users.create`, `users.get`, `users.update`, `users.delete` — for every operation.

### Refactoring Strategy
1. Audit every path operation for missing `operationId`
2. Add `operationId` following `{resource}.{action}` convention
3. Verify uniqueness — every `operationId` must be different
4. Regenerate SDKs and verify method names follow `{resource}.{action}` pattern
5. Add a CI lint rule that requires `operationId` on every operation

### Detection Checklist
- [ ] Count operations with missing `operationId`
- [ ] Verify operationIds follow `{resource}.{action}` convention
- [ ] Check for duplicate operationId values
- [ ] Confirm generated SDK method names match `{resource}.{action}` pattern
- [ ] Add lint rule to enforce operationId presence and naming convention

### Related Rules
- Always Provide Consistent operationId Values (05-rules.md)

### Related Skills
- Generate SDKs from OpenAPI Specs (06-skills.md)

### Related Decision Trees
- Codegen Tool Selection — OpenAPI Generator vs Fern vs Speakeasy (07-decision-trees.md)

---

## Anti-Pattern 4: No SDK Testing Before Publishing

### Category
Reliability

### Description
Generating SDKs and publishing them to package registries without testing that the generated code compiles, constructs correct URLs, handles authentication, and serializes payloads correctly.

### Why It Happens
Codegen tools produce output that "looks correct." Teams review the generated files, see familiar patterns, and assume correctness. Manual testing of every generated SDK in every language is time-consuming. Automated integration tests using the generated SDK against a live API instance are rare.

### Warning Signs
- SDK generation step produces no test execution
- Published SDKs have compilation errors in certain environments
- Consumer reports that the SDK constructs wrong URLs
- Authentication headers are missing or incorrectly formatted
- Serialization bugs (date formats, enum values) are reported by consumers
- CI pipeline generates and publishes SDKs but never tests them

### Why It Is Harmful
An untested SDK is a liability. Compilation errors, URL construction bugs, serialization failures, and authentication issues all surface after consumers download the package. Every consumer's first experience is an integration failure. Trust in the SDK (and the API) erodes with every bug. Fixing a published SDK requires a new release, a new version number, and consumer upgrades.

### Real-World Consequences
A team publishes a PHP SDK generated by OpenAPI Generator. The generated `composer.json` has an incorrect PHP version constraint (`>=8.0` instead of `>=8.1`). A consumer on PHP 8.1 installs the SDK. The Guzzle dependency resolves to a version incompatible with the generated code. Every API call throws a type error. The consumer files a support ticket. The team publishes a fix, but the consumer must upgrade. The fix takes 3 days.

### Preferred Alternative
Automate SDK generation, testing, and publishing in CI. Test the generated SDK against a live API instance before publishing.

### Refactoring Strategy
1. Write integration tests that use the generated SDK to make real API calls
2. Test URL construction, authentication, request serialization, and response deserialization
3. Add a CI step that generates the SDK, runs integration tests against a test environment
4. Only publish the SDK if all tests pass
5. Include basic compile/type-check steps (e.g., `composer install && php -l`, `tsc --noEmit`)

### Detection Checklist
- [ ] Check CI pipeline for SDK test step after generation
- [ ] Verify integration tests exercise URL construction, auth, serialization
- [ ] Confirm published SDKs have been tested against a live API instance
- [ ] Review SDK bug reports — how many were caught by testing vs. discovered by consumers?
- [ ] Add test coverage requirements for SDK generation

### Related Rules
- Automate SDK Generation And Testing In CI (05-rules.md)

### Related Skills
- Generate SDKs from OpenAPI Specs (06-skills.md)

### Related Decision Trees
- SDK Versioning Strategy — Aligned with API vs Independent (07-decision-trees.md)

---

## Anti-Pattern 5: Untyped Object Properties — Generic Map Types

### Category
Design

### Description
Defining properties as `type: object` without specifying their internal structure (`properties`), causing SDK generators to produce generic `Map<string, any>` or `Dictionary` types with no type safety.

### Why It Happens
Complex nested objects are harder to document. Developers use `type: object` as a placeholder, promising to define properties later. The placeholder becomes permanent when no one prioritizes "documentation for nested fields." Auto-generation tools may produce untyped object placeholders when they cannot infer the internal structure.

### Warning Signs
- Schema has `metadata: { type: object }` with no `properties`
- SDK generator produces `Map<string, any>` or `Record<string, unknown>` for these fields
- Generated SDK documentation shows "object" as the type for these fields
- Consumers ask "what fields go in the preferences object?"
- Consumer code has manual type assertions/casts for these fields
- Deserialization errors for nested fields are common

### Why It Is Harmful
Untyped `object` properties eliminate all the benefits of SDK generation. Consumers lose type safety for the most complex parts of the request or response — the nested structures that are hardest to get right. SDK-generated models require runtime type checking and manual validation for untyped properties, defeating the purpose of type-safe client code.

### Real-World Consequences
The `User` response schema has `preferences: { type: object }` with no properties. A consumer generates a TypeScript SDK: `preferences: Record<string, unknown>`. The consumer writes: `const lang = user.preferences['language'] as string`. The actual API stores `language` as `lang`. The consumer's type assertion succeeds at compile time but returns `undefined` at runtime. If the schema defined `preferences.properties.language`, the SDK would generate `preferences.language: string` and the consumer would correctly access `user.preferences.language`.

### Preferred Alternative
Define `properties` for every object-type schema property. Never use `type: object` without a `properties` definition.

### Refactoring Strategy
1. Search every schema for `type: object` without `properties`
2. For each, determine the actual expected structure from the code or validation rules
3. Add complete `properties` definitions with types, constraints, and descriptions
4. Add `required` arrays for mandatory nested fields
5. Regenerate SDKs and verify typed nested objects are produced

### Detection Checklist
- [ ] Search for `type: object` without `properties` in the spec
- [ ] Check SDK generator output for `Map` or `Record` types in nested objects
- [ ] Verify nested objects have explicit property definitions at all levels
- [ ] Confirm consumers can access nested fields with type safety
- [ ] Add lint rule to reject untyped object properties

### Related Rules
- Avoid Untyped Object Properties (05-rules.md)
- Define Every Schema In Components With $ref References (05-rules.md)

### Related Skills
- Generate SDKs from OpenAPI Specs (06-skills.md)

### Related Decision Trees
- Codegen Tool Selection — OpenAPI Generator vs Fern vs Speakeasy (07-decision-trees.md)

---

