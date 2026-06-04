# HATEOAS / Hypermedia Controls: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | hateoas-hypermedia-controls |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Full HATEOAS Without Client Buy-In** — Server requires full hypermedia navigation but clients hardcode URLs from documentation
2. **Links on Every Response Without Consideration** — Adding the same link set to every resource regardless of state or authorization
3. **Hardcoded href Values** — Using string concatenation instead of `route()` helper for link URLs
4. **Authorization in Links** — Embedding tokens or auth state in link URLs
5. **Resource Links Without Method** — Link objects missing the HTTP method field

## Repository-Wide Anti-Patterns

- Inconsistent link object structure across different resource types
- Per-item link generation causing N+1 authorization queries in collections
- Circular link graphs that naive clients could follow indefinitely
- Link `rel` values that change after release, breaking client code

---

## 1. Full HATEOAS Without Client Buy-In

### Category
Over-Engineering

### Description
Implementing full hypermedia-driven navigation (Level 3 REST) with state-driven links, dynamic action discovery, and API root entry points — but no client uses the hypermedia features. Clients hardcode URLs from documentation, ignoring the `_links` objects entirely.

### Why It Happens
Architectural purity — the belief that "true REST requires HATEOAS." Server teams implement hypermedia without understanding how clients consume the API.

### Warning Signs
- `_links` objects are present but client code uses hardcoded URLs
- Analytics show no client navigation via hypermedia links
- Client SDK generation ignores link objects
- Documentation describes URL patterns, not link discovery

### Why Harmful
Significant server complexity (link computation, authorization checks, state-driven logic) with zero client benefit. Response payloads are 10-30% larger due to link objects. The effort could have been spent on Level 2 correctness.

### Real-World Consequences
A team spends three sprints implementing full HATEOAS with state-driven links and authorization-aware link computation. After release, analytics show zero clients using `_links` — all consumers hardcode URLs from the documentation.

### Preferred Alternative
Start with self links and pagination links only. Add state-driven links incrementally when clients demonstrate usage. Invest in Level 2 correctness (HTTP methods, status codes, resource design) first.

### Refactoring Strategy
1. Remove unused action links from responses
2. Keep self links and pagination links (they provide value)
3. Add link usage analytics before implementing more hypermedia
4. Document that the API is Level 2 RESTful, not Level 3 REST

### Detection Checklist
- [ ] Full HATEOAS links present but no client uses them
- [ ] Client SDK code hardcodes URL paths
- [ ] No link usage tracking exists
- [ ] API documentation doesn't reference link discovery
- [ ] Removing links doesn't break any client

### Related Rules/Skills/Trees
- Rule: API-ARCH-004 (Appropriate Abstraction)
- Skill: rest-maturity-model
- Tree: pragmatic-design

---

## 2. Links on Every Response Without Consideration

### Category
Security/Performance Waste

### Description
Adding the same set of links to every resource regardless of its state or the client's authorization level. Links to actions the client cannot perform (403 if followed) are included anyway.

### Why It Happens
Computing state-driven links requires authorization checks and state awareness. It's easier to add a static set of links to every resource and let clients discover blocked actions via 403 responses.

### Warning Signs
- Same links appear for all resources of a type regardless of state
- Deleted/discontinued resources still show update/delete links
- Unauthenticated responses include links that require authentication
- `/users/42` shows same links as `/users/99` regardless of ownership

### Why Harmful
Clients display action buttons that will fail when clicked. This erodes trust in the API's link accuracy and requires clients to handle 403 responses from followed links. Server bandwidth is wasted transmitting useless link objects.

### Real-World Consequences
A UI framework renders action buttons based on `_links`. It shows "Edit" and "Delete" for every resource. Users click these buttons and consistently receive 403 errors, reporting the application as broken.

### Preferred Alternative
Compute links conditionally based on resource state and client authorization. Only include links the client can successfully follow.

### Refactoring Strategy
1. Add authorization checks to link computation
2. Implement state-driven link logic (deleted → restore, not update)
3. Batch authorization checks for collections to avoid N+1 queries
4. Test that link sets change appropriately for different states

### Detection Checklist
- [ ] Same links appear regardless of resource state
- [ ] Unauthorized clients receive links to protected actions
- [ ] Deleted resources show update/delete links
- [ ] Collection items all have identical link sets

### Related Rules/Skills/Trees
- Rule: API-LINK-001 (State-Driven Links)
- Skill: resource-controllers
- Tree: hypermedia-design

---

## 3. Hardcoded href Values

### Category
Maintainability Risk

### Description
Building link URLs using string concatenation or interpolation instead of Laravel's `route()` helper with named routes. For example, `"href": "/api/users/" . $user->id` instead of `route('users.show', $user)`.

### Why It Happens
String concatenation is more visible and feels more direct than calling a helper function. Developers see the exact URL in the code and assume it's correct.

### Warning Signs
- Link href values constructed with string concatenation
- Named routes exist but aren't used for link generation
- Link URLs break when route definitions change
- Different environments produce the same (wrong) href values

### Why Harmful
Hardcoded URLs break when routes change, when the API is deployed to different environments (staging vs. production), or when URL structure is updated. Every hardcoded URL is a maintenance liability.

### Real-World Consequences
The team renames `users.show` route to `users.profile` and updates all controllers. But link generation code used `"/api/users/$user->id"` and continues generating old URLs. All client hypermedia links are now broken.

### Preferred Alternative
Always use `route()` helper with named routes for link generation. This ensures correct URLs in all environments and automatic updates when routes change.

### Refactoring Strategy
1. Find all hardcoded URL strings in resource classes
2. Replace with `route()` calls using named routes
3. Add a test that verifies a URL is generated for each named route
4. Verify link URLs change correctly across environments

### Detection Checklist
- [ ] Link href uses string concatenation
- [ ] Named routes exist but not used for links
- [ ] URL changes break links
- [ ] Same href generated regardless of `APP_URL`

### Related Rules/Skills/Trees
- Rule: API-ROUTE-003 (Named Route Usage)
- Skill: url-structure-design
- Tree: maintainability

---

## 4. Authorization in Links

### Category
Security Risk

### Description
Embedding authorization tokens, API keys, or session identifiers directly in hypermedia link URLs. For example, `"href": "/api/users/42?token=abc123"` or `"href": "/api/users/42?session=xyz789"`.

### Why It Happens
Convenience for the client — the link includes everything needed to make the request. Developers see this as "helpful" for simplifying client code.

### Warning Signs
- Link URLs contain query parameters with tokens or keys
- Link URLs include session identifiers
- Links are only valid for the current client session
- Sharing a link URL gives access to the resource

### Why Harmful
Token exposure in URLs — URLs are logged by proxies, saved in browser history, and transmitted in Referer headers. Embedded tokens can be leaked to third parties. Links cannot be cached (they're per-user).

### Real-World Consequences
A support agent copies a link from an API response and pastes it into a ticket. The embedded token is now visible to everyone with ticket access, compromising the user's account.

### Preferred Alternative
Include authorization context in the `Authorization` header, not the URL. Links should be standalone identifiers that the client authenticates separately.

### Refactoring Strategy
1. Remove tokens/keys from link URLs
2. Move authentication to `Authorization` header
3. Ensure links are cacheable (same URL for all authorized clients)
4. Audit logs for URL parameter exposure

### Detection Checklist
- [ ] Link URLs contain auth tokens or session IDs
- [ ] Links are client-specific (different per user)
- [ ] Links can't be cached or shared safely
- [ ] URL logging shows auth parameters

### Related Rules/Skills/Trees
- Rule: API-SEC-004 (Credentials in Headers, Not URLs)
- Skill: sensitive-data-leak-prevention
- Tree: security-basics

---

## 5. Resource Links Without Method

### Category
Incomplete Contract

### Description
Link objects include the `href` URL but omit the HTTP `method` (or `verb`) field. Clients know the link target but don't know which HTTP method to use when following it.

### Why It Happens
The developer assumes GET is the default method, or focuses on the URL as the primary link information. The method field seems redundant to someone who knows the API conventions.

### Warning Signs
- Link objects contain `href` but no `method` or `verb` field
- Client code must infer the HTTP method from context
- Different resources use different methods for similar link relations
- Client documentation specifies "for this link, use POST"

### Why Harmful
Clients cannot programmatically follow links without knowing the HTTP method. They must hardcode method-per-link-relation mappings, defeating the purpose of hypermedia discoverability.

### Real-World Consequences
A generated client SDK inspects `_links` to build API methods. When it finds a link without a method, the SDK defaults to GET, causing the request to fail with 405 Method Not Allowed.

### Preferred Alternative
Always include the HTTP method in every link object. Use a consistent structure: `{'href': '...', 'method': 'GET'}`.

### Refactoring Strategy
1. Add `method` field to all link objects
2. Use consistent field naming (`method` vs `verb` — pick one)
3. Update documentation to specify the link object structure
4. Test that all link objects include both href and method

### Detection Checklist
- [ ] Link objects missing `method` field
- [ ] Client code hardcodes method per link relation
- [ ] No consistent link object schema documented
- [ ] Different response types use different link structures

### Related Rules/Skills/Trees
- Rule: API-LINK-002 (Complete Link Objects)
- Skill: response-structures
- Tree: api-consistency
