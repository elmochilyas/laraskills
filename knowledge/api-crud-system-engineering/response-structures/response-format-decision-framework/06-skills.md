# Skill: Choose JSON Response Format Based on Client and Context
## Purpose
Select the appropriate JSON response format (JSON:API, bare JSON, custom envelope, Siren, HAL, JSON-LD) based on client needs, API maturity stage, and team expertise — not by popularity alone.
## When To Use
During API design phase; when choosing a response format for a new project; when evaluating whether to adopt JSON:API for an existing API.
## When NOT To Use
When clients already consume a specific format (don't change without deprecation); for internal APIs where any consistent format suffices; when the chosen format adds complexity without value.
## Prerequisites
JSON:API specification knowledge; REST API Design; content negotiation (`Accept` header).
## Inputs
Client requirements (mobile, web, third-party); team experience; tooling ecosystem; API maturity level.
## Workflow
1. Evaluate client requirements: number of clients, third-party vs first-party, need for hypermedia
2. If clients are internal/first-party and few, use custom JSON envelope (simple, flexible)
3. If clients are many third-party, consider JSON:API (standardized, well-documented)
4. If hypermedia is required, consider Siren or HAL (HATEOAS constraints)
5. If semantic web/linked data is needed, consider JSON-LD
6. Use content negotiation (`Accept` header) for versioned format support
7. Default to simple custom envelope for most Laravel APIs (wrapped in `data` key)
8. Avoid mixing formats across endpoints — pick one and apply it everywhere
## Validation Checklist
- [ ] Response format is consistent across all endpoints
- [ ] Format choice is documented and justified in API design docs
- [ ] Content negotiation is considered for format versioning
- [ ] Team understands the chosen format's conventions
- [ ] Tooling/libraries support the chosen format (JSON:API libraries exist)
- [ ] Format choice does not overcomplicate simple endpoints
- [ ] `Accept` header / `Content-Type` header reflects the format
## Common Failures
- Adopting JSON:API "because it's standard" — adds complexity for simple first-party APIs
- Mixing formats across endpoints — clients must parse multiple formats
- Choosing a format with no library support — manual implementation is error-prone
- Over-engineering response format before understanding client needs
- Not documenting the format — every new developer must reverse-engineer the response shape
## Decision Points
- JSON:API (standard) vs Custom envelope (simple) vs HAL (hypermedia)
- Single format for all endpoints vs format per version (Accept header)
- Wrapped (`{ data: ... }`) vs unwrapped (`{ ... }`) responses
## Performance/Security Considerations
JSON:API adds metadata overhead (type, id, attributes wrapper) — slightly larger payloads. Content negotiation adds request parsing overhead. Security: consistent format prevents client-side parsing confusion.
## Related Rules/Skills
JSON:API Compound Documents; REST Architectural Constraints; REST Purity vs Pragmatic; Resource Controller Response Selection.
## Success Criteria
Response format is consistent across the entire API; the choice is documented and justified; team tooling supports the format; clients can parse every response with the same logic.
