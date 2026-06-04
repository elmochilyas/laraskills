## Use PHP 8 Attributes for Endpoint Documentation
---
## Category
Framework Usage
---
## Rule
Document all API endpoints using PHP 8 attributes (not docblock annotations) for OpenAPI spec generation.
---
## Reason
Attributes are natively understood by PHP, provide IDE autocompletion, and are less error-prone than string-based docblock annotations.
---
## Bad Example
```php
/**
 * @OA\Get(path="/users", @OA\Response(response="200", description="Success"))
 */
```
---
## Good Example
```php
use OpenApi\Attributes as OA;
#[OA\Get(path: '/users', responses: [new OA\Response(response: 200, description: 'Success')])]
```
---
## Exceptions
Existing projects with extensive docblock annotations (migrate gradually).
---
## Consequences Of Violation
Annotation typos caught at generation time, no IDE support, harder to refactor.
## Define Reusable Schemas for DTOs
---
## Category
Maintainability
---
## Rule
Define reusable OpenAPI schema definitions for request/response DTOs; never inline schema definitions in endpoint docs.
---
## Reason
Reusable schemas ensure consistency across endpoints and reduce duplication when the same DTO appears in multiple endpoints.
---
## Bad Example
```php
#[OA\Schema(type: 'object', properties: [new OA\Property(property: 'name', type: 'string')])]
// Same schema duplicated in UserController, AdminController, etc.
```
---
## Good Example
```php
#[OA\Schema(schema: 'User', properties: [
    new OA\Property(property: 'name', type: 'string'),
])]
class UserData {}
// Reference: new OA\Schema(ref: '#/components/schemas/User')
```
---
## Exceptions
One-off response shapes that won't be reused.
---
## Consequences Of Violation
Schema drift between endpoints, duplicated definitions, harder to maintain consistency.
## Version OpenAPI Spec Alongside the API
---
## Category
Code Organization
---
## Rule
Maintain separate OpenAPI spec versions matching API versions; never use a single spec for all versions.
---
## Reason
A single spec for multiple versions becomes confusing and inaccurate as versions diverge.
---
## Bad Example
```yaml
# Single openapi.yaml for both v1 and v2 — inaccurate when versions diverge
```
---
## Good Example
```yaml
# storage/api-docs/v1/openapi.yaml
# storage/api-docs/v2/openapi.yaml
```
---
## Exceptions
Minor API versions with identical specs.
---
## Consequences Of Violation
Spec inaccuracies, consumer confusion about which version the spec describes.
## Validate Generated Spec Against OpenAPI Schema
---
## Category
Testing
---
## Rule
Validate the generated OpenAPI spec against the OpenAPI 3.x schema in CI; reject invalid specs.
---
## Reason
Invalid specs break consumer tooling (code generators, API explorers) and indicate documentation bugs.
---
## Bad Example
```yaml
# No validation — invalid spec generated silently
```
---
## Good Example
```yaml
# CI step
- run: swagger-cli validate storage/api-docs/openapi.yaml
```
---
## Exceptions
None — always validate generated specs.
---
## Consequences Of Violation
Broken Swagger UI, failed code generation for consumers, inaccurate documentation.
## Include Example Values in All Schema Definitions
---
## Category
Maintainability
---
## Rule
Provide realistic example values in every schema property; never leave examples empty.
---
## Reason
Examples improve consumer developer experience (generated docs, SDK docs, test data) and serve as implicit contract documentation.
---
## Bad Example
```php
#[OA\Property(property: 'email', type: 'string')] // no example
```
---
## Good Example
```php
#[OA\Property(property: 'email', type: 'string', example: 'user@example.com')]
```
---
## Exceptions
Security-sensitive fields (tokens, secrets) where examples could be used as templates.
---
## Consequences Of Violation
Poor developer experience, generated SDKs with placeholder data, consumer confusion about expected formats.
## Integrate Spec Generation into CI Pipeline
---
## Category
Testing
---
## Rule
Generate and validate the OpenAPI spec on every PR; fail CI if generation fails or spec is invalid.
---
## Reason
Outdated specs silently diverge from implementation; CI integration ensures docs stay synchronized with code.
---
## Bad Example
```yaml
# Manual generation — spec frequently out of date
```
---
## Good Example
```yaml
# CI step — auto-generate and validate
- run: php artisan l5-swagger:generate
- run: swagger-cli validate public/api-docs/api-docs.json
```
---
## Exceptions
None — always integrate spec generation into CI.
---
## Consequences Of Violation
Spec diverges from implementation, consumers see outdated docs, breaking changes undocumented.
