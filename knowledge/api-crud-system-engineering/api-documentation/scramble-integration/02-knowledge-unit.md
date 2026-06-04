# Scramble Integration

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Scramble Integration
- **Last Updated:** 2026-06-02

---

## Executive Summary

Scramble is a Laravel-specific OpenAPI documentation generator that infers API specifications from code annotations, route definitions, and type hints — requiring no external configuration files or PHP annotations beyond standard Laravel conventions. Unlike Scribe (which uses PHPDoc blocks and static analysis), Scramble analyzes Laravel's route definitions, Form Requests, and API Resources at compile time using PHP reflection to generate an OpenAPI 3.1 specification automatically.

Scramble eliminates the need for developers to maintain a separate `openapi.yaml` or write extensive doc blocks. It extracts request body schemas from Form Requests, response schemas from API Resources, and route metadata from controller method signatures and route definitions. The generated spec is served via a built-in Swagger UI endpoint or exported as JSON/YAML for consumption by Postman, Stoplight, or codegen tools.

---

## Core Concepts

### Automatic Schema Extraction
Scramble reads Laravel's Form Request classes to infer validation rules as OpenAPI schema properties. For example, a `StoreUserRequest` with `string|max:255` rules becomes a `string` property with `maxLength: 255` in the generated spec. This eliminates duplication between validation logic and documentation.

### Route Introspection
Scramble walks the route registrar to discover all registered API routes, extracting URI patterns, HTTP methods, middleware, and controller method bindings. Routes from separate route files are merged into a single OpenAPI spec.

### Type Inference via Reflection
PHP 8.0+ type hints (union types, nullable types, named arguments) are used to infer parameter types, return types, and response schemas. Scramble maps PHP types to OpenAPI 3.1 schema types automatically.

### OpenAPI 3.1 Compliance
Scramble generates OpenAPI 3.1.0 output, supporting JSON Schema draft 2020-12 features like `examples`, `deprecated`, and nullable types via `type: [string, null]` format.

---

## Mental Models

### Documentation as a Compilation Artifact
Think of Scramble as a compiler for documentation. Source code (routes, controllers, Form Requests) is the input; the OpenAPI spec is the compiled output. If the source changes, the spec regenerates automatically. No separate documentation source of truth exists.

### The Inference Chain
Routes → Controllers → Form Requests → API Resources. Scramble walks this chain backward: it discovers routes, finds the bound controller, inspects parameters (which may be Form Requests), and traces return types (which may be API Resources). Understanding this chain helps predict what Scramble can and cannot document.

### Zero-Config Philosophy
Scramble follows Laravel's "convention over configuration" philosophy. If the code follows Laravel conventions (type-hinted Form Requests, typed API Resources, route model binding), Scramble works with zero configuration. Deviations require explicit schema annotations.

---

## Internal Mechanics

### Registration and Service Provider
Scramble registers a service provider (`Dedoc\Scramble\ScrambleServiceProvider`) that hooks into Laravel's boot process. It uses a `Route` facade macro to intercept route registration and stores route metadata for documentation generation.

### The Generator Pipeline
1. **RouteCollector** — Enumerates all routes from Laravel's `RouteCollection`, filtering for API routes
2. **OperationBuilder** — For each route, builds an OpenAPI Operation object (path, method, parameters, request body, responses)
3. **SchemaBuilder** — Inspects Form Request `rules()` methods and API Resource `toArray()` methods to infer JSON Schema
4. **OpenApiRenderer** — Composes operations into a complete OpenAPI 3.1 document with info, servers, components, and tags

### Form Request Rule Translation
```php
// Before (Laravel Form Request):
public function rules(): array {
    return ['email' => 'required|email|max:255'];
}

// After (Scramble-generated schema):
"email": { "type": "string", "format": "email", "maxLength": 255 }
```

Scramble parses pipe-delimited rules and individual rule objects, translating each to OpenAPI keywords. Unknown rules produce no schema constraint.

### API Resource Inspection
Scramble inspects the `toArray()` method of API Resources returned by controller methods. It uses reflection to determine the returned resource's schema, including relationships if using `JsonApiResource` or `ResourceCollection`.

---

## Patterns

### Type-Hinted Form Requests
Always type-hint Form Request classes in controller method signatures. Scramble uses this type hint to find and analyze the request class:

```php
public function store(StoreUserRequest $request): UserResource { ... }
```

### Explicit Return Types
Declare return types on controller methods (`UserResource`, `ResourceCollection`) to give Scramble enough information to extract response schemas:

```php
public function show(User $user): UserResource { ... }
```

### Use API Resources for Consistent Schemas
Scramble extracts response structure from API Resource classes. Return ad-hoc arrays from controllers and Scramble has no schema to document.

### Tagging for Operation Grouping
Use PHP 8.1 enums or route groups with consistent naming to produce well-organized OpenAPI tags. Configure tag groupings via `scramble.php` config:

```php
// config/scramble.php
return [
    'tags' => [
        'Users' => ['prefix' => 'users'],
    ],
];
```

---

## Architectural Decisions

### Scramble vs Manual OpenAPI Maintenance
The decision to adopt Scramble is a bet on code-generated documentation. Manual `openapi.yaml` files offer full control but drift from implementation. Scramble guarantees alignment with code but limits what can be documented (only what Scramble can infer). Teams needing extensive documentation of error conditions, rate limits, or non-code behavior may need hybrid approaches.

### Configuration Approach
Scramble supports a `scramble.php` config file for API metadata (title, version, description, servers). The default "zero-config" approach works for simple APIs; complex APIs require explicit configuration for tag grouping, undocumented endpoints, and custom schema components.

### Documentation Route Protection
The built-in Swagger UI route (`/docs/api`) should be protected in production. Wrap in middleware: `Route::view('/docs/api', 'scramble::docs')->middleware(['auth', 'throttle:10,1'])`.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| No manual spec maintenance | Limited to what Scramble can infer | Error responses must be manually documented |
| Always in sync with code | Only works for Laravel-Laravel pipelines | Non-Laravel consumers must fetch spec versioned |
| Zero config for standard Laravel | Custom validation rules produce no schema | Schema completeness depends on rule coverage |
| OpenAPI 3.1 with JSON Schema 2020-12 | Requires PHP 8.0+ with type hints | Legacy PHP projects cannot adopt Scramble |
| Built-in Swagger UI | UI route exposed if not protected | Accidental public access to API documentation |

---

## Performance Considerations

### Generation Time
Scramble regenerates documentation on every request in development (cached in production). First request after code changes incurs a 200-500ms generation penalty. Cache the generated spec in production via `php artisan scramble:cache`.

### Route Enumeration Overhead
Scramble iterates all registered routes on each generation. Projects with 500+ routes may see 50-100ms spent in route enumeration alone. Use route caching (`php artisan route:cache`) to mitigate.

### Schema Caching
Production should use the cached OpenAPI export rather than runtime generation. Configure CI to regenerate and cache the spec on deployment:

```bash
php artisan scramble:cache
```

---

## Production Considerations

### Production Spec Serving
Disable runtime generation in production via `APP_ENV` checks. Serve the cached spec from a static file or CDN rather than running the generation pipeline on every request.

### Access Control
The `/docs/api` endpoint exposes every endpoint and schema. Protect with authentication middleware, IP whitelisting, or VPN. Consider generating the spec in CI and publishing to an internal developer portal instead.

### Versioning the Spec
Tag generated specs with the application version. Store the OpenAPI output in version control or publish as a build artifact alongside each deployment:

```bash
php artisan scramble:export --format=json > openapi-v1.0.0.json
```

---

## Common Mistakes

### Missing Return Type Hints
Why it happens: PHP 7.x habits or omission in controller methods. Why it's harmful: Scramble cannot determine the response schema, producing `{}` for response bodies. Better approach: Always declare `: ResponseResource` or `: ResourceCollection` return types.

### Using `$request->all()` Without Form Requests
Why it happens: Developer uses `Request` base class instead of a Form Request. Why it's harmful: Scramble has no `rules()` method to inspect. Better approach: Create Form Request classes for every mutation endpoint.

### Ignoring Custom Validation Rules
Why it happens: Custom rule classes or Closure rules have no OpenAPI equivalent. Why it's harmful: The generated schema omits constraints, suggesting broader validation than actually exists. Better approach: Annotate custom rules with `@schema` attributes or manual overrides.

### Unprotected Doc Route in Production
Why it happens: The `/docs/api` route is registered automatically and easily forgotten. Why it's harmful: Exposes full API surface area to unauthenticated users. Better approach: Wrap the docs route with authentication middleware explicitly.

---

## Failure Modes

### Schema Generation Failure on Complex Response
Scramble fails silently if it cannot resolve a controller's return type — the response schema is omitted rather than generating an error. The failure mode is incomplete documentation, not broken endpoints.

### Circular Reference in API Resources
If two API Resources reference each other, Scramble's reflection may enter an infinite loop or produce an incomplete schema. Break circular references with manual schema overrides or intermediate DTOs.

### Stale Cached Spec
When `php artisan scramble:cache` is run but route/controller code changes afterward without re-caching, the served spec is stale. Failure mode is silent drift between implementation and documentation.

---

## Ecosystem Usage

### Laravel API Starter Kits
Laravel Breeze and Jetstream include Scramble integration as the default API documentation tool. Both ship with pre-configured `scramble.php` and protected docs routes.

### Spatie Packages
Spatie's `laravel-data` package has explicit Scramble integration, allowing DTO properties to be extracted as OpenAPI schemas. This bridges the gap between DTO-driven APIs and documentation generation.

### Laravel Nova
Nova does not use Scramble — it generates its own internal API documentation. Teams using Nova alongside custom APIs must manage Scramble separately for the public-facing API docs.

---

## Related Knowledge Units

### Prerequisites
- Laravel Route Definitions — Route groups, prefixes, middleware assignment
- PHP 8.0+ Type System — Union types, named arguments, return type declarations

### Related Topics
- Scribe Integration — Alternative documentation generator with different tradeoffs
- OpenAPI Spec Generation — The output format Scramble produces
- Endpoint Documentation Content — What Scramble documents vs what must be added manually

### Advanced Follow-up Topics
- Custom Schema Extensions for Scramble — Extending Scramble's inference beyond Form Requests
- Scramble vs Scribe Selection — Systematic comparison and decision framework

---

## Research Notes

### Source Analysis
- Scramble GitHub: https://github.com/dedoc/scramble — Active development, v0.12+ stable, OpenAPI 3.1 output
- Laravel News coverage (2024-2025): Multiple articles cover Scramble as the preferred Laravel OpenAPI tool

### Key Insight
Scramble's biggest advantage is that documentation cannot drift from implementation because it derives the spec from the implementation itself. This shifts the documentation maintenance burden from "keep spec in sync" to "keep code well-typed."

### Version-Specific Notes
- Scramble v0.10+: OpenAPI 3.1 support with JSON Schema 2020-12
- Scramble v0.8+: Form Request rule inference (basic pipe-delimited rules)
- Scramble v0.6+: API Resource inspection (requires PHP 8.0+)
- Scramble v0.12+: Support for Spatie `laravel-data` v4+ DTO properties
