# Skill: Implement Query String Versioning

## Purpose
Route requests to versioned logic via query parameter (e.g. `?version=2`) using middleware, with validation, default version fallback, and monitoring.

## When To Use
- Internal APIs where URL cleanliness is not a priority
- Simple consumer implementations
- Development/testing environments for quick version switching
- Feature flag trials per version

## When NOT To Use
- Public APIs — version parameter can be accidentally omitted, URLs are less clean
- Cache-heavy APIs — query parameters fragment cache space
- Hypermedia APIs — version should be in media type or URL

## Prerequisites
- Query parameter parsing understanding
- Middleware implementation

## Inputs
- Version parameter name and format specification

## Workflow
1. Create `QueryStringVersionMiddleware` that reads version from query parameter (`?version=2`)
2. Validate parameter format — accept major version only (`2`, not `2.1`)
3. Default to latest version when parameter is missing — never return 400 for missing version
4. Return 400 Bad Request for invalid version format: `?version=abc`
5. Attach resolved version to request attributes: `$request->attributes->set('api_version', 2)`
6. Use version in controllers for version-specific dispatch
7. Return `X-Api-Version` response header showing the version actually used — prevents consumer confusion
8. Log all explicit version requests for deprecation and usage analytics
9. Test with and without version parameter, with valid and invalid values

## Validation Checklist
- [ ] Middleware reads version from query parameter
- [ ] Default version used when parameter missing
- [ ] 400 Bad Request for invalid format
- [ ] Version attached to request attributes
- [ ] X-Api-Version response header present
- [ ] Explicit version requests logged for analytics
- [ ] Tests cover missing, valid, and invalid versions

## Common Failures
- No default version when parameter missing — all unversioned requests fail
- Accepting minor version (`2.0`, `2.1`) — increases surface area for breakage
- No response header — clients don't know which version they received
- URL rewriting strips version parameter — proxies, CDNs, load balancers may remove it
- Cache fragmentation from unique query strings

## Decision Points
- Default version — latest vs stable vs configurable per endpoint
- Parameter name — `version`, `v`, `api-version`, `api_version`
- Validation strictness — only major version, or support major.minor for developers

## Performance Considerations
- Query string versioning fragments caches — every unique query is a different cache entry
- CDN caching of versioned resources requires careful query key configuration
- Consider `X-Api-Version` header logging for monitoring without URL param impacts

## Security Considerations
- Validate that version parameter is an integer within supported range
- Never accept version values like `999` or negative numbers
- Prevent injection through query parameter — cast to integer before use

## Related Rules
- Default to Latest When Query Parameter Is Missing
- Validate Query Parameter Format Strictly
- Return 400 for Unrecognized Version Format
- Return X-Api-Version Header With the Actual Version Used
- Log Explicit Version Requests For Analytics
- Reject Non-Numeric Version Parameters

## Related Skills
- URL Path Versioning — for comparison
- Media Type Version Negotiation — for Accept header approach
- Versioning Strategy Selection — for choosing approach

## Success Criteria
- Version switching requires only changing query parameter
- Unversioned requests resolve to default version without error
- Response includes `X-Api-Version` header for client awareness
- All queries work with and without version parameter
- Cache strategy accounts for query string variation
