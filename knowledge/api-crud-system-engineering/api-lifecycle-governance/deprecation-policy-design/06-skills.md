# Skill: Implement Deprecation Policy Design

## Purpose
Design and enforce API deprecation lifecycle with Warn-Sunset-Remove phases, documentation, timeline notification, consumer migration tracking, and sunset header implementation.

## When To Use
- Planning API version or endpoint removal
- Introducing new API versions
- Establishing API lifecycle governance

## When NOT To Use
- Internal refactoring without contract change
- New APIs before first deprecation cycle

## Prerequisites
- Versioning strategy selection
- Deprecation header implementation

## Inputs
- API version lifecycle timeline
- Consumer communication plan

## Workflow
1. Define deprecation phases: Warn (deprecation announced), Sunset (removal date set), Remove (endpoint removed)
2. Set minimum deprecation notice period: 6 months for public APIs, 3 months for internal
3. Announce deprecation via deprecation headers, changelog, email notification
4. Document migration path from deprecated to replacement endpoint/version
5. Track consumer migration via deprecation header frequency monitoring
6. Extend timeline if migration metrics show insufficient adoption
7. After removal date, return 410 Gone with `Link` to replacement
8. Remove deprecated code after sunset date — keep as reference in git history
9. Review deprecation process after each cycle for improvement
10. Never remove a version without confirmed zero traffic to deprecated endpoints

## Validation Checklist
- [ ] Deprecation phases defined (Warn, Sunset, Remove)
- [ ] Notice period set per consumer type
- [ ] Deprecation announced via headers, changelog, email
- [ ] Migration path documented for all consumers
- [ ] Consumer migration tracked via header monitoring
- [ ] Timeline extended if migration insufficient
- [ ] 410 Gone with replacement link after removal
- [ ] Deprecated code removed after sunset
- [ ] Post-deprecation review conducted
- [ ] Zero traffic confirmed before removal

## Common Failures
- No warning phase — endpoints removed without notice
- Insufficient notice period — consumers can't migrate in time
- No migration path — consumers stuck on deprecated version
- Not tracking migration — removal date set without knowing consumer status
- Removing with active traffic — breaking consumers who haven't migrated
- Deprecation announced but not communicated — headers alone insufficient
- Deprecated code not cleaned up — technical debt accumulates

## Decision Points
- Notice period — 6 months public, 3 months internal, longer for breaking changes
- Communication channels — headers for technical, email for administrative, blog for major
- Migration path quality — direct replacement vs upgrade guide

## Performance Considerations
- Deprecation monitoring of headers adds negligible overhead
- Multiple deprecated versions increase maintenance burden
- Code cleanup after removal reduces cognitive load and build times

## Security Considerations
- Deprecated versions may have known vulnerabilities — accelerate removal for security
- Never deprecate a version and leave it unpatched — maintain security fixes until removal
- Post-removal, 410 Gone prevents accidental access to removed endpoints
- Monitor for traffic to removed endpoints — indicates misconfigured consumers

## Related Rules
- Define Deprecation Phases (Warn, Sunset, Remove)
- Set Minimum Notice Period Per Consumer Type
- Document Migration Path
- Track Consumer Migration
- Confirm Zero Traffic Before Removal

## Related Skills
- Deprecation Header Implementation — for header-based signaling
- Versioning Strategy Selection — for version lifecycle
- API Version Governance — for multi-version management
- Consumer Communication Strategy — for notification design

## Success Criteria
- Deprecation lifecycle documented and followed for all version changes
- Consumers notified before removal via multiple channels
- Migration path available before deprecation announcement
- Zero-traffic confirmed before code removal
- Deprecation process reviewed and improved after each cycle
- Security patches applied to deprecated versions until removal
