# REST Maturity Model — Decision Trees

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: rest-maturity-model
- Phase: 7-decision-trees
- Last Updated: 2026-06-02

## Decision Inventory

| ID | Decision | When Relevant |
|----|----------|---------------|
| D1 | Which maturity level to target | API version planning |
| D2 | Whether to add Level 3 HATEOAS elements | API enhancement planning |
| D3 | How to build maturity cumulatively | API migration from legacy |
| D4 | How to document maturity level | API documentation |
| D5 | Whether to maintain consistent maturity across versions | Multi-version API management |

## Architecture-Level Decision Trees

### D1: Which maturity level to target

**Decision Context:**
The Richardson Maturity Model defines four levels (0-3). Each level provides additional REST benefits at increasing implementation cost. The ROI varies by project.

**Criteria:**
- How many third-party consumers will the API have?
- Is hypermedia discovery needed or expected?
- Is HTTP caching and idempotency important?
- What is the team's implementation capacity?

**Decision Tree:**

```
Is this a new API design or an existing API?
├── New API
│   ├── Default: Level 2 — proper HTTP methods, status codes, resource URLs
│   │   Provides ~95% of REST benefits with manageable effort
│   │   Laravel's apiResource() naturally produces Level 2
│   │
│   └── Consider Level 3 only if:
│       ├── Complex state machine with many transitions
│       ├── Hypermedia-native client ecosystem
│       └── Public API where discoverability is a design goal
│
└── Existing API (migration)
    ├── Assess current level
    │   ├── Level 0 → Migrate to Level 2 (don't stop at Level 1)
    │   ├── Level 1 → Add proper HTTP methods → Level 2
    │   ├── Level 2 → Add HATEOAS selectively → Level 3 partial
    │   └── Level 3 → Maintain and expand hypermedia coverage
    └── Target: Level 2 minimum for all production APIs
```

**Rationale:**
Level 2 provides 95% of REST's benefits (caching, idempotency, uniform interface) with manageable implementation effort. Level 3 (HATEOAS) provides diminishing returns — invest in Level 2 correctness first.

**Default Decision:**
Target Level 2 as the default maturity for all new API endpoints.

**Risks:**
- Level 0/1 lose HTTP caching and idempotency benefits
- Level 3 without client buy-in wastes development effort
- Skipping levels produces a Level 2 facade on Level 0 architecture

**Related Rules:**
- Target Level 2 As The Default Maturity
- Never Skip Levels — Build Cumulatively
- Ensure Level 2 Correctness Before Adding Level 3

**Related Skills:**
- REST Architectural Constraints
- REST Purity vs Pragmatic

---

### D2: Whether to add Level 3 HATEOAS elements

**Decision Context:**
Level 3 elements (self links, pagination links, state-driven action links, API root) can be added incrementally. Not all clients benefit from hypermedia.

**Criteria:**
- Do clients currently use hypermedia navigation?
- Are self links present on all resources (minimum L3 element)?
- Do paginated endpoints have navigation links?
- Would API root entry point provide value?

**Decision Tree:**

```
Start with the minimum Level 3 element — self links:
├── Do all resource responses include a self link?
│   ├── NO → Add self links first (highest value, lowest effort)
│   └── YES
│
│   Do paginated collections include navigation links?
│   ├── NO → Add first/prev/next/last pagination links
│   └── YES
│
│   Do state-driven action links provide client value?
│   ├── NO → Level 3 is sufficient for most APIs
│   └── YES → Add authorization-aware action links
│       (e.g., restore link only for deleted resources)
│
│   Would an API root entry point benefit clients?
│   ├── NO → Level 3 is complete
│   └── YES → Add GET /api with links to top-level resources
│
└── Incremental adoption validates client usage at each step
    Don't implement all Level 3 elements at once
```

**Rationale:**
Full HATEOAS requires significant effort, and most clients don't use hypermedia navigation. Incremental adoption validates that clients actually use each element before investing in more.

**Default Decision:**
Add self links to all resources. Add pagination links to collections. Skip state-driven action links and API root unless clients demonstrate usage.

**Risks:**
- Full HATEOAS without client usage adds unnecessary complexity
- Removing links after adding them is a breaking change
- Link authorization must be correct — wrong links erode client trust

**Related Rules:**
- Add Level 3 Elements Incrementally

**Related Skills:**
- HATEOAS Hypermedia Controls
- Pagination Metadata Design

---

### D3: How to build maturity cumulatively

**Decision Context:**
Each maturity level builds on the previous one. Skipping levels produces a facade that doesn't deliver the expected benefits.

**Criteria:**
- What is the current maturity level of the API?
- Are resources identified before verbs are applied?
- Is there a migration path from each level to the next?

**Decision Tree:**

```
What is the current state of the API?
├── Level 0 (single POST endpoint for all operations)
│   Step 1: Identify resources → Level 1
│   ├── Create separate endpoints for each resource
│   ├── Still using POST only
│   └── Goal: POST /users, POST /orders, POST /products
│
│   Step 2: Add HTTP methods → Level 2
│   ├── Map CRUD to GET, POST, PUT, PATCH, DELETE
│   ├── Add correct status codes
│   └── Goal: GET /users, POST /users, DELETE /users/{id}
│
├── Level 1 (multiple resources, POST only)
│   Migrate directly to Level 2:
│   ├── Add GET for reads, PUT/PATCH for updates, DELETE for removal
│   ├── Keep existing POST endpoints as deprecated aliases
│   └── Goal: Proper verbs on existing resource URLs
│
└── Level 2 (proper verbs and resources)
    Consider Level 3 additions selectively:
    ├── Self links on all resources
    ├── Pagination links on collections
    └── State-driven action links
```

**Rationale:**
Each level builds on the previous one. HTTP verbs (Level 2) require resources (Level 1) to operate on. Skipping Level 1 produces Level 2 verbs applied to a Level 0 single endpoint — verbs have no meaningful target.

**Default Decision:**
Build cumulatively — identify resources before applying verbs. Never skip levels.

**Risks:**
- Migrating from Level 0 directly to Level 2 may miss resource identification
- Legacy clients may depend on Level 0 endpoints — maintain backward compatibility
- Adding verbs without proper resource identification creates confusion

**Related Rules:**
- Never Skip Levels — Build Cumulatively

**Related Skills:**
- REST Architectural Constraints
- API Versioning

---

### D4: How to document maturity level

**Decision Context:**
API consumers need to know what interaction patterns to expect. Documenting the target maturity level sets correct expectations.

**Criteria:**
- What maturity level does the API target?
- Do consumers need to know about hypermedia vs static navigation?
- Is the API public (documentation visible) or internal?

**Decision Tree:**

```
What maturity level does the API operate at?
├── Level 0-1
│   └── Document as "Legacy API" or "RPC-style API"
│       Provide clear migration path to Level 2
│
├── Level 2 (most common)
│   └── Describe as "RESTful HTTP API" — NOT "REST"
│       Document: proper HTTP methods, status codes, resource URLs
│       Imply: no hypermedia navigation
│       OpenAPI extension: x-maturity-level: 2
│
└── Level 3 (with HATEOAS)
    └── Describe as "REST API" (per Fielding's definition)
        Document: hypermedia navigation available
        Link relations documented per resource
```

**Rationale:**
Fielding states that only Level 3 (HATEOAS) qualifies as "REST." Calling Level 2 "REST" creates false expectations. Level 2 is "RESTful" — it uses REST principles but doesn't implement full hypermedia-driven navigation.

**Default Decision:**
Call Level 2 APIs "RESTful" or "RESTful HTTP API." Reserve "REST" for Level 3 APIs with HATEOAS.

**Risks:**
- Marketing requirements may demand "REST" terminology — push back with "RESTful"
- Undocumented maturity leaves clients guessing about capabilities
- Mixed maturity within a version requires per-endpoint documentation

**Related Rules:**
- Call Level 2 APIs "RESTful", Not "REST"
- Document Target Maturity Per API Version

**Related Skills:**
- API Documentation
- REST Purity vs Pragmatic

---

### D5: Whether to maintain consistent maturity across versions

**Decision Context:**
Multiple API versions may operate at different maturity levels. Within a single version, consistency is critical.

**Criteria:**
- Are there multiple active API versions?
- Does each version have a consistent maturity level?
- Are there legacy endpoints at lower maturity in newer versions?

**Decision Tree:**

```
Does a single API version contain endpoints at different maturity levels?
├── YES
│   ├── Are the lower-maturity endpoints documented exceptions?
│   │   ├── YES → Acceptable if documented; plan migration
│   │   └── NO → Fix or document inconsistencies
│   └── Goal: Consistent maturity within each version
│
├── NO — consistent within version
│   └── Good — clients can write generic handling code
│
└── Multiple versions:
    ├── V1: Level 2 (stable, no breaking changes)
    ├── V2: Level 2 + Level 3 elements (evolved)
    └── Simple, predictable progression for clients
```

**Rationale:**
Mixed maturity levels force clients to learn which pattern each endpoint follows. Consistency within a version enables predictable client integration. Different versions can have different maturity levels — clients opt into the version.

**Default Decision:**
Maintain consistent maturity within each API version.

**Risks:**
- V1 Level 0 endpoints may be hard to migrate without breaking clients
- V2 with higher maturity may not be adopted — maintain V1 in parallel
- Mixed maturity within a version is sometimes unavoidable during migration

**Related Rules:**
- Validate Maturity Consistency Per API Version

**Related Skills:**
- API Versioning
- API Lifecycle Governance
