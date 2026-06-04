# Phase 5: Rules — SDK Generation from OpenAPI

## Always Provide Consistent operationId Values
---
## Category
Design
---
## Rule
Set `operationId` on every operation using the `{resource}.{action}` convention. Never leave an operation without an `operationId` or use inconsistent naming.
---
## Reason
SDK generators derive all client method names from `operationId`. Without it, generators fall back to generating names from the HTTP method and path — producing unreadable, inconsistent method names like `apiV1UsersIdGet`. The `resource.action` pattern produces intuitive `client.users.list()`.
---
## Bad Example
```yaml
# No operationId — codegen produces: client.apiV1UsersIdGet()
/users/{id}:
  get:
    summary: Get user by ID
```
---
## Good Example
```yaml
/users/{id}:
  get:
    operationId: users.get
    summary: Get user by ID
# Codegen produces: client.users.get(id)
```
---
## Exceptions
No common exceptions. Every operation must have a unique, conventionally-named `operationId`.
---
## Consequences Of Violation
Generated SDKs have inconsistent, unreadable method names; consumer developers must manually map SDK methods to API operations.
---

## Define Every Schema In Components With $ref References
---
## Category
Code Organization
---
## Rule
Define all data models in `components/schemas` and reference them via `$ref` in request and response bodies. Never use inline schemas.
---
## Reason
SDK generators produce a class per schema component. Inline schemas cause codegen to either generate duplicate classes for identical structures or produce inline anonymous types that cannot be reused. Both outcomes create unusable SDKs.
---
## Bad Example
```yaml
responses:
  '200':
    content:
      application/json:
        schema:
          type: object
          properties:
            id: { type: integer }
            name: { type: string }
# Inline — cannot be referenced by other endpoints
```
---
## Good Example
```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id: { type: integer }
        name: { type: string }
responses:
  '200':
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
```
---
## Exceptions
No common exceptions. Every reusable data structure must be in components.
---
## Consequences Of Violation
Duplicate types in generated SDKs; no shared type references between related endpoints; consumer code has redundant model classes.
---

## Use Discriminated Unions For oneOf Schemas
---
## Category
Design
---
## Rule
When using `oneOf`, include a discriminator property with a mapping so SDK generators can produce proper union types with exhaustiveness checking.
---
## Reason
Without a discriminator, codegen cannot determine which variant of a `oneOf` schema to instantiate at runtime. Generated SDKs fall back to `any` or `object` types, defeating the purpose of type-safe SDK generation.
---
## Bad Example
```yaml
oneOf:
  - $ref: '#/components/schemas/CreatePayment'
  - $ref: '#/components/schemas/RefundPayment'
# No discriminator — codegen produces `object`
```
---
## Good Example
```yaml
oneOf:
  - $ref: '#/components/schemas/CreatePayment'
  - $ref: '#/components/schemas/RefundPayment'
discriminator:
  propertyName: type
  mapping:
    create: '#/components/schemas/CreatePayment'
    refund: '#/components/schemas/RefundPayment'
```
---
## Exceptions
APIs that do not use polymorphic schemas at all.
---
## Consequences Of Violation
Union types are untyped in generated SDKs; type-checking is impossible; consumer code must manually parse and cast response types.
---

## Include Error Response Models In The Spec
---
## Category
Design
---
## Rule
Define error response schemas in `components/schemas` and reference them in error status code responses so generated SDKs have typed error handling.
---
## Reason
Specs with only success responses produce SDKs where all error handling uses generic exceptions or `any` types. Consumers cannot write type-safe error handling code without documented error models.
---
## Bad Example
```yaml
# Only 200 documented — generated SDK has no error types
# Consumers must catch generic exceptions and parse manually
```
---
## Good Example
```yaml
components:
  schemas:
    ErrorResponse:
      type: object
      properties:
        message: { type: string }
        code: { type: string }
        errors: { type: object }
    UnauthorizedError:
      allOf:
        - $ref: '#/components/schemas/ErrorResponse'
        - type: object
          properties:
            code:
              type: string
              enum: [UNAUTHENTICATED]
paths:
  /users:
    get:
      responses:
        '200': { ... }
        '401':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UnauthorizedError'
```
---
## Exceptions
No common exceptions. Every documented error status code must have a schema component.
---
## Consequences Of Violation
SDK error handling is untyped; consumers must write fragile string-parsing code for errors; type-safe languages offer no compile-time error handling guidance.
---

## Avoid Untyped Object Properties
---
## Category
Design
---
## Rule
Define `properties` for every object-type schema property. Never use `type: object` without a `properties` definition.
---
## Reason
SDK generators produce `Map<string, any>` or `Dictionary` for untyped objects, providing zero type safety. Every consumer must manually parse and validate the structure at runtime, which defeats the purpose of a generated SDK.
---
## Bad Example
```yaml
metadata:
  type: object
  # No properties — codegen produces Map<string, any>
```
---
## Good Example
```yaml
metadata:
  type: object
  properties:
    source:
      type: string
      description: Signup source (web, ios, android)
    ip_address:
      type: string
      format: ipv4
```
---
## Exceptions
Truly dynamic key-value metadata maps where keys genuinely cannot be enumerated. Document the key and value types at minimum: `additionalProperties: { type: string }`.
---
## Consequences Of Violation
Generated SDKs have untyped dictionary fields; consumer code loses compile-time safety; the SDK provides no advantage over raw HTTP calls.
---

## Automate SDK Generation And Testing In CI
---
## Category
Reliability
---
## Rule
Run SDK generation as a CI step that produces versioned SDK packages, tests them against a live API instance, and publishes on success.
---
## Reason
Manual SDK generation is error-prone, inconsistent, and easily forgotten. CI-automated generation ensures every API release produces a matching, tested SDK. Testing against a live API catches serialization bugs, URL construction errors, and authentication issues before consumers download the SDK.
---
## Bad Example
Developer runs codegen locally, commits the output, and pushes. Generated Safari-specific bug in URL construction not caught. Consumer SDK is broken until the next release.
---
## Good Example
```yaml
jobs:
  sdk:
    runs-on: ubuntu-latest
    steps:
      - run: openapi-generator generate -i openapi.yaml -g php -o sdk/php
      - run: composer install --working-dir=sdk/php
      - run: phpunit tests/SdkIntegrationTest.php  # Tests generated client against API
      - run: npm publish sdk/js  # Only on success
```
---
## Exceptions
APIs with no external consumers needing SDKs.
---
## Consequences Of Violation
Untested SDKs are published with bugs; consumer integration fails at "import the SDK" step; trust in the generated client erodes.
---

## Never Modify Generated SDK Code Directly
---
## Category
Maintainability
---
## Rule
Do not edit the output of SDK generators. Use codegen extension points — custom templates, post-generation scripts, or configuration files — for any customization.
---
## Reason
Re-generation overwrites manual edits without warning. Any direct modification is lost on the next `openapi-generator generate` call, creating inconsistencies between versions and causing bugs that are difficult to trace.
---
## Bad Example
Developer edits `generated/php/UsersApi.php` to fix a serialization bug. Next generation overwrites the fix. The bug reappears in production.
---
## Good Example
```yaml
# Custom template (mustache) instead of editing generated code
# templates/php/model.mustache
# or post-generation fixer script
# post-generate.php — applied after every generation
```
---
## Exceptions
No common exceptions. Always use extension points, never modify generated files.
---
## Consequences Of Violation
Manual edits are lost on regeneration; the same fixes must be re-applied after every version; production bugs recur.
---
