# Skill: Implement Media Type Versioning

## Purpose
Encode API version in the response media type (e.g., `application/vnd.myapp.v1+json`) using HTTP content negotiation — the client requests a vendor MIME type via Accept header and the server responds with the correct versioned representation.

## When To Use
- APIs supporting multiple serialization formats per version
- REST-pure APIs following strict HTTP semantics
- Public APIs where clients explicitly negotiate representation
- APIs with IANA-registered vendor media types

## When NOT To Use
- Simple APIs with a single format (JSON-only)
- Browser-consumed APIs (poor browser debugging support)
- APIs where client header complexity is a concern
- Internal microservices with simple versioning needs

## Prerequisites
- HTTP content negotiation understanding
- Response serialization patterns

## Inputs
- Media type registry mapping MIME types to transformers
- Accept header handling middleware

## Workflow
1. Define standard vendor MIME type format — `application/vnd.{vendor}.v{major}+{format}`
2. Create media type registry — config mapping MIME types to transformers/version
3. Implement content negotiation middleware — parse Accept header, match media type
4. Use Accept header (not Content-Type) for version negotiation
5. Return 406 Not Acceptable for unsupported media types
6. Cache the transformer registry to avoid per-request reflection
7. Echo negotiated media type in response Content-Type header
8. Handle `*/*` wildcard Accept header gracefully — default to latest version
9. Log and monitor 406 response rates as migration signal

## Validation Checklist
- [ ] Standard vendor MIME type format used
- [ ] Content negotiation middleware implemented
- [ ] Unsupported media types return 406
- [ ] Response Content-Type echoes negotiated media type
- [ ] Transformer registry is cached
- [ ] `*/*` wildcard handled gracefully
- [ ] 406 rates logged and monitored

## Common Failures
- Using Content-Type instead of Accept for version negotiation
- Inconsistent media type format strings across endpoints
- Not handling `*/*` wildcard — browsers and curl break
- Not caching transformer registry — per-request reflection overhead

## Decision Points
- Media-type vs URL-path versioning — media-type for format flexibility, URL for simplicity
- IANA registration vs private types — IANA for public, private for internal
- Single format vs multi-format — `+json`, `+xml` for multi-format support

## Performance Considerations
- Content negotiation adds ~0.1ms for header parsing and transformer resolution
- CDN cache fragmentation: `Vary: Accept` with multiple types creates many cache partitions
- Transformer factory caching resolves once, cached for worker lifetime

## Security Considerations
- Ensure media type parsing doesn't introduce Accept header injection
- Validate deprecated media types don't expose unpatched vulnerabilities
- Wildcard `*/*` should default safely, not expose internal version info

## Related Rules
- Use Standard Vendor MIME Type Format
- Use Accept Header For Version Negotiation
- Return 406 For Unsupported Media Types
- Cache The Transformer Registry
- Echo Negotiated Media Type In Response

## Related Skills
- Content Negotiation — HTTP Accept header handling
- URL Path Versioning — alternative versioning strategy
- Header Based Versioning — alternative via custom header

## Success Criteria
- Clients can request specific versions via Accept header
- Unsupported media types return 406 with supported types list
- Response Content-Type confirms negotiated version
- CDN `Vary: Accept` configured correctly
- 406 rates monitored as consumer migration signal