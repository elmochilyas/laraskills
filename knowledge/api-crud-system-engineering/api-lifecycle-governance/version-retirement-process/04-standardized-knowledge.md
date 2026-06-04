# ECC Standardized Knowledge — Version Retirement Process

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Version Retirement Process |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Version retirement is the operational process of decommissioning an entire API version after it reaches end-of-life. Unlike per-endpoint deprecation, version retirement removes a complete surface area and requires coordinated migration of all consumers. The process includes freeze, migration window, cutoff, and archival phases with multi-wave consumer notification and gateway-level enforcement.

## Core Concepts

- **Version freeze**: Point at which no new features are added; only critical security patches applied.
- **Migration window**: Period between freeze announcement and forced cutoff for consumer migration.
- **Sunset date**: Official date after which version is no longer served.
- **Migration report**: Dashboard showing which consumers have migrated and which remain.
- **Cutoff enforcement**: Gateway-level blocking returning 410 Gone with Link header to migration guide.
- **Archive**: Retired version's specification and docs moved to read-only storage.

## When To Use

- API version reaching end-of-life after deprecation window expires
- Complete API surface replacement with breaking changes
- Legacy version with negligible remaining traffic
- Regulatory/compliance requirement to retire old data handling

## When NOT To Use

- Per-endpoint deprecation is sufficient (use Deprecation Policy Design)
- Version still has active consumers who cannot migrate
- Security emergency requiring immediate endpoint removal (bypass standard retirement)

## Best Practices

- **Multi-wave notification**: 6 months, 3 months, 30 days before cutoff — email + dashboard + changelog.
- **Traffic-light retirement stages**: Green (active) -> Yellow (frozen, deprecation headers) -> Red (410 Gone) -> Black (404 Not Found).
- **Consumer audit before freeze**: Identify all active consumers before announcing retirement.
- **Soft cutoff with actionable response**: Return 410 with Link header to migration guide, not bare 404.
- **Maintain rollback capability**: Feature flag to restore retired version for up to 30 days post-cutoff.
- **Archive the spec and docs**: Store OpenAPI spec in S3 and docs as static site before removal.

## Architecture Guidelines

- Version routing at gateway level (nginx/OpenAPI), not application layer.
- Gateway returns 410 with `Link` header; after grace period, returns 404.
- Consumer registry with contact info is prerequisite for notification.
- Exception mechanism: allowlist with expiration dates to prevent indefinite extensions.
- Archive specs served from CDN with long cache headers.

## Performance Considerations

- Version routing at gateway adds minimal latency (single map lookup).
- Migration report generation queries consumer registry and request logs — schedule daily, not real-time.
- Archived specs served from CDN with long cache headers reduces origin load.

## Security Considerations

- Retired versions may have unpatched vulnerabilities. Expedite removal.
- Archived specs may expose old security schemes. Review before making archive public.
- Consumer exception allowlist must be access-controlled and audited.

## Common Mistakes

- Announcing retirement without complete migration guide.
- Not tracking consumer migration progress during the window.
- Granting exceptions without expiration dates (permanent exceptions defeat retirement).
- Retiring a version with undocumented internal service dependencies.
- Failing to archive the spec before removal.

## Anti-Patterns

- **Hard cutoff without warning**: No notification waves; consumers discover breakage at runtime.
- **Perpetual freeze**: Version frozen indefinitely without scheduled sunset — accumulated tech debt.
- **No exception mechanism**: Critical consumer breaks with no recourse; escalations handled ad-hoc.

## Examples

- Notification wave schedule: T-6 months (announcement), T-3 months (reminder + migration guide), T-30 days (escalation to named contacts).
- Soft cutoff response: `HTTP 410 Gone` with `Link: <https://docs.example.com/v1-to-v2-migration>; rel="migration"`.

## Related Topics

- **Prerequisites**: Deprecation Policy Design, API Changelog Maintenance
- **Closely Related**: Breaking Change Process, API Audit Review Process
- **Advanced**: Consumer migration analytics dashboard, Automated dependency mapping across microservices, Multi-version coexistence strategies

## AI Agent Notes

When retiring API versions: audit consumers before freeze, use multi-wave notification (6mo/3mo/30d), implement traffic-light stages (green/yellow/red/black), return 410 with migration guide link, maintain rollback feature flag for 30 days, archive spec and docs before removal.

## Verification

Sources: Twilio version retirement practices, Google Cloud API sunset page, domain-analysis.md.
