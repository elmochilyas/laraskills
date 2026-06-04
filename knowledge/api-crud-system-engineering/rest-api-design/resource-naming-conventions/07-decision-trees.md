# Resource Naming Conventions — Decision Trees

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: resource-naming-conventions
- Phase: 7-decision-trees
- Last Updated: 2026-06-02

## Decision Inventory

| ID | Decision | When Relevant |
|----|----------|---------------|
| D1 | How to pluralize resource names in URL paths | Every route registration |
| D2 | Which casing convention to use for URI segments | API style guide definition |
| D3 | How deep to nest resources | Relationship hierarchy design |
| D4 | Whether to include verbs in the URI path | Action endpoint design |
| D5 | Which identifier type to use across the API | Resource model design |
| D6 | How to express filtering, sorting, and includes | Collection endpoint design |

## Architecture-Level Decision Trees

### D1: How to pluralize resource names in URL paths

**Decision Context:**
Resource names in URLs must be consistently pluralized. Inconsistent pluralization is the most common naming mistake and the hardest for clients to adapt to.

**Criteria:**
- Is the resource a collection (multiple items) or singleton (one item per context)?
- What is the correct plural form of the resource noun?
- Does Laravel's automatic singularization produce the correct parameter name?

**Decision Tree:**

```
Is this a singleton resource (profile, settings, dashboard)?
├── YES
│   └── Use singular: /profile, /settings, /dashboard
│
└── NO — this is a collection (has multiple instances)
    ├── Is the resource name an irregular plural?
    │   ├── YES (series, species, order-items)
    │   │   └── Register with explicit parameters() to fix parameter name
    │   │       Route::apiResource('series', ...)->parameters(['series' => 'series']);
    │   └── NO — regular plural
    │       └── Use standard plural: /users, /orders, /posts
    │
    └── Verify with `php artisan route:list` that parameter names are correct
```

**Rationale:**
Plural nouns are the universal industry convention for collections. Clients can predict 80% of endpoint paths just by pluralizing the resource name. Singular nouns for collections create confusion about whether the path refers to a collection or a singleton.

**Default Decision:**
Plural kebab-case for collections, singular names for singletons.

**Risks:**
- Laravel's `Str::singular()` may produce incorrect parameter names for irregular plurals
- Inconsistent pluralization across resources forces clients to memorize per-resource conventions
- Changing pluralization after release breaks existing clients

**Related Rules:**
- Use Plural Nouns For Collection Endpoints
- Handle Irregular Pluralization Explicitly
- Avoid Inconsistent Pluralization Across Resources

**Related Skills:**
- URL Structure Design
- HTTP Method Semantics

---

### D2: Which casing convention to use for URI segments

**Decision Context:**
URI path segments can use kebab-case, snake_case, camelCase, or PascalCase. Consistency is important, and the industry has converged on kebab-case.

**Criteria:**
- Does the organization have an existing API convention?
- Is the casing convention consistent with the broader API ecosystem?
- Does the casing work with case-insensitive URL handling?

**Decision Tree:**

```
Does the organization have an established URL casing convention?
├── YES
│   ├── Is it applied consistently across all existing APIs?
│   │   ├── YES → Follow the existing convention (consistency > industry standard)
│   │   └── NO → Migrate to kebab-case — industry standard
│   └── Outcome: Prefer existing convention if consistent
│
└── NO — new API, no existing convention
    └── Use kebab-case (lowercase with hyphens)
        RFC 3986-recommended, case-insensitive, human-readable, industry standard
        /order-items, /user-profiles, /blog-posts
```

**Rationale:**
kebab-case is the RFC 3986-recommended format, case-insensitive, and readable. snake_case is Laravel's internal code convention but differs from industry API URI standards.

**Default Decision:**
kebab-case for all URI path segments.

**Risks:**
- Laravel's route parameters use snake_case internally — kebab-case in URLs maps to snake_case in code
- CDN caching may be case-sensitive despite RFC — enforce lowercase normalization
- Mixed casing creates cache splits and client confusion

**Related Rules:**
- Use kebab-case For All URI Path Segments

**Related Skills:**
- URL Structure Design
- Route Model Binding

---

### D3: How deep to nest resources

**Decision Context:**
Nested resources encode parent-child relationships. Deep nesting creates fragile URLs that are error-prone for clients and hard to maintain.

**Criteria:**
- Is there a clear parent-child ownership relationship?
- Does the child resource have a globally unique identifier?
- Is the nesting required for authorization context?

**Decision Tree:**

```
Does the child resource have a globally unique identifier?
├── YES (UUID, globally unique ID)
│   ├── Use shallow reference: /orders/{order}
│   └── Nest only when parent context is needed for authorization
│
└── NO (namespaced ID, unique only within parent)
    └── Nest: /users/{user}/posts/{post}
    
    How many levels of nesting are needed?
    ├── 1-2 levels → Standard nesting: /users/{user}/posts
    ├── 3 levels → Acceptable with justification: /users/{user}/posts/{post}/comments
    └── 4+ levels → Design smell — use shallow references
        Instead of: /schools/{school}/departments/{dept}/courses/{course}/students
        Use: /courses/{course}/students
        And: /students/{student}
```

**Rationale:**
Each nesting level adds a failure point. Beyond 3 levels, the URL encodes a database foreign key hierarchy rather than a meaningful API relationship. Shallow references with global identifiers are more robust.

**Default Decision:**
Limit nesting to 2-3 levels maximum. Use shallow references with global identifiers beyond that.

**Risks:**
- Missing parent returns 404 for entire path — fragile cascading failures
- Deep nesting creates long URLs that may exceed proxy limits
- Changing the hierarchy after release breaks client URLs

**Related Rules:**
- Limit Nesting To 2-3 Levels Maximum

**Related Skills:**
- URL Structure Design
- Route Model Binding

---

### D4: Whether to include verbs in the URI path

**Decision Context:**
Verbs in URI paths violate REST principles. The HTTP method encodes the action. However, action endpoints for non-CRUD operations use verbs as sub-resource names.

**Criteria:**
- Does the operation map to standard CRUD?
- Is the HTTP method sufficient to convey the action?
- Is the operation an action (non-CRUD) with complex side effects?

**Decision Tree:**

```
Does the operation map to standard CRUD (Create/Read/Update/Delete)?
├── YES
│   └── NO verbs in URI path — HTTP method is sufficient
│       GET /users (reads), POST /users (creates), DELETE /users/{id} (deletes)
│
└── NO — non-CRUD action
    ├── Use verb as sub-resource under the related resource
    │   POST /orders/{order}/cancel
    │   POST /invoices/{invoice}/send
    │   POST /users/{user}/restore
    └── Verbs as sub-resources are an accepted pragmatic convention
        The verb names the action resource, not the CRUD operation
```

**Rationale:**
URIs identify resources (nouns), not actions (verbs). The HTTP method specifies the operation. Adding verbs to URIs conflates resource identification with operation. Action endpoints use verbs as sub-resource names — an accepted pragmatic exception.

**Default Decision:**
Never use verbs in CRUD URI paths. Use verbs only as sub-resources for non-CRUD action endpoints.

**Risks:**
- Verbs in CRUD paths (GET /users/getActive) break the resource model entirely
- Mixing CRUD and action endpoints inconsistently confuses clients
- Action verb names must be clear and self-documenting

**Related Rules:**
- Never Use Verbs In URI Paths

**Related Skills:**
- Resource vs Action Orientation
- HTTP Method Semantics

---

### D5: Which identifier type to use across the API

**Decision Context:**
Resource identifiers (IDs, UUIDs, slugs) must be consistent across the API. Mixed identifier types force clients to handle multiple formats.

**Criteria:**
- Is the API public or internal?
- Is sequential enumeration a security concern?
- Do URLs need to be human-readable/SEO-friendly?
- Is the identifier mutable or immutable?

**Decision Tree:**

```
Is this a public API exposed to third-party consumers?
├── YES
│   ├── Does the resource need human-readable URLs (SEO, sharing)?
│   │   ├── YES → UUID as primary identifier, slug as optional alias
│   │   │   GET /posts/550e8400  and  GET /posts/my-blog-post (alias)
│   │   └── NO → UUID as sole identifier
│   │       Non-predictable, no record count exposure
│   └── Outcome: UUID for public APIs
│
├── NO — internal API, first-party consumers only
│   ├── Is sequential enumeration a concern?
│   │   ├── YES → UUID (same as public API)
│   │   └── NO → Auto-increment ID (shorter, faster, simpler)
│   └── Outcome: Auto-increment for internal, UUID for security-sensitive
│
└── Consistency rule: Use ONE identifier type across the entire API
    Mixing IDs, UUIDs, and slugs forces complex client logic
```

**Rationale:**
Auto-increment IDs expose record count and enable sequential enumeration. UUIDs are non-predictable and reveal no information. Slugs are human-readable but may change. Standardizing on one type simplifies client integration.

**Default Decision:**
UUIDs for all resources in public APIs. Auto-increment IDs for internal APIs.

**Risks:**
- Migrating from auto-increment to UUIDs after launch breaks all client URLs
- UUIDs are 4x larger than integers — larger indexes, slower lookups
- Slugs that change break bookmarks — maintain slug history

**Related Rules:**
- Standardize On One Identifier Type Across The API
- Use Route Model Binding With Custom Keys For Non-ID Resources

**Related Skills:**
- URL Structure Design
- Route Model Binding

---

### D6: How to express filtering, sorting, and includes

**Decision Context:**
Filtering, sorting, and relationship inclusion modify the resource representation without changing resource identity. These should use query parameters, not path segments.

**Criteria:**
- Does the parameter modify the set of resources returned?
- Does the parameter modify the representation of each resource?
- Is the parameter a filter, sort, or inclusion directive?

**Decision Tree:**

```
Does the parameter change which resources are returned or how they're ordered?
├── YES
│   ├── Is it filtering resources by attribute value?
│   │   ├── YES → Use filter[field]=value convention
│   │   │   ?filter[status]=active
│   │   └── NO → Go to next check
│   │
│   ├── Is it sorting resources?
│   │   ├── YES → Use sort=field with - prefix for descending
│   │   │   ?sort=-created_at  (descending)  or  ?sort=name  (ascending)
│   │   └── NO → Go to next check
│   │
│   ├── Is it including related resources?
│   │   ├── YES → Use include=relation comma-separated
│   │   │   ?include=posts,profile
│   │   └── NO → Go to next check
│   │
│   └── None of the above → Use custom parameter with consistent naming
│       ?q=search_term  (generic search)
│
└── NO → Parameter doesn't modify resource — it's something else
    (path parameter, header, or separate endpoint)
```

**Rationale:**
Query parameters are the standard mechanism for modifying resource representation. Encoding filters in the path creates infinite path variants. Consistent query parameter conventions enable client reuse.

**Default Decision:**
Use `filter[field]=value`, `sort=-field`, `include=relation` query parameter conventions.

**Risks:**
- Inconsistent parameter naming across endpoints forces client branching
- Complex filters may exceed URL length limits — switch to POST
- Exposing filterable fields may leak data structure

**Related Rules:**
- Use Query Parameters For Filtering, Sorting, And Includes

**Related Skills:**
- URL Structure Design
- Sparse Fieldset Design
