# Media Type Versioning: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Media Type Versioning |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **No Media Type Registry** — Scattered `if` statements checking Accept header throughout controllers
2. **Removing Transformers Without Warning** — Client requests a media type, gets 500 because transformer is gone
3. **IANA Staleness** — Media type registered with IANA but publicly documented differently
4. **Confusing Accept and Content-Type** — Using `Content-Type` instead of `Accept` for version negotiation
5. **Wildcard Acceptance Without Default** — Handling `*/*` Accept header but returning default version without indication

## Repository-Wide Anti-Patterns

- Not caching the transformer registry — resolving transformers via reflection on every request
- Forgetting charset handling in Accept header parsing
- Inconsistent media type format strings across endpoints
- Not logging the negotiated media type for operations debugging

---

## 1. No Media Type Registry

### Category
Scattered Logic

### Description
Media type to transformer mapping is spread across controllers via `if`/`switch` statements checking the Accept header. Each endpoint independently decides which version to serve.

### Why It Happens
The team starts with one version, then adds version-specific logic incrementally. Each endpoint adds its own version check without centralizing.

### Warning Signs
- Multiple controllers have `if (str_contains($accept, 'v1'))` logic
- New endpoints duplicate version checking code from existing ones
- Adding a new version requires changes to every controller
- Some endpoints accidentally serve wrong version
- No single registry maps media types to transformers

### Why Harmful
Inconsistent version resolution — some endpoints may check headers differently, serving wrong versions. Adding a new version is a cross-cutting change affecting every controller. Bug fixes must be applied everywhere.

### Real-World Consequences
A team adds V3 to the API. They must modify 25 controllers to add the new media type check. In 3 controllers, the developer copy-pastes V2 logic without updating the version string. Those 3 endpoints serve V2 responses for V3 requests.

### Preferred Alternative
Implement a centralized media type registry that maps vendor MIME types to transformers. Middleware resolves the version and sets it as a request attribute.

### Refactoring Strategy
1. Create a configuration-based media type registry
2. Implement content negotiation middleware
3. Remove version-checking code from controllers
4. Read resolved version from `$request->attributes` instead
5. Add tests verifying correct media type resolution

### Detection Checklist
- [ ] `if`/`switch` statements for version in controllers
- [ ] No centralized registry
- [ ] Adding a version requires multiple file changes
- [ ] Inconsistent version resolution across endpoints

### Related Rules/Skills/Trees
- Rule: API-VERSION-009 (Centralized Version Resolution)
- Skill: media-type-versioning
- Tree: api-versioning

---

## 2. Removing Transformers Without Warning

### Category
Breaking Change

### Description
Removing a version's transformer from the media type registry without first deprecating the media type. Clients that request the media type receive 500 errors because the transformer class doesn't exist.

### Why It Happens
Cleanup — "nobody uses V1 anymore, let's remove it." The code is deleted but the version is removed immediately without a deprecation window.

### Warning Signs
- Media type returns 500 because transformer class is missing
- Transformer removed from registry without deprecation period
- No monitoring of media type usage before removal
- Consumers report sudden API failures
- No graceful 406 response for removed media types

### Why Harmful
Clients that still use the old media type (even at low traffic) experience immediate failures. The API breaks its contract without warning.

### Real-World Consequences
An API team removes the V1 transformer because they believe "nobody uses V1." A monthly batch job that calls the API with V1 media type suddenly fails. The batch job processes time-sensitive financial data, and the failure isn't discovered for 3 days.

### Preferred Alternative
Deprecate media types first, monitor usage, then remove after a notice period. Return 406 for removed types with a helpful message.

### Refactoring Strategy
1. Restore the removed transformer
2. Add the media type to a deprecation list
3. Monitor media type usage over the deprecation window
4. Only remove when traffic to the media type is zero for the notice period
5. Return 406 with alternative media type suggestion after removal

### Detection Checklist
- [ ] Transformer removed without deprecation
- [ ] Media type returns 500 instead of 406
- [ ] Media type usage not tracked
- [ ] No deprecation window observed

### Related Rules/Skills/Trees
- Rule: API-VERSION-010 (Deprecate Before Remove)
- Skill: deprecation-header-implementation
- Tree: api-lifecycle

---

## 3. IANA Staleness

### Category
Documentation Drift

### Description
The API is registered with IANA for a specific vendor media type, but the publicly documented media type differs from the registered one. Clients don't know which media type to use.

### Why It Happens
The API documentation is updated independently from the IANA registration. The registration process is bureaucratic, so documentation gets ahead of registration.

### Warning Signs
- IANA-registered media type differs from documentation
- Clients try the documented type and get 406 (not registered)
- Clients try the registered type and get unexpected behavior (old version)
- No sync process between IANA registration and API documentation
- IANA registration has outdated metadata (version, format)

### Why Harmful
Clients cannot determine the correct media type to use. Some may use the documented (wrong) type and fail. Others use the registered (outdated) type and receive old behavior.

### Real-World Consequences
An API documents `application/vnd.myapp.v3+json` but the IANA registration still shows `application/vnd.myapp.v2+json`. New clients use V3 (documented) and work fine. Compliance-sensitive clients check IANA registration and use V2. They receive outdated data.

### Preferred Alternative
Keep IANA registration synchronized with documentation. Automate the sync process or assign explicit ownership.

### Refactoring Strategy
1. Update IANA registration to match current documentation
2. Set up a calendar reminder for IANA registration review
3. Assign ownership for media type registration maintenance
4. Document the relationship between API versions and IANA types
5. Add a CI check that compares registered vs documented types

### Detection Checklist
- [ ] IANA registration differs from documentation
- [ ] Clients report media type confusion
- [ ] No sync process exists
- [ ] Registration metadata outdated

### Related Rules/Skills/Trees
- Rule: API-DOC-004 (Media Type Documentation)
- Skill: openapi-spec-generation
- Tree: api-documentation

---

## 4. Confusing Accept and Content-Type

### Category
Protocol Misunderstanding

### Description
Using the `Content-Type` header (which describes the request body format) instead of the `Accept` header (which describes the desired response format) for version negotiation.

### Why It Happens
Developers confuse the two headers. Both carry MIME type information, so it seems like either could work for versioning.

### Warning Signs
- Version is read from `Content-Type` header instead of `Accept`
- Write endpoints (POST/PUT) work for versioning, but GET doesn't have Content-Type
- Inconsistent behavior between read and write endpoints
- Clients report versioning works for some methods but not others
- No `Accept` header check for version negotiation

### Why Harmful
GET requests typically don't have a `Content-Type` header (they have no body). Version negotiation via `Content-Type` fails for all read operations. Behavior is inconsistent across HTTP methods.

### Real-World Consequences
Versioning works via `Content-Type: application/vnd.myapp.v1+json` for POST requests (which have a body). But GET requests don't include Content-Type. GET always returns the default version. Clients get V2 data on reads but V1 behavior on writes.

### Preferred Alternative
Use the `Accept` header for version negotiation (it describes the desired response). Use `Content-Type` only for request body format.

### Refactoring Strategy
1. Move version resolution from `Content-Type` to `Accept` header
2. Support both during migration period
3. Remove `Content-Type` versioning after migration
4. Update client libraries and documentation
5. Add tests verifying version negotiation works for both GET and POST

### Detection Checklist
- [ ] Version read from Content-Type
- [ ] GET requests have no Content-Type
- [ ] Inconsistent version behavior by HTTP method
- [ ] No Accept header version parsing

### Related Rules/Skills/Trees
- Rule: API-VERSION-011 (Accept for Response, Content-Type for Body)
- Skill: content-negotiation
- Tree: http-semantics

---

## 5. Wildcard Acceptance Without Default

### Category
Incomplete Implementation

### Description
Handling `*/*` Accept headers by serving the default version, but not indicating to the client which version was served. The client may assume a different version.

### Why It Happens
`*/*` means "any format" — the server picks the default. But the version is implicit and invisible to the client.

### Warning Signs
- `Accept: */*` returns default version without version indication
- Clients don't know which version they received
- No `Content-Type` with version marker in response
- No `X-API-Version` header in responses
- Client SDK doesn't send specific Accept header, relies on server default

### Why Harmful
Clients that don't explicitly negotiate a version receive an implicit version they can't verify. When the default version changes (new API release), these clients may break without understanding why.

### Real-World Consequences
A client sends `Accept: */*` (no version preference). The server returns V1 (the default). Six months later, the server changes the default to V2. The client now receives V2 responses without requesting them. Their V1 parser breaks.

### Preferred Alternative
Always include the resolved version in response headers. Consider returning 406 for `*/*` if version is required, or redirect to a version discovery endpoint.

### Refactoring Strategy
1. Always include resolved version in response header
2. Document version selection behavior for `*/*` requests
3. Consider requiring explicit version for state-changing operations
4. Add version hint in response `Content-Type` (e.g., `application/json; version=v1`)
5. Log version distribution for `*/*` clients

### Detection Checklist
- [ ] `*/*` returns version without indication
- [ ] No version in response headers
- [ ] Clients unaware of served version
- [ ] Default version change could break clients

### Related Rules/Skills/Trees
- Rule: API-VERSION-012 (Explicit Version for Wildcard)
- Skill: media-type-versioning
- Tree: api-versioning
