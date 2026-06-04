# ECC Standardized Knowledge — Scramble Integration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Scramble Integration |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Scramble is a Laravel-native OpenAPI 3.1 documentation generator that infers API specifications from code — routes, Form Requests, API Resources, type hints — requiring no external configuration or PHP annotations. It uses PHP reflection to extract request body schemas from Form Request rules, response schemas from API Resource `toArray()` methods, and route metadata from controller signatures. The generated spec can be served via built-in Swagger UI or exported as JSON/YAML.

## Core Concepts

- **Automatic schema extraction**: Form Request rules -> OpenAPI schema properties. Eliminates duplication between validation and documentation.
- **Route introspection**: Walks route registrar to discover all API routes, merging multiple route files into single spec.
- **Type inference via reflection**: PHP 8.0+ type hints mapped to OpenAPI 3.1 schema types.
- **OpenAPI 3.1 compliance**: JSON Schema 2020-12 features — `examples`, `deprecated`, nullable via `type: [string, null]`.
- **Inference chain**: Routes -> Controllers -> Form Requests -> API Resources. Understanding this chain predicts what Scramble can/cannot document.

## When To Use

- Laravel 9+ APIs with PHP 8.0+ type hints
- Teams prioritizing low-maintenance documentation
- APIs following Laravel conventions (type-hinted Form Requests, API Resources, route model binding)
- New Laravel projects where zero-config documentation is desired

## When NOT To Use

- PHP 7.x projects (Scramble requires PHP 8.0+)
- APIs with complex error responses needing extensive documentation (Scramble does not infer errors)
- Schema-first development (spec is designed before code is written)
- Projects needing static HTML documentation sites or Postman collections natively
- APIs heavily using custom validation rules with no OpenAPI equivalent

## Best Practices

- **Type-hint Form Requests**: Always use Form Request classes in controller signatures. Scramble uses this to find and analyze rules.
- **Declare explicit return types**: `UserResource`, `ResourceCollection` on controller methods. Gives Scramble response schema information.
- **Use API Resources for consistent schemas**: Return ad-hoc arrays and Scramble has no schema to document.
- **Tag for operation grouping**: Use route groups with consistent naming. Configure tag grouping via `scramble.php`.
- **Cache in production**: Run `php artisan scramble:cache` in deployment pipeline. Avoid runtime generation in production.
- **Protect docs route**: Wrap `/docs/api` with auth middleware and throttling.

## Architecture Guidelines

- Scramble follows "documentation as compilation artifact" philosophy. Source code is input; OpenAPI spec is output.
- Deviations from Laravel conventions require explicit schema annotations or manual complement.
- For error documentation, combine Scramble with post-processing: generate base spec, then overlay hand-written error docs via YAML merge.
- Configure API metadata (title, version, servers) in `config/scramble.php`.

## Performance Considerations

- First code-change request in development incurs 200-500ms generation penalty. Subsequent requests use cache.
- Projects with 500+ routes may see 50-100ms in route enumeration. Use `php artisan route:cache`.
- Production should serve cached spec (static file or CDN), not runtime generation.

## Security Considerations

- Built-in Swagger UI route (`/docs/api`) exposes every endpoint and schema. Protect with authentication middleware in production.
- Consider generating spec in CI and publishing to internal developer portal instead of exposing docs route.
- Auto-generated specs may expose internal routes accidentally. Review generated spec before publishing.

## Common Mistakes

- **Missing return type hints**: Scramble cannot determine response schema, produces `{}` for response bodies.
- **Using `$request->all()` without Form Requests**: Scramble has no `rules()` to inspect. Create Form Request classes for every mutation endpoint.
- **Ignoring custom validation rules**: Custom rules have no OpenAPI equivalent; schema omits constraints. Annotate with `@schema` attributes or manual overrides.
- **Unprotected doc route in production**: Docs route automatically registered; easily forgotten. Wrap with auth middleware explicitly.
- **Stale cached spec**: Code changes after `scramble:cache` without re-caching produces stale docs. Regenerate on deploy.

## Anti-Patterns

- **Relying on Scramble for error documentation**: Scramble does not infer error responses. Plan separate error documentation strategy.
- **Zero review of generated spec**: Always review auto-generated spec for completeness, correctness, and accidental exposure.

## Examples

```php
// Controller with type hints Scramble can analyze
public function store(StoreUserRequest $request): UserResource { ... }
```

```yaml
# Scramble output from Form Request rules
email: { type: string, format: email, maxLength: 255 }
```

## Related Topics

- **Prerequisites**: Laravel Route Definitions, PHP 8.0+ Type System
- **Closely Related**: Scribe Integration, OpenAPI Spec Generation, Endpoint Documentation Content
- **Advanced**: Custom Schema Extensions for Scramble, Scramble vs Scribe Selection

## AI Agent Notes

When using Scramble: ensure all controller methods have type-hinted Form Requests and explicit return types, use API Resources for response formatting, protect the docs route in production, cache the spec in CI, plan separate error documentation strategy, review generated spec before publishing.

## Verification

Sources: Scramble GitHub (github.com/dedoc/scramble), Laravel News coverage, domain-analysis.md.
