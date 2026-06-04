# ECC Standardized Knowledge — Scribe Integration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Scribe Integration |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Scribe is an API documentation generator for Laravel (and other PHP frameworks) that uses PHPDoc annotations, static analysis, and manual configuration to produce Markdown, HTML, Postman collections, and OpenAPI specs. Unlike Scramble (which infers schemas from code types), Scribe relies on `@bodyParam`, `@response`, `@group`, and other doc-block annotations to extract endpoint metadata. The generator runs as an Artisan command (`php artisan scribe:generate`) and produces output files deployable as static documentation.

## Core Concepts

- **Annotation mappings**: @group (endpoint grouping), @bodyParam (request fields), @queryParam (query strings), @response (example responses), @header (request headers), @urlParam (URL parameters).
- **Multi-format output**: `public/docs/` (HTML site), `collection.json` (Postman), `openapi.yaml` (OpenAPI 3.0).
- **Extract vs call mode**: Extract mode reads @response annotations for examples. Call mode makes real HTTP requests to capture live responses (requires seeded database).
- **Annotations as metadata contracts**: Separate contract layer alongside code. Code defines behavior; annotations define documentation. Both must be maintained.

## When To Use

- API teams wanting explicit control over all documentation content
- Projects requiring static HTML documentation sites with search, sidebar, code samples
- APIs needing Postman collection generation as built-in feature
- PHP 7.x projects or projects without extensive type coverage
- Enterprise APIs with complex error documentation requirements
- Multi-version APIs needing per-version documentation

## When NOT To Use

- Rapidly iterating APIs where annotation maintenance overhead is unacceptable
- Laravel APIs with well-typed code where zero-config generation (Scramble) suffices
- Projects prioritizing "documentation as compilation byproduct" over "documentation as separate artifact"
- APIs where OpenAPI 3.1 features are required (Scribe outputs 3.0 only)

## Best Practices

- **Exhaustive annotations**: Every public controller method should have @group, @bodyParam (for POST/PUT), @response, and description.
- **Seed database for call mode**: Run `php artisan db:seed --class=DemoDataSeeder` before `scribe:generate` in call mode for representative examples.
- **Configure auth in scribe.php**: Set up authentication config for call mode to generate requests with proper tokens.
- **Document error responses explicitly**: Add @response status=4xx annotations for each error scenario alongside happy-path responses.
- **Run in CI or local only**: Never run call mode against production database. Use dedicated testing database.

## Architecture Guidelines

- Documentation is a build artifact, not a runtime resource. Add `php artisan scribe:generate` to deployment pipeline after migrations.
- Static HTML can be served by Laravel's public directory or copied to a CDN/developer portal.
- Annotations and inferred rules (when Form Request inference enabled): Scribe prioritizes annotations over inferred rules for a given field.
- CI pipeline must regenerate docs on every deployment. Consider excluding `public/docs/` from version control.

## Performance Considerations

- Extract mode: 5-15 seconds for 100 endpoints. Call mode: 30-60 seconds (depends on endpoint response times).
- Call mode executes real controller logic and database queries. Use dedicated testing database.
- Generated HTML docs for 100 endpoints: 2-5 MB (HTML, CSS, JS).

## Security Considerations

- Generated docs expose full API surface. Protect the `/docs` route or restrict access to the generated files.
- Never run call mode on production — test requests execute against live data.
- Configure test tokens in scribe.php; ensure they have limited permissions.
- Review generated docs before deployment for accidental internal endpoint exposure.

## Common Mistakes

- **Missing @group annotations**: Endpoints appear under "General" or ungrouped, producing disorganized docs.
- **Stale response examples**: API response structure changed but @response not updated. Use call mode for frequently changing endpoints.
- **Undocumented error responses**: Only happy-path @response annotations written. Consumers don't see 422, 404, 500 shapes.
- **Running call mode on production database**: Test requests create/modify/delete production data. Always use local/CI environment.
- **Incomplete annotation coverage**: Some endpoints have no doc blocks, producing entries with empty content.

## Anti-Patterns

- **Only extract mode for rapidly changing APIs**: Response examples become stale quickly. Prefer call mode or frequent regeneration.
- **Ignoring Form Request inference capabilities**: Scribe v4+ can infer from Form Requests, reducing annotation burden. Enable it in scribe.php.

## Examples

```php
/**
 * @group User Management
 * @bodyParam name string required User's full name. Example: John Doe
 * @response { "id": 1, "name": "John Doe", "email": "john@example.com" }
 * @response status=422 scenario="validation error" { "message": "The name field is required.", "errors": {"name": ["The name field is required."]} }
 */
public function store(StoreUserRequest $request) { ... }
```

## Related Topics

- **Prerequisites**: PHPDoc Annotations, Controller Method Design
- **Closely Related**: Scramble Integration, Endpoint Documentation Content, Postman Collection Generation
- **Advanced**: Custom Scribe Strategies, Scribe HTML Theming

## AI Agent Notes

When using Scribe: always include @group on every controller method, document error responses explicitly via @response status= annotations, use call mode for accurate live examples (with seeded database), configure auth in scribe.php, run generation in CI never production, maintain annotations as part of code review process.

## Verification

Sources: Scribe GitHub (github.com/knuckleswtf/scribe), Scribe documentation (scribe.knuckles.wtf), domain-analysis.md.
