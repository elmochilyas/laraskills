# REST Maturity Model: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | rest-maturity-model |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Level 3 Without Client Buy-In** — Implementing full HATEOAS when clients don't use hypermedia
2. **Level 2 Facade on Level 0** — Using HTTP verbs but applying them to a single endpoint
3. **Cherry-Picking Levels** — Adopting elements from different levels without the foundation
4. **Ignoring Level 0's Validity** — Dismissing Level 0 entirely when it's appropriate for some use cases
5. **Rigid Maturity Dogma** — Insisting on Level 3 for a simple CRUD API with one consumer

## Repository-Wide Anti-Patterns

- Calling Level 2 APIs "REST" instead of "RESTful," setting incorrect consumer expectations
- Mixed maturity levels across endpoints within the same API version
- Skipping Level 1 (resources) and jumping directly to Level 2 (verbs) — applying verbs without resource identification
- Regression in maturity — removing hypermedia links without a version change

---

## 1. Level 3 Without Client Buy-In

### Category
Wasted Effort

### Description
Implementing full Level 3 hypermedia controls (state-driven links, API root discovery, dynamic link navigation) when none of the API's consumers use hypermedia features.

### Why It Happens
Architectural purity — the desire to achieve "true REST" status. The team implements HATEOAS because Fielding says it's required, without verifying client demand.

### Warning Signs
- Full `_links` implementation but no client uses it
- Client libraries hardcode URLs from documentation
- Analytics show zero link-based navigation
- Client developers are unaware of hypermedia features
- Server complexity is high but client satisfaction metrics are unchanged

### Why Harmful
Significant server implementation and maintenance effort with zero client benefit. Response payloads are larger. Authorization checks for link computation add query overhead. The effort could be redirected to Level 2 improvements.

### Real-World Consequences
A team spends 3 months implementing full HATEOAS — state-driven links, API root discovery, and hypermedia navigation. After launch, analytics show 0% of clients use links. All consumers hardcode URLs from the documentation.

### Preferred Alternative
Target Level 2 as the default. Add Level 3 elements incrementally only when clients demonstrate usage: start with self links, then pagination links, then state-driven links.

### Refactoring Strategy
1. Remove unused hypermedia links from responses
2. Retain self links and pagination links (they provide basic value)
3. Add link usage analytics
4. Document the API as Level 2 "RESTful"
5. Redirect HATEOAS effort to Level 2 correctness improvements

### Detection Checklist
- [ ] Full HATEOAS implementation but no client usage
- [ ] Client code hardcodes URLs
- [ ] No link usage analytics exist
- [ ] Server-side link computation adds significant overhead
- [ ] Level 2 correctness has gaps (wrong status codes, missing headers)

### Related Rules/Skills/Trees
- Rule: API-MATURITY-001 (Cost-Benefit of HATEOAS)
- Skill: rest-maturity-model
- Tree: pragmatic-design

---

## 2. Level 2 Facade on Level 0

### Category
Architecture Gap

### Description
Using HTTP verbs (GET, POST, PUT, DELETE) but applying them to a single endpoint or endpoints that don't represent resources. For example, `GET /api?action=getUser` or `POST /api?method=createOrder`.

### Why It Happens
Developers know they should use HTTP verbs but haven't designed resource URLs. They add methods on top of an existing RPC endpoint.

### Warning Signs
- All requests go to the same URL path
- Query parameters or request body fields determine the operation
- Method switching logic in a single controller
- URL doesn't identify a specific resource
- Route definitions use a single endpoint with method routing

### Why Harmful
The API appears to be Level 2 (uses verbs) but is actually Level 0 (no resource identification). Caching, idempotency, and other HTTP benefits don't apply because there's no resource granularity.

### Real-World Consequences
A single `/api` endpoint handles all operations via `?action=...` parameter. The CDN cannot cache individual resources because they're all behind the same URL. Cache invalidation for one resource requires invalidating the entire `/api` cache.

### Preferred Alternative
Identify resources first (Level 1), then apply HTTP verbs (Level 2). Each resource has its own URL.

### Refactoring Strategy
1. Identify all distinct resources in the system
2. Create resource-specific endpoints for each
3. Remove the generic endpoint and action parameter
4. Route requests to appropriate controllers per resource
5. Add tests that verify each resource has its own URL

### Detection Checklist
- [ ] Single endpoint handles all operations
- [ ] Action parameter determines operation
- [ ] No resource-specific URLs exist
- [ ] CDN caches all operations under one URL
- [ ] Controller has method-switching logic

### Related Rules/Skills/Trees
- Rule: API-MATURITY-002 (Resource Identification First)
- Skill: rest-maturity-model
- Tree: rest-compliance

---

## 3. Cherry-Picking Levels

### Category
Incomplete Adoption

### Description
Adopting elements from different maturity levels without the foundational prerequisites — using HTTP verbs (Level 2) without resources (Level 1), or adding hypermedia links (Level 3) without correct HTTP methods (Level 2).

### Why It Happens
Teams copy API patterns from different sources without understanding the cumulative nature of the maturity model.

### Warning Signs
- HTTP verbs used without resource URLs (missing Level 1)
- Hypermedia links present but wrong HTTP methods/status codes (missing Level 2 foundation)
- Some endpoints have self links, others have no caching headers
- Inconsistent constraint adoption across the API
- Team members justify gaps with "we're pragmatic"

### Why Harmful
Each level builds on the previous. Skipping foundations means the higher-level features don't work correctly. Links lead to broken endpoints. Verbs operate on non-existent resources.

### Real-World Consequences
An API adds hypermedia links (Level 3) but uses POST for all operations (missing Level 2). The self links use GET, but the update links say PUT, and the server doesn't handle PUT correctly. Following an update link returns 405 Method Not Allowed.

### Preferred Alternative
Adopt levels cumulatively: first resources (Level 1), then correct verbs (Level 2), then hypermedia (Level 3). Verify each level is complete before adding the next.

### Refactoring Strategy
1. Assess current maturity level per endpoint
2. Fix Level 1 first (ensure all resources have unique URLs)
3. Then fix Level 2 (correct HTTP methods and status codes)
4. Only then consider Level 3 additions
5. Add architecture tests for each maturity level

### Detection Checklist
- [ ] Hypermedia exists but HTTP methods are wrong
- [ ] Verbs used without resource URLs
- [ ] Some endpoints follow one level, others a different level
- [ ] No cumulative adoption strategy
- [ ] Architecture tests don't verify level prerequisites

### Related Rules/Skills/Trees
- Rule: API-MATURITY-003 (Cumulative Level Adoption)
- Skill: rest-maturity-model
- Tree: rest-compliance

---

## 4. Ignoring Level 0's Validity

### Category
Design Dogma

### Description
Dismissing Level 0 (single endpoint, all POST) as always wrong, even when it's the appropriate choice for webhooks, legacy integration, or simple internal tools.

### Why It Happens
Developers learn that Level 0 is the "swamp of POX" and assume it's never appropriate. They over-engineer Level 2 semantics for use cases that don't benefit from them.

### Warning Signs
- Webhook endpoints implement full CRUD semantics
- Simple internal tools have complex resource hierarchies
- Legacy system integration requires fighting with HTTP method semantics
- Developer frustration with designing resources for simple RPC operations
- Time spent on REST compliance for internal-only services

### Why Harmful
Development effort is wasted on REST semantics for use cases that gain no benefit from them. Webhooks don't need resource URLs — they just need to fire events. Internal tools don't need caching headers.

### Real-World Consequences
A team spends a week designing resource URLs, HTTP methods, and status codes for an internal health-check endpoint that's called once per minute by the monitoring system. The endpoint has a single purpose: "is the service alive?" A Level 0 `POST /health` would have taken 5 minutes.

### Preferred Alternative
Choose the minimum maturity level that serves the use case. Webhooks: Level 0. Simple internal tools: Level 1. External APIs: Level 2. Public platforms: consider Level 3.

### Refactoring Strategy
1. Classify each use case by its requirements (caching, idempotency, discoverability)
2. Match maturity level to requirements
3. Document the chosen level and justification per endpoint group
4. Avoid over-engineering for simple use cases
5. Review maturity levels annually

### Detection Checklist
- [ ] Webhooks with complex REST semantics
- [ ] Internal-only endpoints with full resource hierarchy
- [ ] Simple operations with over-engineered CRUD
- [ ] Team frustrated with REST compliance for trivial endpoints
- [ ] No cost-benefit analysis of maturity level

### Related Rules/Skills/Trees
- Rule: API-MATURITY-004 (Appropriate Level Selection)
- Skill: rest-purity-vs-pragmatic
- Tree: pragmatic-design

---

## 5. Rigid Maturity Dogma

### Category
Process Failure

### Description
Insisting that every endpoint must reach a specific maturity level (usually Level 3) regardless of the use case, client needs, or development cost.

### Why It Happens
Architecture enthusiasts who treat REST compliance as a moral virtue rather than an engineering trade-off.

### Warning Signs
- Code review comments mandating Level 3 for trivial endpoints
- Rejected PRs because "this isn't truly REST"
- Time spent debating HATEOAS for internal APIs
- Team morale affected by REST purity arguments
- Client satisfaction inversely correlated with REST compliance

### Why Harmful
Development velocity slows. Team energy is consumed by compliance debates instead of feature delivery. The API becomes more complex without proportional client benefit.

### Real-World Consequences
A junior developer submits a PR adding a simple internal endpoint. The PR is rejected because it doesn't include hypermedia links. The developer spends two days adding `_links` that will never be followed by any client. The feature is delayed by two days.

### Preferred Alternative
Target Level 2 as the default. Allow deviations with documented justification. Review deviations periodically. Focus on client value, not REST purity.

### Refactoring Strategy
1. Document the default maturity level (Level 2)
2. Create a lightweight process for requesting maturity-level deviations
3. Add a timebox for REST compliance discussions in code reviews
4. Measure client satisfaction with API, not REST compliance
5. Review maturity requirements quarterly

### Detection Checklist
- [ ] Level 3 mandated for all endpoints
- [ ] Code reviews blocked by REST compliance debates
- [ ] No documented deviation process
- [ ] Client satisfaction not measured
- [ ] Team morale affected by maturity debates

### Related Rules/Skills/Trees
- Rule: API-MATURITY-005 (Pragmatic Maturity Targets)
- Skill: rest-purity-vs-pragmatic
- Tree: team-process
