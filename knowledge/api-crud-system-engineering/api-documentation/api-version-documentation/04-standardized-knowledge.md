# ECC Standardized Knowledge — API Version Documentation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | API Version Documentation |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

API version documentation presents all API versions with their status, release dates, changelogs, and differences. It helps consumers choose the right version, understand version-specific behavior, and plan migrations. Well-structured version documentation prevents consumers from building integrations against obsolete endpoints.

## Core Concepts

- **Version identification**: Each version needs version number, release date, status (active/deprecated/sunset), base URL, and changelog link.
- **Multi-version documentation**: Separate spec files per version, versioned paths in a single spec, or media-type-based versioning.
- **Version status**: Active (fully supported), Deprecated (functional, not recommended), Sunset (no longer available — 410 Gone).
- **Version-specific behavior**: Endpoints may differ across versions in request/response schemas, auth requirements, rate limits, and defaults.

## When To Use

- APIs with multiple active versions consumers can choose from
- APIs in deprecation lifecycle (some versions deprecated, others active)
- Migration periods between major versions
- Public APIs with external consumers on different versions

## When NOT To Use

- Single-version APIs (document only the current version)
- Internal APIs where all consumers upgrade simultaneously
- Pre-release APIs (version 0.x) where rapid iteration makes multi-version docs high-cost

## Best Practices

- **Separate spec files per version**: Clean separation, independent evolution. Use `openapi-v1.yaml`, `openapi-v2.yaml`.
- **Version status badges**: Green (active), yellow (deprecated with removal date), red (sunset).
- **Version comparison table**: Show feature differences across versions (auth, pagination, rate limits).
- **Default version promotion**: Clearly recommend the current version for new integrations.
- **Preserve sunset docs**: Keep read-only historical docs after removal. Remove interactive features.
- **Version discovery endpoint**: `GET /api/versions` listing all versions with status and docs URLs.

## Architecture Guidelines

- Organize specs per version in `docs/openapi-v1.yaml`, `docs/openapi-v2.yaml`.
- Each spec has its own `info.version` and `info.description` noting status.
- For URL versioning, server URL includes version prefix (`https://api.example.com/v2`).
- Generate per-version docs with environment-specific commands: `APP_ENV=docs-v1 php artisan scribe:generate`.
- Redirect unversioned docs to the latest stable version.

## Performance Considerations

- Multiple spec files increase build time proportionally. No runtime impact.
- Spec file size grows with each version archived. Consider storing old specs in separate storage.

## Security Considerations

- Sunset version docs should remove interactive "try it out" features to prevent accidental usage.
- Version history may expose past security vulnerabilities. Review before publishing historical docs.
- Authentication requirements may differ across versions — document each version's auth.

## Common Mistakes

- **No version history**: Only current version documented — consumers on older versions lack reference material.
- **Unclear default version**: New consumers cannot determine which version to use. Always recommend default.
- **Removing old docs immediately**: Consumers on legacy integrations lose migration reference.
- **Incomplete version-specific notes**: Cross-version differences undocumented — consumers discover breaks at runtime.

## Anti-Patterns

- **All versions presented equally**: New consumers pick wrong version. Visually distinguish active vs deprecated.
- **Version documentation without migration path**: Each deprecated version must link to the upgrade guide.

## Examples

- Version discovery response: `{"versions": [{"version": "2.0", "status": "active", "docs": "https://docs.example.com/v2"}, {"version": "1.0", "status": "deprecated", "docs": "https://docs.example.com/v1"}]}`.

## Related Topics

- **Prerequisites**: API Versioning Strategy, Semantic Versioning for APIs
- **Closely Related**: Changelog Generation, Deprecation Notes in Docs, API Versioning subdomain
- **Advanced**: Multi-version doc generation in CI, version lifecycle automation

## AI Agent Notes

When generating version documentation: maintain separate spec files per version, use status badges, include version comparison tables, preserve sunset docs as read-only, provide version discovery endpoint, recommend default version.

## Verification

Sources: Stripe API versioning docs, GitHub API versions docs, OpenAPI spec structure, domain-analysis.md.
