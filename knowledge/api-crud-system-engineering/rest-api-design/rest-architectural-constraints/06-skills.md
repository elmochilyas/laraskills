# Skill: Apply REST Architectural Constraints to Your API Design
## Purpose
Design APIs that follow the six REST constraints — client-server, stateless, cacheable, uniform interface, layered system, code on demand (optional) — to build scalable, evolvable, and decoupled web services.
## When To Use
New API design; API review and refactoring; when evaluating whether an API is truly RESTful.
## When NOT To Use
Internal RPC-style APIs where REST constraints add friction; simple CRUD apps that don't need evolvability; when pragmatism outweighs purity (see REST Purity vs Pragmatic).
## Prerequisites
HTTP fundamentals; API route design; resource modeling.
## Inputs
API specification; resource model; client requirements; caching and scaling requirements.
## Workflow
1. Client-server — separate UI from data storage, each evolves independently
2. Stateless — each request contains all information needed; no server-side session state
3. Cacheable — mark responses as cacheable or non-cacheable via Cache-Control headers
4. Uniform interface — use resources (not RPC methods), identify resources via URIs, manipulate via representations, use self-descriptive messages, HATEOAS for state transitions
5. Layered system — introduce proxies, load balancers, gateways transparently
6. Code on demand (optional) — server can extend client functionality via scripts
7. Validate each constraint against the API design — document where constraints are relaxed
## Validation Checklist
- [ ] Client-server separation is maintained (no server-side session state in API responses)
- [ ] No session state on server — auth tokens are sent with each request
- [ ] Cache headers (Cache-Control, ETag, Last-Modified) are present on appropriate responses
- [ ] Resources are identified by URIs (nouns, not verbs)
- [ ] Resources are manipulated via representations (CRUD via HTTP methods)
- [ ] Self-descriptive messages contain all metadata needed to process them (Content-Type, Link headers)
- [ ] HATEOAS links are provided for discoverable state transitions (optional, maturity level 3)
- [ ] Layers (proxies, caches) can be inserted without client changes
- [ ] Each constraint violation is documented with a rationale
## Common Failures
- Using GET for state-changing operations (violates uniform interface)
- Maintaining server-side session state (violates stateless constraint)
- Not caching any responses (misses cacheable constraint benefits)
- API methods named as verbs (`/getUser`, `/updatePost`) instead of resources (`/users/{id}`)
- No hypermedia links — client must hardcode URLs (violates HATEOAS)
- Mixing API layers (DB queries in controllers, coupling persistence to presentation)
## Decision Points
- Full REST compliance vs pragmatic tradeoffs (documented tradeoffs)
- HATEOAS for complex workflows vs static URL documentation
- Cache-Control max-age vs ETag for conditional caching
## Performance/Security Considerations
Statelessness scales horizontally (no session affinity). Caching reduces server load. Security: stateless auth (Bearer tokens) must be validated on every request; cache headers must not expose sensitive data.
## Related Rules/Skills
REST Maturity Model; REST Purity vs Pragmatic; Resource Controller Pattern; HTTP Method Semantics.
## Success Criteria
API satisfies all applicable REST constraints; constraint violations are documented and justified; cache headers are used appropriately; resources are identified by URIs and manipulated via HTTP methods.
