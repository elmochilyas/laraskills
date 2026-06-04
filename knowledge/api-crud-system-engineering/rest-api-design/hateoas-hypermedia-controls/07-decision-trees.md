# HATEOAS / Hypermedia Controls — Decision Trees

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: hateoas-hypermedia-controls
- Phase: 7-decision-trees
- Last Updated: 2026-06-02

## Decision Inventory

| ID | Decision | When Relevant |
|----|----------|---------------|
| D1 | Which hypermedia links to include per resource | Every resource response |
| D2 | How to generate link URLs | Every link object |
| D3 | How to handle link authorization in collections | Paginated collection responses |
| D4 | Which pagination links to generate | Collection responses with pagination |
| D5 | How to structure the link object | All hypermedia responses |
| D6 | Whether to provide an API root entry point | API version deployment |

## Architecture-Level Decision Trees

### D1: Which hypermedia links to include per resource

**Decision Context:**
Every resource response can include multiple HATEOAS links (self, related, action). Including too few links reduces discoverability; including too many adds payload overhead and may include links the client cannot actually use.

**Criteria:**
- Does the resource have a canonical URL? (always yes)
- Are there related resources the client may need to navigate to?
- Are there state-dependent actions available (activate, deactivate, restore)?
- Is the client authorized to perform those actions?
- Does the link change based on resource state?

**Decision Tree:**

```
Is this a singular resource response or part of a collection?
├── Singular resource
│   ├── Always include: self link (href + method)
│   ├── For each potential link:
│   │   ├── Is the client authorized for this action?
│   │   │   ├── YES → Is the action relevant to current resource state?
│   │   │   │   ├── YES → Include the link
│   │   │   │   └── NO → Skip the link
│   │   │   └── NO → Skip the link
│   └── Result: self + authorized/state-relevant action links
│
└── Part of a collection
    ├── Always include: self link on each item
    ├── Batch authorization check first (avoid N+1)
    │   ├── Items authorized for action X → mark them
    │   ├── Items not authorized → no link
    │   └── Result: per-item links based on pre-computed auth
    └── Pagination links at collection level (see D4)
```

**Rationale:**
Self links provide universal value as the minimum HATEOAS element. Action links should only be included when the client can successfully follow them. Including unauthorizable links erodes trust in link accuracy. Batch authorization prevents N+1 query problems on collections.

**Default Decision:**
Always include `self` link with `href` and `method`. Add state-driven action links conditionally based on authorization and resource state.

**Risks:**
- Including links for unauthorized actions leads to client frustration (403 on follow)
- Skipping links the client needs reduces discoverability
- Per-item auth checks in collections cause N+1 performance problems

**Related Rules:**
- Always Include Self Link On Every Resource
- Only Include Actionable Links
- Batch Authorization Checks For Collection Link Generation

**Related Skills:**
- Top-Level Meta and Links
- JSON:API Resource Structure
- REST Maturity Model

---

### D2: How to generate link URLs

**Decision Context:**
Link URLs must be correct across all environments (local, staging, production). The method of URL generation determines whether links break when the environment or route structure changes.

**Criteria:**
- Is the link internal (same Laravel app) or external (third-party system)?
- Is the route registered with a named route?
- Does the environment change the base URL (APP_URL)?

**Decision Tree:**

```
Is the link to an internal resource within this Laravel application?
├── YES
│   ├── Does the target have a named route?
│   │   ├── YES → Use route() helper with named route
│   │   └── NO → Register a named route first, then use route() helper
│   └── Result: route('users.show', $user) — environment-aware, restructure-proof
│
└── NO (external system / third-party URL)
    ├── Is the URL configurable (different per environment)?
    │   ├── YES → Read from config file
    │   └── NO → Hardcode as a constant
    └── Result: config('services.external.url') or explicitly documented constant
```

**Rationale:**
Named routes with `route()` helper abstract the actual URL pattern. Changing a route pattern updates all links automatically. Hardcoded strings break when the environment changes (localhost vs production, different domain names).

**Default Decision:**
Always use `route()` helper with named routes for internal URLs.

**Risks:**
- `route()` may generate wrong URL if `APP_URL` is misconfigured
- Hardcoded URLs break silently when environments change
- Missing named routes force developers to use string concatenation

**Related Rules:**
- Use Named Routes With route() Helper For Link Generation

**Related Skills:**
- URL Structure Design
- Route Model Binding

---

### D3: How to handle link authorization in collections

**Decision Context:**
Collections returning 100+ items require per-item link generation. Performing individual authorization checks inside resource serialization creates N+1 query problems.

**Criteria:**
- How large is the collection (items count)?
- Is the authorization check database-backed (policy query)?
- Can authorization be pre-computed before serialization?

**Decision Tree:**

```
Will the collection contain more than 20 items?
├── YES
│   ├── Can authorization be pre-computed in the controller?
│   │   ├── YES → Batch authorize all items before serialization
│   │   │   └── Example: preload updatable IDs, pass to resource
│   │   └── NO → Consider caching auth results or restructuring
│   └── Outcome: N+1 prevented, performance preserved
│
└── NO (small collection or single item)
    ├── Is the auth check cheap (in-memory, no queries)?
    │   ├── YES → Individual check inside resource is acceptable
    │   └── NO → Still prefer batch check for consistency
    └── Outcome: Single queries acceptable, batch preferred
```

**Rationale:**
Individual `$request->user()->can('update', $item)` inside a resource's `toArray()` triggers one database query per item via policy lookups. A 100-item collection with 4 link checks produces 400+ queries. Batch checks reduce this to a single query.

**Default Decision:**
Always batch authorization checks in the controller before passing data to resources. Pre-compute `$item->can_update` flags.

**Risks:**
- Batch auth requires controller-level changes
- Pre-computed flags couple controller and resource logic
- Edge case: authorization may change between batch check and follow

**Related Rules:**
- Batch Authorization Checks For Collection Link Generation

**Related Skills:**
- Pagination Strategies
- Resource Controllers

---

### D4: Which pagination links to generate

**Decision Context:**
Paginated collection responses can include links to navigate pages. Generating all page links for large result sets wastes bandwidth without providing value.

**Criteria:**
- How many pages exist in the result set?
- Does the client need random access to specific pages?
- Are page URLs stable (do not change with data updates)?

**Decision Tree:**

```
How many pages are in the result set?
├── Single page (total_pages <= 1)
│   └── Outcome: self link only; no navigation links needed
│
├── Fewer than 10 pages
│   ├── Does the client explicitly need all page URLs?
│   │   ├── YES → Generate self, first, prev, next, last + per-page links
│   │   └── NO → Generate self, first, prev, next, last only
│   └── Outcome: Standard 5 links (plus optional per-page)
│
└── 10+ pages (large result set)
    └── Always: self, first, prev, next, last only
        Outcome: 5 links max regardless of page count
```

**Rationale:**
A 500-page result set with per-page links adds ~50KB overhead. Standard pagination links (first, prev, next, last) provide sufficient navigation. Clients only need to move forward, backward, or jump to the ends.

**Default Decision:**
Generate only self, first, prev, next, and last pagination links.

**Risks:**
- Clients that need random page access must construct URLs manually
- Page URLs may become stale as data changes
- Removing per-page links after adding them is a breaking change

**Related Rules:**
- Generate Only First/Prev/Next/Last For Pagination Links

**Related Skills:**
- Pagination Metadata Design
- Cursor Pagination Metadata

---

### D5: How to structure the link object

**Decision Context:**
Each link object should contain sufficient information for the client to follow it. Missing metadata (like the HTTP method) forces clients to guess or maintain external mappings.

**Criteria:**
- Can the client determine the HTTP method from the rel value alone?
- Is the rel value an IANA standard?
- Does the client need additional metadata (title, type)?

**Decision Tree:**

```
Is the rel value IANA-standardized (self, next, prev, first, last)?
├── YES
│   ├── Even so, always include method field
│   │   └── Reason: consistency across all links
│   └── Structure: { "rel": "self", "href": "...", "method": "GET" }
│
└── NO (custom rel like "cancel", "pay", "restore")
    ├── Include method — mandatory for custom rels
    ├── Consider adding "title" for human-readable description
    └── Structure: { "rel": "cancel", "href": "...", "method": "POST", "title": "Cancel this order" }
```

**Rationale:**
Clients need to know which HTTP method to use when following a link. A `self` link uses GET, an `update` link uses PUT, a `delete` link uses DELETE. Without the `method` field, clients must guess or maintain a separate mapping.

**Default Decision:**
Every link object includes `rel`, `href`, and `method` fields. Custom rels additionally include `title`.

**Risks:**
- Clients may ignore method and use wrong HTTP verb
- Adding fields later is non-breaking; removing fields is breaking
- Inconsistent structure across resources confuses clients

**Related Rules:**
- Include Method In Every Link Object
- Use Consistent Link Rel Values Across The API

**Related Skills:**
- Envelope Response Design
- JSON:API Resource Structure

---

### D6: Whether to provide an API root entry point

**Decision Context:**
An API root endpoint (`GET /api`) can return links to all available top-level resources. This benefits discoverability but adds maintenance overhead.

**Criteria:**
- Is the API public with multiple resource types?
- Are clients expected to discover endpoints dynamically?
- Is the URL structure likely to evolve?
- Does any client actually use hypermedia discovery?

**Decision Tree:**

```
Is this a public API with multiple resource types?
├── YES
│   ├── Do clients use hypermedia discovery or hardcode URLs?
│   │   ├── Hypermedia discovery → Provide full API root with all resource links
│   │   └── Hardcode URLs → Skip API root or provide minimal version
│   └── Outcome: API root useful even if unused — provides entry point
│
└── NO (private/internal API, single consumer)
    ├── Does the consumer hardcode all URLs from documentation?
    │   ├── YES → Skip API root (no value)
    │   └── NO → Provide minimal API root
    └── Outcome: API root optional; prioritize consumer needs
```

**Rationale:**
The API root is the entry point for hypermedia-driven clients. It provides a single URL that a client can use to discover all available resources. Without it, clients must hardcode resource URLs from documentation.

**Default Decision:**
Provide an API root endpoint (`GET /api`) returning `_links` to all top-level resources.

**Risks:**
- API root must be maintained as resources are added/removed
- May expose resources that should be discovered through other means
- Little value if no client uses it

**Related Rules:**
- Include API Root Links For Discoverability

**Related Skills:**
- Top-Level Meta and Links
- REST Maturity Model
