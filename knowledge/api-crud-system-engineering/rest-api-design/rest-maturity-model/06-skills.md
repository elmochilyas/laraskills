# Skill: Evaluate Your API Against the Richardson Maturity Model
## Purpose
Classify your API against Leonard Richardson's Maturity Model (Level 0-3) — from RPC-style (Level 0) to hypermedia-driven (Level 3) — to identify concrete steps for increasing RESTful maturity.
## When To Use
When assessing current API maturity; when planning API improvements; when evaluating whether to add HATEOAS to an existing API.
## When NOT To Use
Internal RPC-style APIs that don't aim for RESTfulness; when the team or client has no need for hypermedia; for simple CRUD APIs where Level 2 is sufficient.
## Prerequisites
REST Architectural Constraints; HTTP method semantics; HATEOAS concept.
## Inputs
API specification; current endpoints; response structures; client navigation patterns.
## Workflow
1. Level 0 (The Swamp of POX) — single URL, single HTTP method (POST), all actions as XML body
2. Level 1 (Resources) — multiple URLs for different resources, but still POST-only or single method
3. Level 2 (HTTP Verbs) — multiple URLs + correct HTTP methods (GET, POST, PUT, DELETE) + proper status codes
4. Level 3 (Hypermedia Controls / HATEOAS) — Level 2 + response includes links for available state transitions
5. Identify the current level of your API
6. List the specific changes required to reach the next level
7. Implement Level 2 as the minimum viable target (correct HTTP verbs and status codes)
8. Implement Level 3 selectively where client navigation benefits justify the complexity
## Validation Checklist
- [ ] The current maturity level is identified and documented
- [ ] Level 0 conditions: multiple actions per URL, all POST, status codes not used
- [ ] Level 1 conditions: URLs represent resources (nouns), but HTTP methods may be wrong
- [ ] Level 2 conditions: correct HTTP methods (GET, POST, PUT, PATCH, DELETE) + correct status codes (200, 201, 204, 404, 422)
- [ ] Level 3 conditions: Level 2 + responses contain `links` for available transitions
- [ ] Upgrade path to next level is documented
- [ ] Level 2 is implemented as the minimum baseline
- [ ] Level 3 (HATEOAS) is implemented only where it adds value
## Common Failures
- Claiming RESTful (Level 2) but using GET for deletion or POST for reads
- Jumping to Level 3 without solid Level 2 implementation
- Implementing HATEOAS in responses but clients ignore the links (wasted effort)
- Using wrong status codes (200 for all responses, even validation errors)
- Building Level 1 APIs (multiple URLs) but not using correct HTTP methods
## Decision Points
- Level 2 vs Level 3 for your API — Level 2 is sufficient for most CRUD APIs
- Full HATEOAS vs simple `self`/`related` links
- Client-driven vs server-driven navigation via links
## Performance/Security Considerations
Level 3 adds response size overhead from links. Security: links must respect authZ — don't include links for actions the current user cannot perform.
## Related Rules/Skills
REST Architectural Constraints; REST Purity vs Pragmatic; HTTP Method Semantics; Top-Level Meta and Links.
## Success Criteria
API maturity level is identified; Level 2 (correct HTTP methods + status codes) is the minimum target; HATEOAS is added selectively where it adds value.
