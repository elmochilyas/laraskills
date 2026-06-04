# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Groups
**Generated:** 2026-06-03

---

# Decision Inventory

* Attribute Merging Strategy (Middleware vs Prefix vs Name)
* Shallow Nesting vs Deep Nesting for Group Hierarchy
* Domain-Based Groups vs Prefix-Based Groups
* Group-as-Organization vs Group-for-Shared-Attributes

---

# Architecture-Level Decision Trees

---

## Decision 1: Attribute Merging Strategy (Middleware vs Prefix vs Name)

---

## Decision Context

How to organize route group attributes — which attributes to define at which nesting level to achieve predictable merging.

---

## Decision Criteria

* Which attributes are shared by all routes in the group
* Whether nested groups add or replace attributes
* Whether the merge behavior for each attribute type is understood

---

## Decision Tree

Do all routes in the group share the same middleware stack?
↓
YES → Define middleware at the outermost group — middleware arrays merge across levels
NO → Define middleware per route — group-level middleware adds to all routes
NO → Is there a URL prefix shared by the group?
    ↓
    YES → Define prefix at the outermost group — prefixes concatenate with `/`
    NO → Is there a route name prefix shared by the group?
        ↓
        YES → Define name at the outermost group — name prefixes prepend with `.`
        NO → Does the group need a domain constraint?
            ↓
            YES → Define domain at the outermost group — child domain replaces parent (does not merge)
            NO → The group may not be needed

---

## Rationale

Group attribute merging rules differ by attribute type: middleware arrays merge (no dedup), prefixes concatenate with `/`, names prepend with `.`, domains replace, `where` merges. Understanding these rules is essential for correct group composition. Middleware merging is additive-only — you cannot remove middleware inherited from a parent group.

---

## Recommended Default

**Default:** Define shared middleware, prefix, and name at the outermost group. Use inner groups to add targeted attributes. Avoid relying on middleware deduplication (there is none).
**Reason:** Outermost definitions are most visible and affect all routes. Inner additions are incremental and easier to reason about.

---

## Risks Of Wrong Choice

* Middleware merge without dedup: Middleware registered twice runs twice on the same route
* Name prefix without trailing dot: `Route::name('admin')` produces `adminusers.index` instead of `admin.users.index`
* Domain in child: Child domain replaces parent; routes may unexpectedly match different domains
* Deep nesting with mixed merge rules: Impossible to trace effective attributes without `php artisan route:list`

---

## Related Rules

* Always Name Routes
* Keep Global Middleware Minimal

---

## Related Skills

* Organize Routes with Group Attribute Merging
* Define Nested Groups with Predictable Attribute Inheritance

---

---

## Decision 2: Shallow Nesting vs Deep Nesting for Group Hierarchy

---

## Decision Context

How many levels of group nesting to use when organizing routes.

---

## Decision Criteria

* Number of distinct attribute layers needed
* Whether developers can trace the effective attribute set for any route
* Whether the team understands attribute merging rules

---

## Decision Tree

Do routes need more than 2 levels of attribute grouping?
↓
NO → Shallow nesting — 1-2 levels is manageable; attribute merging is traceable
YES → Can the hierarchy be flattened by combining attributes?
    ↓
    YES → Flatten to 2 levels — combine middleware, prefix, and name into fewer groups
    NO → Are the 3+ levels strictly necessary for domain isolation?
        ↓
        YES → Acceptable with strict documentation — document each route's effective attribute set
        NO → Flatten — deep nesting is a maintenance risk
NO → Does the team understand middleware merge, prefix concatenation, and name prepend?
    ↓
    YES → 3 levels may be acceptable — but document the merging behavior
    NO → Limit to 2 levels — cascading merge rules are non-obvious

---

## Rationale

Beyond 2 levels, the cascading attribute merging becomes non-obvious. Developers must trace through multiple group closures to understand which middleware, prefix, and name apply to a given route. Each level doubles the cognitive load. The `php artisan route:list` command shows the effective result but doesn't show how it was derived.

---

## Recommended Default

**Default:** Maximum 2 levels of group nesting. Use explicit attribute declarations on inner groups rather than relying on deep inheritance.
**Reason:** At 2 levels, merging is traceable. At 3+, developers cannot determine effective attributes without tooling.

---

## Risks Of Wrong Choice

* 4+ levels: Impossible to determine effective middleware list without route:list
* Middleware duplication: Nested groups each adding middleware without dedup — 12 middleware on a single route
* Merge rule misunderstanding: Developer assumes child replaces parent middleware (it merges); routes have unexpected middleware
* Name prefix concatenation error: `admin.` outer + `users.` inner = `admin.users.` — correct; `admin` outer = `adminusers.` — wrong

---

## Related Rules

* Always Name Routes
* Keep Global Middleware Minimal

---

## Related Skills

* Organize Routes with Group Attribute Merging
* Define Nested Groups with Predictable Attribute Inheritance

---

---

## Decision 3: Domain-Based Groups vs Prefix-Based Groups

---

## Decision Context

Whether to isolate route groups by domain (subdomain) or by URL prefix.

---

## Decision Criteria

* Whether different domains serve different content
* Whether the application needs domain-level route isolation
* Whether deployment infrastructure supports domain routing

---

## Decision Tree

Do different segments of the application serve different domains (admin.example.com, api.example.com)?
↓
YES → Domain-based groups — `Route::domain('admin.example.com')->group(...)` isolates routes by domain
NO → Is the application a single domain with multiple URL sections?
    ↓
    YES → Prefix-based groups — `Route::prefix('admin')->group(...)` organizes by URL path
    NO → Is domain-level isolation needed for security?
        ↓
        YES → Domain-based groups — admin on separate subdomain adds network-level security layer
        NO → Prefix-based groups — simpler infrastructure; no DNS or certificate management
NO → Does the application serve both web and API?
    ↓
    YES → Both — default `routes/web.php` and `routes/api.php` use different middleware stacks; prefix vs domain depends on deployment
    NO → Choose based on whether subdomain separation is needed

---

## Rationale

Domain-based groups provide stronger isolation — routes on `admin.example.com` are inaccessible from `example.com` without explicit cross-domain access. Prefix-based groups are simpler but share the same domain. Domain-based routing requires DNS configuration and SSL certificates for each subdomain.

---

## Recommended Default

**Default:** Prefix-based groups for most applications. Domain-based groups only when subdomain isolation is architecturally required (admin panel separated for security, multi-tenant subdomains).
**Reason:** Prefix-based routing is simpler to deploy and requires no additional infrastructure. Domain-based routing adds deployment complexity.

---

## Risks Of Wrong Choice

* Domain group without DNS: Subdomain not configured; routes return DNS resolution errors
* Domain group on wrong server: Subdomain routes to different server; routes don't match
* Prefix for security isolation: Shared domain means cookies, localStorage, and CSRF tokens are accessible to all routes
* Domain group in development: Localhost doesn't support subdomains without `/etc/hosts` or `localhost` configurations

---

## Related Rules

* Always Name Routes
* Name Every Route for URL Generation

---

## Related Skills

* Organize Routes with Group Attribute Merging
* Configure Domain-Based Route Groups for Subdomain Isolation

---

---

## Decision 4: Group-as-Organization vs Group-for-Shared-Attributes

---

## Decision Context

Whether to create route groups purely for visual organization or only when routes share attributes.

---

## Decision Criteria

* Whether the routes in the group share middleware, prefix, or name attributes
* Whether the group is purely cosmetic (wrapping unrelated routes)
* Whether group nesting is needed for organization only

---

## Decision Tree

Do the routes in the group share any attributes (middleware, prefix, name, domain)?
↓
YES → Group-for-shared-attributes — the group has functional purpose beyond organization
NO → Is the group purely for visual organization?
    ↓
    YES → Remove the group — use comments or separate route files instead
    NO → Does the group provide no functional benefit?
        ↓
        YES → Remove the group — groups should only exist when attributes are shared
        NO → Keep — if routes are semantically related, group may provide organizational clarity even without shared attributes
NO → Is the group used to apply attributes to future routes (convenience, not current)?
    ↓
    YES → Keep — if the group is a template for future additions; document the intended attributes
    NO → Remove — cosmetic groups add nesting without benefit

---

## Rationale

Route groups exist to apply shared attributes to multiple routes. A group without shared attributes adds nesting and indentation without functional benefit. Use comments or separate files for visual organization. Groups also affect route registration order — wrapping a route in a group changes its position in the route collection.

---

## Recommended Default

**Default:** Create groups only when routes share middleware, prefix, or name attributes. Use comments or separate files for visual organization.
**Reason:** Groups add nesting complexity. Without shared attributes, the nesting provides no benefit and obscures the route structure.

---

## Risks Of Wrong Choice

* Group without shared attributes: Adds nesting, indentation, and visual noise without benefit
* Group for future attributes: If attributes are never added, the group is permanently cosmetic
* Group that applies unintended middleware: Group middleware wraps all routes even if some don't need it
* Group that is too broad: Adding middleware to the group adds it to all routes, even those that should be excluded

---

## Related Rules

* Always Name Routes
* Keep Global Middleware Minimal

---

## Related Skills

* Organize Routes with Group Attribute Merging
* Define Nested Groups with Predictable Attribute Inheritance
