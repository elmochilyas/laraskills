# Scribe Integration

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Scribe Integration
- **Last Updated:** 2026-06-02

---

## Executive Summary

Scribe is an API documentation generator for Laravel (and other PHP frameworks) that uses PHPDoc annotations, static analysis, and manual configuration to produce Markdown, HTML, and Postman collections. Unlike Scramble (which infers schemas from code types), Scribe relies on `@bodyParam`, `@response`, `@group`, and other doc-block annotations to extract endpoint metadata, request parameters, and response examples.

Scribe generates a static HTML documentation site, a Postman collection, and an OpenAPI spec. It supports Laravel, Lumen, and generic PHP projects. The generator runs as an Artisan command (`php artisan scribe:generate`) and produces output files that can be committed to version control or deployed to a static host.

---

## Core Concepts

### Annotation-Driven Documentation
Scribe reads PHPDoc blocks on controller methods to extract endpoint descriptions, request parameters, response structures, and grouping information. Each annotation maps to specific documentation elements:

| Annotation | Purpose |
|---|---|
| `@group` | Groups endpoints under a heading |
| `@bodyParam` | Documents request body fields |
| `@queryParam` | Documents query string parameters |
| `@response` | Provides an example response |
| `@header` | Documents request headers |
| `@urlParam` | Documents URL parameters (route bindings) |

### Static Site Generation
Scribe generates a complete HTML documentation site with Bootstrap-based responsive design, sidebar navigation, search, and code samples in multiple languages (cURL, JavaScript, PHP, Python, etc.).

### Multi-Format Output
The `scribe:generate` command produces:
- `public/docs/` — Static HTML documentation site
- `public/docs/collection.json` — Postman collection
- `public/docs/openapi.yaml` — OpenAPI specification

### Extractable vs Inferred Content
Scribe extracts what annotations explicitly declare; it does not infer schema from code. A `@bodyParam` must exist for each request field. Response examples come from `@response` annotations or by making actual HTTP requests (response call mode).

---

## Mental Models

### Annotations as Metadata Contracts
Think of PHPDoc annotations as a separate contract layer alongside the code. The code defines behavior; annotations define the documentation contract. Both must be maintained, and they can drift independently.

### Documentation as a Static Artifact
Unlike Scramble (which serves docs dynamically), Scribe generates static files. The workflow is: write code → add annotations → run `scribe:generate` → deploy the generated docs. Documentation is a build artifact, not a runtime resource.

### Two Modes: Extract vs Call
Scribe operates in two modes for response examples:
- **Extract mode:** Reads `@response` annotations for examples
- **Call mode:** Makes real HTTP requests to the application and captures the response

Call mode produces accurate, live examples but requires a working application with seeded data. Extract mode requires manual maintenance but works without a running database.

---

## Internal Mechanics

### The Generation Pipeline
1. **RouteCollector** — Discovers API routes from route files (configurable in `scribe.php`)
2. **EndpointExtractor** — For each route, resolves the controller method and parses PHPDoc annotations
3. **ResponseResolver** — Collects response examples from annotations or actual HTTP calls
4. **PostmanConverter** — Transforms endpoints into Postman collection JSON
5. **OpenApiConverter** — Converts internal endpoint representation to OpenAPI YAML
6. **HtmlWriter** — Renders the static HTML documentation site using Blade templates

### Annotation Parsing
Scribe uses PHP's `ReflectionMethod` and `DocComment` parsing to extract annotations. Each annotation is mapped to endpoint metadata:

```php
/**
 * @group User Management
 * @bodyParam name string required User's full name. Example: John Doe
 * @response {
 *   "id": 1, "name": "John Doe", "email": "john@example.com"
 * }
 */
public function store() { ... }
```

### Response Call Mode
When using response call mode (`@responseFromApi` or config setting), Scribe:
1. Bootstraps a Laravel application instance
2. Makes an HTTP request to each endpoint
3. Captures the JSON response body
4. Extracts the response as the example

This requires database seeding for GET endpoints and may require manual setup for endpoints with authentication.

### Configuration File
The `scribe.php` config file controls:
- Route groups to include/exclude
- Authentication setup for response call mode
- Type extraction strategy (annotations vs. Form Request inference)
- Output directory and HTML theme
- Postman collection metadata

---

## Patterns

### Exhaustive Annotation Practice
Every public controller method should have `@group`, `@bodyParam` (for POST/PUT), `@response`, and description annotations. Missing annotations produce incomplete documentation sections.

### Seed Database for Call Mode
Before running `scribe:generate` in call mode, ensure the database has representative seed data. Empty responses produce misleading documentation:

```bash
php artisan db:seed --class=DemoDataSeeder
php artisan scribe:generate
```

### Authentication Setup in Config
Configure authentication in `scribe.php` to generate requests with proper tokens:

```php
// config/scribe.php
'authentication' => [
    'type' => 'bearer',
    'value' => env('SCRIBE_AUTH_TOKEN', 'test-token'),
],
```

### Annotations for Error Responses
Document error responses separately via additional `@response` annotations with status codes:

```php
/**
 * @response status=422 scenario="validation error" {
 *   "message": "The name field is required.",
 *   "errors": {"name": ["The name field is required."]}
 * }
 */
```

---

## Architectural Decisions

### Scribe vs Scramble
Scribe requires explicit annotations but offers complete control over documentation content. Scramble requires zero annotations but only documents what it can infer. The decision depends on team preference for explicit documentation vs. code-driven generation.

### Extract vs Call Mode
Extract mode is simpler and deterministic but requires manual maintenance of response examples. Call mode produces accurate examples but adds complexity (database seeding, authentication setup, environment configuration).

### Postman Collection Generation
Scribe's Postman export is a side benefit — the HTML docs are the primary output. Teams that require Postman as their primary documentation format may prefer dedicated Postman tooling.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Complete control over documentation | Manual annotation maintenance | Doc drift if annotations aren't updated |
| Static HTML output (fast, deployable) | Requires `php artisan scribe:generate` step | CI pipeline must regenerate docs |
| Multi-language code samples | Only works for endpoints with annotations | Undocumented endpoints are invisible |
| Postman and OpenAPI export | Export quality depends on annotation completeness | Postman collection may lack schema detail |
| Works with any PHP framework | No type-inference innovation | More verbose than Scramble for Laravel |

---

## Performance Considerations

### Generation Time
Scribe's generation is I/O bound (writing files) and annotation parsing bound. A project with 100 endpoints typically generates in 5-15 seconds in extract mode, 30-60 seconds in call mode.

### Call Mode Database Impact
Call mode makes real HTTP requests, executing controller logic and database queries. Use a dedicated testing database and seed it before generation runs to avoid polluting production data.

### Output Size
Generated HTML documentation for 100 endpoints is typically 2-5 MB (HTML, CSS, JS). Consider excluding `public/docs/` from version control and generating during deployment.

---

## Production Considerations

### CI/CD Integration
Add `php artisan scribe:generate` to the deployment pipeline. Run it after `php artisan migrate` and before application startup. Generate in call mode only if a test database is available.

### Documentation Deployment
The generated `public/docs/` directory is served by Laravel's static file handling. Alternatively, copy the docs to a CDN or developer portal for access without application uptime dependency.

### Authentication in Call Mode
For authenticated endpoints, configure a test token in `scribe.php` and ensure the API routes accept it. Use a dedicated test user with representative data.

---

## Common Mistakes

### Missing @group Annotations
Why it happens: Developer forgets to add `@group` to controller methods. Why it's harmful: Endpoints appear under "General" or are ungrouped, producing a disorganized documentation site. Better approach: Always start every controller method's doc block with `@group`.

### Stale Response Examples
Why it happens: Developer changes API response structure but does not update `@response` annotations. Why it's harmful: Documentation shows a response structure that does not match implementation. Better approach: Use call mode for frequently changing endpoints; review annotations during code review.

### Undocumented Error Responses
Why it happens: Only happy-path `@response` annotations are written. Why it's harmful: Clients see only success responses in docs, missing validation errors, 404s, and 500s. Better approach: Add `@response status=4xx` annotations for each error scenario.

### Running Call Mode on Production Database
Why it happens: `APP_ENV=production` is not checked before running `scribe:generate`. Why it's harmful: Test requests execute against production data, potentially creating, modifying, or deleting records. Better approach: Always run in a local or CI environment with a dedicated database.

---

## Failure Modes

### Missing Annotation Causes Blank Section
If a controller method has no doc block, Scribe generates an endpoint entry with no description, no parameters, and no response example. The failure mode is incomplete but not broken — the endpoint appears in navigation with empty content.

### Call Mode Timeout
Endpoints that are slow (external API calls, large datasets) may time out during call mode generation. Increase the timeout in `scribe.php` or skip slow endpoints via the `@hideFromScribe` annotation.

### Form Request Inference Conflicts
When Scribe's Form Request inference is enabled, annotations and inferred rules may conflict. Scribe prioritizes annotations over inferred rules, so an explicit `@bodyParam` overrides a Form Request rule for the same field.

---

## Ecosystem Usage

### Laravel Documentation
The official Laravel documentation has used Scribe at various points for generating its API reference. Scribe's longevity in the Laravel ecosystem makes it a proven choice for projects requiring comprehensive static documentation.

### Third-Party Packages
Several packages extend Scribe:

- `knuckleswtf/scribe-extra` — Additional strategies and output formats
- `kutia-software-company/laravel-scribe-demo` — Demo setup with authentication and seeding
- Custom Blade themes for branded documentation

### Community Maintenance
Scribe is maintained by KnucklesWTF. It is well-established (v4.x stable) with extensive documentation and community support across forums, Laravel News, and Stack Overflow.

---

## Related Knowledge Units

### Prerequisites
- PHPDoc Annotations — `@param`, `@return`, custom annotation syntax
- Controller Method Design — Route-to-controller binding

### Related Topics
- Scramble Integration — Type-inference-based alternative
- Endpoint Documentation Content — What to document vs Scribe's capabilities
- Postman Collection Generation — Scribe's export in detail

### Advanced Follow-up Topics
- Custom Scribe Strategies — Writing custom response and parameter extraction strategies
- Scribe HTML Theming — Custom Blade layouts for branded documentation

---

## Research Notes

### Source Analysis
- Scribe GitHub: https://github.com/knuckleswtf/scribe — v4.x stable, Laravel-first but framework-agnostic
- Scribe Documentation: https://scribe.knuckles.wtf — Comprehensive configuration and strategy documentation

### Key Insight
Scribe's annotation-driven approach is a conscious tradeoff: it requires more maintenance upfront but provides explicit, predictable documentation output. Teams that value "documentation as a separate artifact" benefit from Scribe's approach; teams seeking "documentation as a compilation byproduct" prefer Scramble.

### Version-Specific Notes
- Scribe v4.x: Supports Laravel 10.x and 11.x; drops support for Lumen and Laravel < 9
- Scribe v3.x: Last major version supporting Lumen and older Laravel versions
- Scribe v4.3+: Improved Form Request inference, OpenAPI 3.0 export
- Scribe v4.5+: Support for PHP 8.1 enums in schema generation
