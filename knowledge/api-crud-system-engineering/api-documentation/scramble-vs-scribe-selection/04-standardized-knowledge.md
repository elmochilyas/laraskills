# ECC Standardized Knowledge — Scramble vs Scribe Selection

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Scramble vs Scribe Selection |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Scramble and Scribe are the two primary OpenAPI documentation generators for Laravel. Scramble infers documentation from code (type hints, Form Requests, API Resources) with zero annotations. Scribe relies on explicit PHPDoc annotations and static analysis. The choice between them significantly impacts documentation workflow, maintenance burden, and output quality. Hybrid approaches are possible and sometimes optimal.

## Core Concepts

- **Fundamental difference**: Scramble uses compile-time reflection (zero annotations); Scribe uses PHPDoc annotations + static analysis (explicit control).
- **Output formats**: Scramble produces OpenAPI 3.1 JSON/YAML + Swagger UI; Scribe produces HTML site + Postman collection + OpenAPI 3.0.
- **Schema source**: Scramble from Form Requests + API Resources; Scribe from @bodyParam, @response annotations.
- **Error documentation**: Scramble does not infer errors; Scribe requires explicit @response status= annotations.
- **PHP requirement**: Scramble requires PHP 8.0+ with type hints; Scribe works with PHP 7.4+.

## When To Use Scramble

- Code follows Laravel conventions (type-hinted Form Requests, API Resources)
- Team prioritizes low-maintenance documentation
- API is well-typed with PHP 8.0+ type hints
- Error documentation handled separately or less critical

## When To Use Scribe

- API has complex error responses that must be explicitly documented
- Team wants explicit control over documentation content
- Consumers need HTML documentation site or Postman collection
- API serves multiple versions with different documentation
- Project uses PHP 7.x or has legacy type coverage

## Best Practices

- **Evaluate end-to-end pipeline**: Consider CI integration, output hosting, and consumer tools, not just generation step.
- **Match tool to API maturity**: Scramble for fast-iterating/evolving APIs; Scribe for stable APIs with established consumers.
- **Hybrid approach**: Use Scramble for automatic request/response schemas, overlay manual error documentation via OpenAPI spec post-processing.
- **Scribe with Form Request inference**: Scribe v4+ can infer schemas from Form Requests, reducing annotation overhead while maintaining error doc control.
- **Parallel transition**: When migrating tools, generate both specs in parallel for a transition period before switching.

## Architecture Guidelines

- **Decision factors**: PHP version, type coverage, error documentation needs, output formats, maintenance budget, control requirements, Laravel version.
- **OpenAPI 3.1 requirement**: If OpenAPI 3.1 features are needed, Scramble is the only option (Scribe outputs 3.0).
- **Multi-language code samples**: Scribe provides this natively; Scramble requires manual setup or third-party viewer.
- **Documentation hosting**: Scramble needs a viewer (Swagger UI, Redoc); Scribe outputs self-contained HTML deployable independently.

## Performance Considerations

- Scramble generation: 200-500ms runtime or cached. Scribe extract mode: 5-15s. Scribe call mode: 30-60s.
- Scramble regenerates on every request in dev (no manual command). Scribe requires `php artisan scribe:generate` after code changes.
- Scramble's live-reload workflow is faster for rapid iteration.

## Security Considerations

- Both tools expose API surface through documentation. Protect access regardless of tool choice.
- Scramble's built-in Swagger UI route requires explicit protection. Scribe's static HTML can be served from restricted locations.
- Review auto-generated specs before publishing regardless of generation approach.

## Common Mistakes

- **Choosing based on hype, not requirements**: Blog recommendations may not match project needs. Evaluate against requirements.
- **Assuming auto-generation is always better**: "Zero annotations" sounds appealing but error documentation is completely missing.
- **Underestimating annotation maintenance**: Annotations drift from code over time. Budget for documentation maintenance regardless of tool.
- **Not evaluating the full pipeline**: CI integration, output hosting, consumer tools equally important as generation step.
- **Wrong tool for project lifecycle**: Scribe for rapidly iterating API causes annotation maintenance burden; Scramble for stable API may miss needed output formats.

## Anti-Patterns

- **Sole reliance on Scramble with no error doc plan**: Consumers have no error documentation. Always add error documentation strategy.
- **Dogmatic tool choice across teams**: Different teams/projects within same org may benefit from different tools based on API characteristics.

## Examples

- Scramble setup: `composer require dedoc/scramble` + config for title/version. Zero annotations needed.
- Scribe setup: `composer require knuckleswtf/scribe` + `php artisan vendor:publish --tag=scribe-config`.
- Hybrid: Scramble generates base spec; `yq` merges hand-written error docs into final spec.

## Related Topics

- **Prerequisites**: Endpoint Documentation Content, OpenAPI Spec Generation
- **Closely Related**: Scramble Integration, Scribe Integration, Documentation CI Validation
- **Advanced**: Hybrid Scramble + Scribe Workflow, Post-Processing OpenAPI Specs, Custom Documentation Strategy

## AI Agent Notes

When choosing between Scramble and Scribe: evaluate PHP version (Scramble requires 8.0+), type coverage, error doc needs, output format requirements (HTML/Postman vs Swagger UI), maintenance budget, and API maturity. Consider hybrid approach: Scramble for request/response schemas + manual error doc overlay. Plan error documentation regardless of tool choice.

## Verification

Sources: Scramble GitHub (github.com/dedoc/scramble), Scribe GitHub (github.com/knuckleswtf/scribe), Laravel News comparisons (2024-2025), domain-analysis.md.
