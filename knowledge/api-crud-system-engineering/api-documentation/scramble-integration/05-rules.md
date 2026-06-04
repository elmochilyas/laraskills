# Phase 5: Rules — Scramble Integration

## Type-Hint Form Requests In Controller Signatures
---
## Category
Framework Usage
---
## Rule
Always type-hint Form Request classes in controller method signatures instead of using `Request` and calling `$request->all()`.
---
## Reason
Scramble uses PHP reflection to inspect controller method parameters. If the parameter is a Form Request, Scramble reads its `rules()` method and generates matching OpenAPI schemas. Without a Form Request type hint, Scramble has no validation rules to analyze and produces an empty request body schema.
---
## Bad Example
```php
public function store(Request $request): UserResource
{
    $validated = $request->validate([...]); // Scramble cannot see inline validation
}
```
---
## Good Example
```php
public function store(StoreUserRequest $request): UserResource
{
    // Scramble reads StoreUserRequest::rules() for schema generation
}
```
---
## Exceptions
GET/DELETE endpoints that have no request body; Scramble does not need to infer request schemas.
---
## Consequences Of Violation
Request body schemas are empty or missing; consumers see no documented request payload structure.
---

## Declare Explicit Return Types On Controller Methods
---
## Category
Framework Usage
---
## Rule
Add explicit return type declarations — `UserResource`, `ResourceCollection`, `AnonymousResourceCollection` — to every controller method.
---
## Reason
Scramble infers response schemas from controller return types. Without explicit return types, Scramble produces `{}` for response bodies, leaving consumers with no information about what the endpoint returns.
---
## Bad Example
```php
public function index()
{
    return UserResource::collection(User::all());
}
// Scramble produces: responses: { '200': { schema: {} } }
```
---
## Good Example
```php
public function index(): AnonymousResourceCollection
{
    return UserResource::collection(User::all());
}
// Scramble produces full UserResource schema in response
```
---
## Exceptions
No common exceptions. Every controller action that returns data must have an explicit return type.
---
## Consequences Of Violation
Response schemas are empty objects; consumers cannot determine what data the endpoint returns; SDK codegen produces unusable models.
---

## Protect The Built-In Docs Route In Production
---
## Category
Security
---
## Rule
Wrap the `/docs/api` route with authentication middleware and rate limiting in production. Never expose the raw API surface to unauthenticated users.
---
## Reason
Scramble's built-in Swagger UI route exposes every endpoint, schema, and configuration of the API. Unprotected access in production leaks the full attack surface to anyone who discovers the URL, including internal endpoint paths and data model structures.
---
## Bad Example
```php
// config/scramble.php — no route protection configured
// /docs/api is publicly accessible in production
```
---
## Good Example
```php
// In RouteServiceProvider or middleware
Route::middleware(['auth:sanctum', 'throttle:30,60'])
    ->group(function () {
        Scramble::registerUiRoute('docs/api');
    });
```
---
## Exceptions
Public APIs where documentation is intentionally public; still add rate limiting.
---
## Consequences Of Violation
Full API surface is publicly exposed; internal endpoint patterns are discoverable; attack surface increases.
---

## Cache The Generated Spec In CI For Production
---
## Category
Performance
---
## Rule
Run `php artisan scramble:cache` during deployment and serve the cached spec as a static file rather than generating at runtime.
---
## Reason
Runtime spec generation on every un-cached request adds 200-500ms latency. More importantly, runtime generation requires the full Laravel bootstrap, increasing memory usage and exposing the generation process to runtime failures. Cached static file serving is instant and isolated.
---
## Bad Example
// No caching; every request to /docs/api triggers spec generation
// First request after each deploy takes 500ms+ to generate spec
---
## Good Example
```yaml
# Deployment script
- run: php artisan scramble:cache
- run: php artisan route:cache
```
---
## Exceptions
Development environments where live spec updates are desired; use cache only in production.
---
## Consequences Of Violation
Increased latency on documentation requests; higher memory usage; risk of runtime generation failures.
---

## Plan A Separate Error Documentation Strategy
---
## Category
Design
---
## Rule
Do not rely on Scramble to document error responses. Implement a separate strategy: post-process the generated spec to overlay hand-written error documentation, or maintain error components manually.
---
## Reason
Scramble explicitly does not infer error responses from controller code. Controllers may throw exceptions, use validation exceptions, or return error responses — Scramble has no visibility into these paths. Relying on Scramble for error docs guarantees no error documentation exists.
---
## Bad Example
```php
// Controller assumes Scramble documents errors
// Scramble shows only 200 responses
// Consumers have no error shapes
```
---
## Good Example
```yaml
# Post-generation merge script
openapi: generated-by-scramble.yaml
components:
  responses:
    ValidationError:
      description: "422 validation error shape"
    Unauthorized:
      description: "401 unauthorized shape"
```
---
## Exceptions
APIs using Scramble with a custom extension that injects error schemas into the generation process.
---
## Consequences Of Violation
Error documentation is completely absent; consumers have no documented error response shapes; integration error handling is impossible.
---

## Review Auto-Generated Spec Before Publishing
---
## Category
Reliability
---
## Rule
Always review Scramble's generated OpenAPI spec for completeness, correctness, and accidental endpoint exposure before publishing.
---
## Reason
Scramble's inference is not perfect. It may miss custom validation rules, fail to resolve complex type hierarchies, or include routes intended for internal use. An unverified auto-generated spec is an untrusted spec.
---
## Bad Example
```bash
# Deploy directly from generated spec without review
php artisan scramble:generate
# Deploy...  # Internal routes may be exposed
```
---
## Good Example
```bash
php artisan scramble:generate
# Manual or automated review step
npx @redocly/cli lint openapi.yaml
# Check for internal routes
grep -E "/_(health|horizon|telescope)" openapi.yaml && exit 1
# Deploy...
```
---
## Exceptions
No common exceptions. Always review auto-generated output before publishing.
---
## Consequences Of Violation
Missing documentation elements; internal endpoints accidentally exposed; consumers see incomplete or incorrect schemas.
---
