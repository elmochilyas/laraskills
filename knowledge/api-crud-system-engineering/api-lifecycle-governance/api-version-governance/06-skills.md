# Skill: Implement API Version Governance

## Purpose
Establish API version governance policies: which versions are active, deprecated, or sunset, migration tracking per version, breaking vs non-breaking change policy, and minimum supported version.

## When To Use
- Multi-version API management
- API platform governance
- Breaking change planning

## When NOT To Use
- Single-version APIs
- Prototype/early-stage APIs

## Prerequisites
- Versioning strategy selection
- Deprecation policy design

## Inputs
- Active version list
- Breaking change policy
- Support timeline

## Workflow
1. Define nomenclature: Active (fully supported), Deprecated (still works, migration recommended), Sunset (removal date set), Removed (no longer available)
2. Set minimum supported version — typically N-2 (current and two previous)
3. Define breaking changes — API contract changes requiring version bump
4. Define non-breaking changes — additive only, no contract breaks
5. Track version usage metrics — requests per day per version
6. Enforce Major.Minor in version labels — not Patch (API versions are Major only)
7. Deprecate versions when usage drops below threshold or new version released
8. Sunset with fixed date communicated to all consumers
9. Run governance reviews quarterly — review version usage, plan deprecations
10. Document all governance decisions in API changelog

## Validation Checklist
- [ ] Version nomenclature defined (Active, Deprecated, Sunset, Removed)
- [ ] Minimum supported version policy set
- [ ] Breaking vs non-breaking change policy documented
- [ ] Version usage metrics tracked
- [ ] Major.Minor versioning enforced (no Patch)
- [ ] Deprecation triggered by usage threshold or new version
- [ ] Sunset dates communicated to consumers
- [ ] Governance reviews scheduled quarterly
- [ ] Changelog documents governance decisions
- [ ] Migration path documented for deprecated versions

## Common Failures
- No sunset date — deprecated versions exist indefinitely
- Too many supported versions — N-5, maintenance burden grows
- Breaking change in non-major version — violates semver, breaks clients
- No usage metrics — don't know which versions consumers use
- Governance not documented — stakeholders don't know version lifecycle
- Deprecation without migration path — consumers can't upgrade
- Quarterly review missed — versions accumulate unnoticed

## Decision Points
- N-2 vs N-1 support — N-2 for public APIs, N-1 for internal
- Breaking change threshold — any contract change vs only backward-incompatible
- Governance review cadence — quarterly for multi-version, bi-annual for stable

## Performance Considerations
- Each supported version adds maintenance overhead
- Multiple versions may share same underlying code (implementation reuse)
- Version usage metrics should be sampled, not counted per-request
- Removing a version improves deploy times and codebase complexity

## Security Considerations
- Deprecated versions must receive security patches until sunset
- Active versions must have latest security patches within SLA
- Old versions with known vulnerabilities accelerate deprecation timeline
- Security team must be notified of all version status changes
- Minimum supported version must be free of known critical vulnerabilities

## Related Rules
- Define Version Nomenclature (Active, Deprecated, Sunset, Removed)
- Set Minimum Supported Version Policy
- Enforce Major-Only Versioning For APIs
- Track Version Usage Metrics
- Review Governance Quarterly
- Communicate Sunset Dates To All Consumers

## Related Skills
- Versioning Strategy Selection — for versioning approach
- Deprecation Policy Design — for deprecation lifecycle
- Deprecation Header Implementation — for signaling deprecation
- API Changelog Maintenance — for changelog documentation

## Success Criteria
- Version governance policy documented and followed
- Known number of active, deprecated, and sunset versions at any time
- Minimum supported version maintained
- Breaking changes only in major version bumps
- Deprecated versions have sunset dates set at deprecation time
- Version usage metrics drive deprecation decisions
- Security patches applied to all supported versions within SLA
