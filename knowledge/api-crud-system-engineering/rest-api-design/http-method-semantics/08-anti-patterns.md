# HTTP Method Semantics: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | http-method-semantics |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **POST Everything** — Using POST for all operations regardless of semantics
2. **GET for Writes** — Using GET requests to trigger server-side state changes
3. **PUT for Partial Updates** — Using PUT but only sending changed fields
4. **DELETE with Body** — Sending a request body with DELETE requests
5. **Custom Methods in URL** — Embedding action verbs in URL paths (e.g., `/users/getActiveUsers`)

## Repository-Wide Anti-Patterns

- Using `Route::resource()` (with `create`/`edit` routes) instead of `Route::apiResource()` for APIs
- Mixing PUT and PATCH inconsistently across update endpoints
- Not returning 204 for successful DELETE responses

---

## 1. POST Everything

### Category
HTTP Semantics Violation

### Description
Using POST for all API operations — reads, writes, updates, deletes — regardless of the operation's safety or idempotency characteristics. The API effectively becomes RPC-over-HTTP with a single verb.

### Why It Happens
POST is the most permissive HTTP method (no constraints). Stripe and other successful APIs use POST for everything, leading developers to believe it's acceptable practice.

### Warning Signs
- All API route definitions use `Route::post()`
- No GET, PUT, PATCH, or DELETE routes exist
- Response caching doesn't work (POST responses aren't cacheable by intermediaries)
- Clients cannot rely on idempotency for retries

### Why Harmful
HTTP intermediaries (CDNs, proxies, browsers) cannot cache responses, perform automatic retries, or optimize pre-fetching. The API loses the core benefits of HTTP protocol semantics. Clients must implement their own caching and retry logic.

### Real-World Consequences
A mobile app repeatedly fetches user data via POST because "POST for everything." The response cannot be cached by the CDN or browser, so every app launch triggers a full server round-trip, increasing latency and server load 10x compared to a cached GET.

### Preferred Alternative
Use HTTP methods according to their defined semantics: GET for reads, POST for creates, PUT for full replacement, PATCH for partial updates, DELETE for removal.

### Refactoring Strategy
1. Classify each endpoint by operation type (read, create, update, delete)
2. Replace POST with the correct HTTP method for each
3. Update route definitions in `routes/api.php`
4. Adjust controllers to handle method-specific semantics (idempotency for PUT/DELETE)
5. Update client code to use correct methods
6. Add version bump if this is a breaking change

### Detection Checklist
- [ ] All or most routes use POST
- [ ] No GET routes for read operations
- [ ] CDN caching is ineffective
- [ ] Clients must implement custom caching
- [ ] HTTP method count shows >90% POST

### Related Rules/Skills/Trees
- Rule: API-HTTP-001 (Method Semantics)
- Skill: http-method-semantics
- Tree: rest-compliance

---

## 2. GET for Writes

### Category
Safety Violation

### Description
Using GET requests to trigger server-side state changes — updating records, sending emails, deleting resources. The GET method is defined as safe (no side effects), and violating this breaks fundamental HTTP guarantees.

### Why It Happens
Convenience — GET is easier to test in a browser, easier to cache, and doesn't require CSRF protection. Developers use `GET /users/delete/42` or `GET /users/activate?id=42&status=active`.

### Warning Signs
- GET routes trigger database writes, email sending, or file mutations
- URL query parameters used for destructive operations
- Browser pre-fetching or crawling accidentally triggers state changes
- CDN edge servers cache and replay write operations

### Why Harmful
GET requests are automatically retried by browsers, pre-fetched by link prefetching, crawled by search engines, and cached by CDNs. Any of these can accidentally trigger the side effect multiple times or without user intent.

### Real-World Consequences
A search engine crawls `GET /users/delete/42` while indexing the site, accidentally deleting a user account. The team discovers the deletion during an audit but cannot determine which request was the "real" one.

### Preferred Alternative
Use POST for operations that change server state. Use DELETE for deletions. Never modify state in GET handlers.

### Refactoring Strategy
1. Find all GET routes that modify state
2. Change route method to POST, DELETE, or PATCH as appropriate
3. Update all links and forms that use these URLs
4. Add redirect from old GET URL to new POST/DELETE endpoint with clear error

### Detection Checklist
- [ ] GET routes with side effects
- [ ] Controllers with `write` operations in `index` or `show` methods
- [ ] Query parameters used for mutation operations
- [ ] Browser pre-fetching triggers unintended state changes
- [ ] CDN logs show write operations on cached GET URLs

### Related Rules/Skills/Trees
- Rule: API-HTTP-002 (Safe Method Enforcement)
- Skill: http-method-semantics
- Tree: http-fundamentals

---

## 3. PUT for Partial Updates

### Category
Semantic Mismatch

### Description
Using PUT for endpoints that accept partial data — only sending changed fields. PUT semantically requires the client to send the complete resource representation; missing fields should be reset to defaults or null.

### Why It Happens
Developers see PUT and PATCH as interchangeable "update" methods. PUT is more widely known, so it's used for all updates regardless of whether the client sends full or partial data.

### Warning Signs
- PUT endpoints use `sometimes` validation rules
- PUT endpoints accept a subset of resource fields
- Missing fields are not reset to null/default
- PUT and PATCH have identical implementations
- Documentation says "send only the fields you want to change" for PUT

### Why Harmful
Clients that send partial data expect only those fields to change. If the API later adds a `required` field, existing PUT calls will fail because the field is missing. If PUT is later implemented correctly (resetting missing fields), existing clients break.

### Real-World Consequences
A mobile app sends `PUT /users/42` with only `{name: "New Name"}`. The API currently ignores missing fields and only updates `name`. Later, a backend change correctly implements PUT semantics, resetting `email` to null because it wasn't sent. User profiles break.

### Preferred Alternative
Use PUT only when the client sends the complete resource representation. Use PATCH for partial updates with `sometimes` validation.

### Refactoring Strategy
1. Determine whether each update endpoint receives full or partial data
2. For full data: keep PUT, add validation requiring all fields
3. For partial data: change to PATCH, use `sometimes` validation
4. Document which method each update endpoint uses
5. Add tests verifying PUT resets missing fields and PATCH doesn't

### Detection Checklist
- [ ] PUT endpoints use `sometimes` rules
- [ ] PUT accepts subset of resource fields
- [ ] PUT and PATCH implementations are identical
- [ ] Missing fields are not reset to null
- [ ] Documentation says "partial updates via PUT"

### Related Rules/Skills/Trees
- Rule: API-HTTP-003 (PUT vs PATCH Semantics)
- Skill: http-method-semantics
- Tree: rest-compliance

---

## 4. DELETE with Body

### Category
Protocol Violation

### Description
Sending a request body with DELETE requests, or designing DELETE endpoints that require body content. HTTP semantics allow DELETE bodies but servers and proxies may ignore them.

### Why It Happens
Developers need to pass additional context for deletion (reason, confirmation token, bypass flag) and add it to the request body because there's no obvious place to put it.

### Warning Signs
- DELETE routes read `$request->all()` or `$request->input()`
- DELETE validation rules check for body fields
- Proxies or servers strip the DELETE body in production
- DELETE works in development but fails in production

### Why Harmful
Intermediaries (proxies, CDNs, load balancers) may strip DELETE request bodies or reject requests with bodies. The delete operation fails non-deterministically depending on the infrastructure layer.

### Real-World Consequences
A DELETE endpoint requires a `reason` field in the body for audit logging. In staging, it works fine. In production behind an AWS ALB, the body is stripped by the load balancer. The endpoint receives empty data and returns 422 validation error.

### Preferred Alternative
Use query parameters or headers for DELETE metadata. Or use POST for deletions that need complex payloads: `POST /resources/{id}/delete` with body.

### Refactoring Strategy
1. Move required DELETE metadata to headers or query parameters
2. If complex payload is needed, convert to `POST /resource/{id}/delete` action endpoint
3. Test DELETE behind a proxy that strips bodies
4. Document which parameters are passed via query vs body for DELETE

### Detection Checklist
- [ ] DELETE controller reads request body
- [ ] DELETE validation includes body fields
- [ ] DELETE works in local dev but fails in production
- [ ] Proxy logs show DELETE body stripped

### Related Rules/Skills/Trees
- Rule: API-HTTP-004 (DELETE Semantics)
- Skill: http-method-semantics
- Tree: http-protocol

---

## 5. Custom Methods in URL

### Category
Naming Convention Violation

### Description
Embedding action verbs in URL paths — `GET /users/getActiveUsers`, `POST /users/createUser`, `GET /orders/getByStatus`. The HTTP method already encodes the action; repeating it in the URL is redundant and breaks resource-oriented design.

### Why It Happens
Action-oriented thinking — developers think in terms of operations ("get active users") rather than resource states ("users filtered by status"). Frameworks that use controller actions as route names reinforce this pattern.

### Warning Signs
- URL paths contain verbs (get, create, update, delete)
- URL paths read as function calls (`/users/getActive`)
- Controller action names appear in URLs
- Query parameters would suffice to express the same operation

### Why Harmful
Breaks resource identification — the URL no longer identifies a resource but an operation. Clients cannot predict URLs from the resource model. HTTP semantics are duplicated (method says "GET", URL says "get").

### Real-World Consequences
A client SDK auto-generates methods from URL structure. It creates `getUsersGetActiveUsers()` as a method name. The generated code is unreadable, and the developer must manually map URLs to sensible method names.

### Preferred Alternative
Use query parameters to express variations: `GET /users?filter[status]=active`. Use HTTP methods for the action and URLs for resource identification.

### Refactoring Strategy
1. Identify verbs in URL paths
2. Express the same operation via resource + query parameters
3. Create action endpoints (POST) only for operations that can't be expressed as resource state
4. Add redirects from old verb-based URLs to new resource-based URLs
5. Update documentation with new URL patterns

### Detection Checklist
- [ ] URL paths contain GET, POST, DELETE verbs
- [ ] URL reads like a function call
- [ ] Query parameters would express the same concept
- [ ] Controller action names appear in route paths
- [ ] Laravel `Route::resource()` not used

### Related Rules/Skills/Trees
- Rule: API-URL-001 (Resource-Oriented URLs)
- Skill: url-structure-design
- Tree: restful-naming
