# Skill: Implement Deprecation Link Headers

## Purpose
Attach `Link` headers with standard relation types (`deprecation`, `alternate`, `sunset`) to deprecated API responses, pointing consumers to migration guides and alternative versions.

## When To Use
- On every deprecated API response alongside the Deprecation header
- When deprecation information should be actionable (not just a warning)
- Alongside Sunset headers to point to migration guides

## When NOT To Use
- For non-deprecated endpoints
- When migration documentation doesn't exist yet
- When link targets are unstable or temporary

## Prerequisites
- Deprecation middleware in place
- Migration guide documentation prepared

## Inputs
- Migration guide URLs per version
- Alternative version endpoint URLs

## Workflow
1. Include `Link` header with `rel="deprecation"` on every deprecated response — points to migration guide
2. Include `Link` header with `rel="alternate"` — points to new version endpoint
3. Use absolute URLs in link headers — never relative paths
4. Send multiple links as separate headers — not comma-separated
5. Use standard IANA-registered relation types only — `deprecation`, `sunset`, `alternate`, `latest-version`
6. Include deprecation links in 410 error responses for removed endpoints
7. Schedule periodic health checks for all deprecation link targets
8. Combine with deprecation middleware — inject alongside deprecation/sunset headers

## Validation Checklist
- [ ] `Link` header with `rel="deprecation"` present on deprecated responses
- [ ] `Link` header with `rel="alternate"` pointing to new version
- [ ] Absolute URLs used in all link headers
- [ ] Links sent as separate headers, not comma-separated
- [ ] Link targets return 200 with migration guidance
- [ ] Link health check runs on schedule
- [ ] Links included in error responses for deprecated endpoints

## Common Failures
- Using `rel="deprecated"` instead of `rel="deprecation"` (non-standard)
- Pointing links to pages that don't exist yet
- Using relative URLs — consumers resolve against wrong domain
- Not updating link URLs when documentation moves

## Decision Points
- Deprecation vs alternate link — deprecation points to migration guide, alternate to new endpoint
- Single URL per version vs per-endpoint — version level simpler, endpoint level more precise
- Analytics redirect vs direct — analytics for measurement, direct for simplicity

## Performance Considerations
- Link headers add ~50-200 bytes per deprecated response — negligible
- Parse overhead is zero (header injection at framework level)
- Link health checks run offline — no production cost

## Security Considerations
- Ensure link targets don't point to external/untrusted domains without validation
- Analytics redirects should not leak API keys in redirect URL
- Migration guide URLs must be served over HTTPS

## Related Rules
- Always Include `rel="deprecation"` Link On Deprecated Endpoints
- Use Absolute URLs In Link Headers
- Include Both Deprecation And Alternate Links
- Test Link Target Health Periodically
- Use Standard Relation Types Only
- Include Links In Error Responses For Deprecated Endpoints

## Related Skills
- Deprecation Header Implementation — paired deprecation header
- Sunset Header Implementation — removal date header
- Phased Deprecation Timeline — full deprecation lifecycle

## Success Criteria
- All deprecated responses include actionable Link headers
- Consumers can follow links to find migration guidance
- Link targets are tested and return 200
- No non-standard relation types used
- 410 responses include migration links for stranded consumers