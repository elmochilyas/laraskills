# Skill: Implement Media Type Version Negotiation

## Purpose
Route requests to versioned logic based on `Accept` header media type (e.g. `application/vnd.api+json; version=2`) via dedicated middleware, without changing URL paths.

## When To Use
- Hypermedia APIs where URL stability is paramount
- APIs requiring per-representation versioning (same URL, different `Accept`)
- Mobile apps where deep-linking to URLs should never break

## When NOT To Use
- Simple public APIs with few consumers
- Teams new to HTTP content negotiation
- Environments where clients cannot control Accept headers (webhooks)

## Prerequisites
- Content negotiation understanding
- Middleware implementation

## Inputs
- Version routing map (media type → version handler)
- Versioned logic per resource

## Workflow
1. Create `VersionNegotiationMiddleware` that parses Accept header per RFC 2295
2. Define supported media type patterns: `application/vnd.api+json` with optional `version=2` parameter
3. Match client `Accept` header against supported patterns — exact match preferred, wildcard fallback
4. Resolve to internal version handler via configuration map
5. Attach resolved version to request attributes: `$request->attributes->set('api_version', 2)`
6. Use version in controllers for version-specific logic
7. Respond with `Content-Type: application/vnd.api+json; version=2` matching the client's negotiated version
8. Fall back to latest version when client sends generic `application/json` or `*/*`
9. Return 406 Not Acceptable for unsupported media types with `available` link
10. Test with explicit Accept headers covering all supported versions

## Validation Checklist
- [ ] Middleware parses Accept header per RFC 2295
- [ ] Version resolved from Accept parameter, not URL
- [ ] Version attached to request attributes
- [ ] Response Content-Type matches negotiated version
- [ ] Wildcard fallback resolves to latest stable version
- [ ] 406 Not Acceptable returned for unsupported media types
- [ ] 406 response includes `available` link header
- [ ] Tests cover Accept strings for all supported versions
- [ ] Tests cover 406 case for unsupported Accept

## Common Failures
- Parsing Accept header inconsistently — some clients send version, others don't
- Version fallback ambiguity — which version serves generic `application/json`?
- No 406 response — falling back silently to latest version when version is unsupported
- Response Content-Type mismatch — returning different version than client negotiated
- Missing `Vary: Accept` header — caching layer serves wrong version

## Decision Points
- Version in Accept parameter vs custom media type — `version=2` parameter is simpler, custom types per version are more explicit
- Fallback version — latest stable vs lowest common denominator
- Caching strategy — `Vary: Accept` with cache tags per version

## Performance Considerations
- Content-type header parsing is O(1) with small regex
- `Vary: Accept` splits cache per version — cache freshness reduces as versions increase
- Middleware overhead is negligible (~0.02ms)

## Security Considerations
- Validate Accept header to prevent injection in media type parsing
- Never accept `application/vnd.api+json; version=-1` or out-of-range versions
- Version parameter whitelist prevents version enumeration attacks

## Related Rules
- Use Middleware for Version Negotiation
- Include Vary: Accept In Responses
- Fall Back to Latest for Generic Accept
- Return 406 for Unsupported Media Types
- Respond With Negotiated Version In Content-Type
- Attach Resolved Version to Request Attributes

## Related Skills
- URL Path Versioning — for comparison
- Accept Header Routing Design — for routing design
- Content Negotiation Middleware — for middleware patterns

## Success Criteria
- Same URL returns different response versions based on Accept header
- Clients can negotiate version without changing URLs
- Generic Accept headers resolve to latest stable version
- Unsupported media types receive 406 with helpful link
- Caching respects `Vary: Accept` and serves correct version
