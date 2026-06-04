# Skill: Balance REST Purity Against Pragmatic Engineering Decisions
## Purpose
Make deliberate, documented tradeoffs between strict REST compliance and practical engineering needs — accepting deviations from "pure" REST when the pragmatic choice reduces complexity, improves performance, or meets client requirements.
## When To Use
During API design decisions where REST constraints conflict with practical needs; when deciding whether to add HATEOAS; when choosing response formats; when optimizing for performance over strict adherence.
## When NOT To Use
When strict REST compliance is required by contract; when the API is meant as a REST reference implementation; when tradeoffs are made without documentation or team awareness.
## Prerequisites
REST Architectural Constraints; REST Maturity Model; knowledge of common REST purity debates.
## Inputs
API requirements; client constraints; performance requirements; team expertise.
## Workflow
1. Identify where REST constraints conflict with practical requirements
2. For each conflict, evaluate the cost of compliance (complexity, performance, client effort)
3. For each conflict, evaluate the cost of deviation (coupling, evolvability, client confusion)
4. Make a deliberate decision — document the tradeoff and the rationale
5. Common pragmatic deviations: omitting HATEOAS, using custom JSON envelopes, embedding related resources (sideloading), relaxing statelessness for performance, using POST for non-CRUD actions
6. Revisit tradeoffs when requirements change (new clients, scaling need)
7. Ensure the core REST principles are preserved: resource-based URLs, correct HTTP methods, meaningful status codes
## Validation Checklist
- [ ] Every REST purity tradeoff is documented with rationale
- [ ] Core REST principles (resources, HTTP methods, status codes) are preserved even when deviating
- [ ] HATEOAS omission is a deliberate choice, not an oversight
- [ ] Custom response formats are consistent and documented
- [ ] Performance-driven deviations (data embedding, caching) are measured and justified
- [ ] Deviations are revisited when the API undergoes major version changes
- [ ] Clients are not negatively impacted by deviations (documented for them)
- [ ] The team agrees on the tradeoff boundaries
## Common Failures
- Abandoning REST entirely because "pure REST is impractical" — losing core benefits
- Adding HATEOAS because "REST requires it" — wasted effort clients don't use
- Inconsistent approach — some endpoints are "pure" while others are pragmatic, confusing clients
- Undocumented tradeoffs — new team members reintroduce "pure" patterns that were intentionally avoided
- Using pragmatic decisions as excuse for poor design (e.g., using POST for everything)
## Decision Points
- HATEOAS (Level 3) vs static docs (Level 2) for client navigation
- Embedding related resources vs requiring separate requests
- Custom JSON envelope vs JSON:API specification
- POST for non-CRUD vs inventing new HTTP methods
## Performance/Security Considerations
Pragmatic deviations often improve performance (embedding reduces requests). Security: ensure deviations don't bypass authZ (e.g., embedding unrelated resources).
## Related Rules/Skills
REST Architectural Constraints; REST Maturity Model; Response Format Decision Framework; Resource Controller Pattern.
## Success Criteria
REST tradeoffs are deliberate, documented, and justified; core REST principles are preserved; pragmatic decisions are revisited with major API changes.
