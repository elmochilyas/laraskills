# REST Purity vs Pragmatic — Decision Trees

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: rest-purity-vs-pragmatic
- Phase: 7-decision-trees
- Last Updated: 2026-06-02

## Decision Inventory

| ID | Decision | When Relevant |
|----|----------|---------------|
| D1 | Whether to deviate from REST conventions | Any endpoint that doesn't fit standard CRUD |
| D2 | How to document REST deviations | Style guide and code review process |
| D3 | Whether to prioritize consistency over purity | Cross-endpoint pattern conflicts |
| D4 | Whether the deviation is justified using the decision matrix | Each proposed deviation |
| D5 | When to review and remove old deviations | Quarterly architecture reviews |
| D6 | What purity standard to apply (external vs internal) | API audience differentiation |

## Architecture-Level Decision Trees

### D1: Whether to deviate from REST conventions

**Decision Context:**
REST conventions provide predictability but some operations don't fit the resource model cleanly. The decision to deviate should be deliberate, not accidental.

**Criteria:**
- Does the operation fit naturally into CRUD?
- Does the deviation provide clear benefit over the RESTful approach?
- What is the cost of the deviation to clients and maintainers?

**Decision Tree:**

```
Default position: Use REST conventions (proper methods, resource URLs, status codes)

Does the operation fit naturally into standard CRUD?
├── YES → Use REST (no deviation needed)
├── NO
│
│   Apply the Deviation Decision Matrix (four questions):
│
│   1. Client cost: Does this deviation require special client handling?
│   ├── YES → Cost +1
│   └── NO → Cost +0
│
│   2. Documentation cost: Must this be documented as an exception?
│   ├── YES → Cost +1
│   └── NO → Cost +0
│
│   3. Migration cost: Does this make future changes harder?
│   ├── YES → Cost +1
│   └── NO → Cost +0
│
│   4. Tooling cost: Does this break standard HTTP tooling?
│   ├── YES → Cost +1
│   └── NO → Cost +0
│
│   Total cost:
│   ├── 0 → Deviation is cost-free; proceed
│   ├── 1-2 → Acceptable with documented justification
│   └── 3-4 → Reconsider the deviation; find a RESTful alternative
│
└── Document the deviation with: justification, costs, and client impact
```

**Rationale:**
The deviation decision matrix makes evaluation objective and repeatable. Each "yes" answer represents real cost that must be weighed against the benefit the deviation provides.

**Default Decision:**
Default to REST conventions. Deviate only when the benefit clearly outweighs the measured costs.

**Risks:**
- Undocumented deviations become permanent design debt
- Too many deviations erode the RESTful contract
- Each deviation adds to the client learning curve

**Related Rules:**
- Default To REST, Deviate With Documentation
- Use The Deviation Decision Matrix

**Related Skills:**
- REST Architectural Constraints
- Resource vs Action Orientation

---

### D2: How to document REST deviations

**Decision Context:**
Deviations must be visible to the team and documented for clients. Undocumented deviations create confusion and are replicated by future developers.

**Criteria:**
- Is the deviation visible in code (clear from the route structure)?
- Does the style guide cover this deviation pattern?
- Are future maintainers likely to understand the justification?

**Decision Tree:**

```
Is the deviation self-documenting and universally accepted?
├── YES (POST for action endpoints like cancel)
│   └── Brief inline documentation is sufficient
│       // Action endpoint: side effects beyond state change
│
└── NO — deviation needs explicit rationale
    ├── Code-level documentation:
    │   /**
    │    * POST /users/search — GET deviation
    │    * Justification: Complex multi-field filters exceed URL length limits (~4KB).
    │    * Cost: Clients must use POST instead of GET; no HTTP-level caching.
    │    * Migration: Consider POST with Cache-Control headers for app-level caching.
    │    */
    │
    ├── Style guide entry:
    │   ├── Deviation pattern documented (e.g., "POST for complex search")
    │   └── All endpoints using this deviation reference the style guide rule
    │
    └── OpenAPI documentation:
        ├── Endpoint deviation noted in description
        └── Client impact documented
```

**Rationale:**
Documented deviations are auditable — undocumented deviations create security blind spots and design debt. Code comments, style guide entries, and API documentation together ensure visibility.

**Default Decision:**
Document every REST deviation with inline code comments. Add codified deviations to the style guide.

**Risks:**
- Documentation rot — deviations documented but not reviewed
- Over-documentation — trivial deviations with excessive comments
- Clients may not read documentation and rely on the deviation anyway

**Related Rules:**
- Default To REST, Deviate With Documentation
- Codify Common Deviations In The Style Guide

**Related Skills:**
- API Documentation
- Style Guide Creation

---

### D3: Whether to prioritize consistency over purity

**Decision Context:**
A consistently pragmatic API is more usable than an inconsistently pure one. Inconsistency forces clients to handle multiple patterns.

**Criteria:**
- Is the current API consistent in its patterns?
- Would enforcing purity create inconsistency across endpoints?
- Can all endpoints be migrated to a single consistent pattern?

**Decision Tree:**

```
Is the API currently consistent in its approach (even if pragmatic)?
├── YES
│   └── Maintain consistency — it's more valuable than purity
│       A consistently pragmatic API is predictable
│       Example: All POST for writes is consistent and learnable
│
├── NO — mixing REST and RPC patterns
│   ├── Can all endpoints be migrated to a single pattern?
│   │   ├── YES → Migrate to the dominant pattern (whichever has more endpoints)
│   │   └── NO → Document each pattern; plan version-based migration
│   └── Goal: Achieve consistency over purity
│
└── Consistency principle: Pick ONE pattern and apply it everywhere
    ├── Option A: Pure REST (proper methods everywhere)
    └── Option B: Pragmatic but consistent (same deviation for same scenarios)
```

**Rationale:**
Inconsistency is the most harmful API quality. An API that consistently uses POST for all writes is easier to integrate with than one mixing REST for some resources and RPC for others with no clear pattern.

**Default Decision:**
Prioritize consistency over purity. A consistently pragmatic API is better than an inconsistently pure one.

**Risks:**
- Migrating to consistency may temporarily break existing clients
- Pure REST advocates may resist pragmatic consistency
- Some domains genuinely need mixed patterns — document clearly

**Related Rules:**
- Be Consistent Over Pure

**Related Skills:**
- API Style Guide
- API Versioning

---

### D4: Whether the deviation is justified using the decision matrix

**Decision Context:**
Before deviating from REST, evaluate the deviation using the four-question matrix. This provides objective, repeatable decision-making.

**Criteria:**
- Requires special client handling?
- Must be documented as exception?
- Makes future changes harder?
- Breaks standard HTTP tooling?

**Decision Tree:**

```
Proposed deviation: Submit to the four-question matrix

1. Client cost: Does this deviation require special client handling?
├── YES → The client cannot use standard HTTP patterns
│   Example: POST instead of GET for search → client must know this endpoint
├── NO → Standard HTTP tooling works fine
└── Cost: ____

2. Documentation cost: Must this be documented as an exception?
├── YES → Every client developer must read about this
├── NO → Deviation is invisible to consumers
└── Cost: ____

3. Migration cost: Does this make future changes harder?
├── YES → Must maintain backward compatibility for this deviation
├── NO → Easy to change later
└── Cost: ____

4. Tooling cost: Does this break standard HTTP tooling?
├── YES → curl, Postman, browser dev tools can't handle it naturally
├── NO → Works with standard tools
└── Cost: ____

Total cost: 0 → Proceed (rare)
Total cost: 1-2 → Approved with documentation
Total cost: 3-4 → Reconsider; find RESTful approach
```

**Rationale:**
Without this matrix, deviations are approved based on developer preference rather than objective assessment. Each "yes" represents real cost that must be weighed against the benefit.

**Default Decision:**
Apply the decision matrix before every deviation. Approve only if cost is 0-2.

**Risks:**
- Matrix may reject a deviation that is genuinely necessary
- Team may skip the matrix for "obvious" deviations
- Costs may change over time — deviations need periodic review

**Related Rules:**
- Use The Deviation Decision Matrix

**Related Skills:**
- API Architecture Review
- Design Governance

---

### D5: When to review and remove old deviations

**Decision Context:**
Deviations approved at one point may become unnecessary as circumstances change. Regular review prevents deviation creep.

**Criteria:**
- Is the original justification still valid?
- Have infrastructure or client capabilities changed?
- Can the deviation be removed without breaking clients?

**Decision Tree:**

```
Schedule: Quarterly review of all documented REST deviations

For each deviation:
├── Is the original justification still valid?
│   ├── YES → Keep; re-review next quarter
│   └── NO → The deviation is no longer needed
│
│   Can the deviation be removed without breaking existing clients?
│   ├── YES → Remove deviation; adopt RESTful approach
│   │   Example: POST /search migrated to GET with query parameters
│   ├── NO — clients depend on the deviation
│   │   ├── Add RESTful endpoint alongside deviation
│   │   ├── Deprecate deviation endpoint with Sunset header
│   │   └── Remove deviation after migration period
│   └── Outcome: Remove or deprecate outdated deviations
│
└── New deviations added this quarter:
    ├── Review all against the style guide
    ├── Add recurring patterns to the style guide
    └── Flag exceptions for team discussion
```

**Rationale:**
Deviations may become unnecessary as infrastructure improves, URL limits increase, or client capabilities evolve. Quarterly reviews prevent permanent deviation accumulation.

**Default Decision:**
Review all REST deviations quarterly. Remove deviations that are no longer justified.

**Risks:**
- Removing a deviation may break clients that depend on it
- Reviews may be skipped due to time pressure
- Deviation list grows if reviews don't happen

**Related Rules:**
- Review Deviations Quarterly

**Related Skills:**
- API Lifecycle Governance
- Deprecation Strategies

---

### D6: What purity standard to apply (external vs internal)

**Decision Context:**
External APIs (third-party consumers) benefit from higher REST purity. Internal APIs (same-org microservices) can be more pragmatic.

**Criteria:**
- Who consumes the API (external or internal)?
- How diverse is the consumer base?
- What is the cost of higher purity (development time, complexity)?

**Decision Tree:**

```
Who are the primary API consumers?
├── External (third-party developers, public API)
│   ├── Apply higher REST purity standards
│   │   ├── Proper HTTP methods for all endpoints
│   │   ├── Correct status codes for all outcomes
│   │   ├── Consistent resource naming
│   │   ├── Comprehensive error responses
│   │   ├── Self/+ pagination links
│   │   └── Full documentation with OpenAPI
│   └── Benefit: Diverse consumers benefit from predictability
│
├── Internal (same org, frontend, microservice)
│   ├── More pragmatic approach acceptable
│   │   ├── Action endpoints where practical
│   │   ├── Simplified error responses
│   │   ├── Batch operations for efficiency
│   │   └── Fewer navigation links
│   └── Benefit: Faster development, less overhead
│
└── But both should follow the same core conventions:
    ├── Resource-oriented URLs (no verbs in paths)
    ├── Consistent naming (kebab-case, plural)
    └── Proper authentication (tokens, not sessions)
```

**Rationale:**
Public APIs have diverse, uncontrolled consumers who benefit from strict REST conventions. Internal APIs have controlled consumers where pragmatism reduces development cost without proportional harm.

**Default Decision:**
Higher purity for public APIs, more pragmatism for internal APIs. Same core conventions apply to both.

**Risks:**
- Internal APIs may accumulate too many deviations and become unmanageable
- Public API deviations are harder to remove due to external dependencies
- Same API serving both audiences should use a gateway layer

**Related Rules:**
- Set Different Purity Standards For External vs Internal APIs

**Related Skills:**
- API Governance
- Developer Experience Design
