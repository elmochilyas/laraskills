# Skill: Document API Versions

## Purpose
Create and maintain multi-version API documentation with separate spec files per version, version discovery endpoints, status badges, and version comparison tables.

## When To Use
- APIs with multiple active versions
- APIs in deprecation lifecycle with active/deprecated/sunset versions
- Public APIs with external consumers on different versions
- Migration periods between major versions

## When NOT To Use
- Single-version APIs
- Internal APIs with simultaneous consumer upgrades
- Pre-release (0.x) APIs with rapid iteration

## Prerequisites
- OpenAPI spec generation
- API versioning strategy
- Semantic versioning for APIs

## Inputs
- List of supported API versions with statuses
- OpenAPI spec per version
- Changelog per version

## Workflow
1. Create separate OpenAPI spec file per version (`docs/openapi-v1.yaml`, `docs/openapi-v2.yaml`)
2. Set `info.version` and `info.description` with status in each spec
3. Implement `GET /api/versions` endpoint returning all versions with status and docs URLs
4. Add version status badges: green (active), yellow (deprecated), red (sunset)
5. Create version comparison table showing auth, pagination, rate limits, defaults across versions
6. Redirect unversioned docs root to latest stable version
7. Document auth requirements per version in each spec's security schemes
8. Preserve sunset version docs as read-only historical reference; remove interactive features
9. Validate docs in CI: each spec must pass lint, each version status must be accurate

## Validation Checklist
- [ ] Separate OpenAPI spec file per version
- [ ] Version discovery endpoint returning all versions
- [ ] Status badges with visual distinction (green/yellow/red)
- [ ] Version comparison table published
- [ ] Root docs URL redirects to latest stable version
- [ ] Auth requirements documented per version
- [ ] Sunset version docs preserved (read-only, no interactive features)
- [ ] CI validates all version specs on PR

## Common Failures
- No version history — only current version documented
- All versions presented equally — consumers choose deprecated versions
- Removing old docs immediately — consumers lose migration reference
- Incomplete version-specific notes — consumers discover breaks at runtime
- No default version recommendation — new consumers pick wrong version

## Decision Points
- Spec organization: separate files vs versioned paths in single spec
- Version status model: active/deprecated/sunset vs more granular states
- Discovery endpoint response format: inline vs using OpenAPI extensions

## Performance Considerations
- Multiple spec files increase build time proportionally
- Archived specs add storage cost; store older specs in separate storage
- No runtime performance impact

## Security Considerations
- Remove interactive "try it out" from sunset docs to prevent accidental usage
- Review version history for past security vulnerabilities before publishing
- Auth requirements may differ across versions — document each version's auth scheme

## Related Rules
- Separate Spec Files Per Version
- Always Expose A Version Discovery Endpoint
- Visually Distinguish Active From Deprecated Versions
- Never Remove Sunset Version Docs
- Publish A Version Comparison Table
- Redirect Unversioned Docs To Latest Stable Version
- Document Auth Requirements Per Version

## Related Skills
- Implement Changelog Generation
- Document Deprecation Notes
- Design Versioning Strategy

## Success Criteria
- Each API version has its own separate spec file
- Consumers can discover all versions via GET /api/versions
- Active vs deprecated versions are visually distinct in docs
- Sunset docs remain accessible as read-only reference
- Version comparison enables informed consumer migration decisions
- New consumers default to the latest stable version
