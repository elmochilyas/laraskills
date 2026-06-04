# Skill: Retire API Versions

## Purpose
Decommission entire API versions through a staged process including consumer audit, multi-wave notification, traffic-light retirement stages, 410 response with migration links, rollback capability, and spec archival.

## When To Use
- API version reaching end-of-life after deprecation window expires
- Complete API surface replacement with breaking changes
- Legacy version with negligible remaining traffic
- Regulatory/compliance requirement to retire old data handling

## When NOT To Use
- Per-endpoint deprecation is sufficient
- Version still has active consumers who cannot migrate
- Security emergency requiring immediate endpoint removal

## Prerequisites
- Deprecation policy design
- Consumer registry with contact information
- Migration guide for target version

## Inputs
- Version identifier to retire
- Consumer audit report
- Migration guide content
- Cutoff date

## Workflow
1. Audit all consumers before freeze announcement — identify every active consumer and integration depth
2. Implement traffic-light retirement stages: Green (active) → Yellow (frozen, deprecation headers) → Red (410 Gone) → Black (404 Not Found)
3. Schedule multi-wave notifications: 6 months, 3 months, 30 days before cutoff via email + dashboard + changelog
4. Return 410 Gone with `Link` header pointing to migration guide — never bare 404
5. Maintain rollback capability via feature flag for 30 days post-cutoff
6. Archive OpenAPI spec and documentation to read-only storage before route removal
7. Grant consumer exceptions only with expiration dates — never indefinite extensions
8. Track migration progress via dashboard with daily reports throughout the migration window

## Validation Checklist
- [ ] Consumer audit completed before freeze announcement
- [ ] Traffic-light stages implemented (green/yellow/red/black)
- [ ] Multi-wave notifications sent (6mo, 3mo, 30d)
- [ ] 410 response with migration Link header
- [ ] Rollback feature flag active for 30 days post-cutoff
- [ ] Spec and docs archived before removal
- [ ] Exception allowlist entries have expiration dates
- [ ] Migration progress tracked via daily dashboard

## Common Failures
- Announcing retirement without complete migration guide
- Not tracking consumer migration progress during window
- Granting exceptions without expiration dates
- Retiring version with undocumented internal service dependencies
- Failing to archive spec before removal
- Hard cutoff without warning — consumers discover breakage at runtime

## Decision Points
- Notification frequency: 6/3/1 months vs 3/2/1 months
- Exception window: 30 days vs 90 days rollback capability
- Routing layer: gateway (nginx) vs application-level vs API gateway

## Performance Considerations
- Version routing at gateway adds minimal latency
- Migration report generation queries consumer registry — schedule daily
- Archived specs served from CDN reduces origin load

## Security Considerations
- Retired versions may have unpatched vulnerabilities — expedite removal
- Archived specs may expose old security schemes — review before making public
- Exception allowlist must be access-controlled and audited

## Related Rules
- Audit All Consumers Before Announcing Freeze
- Implement Traffic-Light Retirement Stages
- Return 410 Gone with Migration Link, Not Bare 404
- Maintain Rollback Capability for 30 Days Post-Cutoff
- Archive Spec and Docs Before Removal
- Grant Exceptions with Expiration Dates
- Stagger Migration Progress Tracking

## Related Skills
- Implement Breaking Change Process
- Deprecate API Versions
- Manage API Changelog

## Success Criteria
- All consumers are identified and notified before freeze
- Retirement stages progress through green/yellow/red/black
- Retired version returns 410 with actionable migration link
- Rollback available for 30 days post-cutoff
- Spec and docs archived for historical reference
- All consumers migrated or on expiring exceptions
- No indefinite exceptions granted
