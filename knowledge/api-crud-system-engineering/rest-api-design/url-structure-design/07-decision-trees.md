# URL Structure Design — Decision Trees

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: url-structure-design
- Phase: 7-decision-trees
- Last Updated: 2026-06-02

## Decision Inventory

| ID | Decision | When Relevant |
|----|----------|---------------|
| D1 | Which identifier type to use for resource URLs | Resource model design |
| D2 | How deep to nest resources in the URL path | Relationship hierarchy design |
| D3 | Which versioning strategy to use | API versioning approach |
| D4 | What query parameter conventions to standardize on | Collection and filter endpoints |
| D5 | Whether to normalize URLs to lowercase | URL case sensitivity handling |
| D6 | How to handle deprecated URLs | URL migration and deprecation |

## Architecture-Level Decision Trees

### D1: Which identifier type to use for resource URLs

**Decision Context:**
Resource identifiers in URLs affect security (enumeration risk), performance (index size), and usability (readability). The choice should be consistent across the entire API.

**Criteria:**
- Is the API public (third-party consumers) or internal?
- Is sequential enumeration a security concern?
- Do URLs need to be human-readable/SEO-friendly?
- Is the identifier immutable?

**Decision Tree:**

```
Is this a public API exposed to third-party consumers?
├── YES
│   ├── Do URLs need to be human-readable (blog posts, products)?
│   │   ├── YES → UUID as primary key, slug as optional alias
│   │   │   GET /posts/550e8400  (canonical)
│   │   │   GET /posts/my-blog-post  (slug alias, may redirect)
│   │   └── NO → UUID as sole identifier
│   │       Non-predictable, no record count exposure
│   └── Outcome: UUID for all public API resources
│
├── NO — internal API, first-party consumers only
│   ├── Is sequential enumeration a concern?
│   │   ├── YES → UUID (same as public API)
│   │   └── NO → Auto-increment ID (shorter, faster, simpler)
│   └── Outcome: Auto-increment for unrestricted internal APIs
│
└── Consistency rule: ONE identifier type across the entire API
    Never mix IDs, UUIDs, and slugs for different resources
```

**Rationale:**
Auto-increment IDs expose record count and enable sequential enumeration. UUIDs are non-predictable and reveal no information. Slugs are human-readable but mutable. Standardizing on one type simplifies client integration.

**Default Decision:**
UUIDs for all resources in public APIs. Auto-increment IDs for internal APIs.

**Risks:**
- UUIDs are 4x larger than integers — larger indexes, slower index scans
- Migrating from auto-increment to UUIDs after launch breaks all client URLs
- Slugs that change break bookmarks — maintain slug history with redirects

**Related Rules:**
- Use UUIDs For Public API Identifiers
- Never Use Mutable Identifiers In URLs
- Design URLs For Permanence

**Related Skills:**
- Resource Naming Conventions
- Route Model Binding

---

### D2: How deep to nest resources in the URL path

**Decision Context:**
Nested paths encode parent-child relationships. Each level adds fragility and complexity. The optimal depth balances relationship clarity with URL robustness.

**Criteria:**
- Does the child have a globally unique identifier?
- Is the parent context needed for authorization?
- What is the domain relationship depth?

**Decision Tree:**

```
Does the child resource have a globally unique identifier (UUID)?
├── YES
│   ├── Use shallow nesting: /orders/{order}
│   └── Only nest when parent context is required:
│       ├── For authorization (parent scopes permissions)
│       └── For collection filtering (list items within a parent)
│
└── NO (namespaced ID)
    └── Nest is necessary: /users/{user}/posts/{post}

How many levels of nesting?
├── 1 level: /users — flat, simple (recommended for most APIs)
├── 2 levels: /users/{user}/posts — clear parent-child (standard)
├── 3 levels: /users/{user}/posts/{post}/comments — acceptable max
└── 4+ levels: Design smell
    Instead: /courses/{course}/students (shallow reference)
    Replace deep nesting with global resource references

    Decision for 4+:
    ├── Break into separate shallow resources with references
    ├── Use query parameter scoping: /students?course_id=123
    └── Or keep nesting only if auth context requires every level
```

**Rationale:**
Each nesting level adds a failure point. Beyond 3 levels, the URL encodes a database foreign key hierarchy rather than a meaningful relationship. Shallow references with global identifiers are more robust and fault-tolerant.

**Default Decision:**
Limit nesting to 2-3 levels maximum. Use shallow references with global identifiers beyond that.

**Risks:**
- Missing parent returns 404 for entire deep path
- Deep URLs exceed 2,048-character proxy limits
- Changing hierarchy after release breaks client URLs

**Related Rules:**
- Limit Nesting To 2-3 Levels
- Remove Unnecessary Path Segments

**Related Skills:**
- Resource Naming Conventions
- Route Model Binding

---

### D3: Which versioning strategy to use

**Decision Context:**
API versioning can be done via URL path prefix, Accept header, or query parameter. The choice affects testability, discoverability, and routing complexity.

**Criteria:**
- How many consumers need to test/access the API manually?
- Is CDN routing based on version needed?
- How frequently are new versions released?

**Decision Tree:**

```
Is this a public API with diverse consumers?
├── YES
│   └── URL path prefix versioning: /v1/users, /v2/users
│       Most explicit, testable, and discoverable
│       curl: GET /v1/users (works without custom headers)
│       CDN: Route by path prefix
│       Testing: Straightforward in browser and tools
│
├── NO — internal API, SDK-only access
│   ├── Can also use URL path prefix (recommended for operational simplicity)
│   └── Accept header versioning is possible but less testable:
│       Accept: application/vnd.myapp.v2+json
│       Harder to test with curl, harder for CDN routing
│
└── What about query parameter versioning: /users?api_version=2?
    → Avoid — pollutes query parameter namespace
    → Can be stripped by intermediaries
    → Harder to document and route
```

**Rationale:**
Path prefix versioning is the most explicit, testable, and discoverable approach. Clients can see the version in every request. curl and browser testing work without custom headers. CDN routing can distinguish versions by path.

**Default Decision:**
URL path prefix versioning (`/v1/`) as the primary versioning mechanism.

**Risks:**
- Path prefix doubles the number of route registrations
- URL restructuring between versions confuses clients
- Header versioning is more REST-pure but less practical

**Related Rules:**
- Use Path Prefix For Major API Versions

**Related Skills:**
- API Versioning
- Route Caching

---

### D4: What query parameter conventions to standardize on

**Decision Context:**
Query parameters for filtering, sorting, pagination, and inclusion must be consistent across all endpoints. Inconsistent conventions force clients to write endpoint-specific request-building logic.

**Criteria:**
- Are filters expressed as nested parameters?
- Is sort direction indicated by prefix or separate parameter?
- Is pagination by page number or cursor?

**Decision Tree:**

```
Choose a query parameter convention:

Recommended: JSON:API-style (most widely adopted)
├── Filtering: filter[field]=value
│   GET /users?filter[status]=active&filter[role]=admin
├── Sorting: sort=field (-prefix for descending)
│   GET /users?sort=-created_at,name
├── Pagination: page[size]=&page[number]= or page[cursor]=
│   GET /users?page[size]=25&page[number]=2
├── Inclusion: include=relation
│   GET /users?include=posts,profile
└── Sparse fieldsets: fields[resource]=field1,field2
    GET /users?fields[users]=id,name,email

Alternative conventions (discouraged unless established):
├── Flat parameters: ?status=active&sort_by=name&order=asc
│   → Less expressive, harder to extend
├── Dot notation: ?filter.status=active
│   → Works but differs from JSON:API ecosystem
└── Custom per-endpoint: ?active_only=true
    → Inconsistent, forces client branching
```

**Rationale:**
Consistent query parameter conventions let clients write reusable request-building code. JSON:API-style is the most widely adopted and documented convention with clear semantics.

**Default Decision:**
Standardize on JSON:API-style query parameter conventions (`filter[field]=`, `sort=`, `include=`, `page[size]=`).

**Risks:**
- Existing clients may depend on old parameter names — migration period needed
- Complex nested filter parameters can be hard to parse server-side
- URL length limits may be hit with many filter parameters

**Related Rules:**
- Standardize Query Parameter Conventions

**Related Skills:**
- Pagination Strategies
- Sparse Fieldset Design

---

### D5: Whether to normalize URLs to lowercase

**Decision Context:**
URLs are case-insensitive by RFC spec but case-sensitive by default in most servers. Serving the same resource at different casings creates cache splits and confusion.

**Criteria:**
- Are resource identifiers case-sensitive (slugs, some UUIDs)?
- Is there a CDN or proxy layer that caches by URL?
- Do clients send URLs with inconsistent casing?

**Decision Tree:**

```
Is there a case-sensitive component in the URL path?
├── YES (case-sensitive slug, case-sensitive identifier)
│   ├── Normalize the path segments before the identifier
│   ├── Preserve the identifier's original case
│   └── Example: /Users/My-Blog-Post → /users/My-Blog-Post
│
├── NO — all path segments are case-insensitive
│   ├── Normalize all URLs to lowercase via middleware
│   │   ├── Redirect /Users/42 to /users/42 with 301
│   │   └── Enforce single canonical form for each resource
│   └── Benefits:
│       ├── Prevents cache splits (single cache entry per resource)
│       ├── Consistent client experience
│       └── Aligns with RFC spec (case-insensitive scheme/host/path)
│
└── UUIDs: Always normalize to lowercase
    → 550e8400-e29b-41d4-a716-446655440000
    → NOT 550E8400-E29B-41D4-A716-446655440000
    → Case-insensitive comparison in route binding
```

**Rationale:**
Serving the same resource at different cases creates duplicate cache entries, SEO penalties, and confusion. Normalizing to lowercase ensures a single canonical URL for each resource.

**Default Decision:**
Normalize all URL paths to lowercase via middleware. Normalize UUIDs to lowercase in route bindings.

**Risks:**
- Case-sensitive identifiers (slugs) must be preserved after normalization
- Redirecting non-canonical URLs adds latency for clients using wrong casing
- Development (case-insensitive filesystem) vs production (case-sensitive) mismatch

**Related Rules:**
- Normalize URLs To Lowercase

**Related Skills:**
- Middleware Design
- Route Model Binding

---

### D6: How to handle deprecated URLs

**Decision Context:**
URLs must be permanent contracts. When a URL must change (new version, restructuring), the old URL should continue working during a migration period.

**Criteria:**
- Are there active clients using the deprecated URL?
- Is there a replacement URL available?
- What is the migration period (Sunset date)?

**Decision Tree:**

```
Does the deprecated URL have active clients?
├── NO — no known consumers
│   └── Remove the URL (no migration period needed)
│       Document the removal in release notes
│
├── YES — clients depend on this URL
│   ├── Is there a replacement URL available?
│   │   ├── YES → Keep the old URL working
│   │   │   ├── Add Deprecation header: Deprecation: true
│   │   │   ├── Add Sunset header: Sunset: Sat, 01 Dec 2026 00:00:00 GMT
│   │   │   ├── Either serve the content at the old URL
│   │   │   └── Or redirect: 301 redirect to new URL
│   │   │
│   │   └── NO → Keep the URL indefinitely (no replacement yet)
│   │
│   └── Migration period:
│       ├── Minimum: 3-6 months for public APIs
│       ├── Monitor: Track deprecated URL usage
│       └── Remove: After Sunset date if usage is near zero
│
└── Security-critical endpoint (vulnerable, exposed internal)
    └── Remove immediately — communicate aggressively
```

**Rationale:**
Clients cannot update their integrations instantly. Removing a URL that clients depend on causes production failures. The `Deprecation` header warns clients; the `Sunset` header provides a deadline, enabling proactive updates.

**Default Decision:**
Keep deprecated URLs working with `Deprecation` and `Sunset` headers during a minimum migration period.

**Risks:**
- Old URLs maintained indefinitely increase maintenance surface
- Clients may ignore `Sunset` headers and break when URL is removed
- Redirects add latency for every request during migration period

**Related Rules:**
- Keep Deprecated URLs Working With Deprecation Header

**Related Skills:**
- API Versioning
- API Lifecycle Governance
