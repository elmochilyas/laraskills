# ECC Standardized Knowledge — Deprecation Notes in Docs

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Deprecation Notes in Docs |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Deprecation notes in documentation communicate that an endpoint, parameter, response field, or version is scheduled for removal. In OpenAPI, the `deprecated: true` flag marks operations and schema properties. Proper deprecation documentation provides advance notice, migration guidance, and a clear timeline — preventing consumer integration breaks.

## Core Concepts

- **Deprecation levels**: Soft (not recommended, no removal date), Hard (removal date set), Sunset (removed — 410 Gone).
- **OpenAPI `deprecated: true`**: Marks operations and schema properties. Documentation tools render with visual styling.
- **Deprecation headers**: `Deprecation: true`, `Sunset: <date>`, `Link: <migration>; rel="deprecation"`.
- **Standard notice format**: What is deprecated, what replaces it, deprecated since, removal date, migration instructions.

## When To Use

- Endpoints being phased out in favor of newer alternatives
- Response fields that are being replaced
- API versions entering deprecation lifecycle
- Parameters that are no longer recommended

## When NOT To Use

- Features that still work as designed and are not being removed
- Internally deprecated implementation details not exposed to consumers
- Features removed immediately without deprecation period (emergency security removals)

## Best Practices

- **Standard deprecation callout**: Consistent format: what, use instead, deprecated since, removal date, migration.
- **Both `deprecated: true` and description**: The flag alerts tooling; the description provides human context.
- **Deprecation in changelog**: Every deprecation appears in the "Deprecated" section.
- **Headers in API responses**: `Deprecation: true` + `Sunset` header + migration link header.
- **Monitor deprecated usage**: Log usage of deprecated endpoints and contact consumers before removal.
- **Enforce timeline**: Announce → add headers → remove at sunset date (410 Gone).

## Architecture Guidelines

- `deprecated: true` on operation level for deprecated endpoints.
- `deprecated: true` on schema property level for deprecated fields (OpenAPI 3.1+).
- Description field contains the structured deprecation notice.
- In Scramble, use PHP 8.4 `#[Deprecated]` attribute or `@deprecated` PHPDoc.
- In Scribe, use `@deprecated` in controller doc blocks.

## Performance Considerations

- Deprecation headers add minimal overhead to response size.
- No runtime performance impact from documentation notes.

## Security Considerations

- Deprecated endpoints may have known security issues — document replacement clearly to discourage continued use.
- Sunset old auth mechanisms with migration path documented.

## Common Mistakes

- **No replacement indicated**: Deprecation noted but alternative not provided.
- **Vague timeline**: "Will be removed in a future version" — consumers cannot plan.
- **No migration instructions**: Consumers must reverse-engineer the migration path.
- **Forgetting to remove after sunset**: Endpoint still works past removal date — no incentive to migrate.

## Anti-Patterns

- **Deprecated without consumer notification**: Endpoint marked in docs but consumers unaware until removal.
- **Premature removal**: Endpoint removed before stated sunset date, breaking consumer schedules.
- **Deprecated with no replacement**: Consumers have no migration path.

## Examples

- OpenAPI: `get /users/list: deprecated: true, description: "Deprecated. Use GET /users instead. Removal: 2026-12-31"`.
- Response header: `Deprecation: true, Sunset: Sat, 31 Dec 2026 23:59:59 GMT, Link: <https://docs.example.com/migration>; rel="deprecation"`.

## Related Topics

- **Prerequisites**: API Versioning Strategy, API Changelog Generation
- **Closely Related**: API Version Documentation, Changelog Generation, Documentation CI Validation
- **Advanced**: Deprecation header implementation, consumer notification pipeline

## AI Agent Notes

When generating deprecation docs: use `deprecated: true` flag + structured description, include replacement endpoint, set removal date, add Deprecation/Sunset headers in API responses, log usage of deprecated endpoints.

## Verification

Sources: IETF Deprecation Header draft, RFC 8594 Sunset Header, OpenAPI deprecated flag, domain-analysis.md.
