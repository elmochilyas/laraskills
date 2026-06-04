# URL Structure Design: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | url-structure-design |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Deep Nesting** — Exceeding 3 levels of path hierarchy
2. **Inconsistent Identifier Strategy** — Mixing ID types across resources
3. **Unnecessary Prefixes** — Adding redundant path segments like `/api`, `/rest`, `/v1` when subdomain handles it
4. **Verbs in Paths** — Embedding action verbs (`getUsers`, `createOrder`) in URL segments
5. **Mutable Identifiers** — Using values that can change (email, username) as primary resource identifiers

## Repository-Wide Anti-Patterns

- Not normalizing URLs to lowercase — causing cache splits between `/Users/42` and `/users/42`
- Trailing slash inconsistency — some endpoints with trailing slash, others without
- Changing identifier strategy after launch without dual-support migration period
- Case-insensitive assumptions — not normalizing UUIDs or slugs to lowercase

---

## 1. Deep Nesting

### Category
Structural Fragility

### Description
Creating URL hierarchies with 4+ levels of nesting — `/schools/1/departments/2/courses/3/students/4/enrollments/5`. Deeply nested URLs are fragile, error-prone, and difficult for clients to construct correctly.

### Why It Happens
Directly mapping database foreign key chains to URL hierarchy. If tables relate A→B→C→D, the URL mirrors this: `/a/1/b/2/c/3/d/4`.

### Warning Signs
- URLs with 4+ path segments
- Route definitions with 4+ nested route parameters
- High client error rates on deeply nested endpoints
- URLs exceeding 100 characters
- Difficulty adding new resources with different parent relationships

### Why Harmful
Deep URLs break when any parent ID changes. Route model binding performs N queries for N nesting levels. Client URL construction is error-prone. REST discourages exposing internal hierarchy this way.

### Real-World Consequences
A school management API uses `/schools/{school}/departments/{dept}/courses/{course}/students/{student}/enrollments`. A student transfers departments — their old enrollment URLs all contain the old department ID, breaking every link.

### Preferred Alternative
Limit nesting to 2-3 levels Maximum. Use shallow nesting with global resource identifiers beyond that: `/enrollments/{enrollment}`. Filter by related resources via query parameters.

### Refactoring Strategy
1. Identify URLs with 3+ nesting levels
2. Promote deeply nested resources to top-level routes
3. Use query parameter filtering for context-specific queries
4. Add redirects for existing deeply nested URLs
5. Implement architecture tests that fail on deep nesting

### Detection Checklist
- [ ] URLs with 4+ path segments exist
- [ ] Route binding performs 4+ queries for single request
- [ ] Client error rates correlate with nesting depth
- [ ] Resource identifiers depend on multiple parent IDs
- [ ] URL exceeds 100 characters

### Related Rules/Skills/Trees
- Rule: API-URL-003 (Maximum Nesting Depth)
- Skill: url-structure-design
- Tree: api-structure

---

## 2. Inconsistent Identifier Strategy

### Category
Consistency Failure

### Description
Using different identifier types across resources in the same API — some resources use auto-increment IDs, others use UUIDs, others use slugs. Clients must handle multiple identifier formats.

### Why It Happens
Different teams or developers made independent decisions. Legacy resources keep old IDs while new ones use UUIDs. No team-wide identifier strategy was established.

### Warning Signs
- Some resources use `/users/42`, others use `/orders/abc-def-123`
- Client code has type checking for different identifier formats
- Cache key strategy varies by resource
- Database queries can't use a single lookup pattern
- Identifier strategy differs between collection endpoints

### Why Harmful
Client code is significantly more complex — must handle integers, UUIDs, and slugs. Caching strategies are fragmented. Database queries cannot use a uniform lookup pattern. Each new resource must decide which identifier to use.

### Real-World Consequences
A client library must handle: `users/42` (integer), `orders/abc-def-ghi` (UUID), `posts/my-blog-post` (slug). The client code has three different code paths for resource identification, each with different validation, encoding, and caching logic.

### Preferred Alternative
Choose one identifier strategy for all public API resources. UUIDs are recommended for public APIs (globally unique, non-predictable, consistent format).

### Refactoring Strategy
1. Choose a single identifier strategy (UUID recommended)
2. Add UUID columns to all resources that use different ID types
3. Support both old and new identifiers during migration
4. Update route model binding to use the new identifier
5. Deprecate and eventually remove old identifier support

### Detection Checklist
- [ ] Multiple identifier types across resources
- [ ] Client code handles different formats
- [ ] Cache key strategy varies by resource
- [ ] No documented identifier strategy
- [ ] New resources must choose identifier type

### Related Rules/Skills/Trees
- Rule: API-URL-004 (Uniform Identifier Strategy)
- Skill: resource-naming-conventions
- Tree: api-consistency

---

## 3. Unnecessary Prefixes

### Category
URL Pollution

### Description
Adding redundant path segments that don't contribute to resource identification — `/api/v1/rest/users` when the API is already on `api.example.com` and is obviously REST.

### Why It Happens
Copy-paste from tutorials or existing projects. "This is how we've always done it." Each prefix seemed reasonable when added, but together they create noise.

### Warning Signs
- `/api/` prefix when API is on `api.` subdomain
- `/rest/` segment in URL path
- Multiple version prefixes (`/v1/api/` or `/api/v1/`)
- URL path segments that don't identify resources
- No functional purpose for the prefix (no routing difference)

### Why Harmful
URL noise without value. Longer URLs increase typo risk and bandwidth. Every prefix is something clients must remember and include. Refactoring requires breaking changes.

### Real-World Consequences
An API at `api.example.com/api/v1/rest/users` — the `api` subdomain already indicates this is an API. The `/api/` prefix is redundant. The `/v1/` version is useful. The `/rest/` prefix adds nothing. Removing `/api/` and `/rest/` would require version bump because client URLs change.

### Preferred Alternative
Use a clean, minimal URL structure. Version prefix (`/v1/`) is useful. `/api/` is redundant when on API subdomain. `/rest/` is always unnecessary.

### Refactoring Strategy
1. Audit current URL path for unnecessary segments
2. Identify which prefixes serve a functional purpose
3. Create cleaner URL structure removing redundant segments
4. Add redirects from old URLs
5. Document the URL structure convention for new endpoints

### Detection Checklist
- [ ] `/api/` prefix on API subdomain
- [ ] `/rest/` segment in URL
- [ ] Duplicate version indicators
- [ ] Path segments that don't identify resources
- [ ] No functional purpose for prefixes

### Related Rules/Skills/Trees
- Rule: API-URL-005 (Minimal URL Structure)
- Skill: url-structure-design
- Tree: api-structure

---

## 4. Verbs in Paths

### Category
Naming Violation

### Description
Embedding action verbs in URL paths — `/users/getActiveUsers`, `/orders/createOrder`, `/products/deleteProduct`. The HTTP method is the verb; repeating it in the URL is redundant and breaks resource-oriented design.

### Why It Happens
Action-oriented thinking patterns. Developers think "I need to get active users" and create `getActiveUsers` instead of thinking "I need users filtered by active status."

### Warning Signs
- URL segments contain get, create, update, delete, activate
- URL paths read as method calls
- Query parameters could express the same operation
- `Route::apiResource()` not used for CRUD
- Action endpoints outnumber resource endpoints

### Why Harmful
URLs no longer identify resources — they identify operations. Clients cannot predict URLs from the resource model. HTTP method semantics are duplicated (method says "GET", URL says "get").

### Real-World Consequences
A client library auto-generates method names from URL paths: `getUsersGetActiveUsers()`. The generated name is unreadable. The developer manually renames it, creating a maintenance burden when the URL changes.

### Preferred Alternative
Use HTTP methods as the verb. Use query parameters for filtering: `GET /users?filter[status]=active`. Use POST action endpoints only for non-CRUD operations.

### Refactoring Strategy
1. Identify verbs in URL paths
2. Express the same operation via resource + query parameters
3. Create POST action endpoints only for non-CRUD operations
4. Add redirects from old verb-based URLs
5. Update client code and documentation

### Detection Checklist
- [ ] Action verbs in URL paths
- [ ] HTTP method redundant with URL verb
- [ ] Query parameters would suffice
- [ ] `apiResource()` not used
- [ ] Action endpoints outnumber CRUD endpoints

### Related Rules/Skills/Trees
- Rule: API-NAMING-003 (HTTP Method as Verb)
- Skill: resource-naming-conventions
- Tree: restful-naming

---

## 5. Mutable Identifiers

### Category
Design Fragility

### Description
Using values that can change over time (email address, username, display name) as the primary resource identifier in URLs. When the value changes, all existing URLs referencing that resource break.

### Why It Happens
Developers choose human-readable identifiers for convenience — `/users/john.doe` is more readable than `/users/abc-123`. They don't consider that email addresses or usernames can change.

### Warning Signs
- Email addresses in URL paths
- Usernames as primary resource identifiers
- Display names or nicknames in URLs
- Identifier value has changed for some resources
- Old URLs return 404 after identifier change

### Why Harmful
Every identifier change breaks all cached, bookmarked, or shared URLs. The resource becomes inaccessible under its original URL. Clients receive 404 for previously working URLs.

### Real-World Consequences
A user changes their email address. All URLs containing their old email now return 404. Search engines have indexed the old URLs. Shared links don't work. The user's profile is effectively gone from the web under its original URL.

### Preferred Alternative
Use immutable identifiers (UUIDs or auto-increment IDs) as the primary resource identifier. Add slugs or usernames as secondary identifiers for readability.

### Refactoring Strategy
1. Add UUID column to resources with mutable identifiers
2. Switch route model binding to use UUID
3. Support old mutable identifiers via slug history or redirects
4. Document that primary identifiers are immutable
5. Add tests verifying identifier immutability

### Detection Checklist
- [ ] Email or username in URL paths
- [ ] Identifier values can change
- [ ] Changed identifiers return 404
- [ ] Slug history not maintained
- [ ] No immutable identifier on resources

### Related Rules/Skills/Trees
- Rule: API-URL-006 (Immutable Identifiers)
- Skill: url-structure-design
- Tree: api-stability
