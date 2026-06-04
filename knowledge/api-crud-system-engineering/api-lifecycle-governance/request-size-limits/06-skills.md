# Skill: Enforce Request Size Limits

## Purpose
Configure multi-layer request size limits at nginx, PHP, and Laravel with tiered per-consumer limits, endpoint-specific overrides for uploads, streaming validation, structured 413 responses with upgrade paths, and X-Content-Length-Limit headers.

## When To Use
- All HTTP APIs with request bodies
- File upload endpoints
- Public-facing APIs needing resource protection
- Multi-tenant systems requiring fair usage guarantees

## When NOT To Use
- Internal-only APIs with trusted consumers
- Streaming endpoints (use chunked transfer with streaming validation)
- GraphQL APIs (query complexity sizing is different)

## Prerequisites
- nginx or equivalent gateway configuration
- PHP configuration access
- Consumer tier system for differentiated limits

## Inputs
- Default body size limit (10 MB)
- Upload size limit (50 MB)
- Consumer tier limits (Free: 1 MB, Pro: 10 MB, Enterprise: 50 MB)
- Endpoint-specific override list

## Workflow
1. Configure most restrictive limit at nginx (outermost layer), equal or more permissive at PHP and Laravel — never inner stricter than outer
2. Implement tiered limits per consumer: Free (1 MB), Pro (10 MB), Enterprise (50 MB)
3. Configure endpoint-specific overrides: higher limits for file uploads, lower for JSON mutations
4. Enforce limits during streaming (reject at TCP level with nginx) — not after buffering entire body
5. Return 413 Payload Too Large with structured JSON body containing limit, actual size, and upgrade path
6. Include `X-Content-Length-Limit` response header informing consumers of endpoint's maximum size
7. Log oversized request attempts with consumer ID, endpoint, and size — never log payload content

## Validation Checklist
- [ ] nginx limit ≤ PHP limit ≤ Laravel limit (strictest at outermost)
- [ ] Tiered limits by consumer (Free/Pro/Enterprise)
- [ ] Endpoint-specific limits (upload endpoints higher)
- [ ] Streaming enforcement (not after full buffering)
- [ ] 413 response with limit info, actual size, and upgrade path
- [ ] X-Content-Length-Limit header on responses
- [ ] Oversized request logging without payload content

## Common Failures
- Setting limits too low for legitimate use cases
- Setting limits too high (memory exhaustion under peak traffic)
- Inconsistent limits across layers (nginx vs PHP vs Laravel)
- Not updating limits when business requirements change
- Single limit for all endpoints (uploads and mutations have different needs)

## Decision Points
- Default body limit: 10 MB vs consumer-tier-driven dynamic limits
- Upload limit: 50 MB standard vs higher for video/enterprise
- Endpoint categories: standard mutation vs file upload vs bulk import

## Performance Considerations
- nginx rejects at TCP level — minimal resource cost
- Larger PHP limits increase per-worker memory pressure
- Streaming uploads to disk reduces per-request memory footprint
- Validation at nginx prevents wasted application processing

## Security Considerations
- Request size limits are first line of defense against DoS via large payloads
- DoS via chunked transfer: enforce cumulative size limit
- Log oversized requests without payload content
- Tiered limits prevent free-tier abuse while supporting enterprise needs

## Related Rules
- Enforce Strictest Limit at Outermost Layer (nginx)
- Use Tiered Limits Per Consumer
- Return 413 with Limit Info and Upgrade Path
- Enforce Limit During Streaming, Not After Buffering
- Log Oversized Requests Without Payload Content
- Configure Endpoint-Specific Overrides for Uploads
- Include X-Content-Length-Limit Header

## Related Skills
- Design Rate Limit Tiers
- Design Bulk API Operations
- Configure CORS Policy

## Success Criteria
- nginx rejects oversized requests before they reach application
- Free/Pro/Enterprise tiers have appropriately different limits
- Upload endpoints accept larger payloads than mutation endpoints
- Streaming enforcement prevents memory exhaustion
- 413 responses include actionable guidance for consumers
- Consumers see X-Content-Length-Limit header before sending requests
- Logs contain size metadata without payload content
