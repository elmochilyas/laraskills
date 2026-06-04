# Skill: Implement Header-Based Versioning

## Purpose
Route API requests based on custom header (e.g. `X-API-Version: 2`) via middleware, with validation, default version fallback, and response header echo.

## When To Use
- Same URL for all versions (URL stability)
- APIs where headers are under client control
- Versioning as cross-cutting concern

## When NOT To Use
- Public APIs with simple consumers
- Cache-heavy APIs — header variation splits cache
- Mobile apps where header manipulation is limited

## Prerequisites
- Middleware implementation
- Version routing map

## Inputs
- Header name and format
- Version routing configuration

## Workflow
1. Choose header name: `X-API-Version` or `Accept-Version` — consistent across all requests
2. Create `HeaderVersionMiddleware` reading version from header
3. Validate header format — major version integer only
4. Default to latest version when header missing
5. Return 400 for invalid version format
6. Attach resolved version to request attributes: `$request->attributes->set('api_version', 2)`
7. Echo version header in response: `X-API-Version: 2`
8. Include `Vary: X-API-Version` for cache correctness
9. Log header version usage for analytics
10. Test with and without header, valid and invalid values

## Validation Checklist
- [ ] Header name chosen and documented
- [ ] Middleware reads version from header
- [ ] Validates format — major version integer
- [ ] Default version when header missing
- [ ] 400 for invalid format
- [ ] Version attached to request attributes
- [ ] Version header echoed in response
- [ ] `Vary` header set for cache coherence
- [ ] Header version usage logged
- [ ] Tests cover missing, valid, invalid header values

## Common Failures
- Header name collision — `X-API-Version` conflicts with proxy/CDN headers
- No `Vary` header — cache serves wrong version
- Header not validated — `X-API-Version: abc` passes through
- No default version — missing header breaks request
- Version not echoed — client unsure which version was used

## Decision Points
- Header name — `X-API-Version` vs `Accept-Version` vs custom
- Default version behavior — latest vs stable vs configurable
- Validation strictness — only major version or support semver

## Performance Considerations
- Header parsing is O(1) — negligible
- `Vary: X-API-Version` splits cache — each version is separate cache entry
- Cache hit rate decreases as version count increases

## Security Considerations
- Header is client-controlled — validate strictly
- Never trust version from unvalidated header for auth decisions
- Prevent injection through version header value

## Related Skills
- URL Path Versioning
- Media Type Version Negotiation
- Query String Versioning

## Success Criteria
- Version negotiated via header, same URL for all versions
- Header validated and defaulted
- Response echoes version used
- Cache properly varies by version header
