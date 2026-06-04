# Resource Naming Conventions: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | resource-naming-conventions |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Verbs in URIs** — Embedding action verbs in URL paths instead of using HTTP methods
2. **Deep Nesting** — Exceeding 3 levels of path hierarchy
3. **Mixed Casing** — Using different casing conventions across the same API
4. **Database Names as API** — Exposing database column names and table structures directly as API resources
5. **Auto-Increment in Public URLs** — Using sequential numeric IDs in public API URLs

## Repository-Wide Anti-Patterns

- Inconsistent pluralization — some resources plural, others singular for collections
- Not using `Route::apiResource()` and instead manually defining `create`/`edit` routes
- Identifier type mixing — using UUIDs for some resources and auto-increment IDs for others
- Singularization errors with `Str::singular()` for irregular plurals

---

## 1. Verbs in URIs

### Category
Naming Violation

### Description
Embedding action verbs in URL paths — `/users/getActiveUsers`, `/orders/createOrder`, `/products/deleteProduct`. The HTTP method already encodes the action; repeating it in the URL path is redundant and breaks resource identification.

### Why It Happens
Action-oriented thinking patterns. Developers think in terms of operations rather than resources. Early tutorials and some frameworks use verb-based routing, establishing this as a habit.

### Warning Signs
- URL segments contain words like get, create, update, delete, activate
- URL paths read as method calls (`/users/getActive`)
- Query parameters could express the same filtering
- Laravel's `Route::resource()` not used for CRUD endpoints

### Why Harmful
Clients cannot predict URLs from the resource model — they must memorize verb-action combinations. HTTP caching doesn't work because POST is used for everything. The API becomes RPC-like rather than resource-oriented.

### Real-World Consequences
A new developer joining the team needs to learn all available actions per resource: `getAllUsers`, `getUserByStatus`, `createUser`, `updateUserProfile`, etc. — 20+ custom endpoints per resource. With proper resource naming, they would learn just 5 standard CRUD patterns.

### Preferred Alternative
Use HTTP methods as verbs and URLs for resource identification. Express filtering via query parameters: `GET /users?filter[status]=active`.

### Refactoring Strategy
1. Identify all verb-containing URL patterns
2. Convert to resource-oriented URLs with query parameters
3. Create action endpoints (POST) only for operations that can't be resource-mapped
4. Add redirects from old URLs to maintain backward compatibility
5. Update documentation

### Detection Checklist
- [ ] URL paths contain action verbs
- [ ] Method verbs appear in path segments
- [ ] Non-CRUD endpoints outnumber CRUD endpoints
- [ ] Query parameters could replace verb-based endpoints
- [ ] `Route::apiResource()` not used

### Related Rules/Skills/Trees
- Rule: API-NAMING-001 (No Verbs in URLs)
- Skill: url-structure-design
- Tree: restful-naming

---

## 2. Deep Nesting

### Category
Structural Fragility

### Description
Creating URL hierarchies that exceed 3 levels — `/schools/1/departments/2/courses/3/students/4/enrollments/5`. Deep nesting makes URLs fragile, long, and error-prone for clients.

### Why It Happens
Directly mapping database foreign key relationships to URL hierarchy. If tables A→B→C→D have foreign keys, the URL mirrors this chain.

### Warning Signs
- URLs with 4+ path segments
- Route definitions with 4+ nested parameters
- High error rates on deeply nested endpoints
- URLs exceeding 100 characters
- Difficulty adding new resources that need different parent relationships

### Why Harmful
Deep URLs are fragile — changing one parent ID breaks the entire chain. Route binding performs N queries for N nesting levels. Clients must construct complex URLs with multiple parent identifiers.

### Real-World Consequences
A course enrollment API uses `/schools/{school}/departments/{dept}/courses/{course}/students/{student}/enrollments`. The school's ID changes during a data migration. Every enrollment URL in the system is now invalid, requiring a full data migration of cached URLs.

### Preferred Alternative
Limit nesting to 2-3 levels. Use shallow nesting with global resource identifiers beyond that: `/enrollments/{enrollment}` with filtering by related resources.

### Refactoring Strategy
1. Identify URLs with 3+ nesting levels
2. Promote deeply nested resources to top-level routes with global IDs
3. Keep nesting only for collections that show context (e.g., `/users/{user}/orders`)
4. Use query parameter filtering for cross-resource queries
5. Add tests for URL length and nesting depth

### Detection Checklist
- [ ] URLs with 4+ path segments exist
- [ ] Route definitions with 4+ nested parameters
- [ ] Route model binding performs 4+ queries per request
- [ ] Client error rates correlate with nesting depth
- [ ] Resource IDs depend on multiple parent IDs

### Related Rules/Skills/Trees
- Rule: API-URL-002 (Nesting Depth Limit)
- Skill: url-structure-design
- Tree: api-structure

---

## 3. Mixed Casing

### Category
Inconsistency

### Description
Using different casing conventions within the same API — some endpoints use kebab-case (`/order-items`), others snake_case (`/order_items`), others camelCase (`/orderItems`). This creates an inconsistent and confusing API surface.

### Why It Happens
Different developers on the team use different conventions. Laravel internally uses snake_case, while frontend developers prefer camelCase. No style guide exists.

### Warning Signs
- URLs use a mix of casing styles
- Same resource referenced with different casing in different endpoints
- Cache entries split by casing (`/order-items` vs `/orderItems`)
- Client code must handle multiple URL formats for the same resource

### Why Harmful
Inconsistent casing splits caching (same resource cached under multiple URLs), confuses clients, and signals poor API design quality. Each new developer must learn the pattern for each endpoint individually.

### Real-World Consequences
A CDN caches `/order-items` and `/orderItems` as different entries because the URLs are case-sensitive. Cache hit rate drops by 40% because traffic splits across the two URL formats.

### Preferred Alternative
Adopt kebab-case (industry standard for URLs) consistently across all endpoints. Enforce via coding standards and CI checks.

### Refactoring Strategy
1. Choose a casing convention (kebab-case recommended)
2. Rename all endpoints to use the chosen convention
3. Add redirects from old URLs
4. Add CI check that rejects non-conforming route names
5. Update client code and documentation

### Detection Checklist
- [ ] Multiple casing styles in URLs
- [ ] Same resource accessible via different casing
- [ ] Cache entries split by casing
- [ ] No casing convention documented in style guide
- [ ] Client code handles multiple casing patterns

### Related Rules/Skills/Trees
- Rule: API-CONSISTENCY-002 (Casing Standardization)
- Skill: resource-naming-conventions
- Tree: api-consistency

---

## 4. Database Names as API

### Category
Leaky Abstraction

### Description
Exposing database table and column names directly as API resource names and field names. For example, `/users_categories` for a pivot table, or field `usr_role_cd` from a legacy database column.

### Why It Happens
Convenience — the API is auto-generated from the database schema. ORM tools and some scaffolding packages generate API endpoints from model/database names without translation.

### Warning Signs
- Resource names match database table names exactly
- Field names include database column abbreviations
- Pivot table names appear as API resources
- Database column types exposed in API field names (e.g., `is_admin_int`)
- Underscore-heavy field names from database conventions

### Why Harmful
The API exposes internal database design decisions that clients shouldn't depend on. Renaming a database column or table breaks the API. Database-specific naming conventions confuse API consumers.

### Real-World Consequences
A database migration renames `usr_role_cd` to `user_role_code`. The API field name changes, breaking all clients that parse `usr_role_cd`. With a proper domain name (`role`), the API wouldn't have changed.

### Preferred Alternative
Design API resource names and fields around the domain model, not the database schema. Translate between API and database in a transformation layer (resources, DTOs).

### Refactoring Strategy
1. Map database table names to domain-appropriate resource names
2. Map database column names to domain-appropriate field names
3. Add API resource classes to handle mapping
4. Add architecture test preventing database names in API
5. Support both old and new field names during migration

### Detection Checklist
- [ ] Resource names match database table names
- [ ] Field names use database naming conventions
- [ ] Pivot tables exposed as resources
- [ ] Database column abbreviations in API fields
- [ ] Database type names in API field names

### Related Rules/Skills/Trees
- Rule: API-NAMING-002 (Domain-Oriented Naming)
- Skill: rest-architectural-constraints
- Tree: api-design

---

## 5. Auto-Increment in Public URLs

### Category
Security/Privacy Risk

### Description
Using auto-increment integer IDs in public API URL paths — `/users/42`, `/orders/99`. These expose record count, growth rate, and enable sequential enumeration of all resources.

### Why It Happens
Laravel defaults to auto-increment IDs. Route model binding uses `id` by default. Developers don't consider the security implications of sequential IDs in URLs.

### Warning Signs
- All URLs use integer IDs like `/users/1`, `/users/2`
- A competitor can determine user count by checking the highest ID
- Sequential enumeration reveals all resource IDs
- ID in URL reveals growth rate (comparing IDs over time)

### Why Harmful
Competitors can estimate user count by checking the highest user ID. Attackers can enumerate all resources sequentially. Sequential IDs expose business metrics (order volume, user growth) that may be confidential.

### Real-World Consequences
A competitor scrapes all user profiles by incrementing `/users/1`, `/users/2`... `/users/50000`. They now know the exact user count, growth rate, and have collected all public profile data.

### Preferred Alternative
Use UUIDs for public API resources. Laravel supports UUIDs natively via `Route::keyType('uuid')` or custom route bindings.

### Refactoring Strategy
1. Add UUID column to models exposed via public API
2. Configure route model binding to use UUID instead of ID
3. Support both ID and UUID lookup during migration
4. Update all client integrations to use UUIDs
5. Eventually deprecate ID-based URLs

### Detection Checklist
- [ ] Public API URLs use auto-increment IDs
- [ ] Sequential enumeration is possible
- [ ] Record count is derivable from URLs
- [ ] No UUID support in public endpoint URLs
- [ ] Competitors could estimate growth from IDs

### Related Rules/Skills/Trees
- Rule: API-SEC-006 (Non-Predictable Identifiers)
- Skill: url-structure-design
- Tree: security-hardening
