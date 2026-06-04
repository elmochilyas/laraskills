# API Version Documentation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** API Version Documentation
- **Last Updated:** 2026-06-02

---

## Executive Summary

API version documentation covers how different API versions are presented in documentation — which versions exist, what changed between them, when each version was released, and when each version will be retired. Version documentation helps consumers choose the right API version, understand version-specific behavior, and plan migrations.

In OpenAPI, different versions can be documented as separate spec files (openapi-v1.yaml, openapi-v2.yaml), as versioned paths within a single spec, or via media type versioning. The documentation must clearly communicate which version a consumer is viewing, how to switch versions, and what the differences are between versions.

---

## Core Concepts

### Version Identification
Each API version needs:
- **Version number** — Semantic or date-based (v1, v2, 2026-01-01)
- **Release date** — When the version became available
- **Status** — Active, deprecated, sunset
- **Base URL** — The URL prefix for the version (/api/v1/, /api/v2/)
- **Changelog link** — Link to what changed in this version

### Multi-Version Documentation
Ways to document multiple versions:

1. **Separate spec files per version** — Clean separation, independent evolution
2. **Single spec with versioned paths** — All versions in one file, easier comparison
3. **Media type versioning** — Same paths, different Content-Type headers

### Version Status Documentation
Each version should display its current status prominently:
- **Active** — Fully supported, accepting new consumers
- **Deprecated** — Still functional but no longer recommended
- **Sunset** — No longer available; requests return 410 Gone

### Version-Specific Behavior
Document endpoints that behave differently across versions:
- Different request/response schemas
- Different authentication requirements
- Different rate limits
- Different default values

---

## Mental Models

### Version as Product Release
Each API version is a product release with its own documentation, support lifecycle, and migration path. Think of version documentation as release notes + user manual combined.

### Version Selector as Navigation
The version selector in documentation UI is the primary navigation tool for consumers. It should be prominent, show version status (active/deprecated), and indicate the current default version.

### Documentation Per Version
Each version has its own complete documentation set. Consumers on v1 should not need to consult v2 documentation. Maintain independent docs per version, even if most content is shared.

---

## Internal Mechanics

### Separate Spec Files
Organize specs per version:
```
docs/
  openapi-v1.yaml
  openapi-v2.yaml
  openapi-latest.yaml  (symlink or copy of current version)
```

Each spec has its own info section with version-specific metadata:
```yaml
info:
  title: My API
  version: 2.0.0
  description: API v2 - Current version. API v1 is deprecated.
```

### Versioned URL Paths
When using URL path versioning, the spec paths include the version prefix:
```yaml
servers:
  - url: https://api.example.com/v2
paths:
  /users:
    get:
      summary: List users (v2)
```

### Documentation UI Versioning
Documentation tools (Swagger UI, ReDoc, Stoplight) support multi-version docs:
- Swagger UI: Multiple spec URLs via configuration
- ReDoc: Version dropdown via Redocly configuration
- Stoplight: Built-in version management

### Version-Specific Content Generation
When generating docs with Scramble or Scribe, generate per-version outputs:
```bash
# For v1
APP_ENV=docs-v1 php artisan scribe:generate --output-path=public/docs/v1

# For v2
APP_ENV=docs-v2 php artisan scribe:generate --output-path=public/docs/v2
```

---

## Patterns

### Version Status Badge
Display status badges in documentation navigation:
- Active: Green badge
- Deprecated: Yellow badge with removal date
- Sunset: Red badge with "No longer available"

### Version Comparison Table
Provide a table comparing features across versions:

| Feature | v1 | v2 |
|---|---|---|
| Authentication | API Key | Bearer Token |
| Pagination | Page-based | Cursor-based |
| Rate Limit | 100 req/min | 1000 req/min |

### Default Version Promotion
Clearly indicate which version is the default for new integrations:
```
> **Recommended:** Use API v2 for new integrations.
> API v1 will be sunset on 2027-01-01. [Migration guide](/docs/migration-v1-to-v2)
```

### Version-Specific Endpoint Notes
In endpoint documentation, note version-specific behavior:
```
> **v1:** This endpoint returns all fields.
> **v2:** This endpoint returns paginated results. Use `?page=` parameter.
```

---

## Architectural Decisions

### Separate vs Combined Spec Files
Separate files are cleaner but require maintaining multiple specs. Combined files simplify comparison but become very large. Decision: Separate files for long-lived versions (>6 months); combined files for rapid iteration (pre-1.0).

### Version in URL vs Header
URL-based versioning is more visible in documentation (the path changes). Header-based versioning requires the consumer to remember the header. Decision: Use URL versioning for documentation clarity.

### Documentation for Sunset Versions
Keep sunset version documentation available (read-only) for historical reference. Mark clearly as "No longer available" and remove interactive features (auth, try-it-out).

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Separate specs per version are independent | Maintenance overhead per version | Automate spec generation per version |
| Version selector improves navigation | Requires documentation UI customization | Use tools with built-in versioning |
| Version comparison helps migration | Comparison tables must be maintained | Auto-generate from spec diff |
| Sunset docs as historical reference | Keeping old docs consumes space | Archive to separate storage |

---

## Performance Considerations

### N/A
Version documentation structure has no runtime performance impact. Multiple spec files increase build time proportionally.

---

## Production Considerations

### Version Documentation Deployment
Deploy version docs alongside the corresponding API version. When a version is sunset, its documentation should remain available but marked as historical.

### Version Discovery Endpoint
Consider a `GET /api/versions` endpoint that lists all available versions, their statuses, and their documentation URLs:
```json
{
  "versions": [
    { "version": "2.0", "status": "active", "docs": "https://docs.example.com/v2" },
    { "version": "1.0", "status": "deprecated", "docs": "https://docs.example.com/v1" }
  ]
}
```

### Documentation Redirects
When a consumer accesses unversioned docs, redirect to the latest stable version. When accessing a deprecated version, show a banner linking to the migration guide.

---

## Common Mistakes

### No Version History in Docs
Why it happens: Only the current version is documented. Why it's harmful: Consumers on older versions cannot find their documentation. Better approach: Maintain documentation for all supported versions.

### Unclear Default Version
Why it happens: All versions are presented equally. Why it's harmful: New consumers pick the wrong version. Better approach: Clearly recommend the default/current version.

### Incomplete Version-Specific Notes
Why it happens: Versions are documented independently without cross-references. Why it's harmful: Consumers upgrading miss behavior differences. Better approach: Include version comparison notes in endpoint docs.

### Removing Old Version Docs Immediately
Why it happens: Old documentation is deleted when a version is sunset. Why it's harmful: Consumers on legacy integrations lose reference material. Better approach: Archive old docs with clear sunset markers.

---

## Failure Modes

### Broken Version Links
Documentation links to a version that no longer exists. Failure mode: 404 errors in documentation navigation. Mitigation: Redirect old version URLs to a version history page.

### Incorrect Version Status
Documentation shows a version as active when it has been sunset. Failure mode: Consumers attempt to use a sunset version. Mitigation: Automate version status updates from the version lifecycle configuration.

### Cross-Version Documentation Confusion
Consumers view documentation for the wrong version. Failure mode: Integration uses v1 schemas against v2 endpoints. Mitigation: Show the version prominently in every page header.

---

## Ecosystem Usage

### Stripe API Versioning
Stripe documents each API version with release dates, changelogs, and upgrade guides. The documentation includes a version selector in the sidebar showing the date-based version and status.

### GitHub API Versioning
GitHub maintains separate documentation for v3 and v4 (GraphQL). Each version has its own documentation section, API reference, and changelog.

### Twilio API Versioning
Twilio documents versions with clear base URLs, version-specific reference docs, and migration guides between versions.

---

## Related Knowledge Units

### Prerequisites
- API Versioning Strategy — How versioning is implemented (URL, header, media type)
- Semantic Versioning for APIs — Version number semantics

### Related Topics
- Changelog Generation — Per-version change documentation
- Deprecation Notes in Docs — Marking deprecated versions in documentation
- API Versioning (subdomain) — All versioning-related KUs

### Advanced Follow-up Topics
- Multi-Version Doc Generation — CI pipeline for building per-version documentation
- Version Migration Guides — Comprehensive migration documentation
- Version Lifecycle Automation — Automating version status updates in docs

---

## Research Notes

### Source Analysis
- Stripe API Versioning: https://stripe.com/docs/api/versioning — Reference for version documentation patterns
- GitHub API Versions: https://docs.github.com/en/rest/overview/api-versions — Multi-version documentation

### Key Insight
Version documentation is most useful when it provides clear upgrade paths. Each version's documentation should answer: "What is different from the previous version?" and "How do I migrate?"

### Version-Specific Notes
- OpenAPI 3.x: Supports multiple version documents; no native multi-version spec merging
- Swagger UI: Configuration can load multiple spec URLs for version dropdown
- Redocly: Supports version selector via configuration
