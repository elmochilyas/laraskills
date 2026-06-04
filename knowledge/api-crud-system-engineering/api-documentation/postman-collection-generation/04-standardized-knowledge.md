# ECC Standardized Knowledge — Postman Collection Generation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Postman Collection Generation |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Postman Collection Generation produces a Postman-compatible JSON collection file representing the complete API surface. Collections can be imported into Postman for interactive API exploration, testing, and documentation viewing. Collections can be generated from OpenAPI specs (via Postman import or openapi-to-postman) or directly from documentation generators like Scribe (which produces a collection.json alongside HTML docs).

## Core Concepts

- **Collection v2.1 format**: JSON with `info` (metadata), `item` (endpoint array), `variable` (environment variables), `event` (scripts), `auth` (authentication config).
- **OpenAPI to Postman mapping**: Paths -> items, tags -> folders, parameters -> query/header/path params, requestBody -> request body, responses -> response examples, securitySchemes -> auth config.
- **Collection vs environment separation**: Collection defines endpoints/schemas/examples; environment defines variable values (base URL, tokens). Enables reuse across dev/staging/production.
- **Scribe export**: `php artisan scribe:generate` outputs `public/docs/collection.json`.

## When To Use

- APIs consumed by external teams that use Postman
- APIs needing interactive runnable documentation
- APIs requiring integration testing via Newman (Postman's CLI)
- APIs documented via Scribe (which includes collection export)

## When NOT To Use

- APIs documented exclusively through OpenAPI specs without Postman consumers
- Internal-only APIs where curl examples suffice
- APIs with very large endpoint sets (1000+) where collection file size becomes unmanageable

## Best Practices

- **Environment variable separation**: Define `base_url`, tokens as variables, not hardcoded values. Create separate environment files for each deployment target.
- **Pre-request scripts for auth**: Automate token acquisition with `pm.sendRequest()` to login endpoint, storing token in environment variable.
- **Test scripts per endpoint**: Add at least status code assertions. Extend to response structure validation for key endpoints.
- **Organize by resource**: Folder structure matching API resources (Users, Posts, Auth).
- **Store environment templates in version control**: With placeholder values only. Never commit real tokens or production URLs.
- **Generate from spec, enhance manually**: Auto-generate collection from OpenAPI for correctness; add scripts post-generation.

## Architecture Guidelines

- Version collections alongside API versions. Maintain separate collections per supported version.
- Publish collection alongside documentation. Provide "Run in Postman" button.
- Use Newman in CI for collection-based integration testing.
- Generate collection from OpenAPI spec in CI to keep in sync; apply manual enhancements as post-processing scripts.

## Performance Considerations

- Collection for 100 endpoints with response examples: 1-5 MB. Large collections may slow Postman import.
- Pre-request scripts (auth token acquisition) add latency to first request. Cache tokens in environment variables.
- Newman test execution time scales linearly with number of endpoints.

## Security Considerations

- Do not commit environment files with real tokens or production URLs.
- Environment variable leak: if environment files with tokens are committed, credentials are exposed. Use .gitignore for real value files.
- Review collection before sharing to ensure no internal endpoints are exposed.

## Common Mistakes

- **Hardcoded environment values**: base_url set directly instead of variable. Collection cannot be reused across environments.
- **No test scripts**: Collection treated as documentation only. Missed opportunity for integration testing.
- **Stale auth tokens in environment**: Tokens hardcoded in env files expire. Use pre-request scripts to acquire dynamically.
- **Collection drift from spec**: Manual editing after regeneration overwritten on next generate. Keep manual changes in separate enhancement scripts.

## Anti-Patterns

- **Single environment file for all deployments**: Forces consumers to edit the collection file. Always separate environment from collection.
- **Ignoring collection versioning**: Consumers on older API versions use outdated collections without knowing.

## Examples

- Collection folder structure: `API v2 > Users > List Users, Create User, Get User`.
- Environment template: `{ "key": "base_url", "value": "http://localhost:8000/api" }`.
- Newman command: `npx newman run collection.json -e environment.json --reporters cli,junit`.

## Related Topics

- **Prerequisites**: OpenAPI Spec Generation, API Endpoint Design
- **Closely Related**: Scribe Integration, Documentation CI Validation
- **Advanced**: Newman CI Integration, Postman Test Scripting, Collection Workflow Ordering

## AI Agent Notes

When generating Postman collections: separate environment from collection definition, automate auth via pre-request scripts, add test scripts for status code validation, generate from OpenAPI spec in CI, version collections alongside API versions, use variable references for all environment-specific values.

## Verification

Sources: Postman Collection Format v2.1 (schema.postman.com), openapi-to-postman (github.com/postmanlabs), Newman (github.com/postmanlabs/newman), domain-analysis.md.
