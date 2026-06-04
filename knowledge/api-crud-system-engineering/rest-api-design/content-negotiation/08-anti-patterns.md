# Content Negotiation: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | content-negotiation |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **JSON-Only But Ignoring Accept** — Not validating Accept header; clients receive JSON even when requesting XML
2. **Format via User-Agent Sniffing** — Detecting browser vs. app to choose response format
3. **URL Extension for Every Format Decision** — Supporting both `.json` and `?format=json` without choosing one
4. **Negotiation Without Vary Header** — Responses vary by Accept header but caches are not told to differentiate
5. **Silent Defaulting to JSON** — Accepting `text/html` and defaulting to JSON without warning

## Repository-Wide Anti-Patterns

- Implementing multi-format support when only JSON consumers exist
- Placing format negotiation logic in individual controllers instead of middleware
- Inconsistent error format — HTML errors for API routes that expect JSON errors

---

## 1. JSON-Only But Ignoring Accept

### Category
Broken Contract

### Description
The API only produces JSON but ignores the `Accept` header entirely. Clients that send `Accept: application/xml` receive JSON without any indication that their requested format is unsupported, causing parse failures on the client side.

### Why It Happens
The API only outputs JSON, and since all current clients accept JSON, checking the `Accept` header seems like unnecessary work. The problem only surfaces when new clients with different format expectations integrate.

### Warning Signs
- No middleware validates `Accept` header
- All responses return JSON regardless of `Accept` value
- Client integration issues with "unexpected format" errors
- No 406 Not Acceptable responses in the API

### Why Harmful
Clients receive JSON when they explicitly request another format, leading to silent parse failures, confusing error messages, and wasted debugging time. The API violates HTTP content negotiation semantics.

### Real-World Consequences
A third-party integrator sends `Accept: application/xml` per their corporate standard. The API returns JSON. The client's XML parser fails, and the integrator spends two days debugging before discovering the API ignores `Accept` headers.

### Preferred Alternative
Validate the `Accept` header in middleware. Return 406 Not Acceptable for unsupported formats. For JSON-only APIs, accept `application/json`, `*/*`, or `application/*`.

### Refactoring Strategy
1. Create middleware to validate `Accept` header
2. Return 406 with clear message when format is unsupported
3. Include supported formats in the error response
4. Add `Accept` header validation to integration tests

### Detection Checklist
- [ ] No `Accept` header validation exists
- [ ] `Accept: application/xml` returns JSON without error
- [ ] API never returns 406 status code
- [ ] Error responses don't list supported formats

### Related Rules/Skills/Trees
- Rule: API-CONTRACT-001 (Content Negotiation)
- Skill: rest-architectural-constraints
- Tree: http-semantics

---

## 2. Format via User-Agent Sniffing

### Category
Poor Design

### Description
Determining the response format by inspecting the `User-Agent` header instead of the `Accept` header. For example, detecting "Mozilla" for HTML, "Postman" for JSON, or "Mobile" for a compact format.

### Why It Happens
Developers believe User-Agent is more reliable because it's simpler to read than parsing Accept headers with quality values. Some frameworks historically promoted User-Agent sniffing for mobile detection.

### Warning Signs
- `$request->userAgent()` is used to determine response format
- Different formats are returned for the same endpoint based on User-Agent
- `Accept` header is present but ignored in format selection

### Why Harmful
User-Agent is unreliable — it can be spoofed, omitted, or changed without notice. It conflates client identity with format preference. New clients with different User-Agent values get unexpected formats.

### Real-World Consequences
A new API client is built with a different HTTP library that sends a different User-Agent. It receives HTML instead of JSON, breaking the integration. Debugging reveals the format selection logic was User-Agent-based.

### Preferred Alternative
Use the `Accept` header exclusively for format negotiation. Use `$request->expectsJson()` or `$request->prefers()` for quality-weighted selection.

### Refactoring Strategy
1. Remove all User-Agent-based format selection logic
2. Implement `Accept` header validation and response format selection
3. Update documentation to specify supported `Accept` header values
4. Add tests for each supported format via proper Accept headers

### Detection Checklist
- [ ] `User-Agent` is used to determine response format
- [ ] `Accept` header is available but not used for format selection
- [ ] Response format changes with different HTTP clients
- [ ] No `$request->expectsJson()` or `$request->prefers()` usage

### Related Rules/Skills/Trees
- Rule: API-DESIGN-003 (Content Negotiation)
- Skill: content-negotiation
- Tree: http-semantics

---

## 3. URL Extension for Every Format Decision

### Category
Inconsistent Design

### Description
Supporting both URL extension format selection (`/users.json`) and query parameter format selection (`/users?format=json`) simultaneously, or using URL extensions inconsistently across endpoints.

### Why It Happens
Different developers on the team have preferences. One implements extensions for collection endpoints, another uses query parameters for member endpoints. No standardization exists.

### Warning Signs
- Both `/users.json` and `/users?format=json` work for the same resource
- Some endpoints accept `.xml` extension, others don't
- Route definitions include `.{format}` parameter but not all controllers handle it
- Documentation doesn't specify a single format selection mechanism

### Why Harmful
Inconsistent format selection confuses clients, complicates route definitions, splits caching (same content cached under different URLs), and increases maintenance burden.

### Real-World Consequences
A CDN caches `/users` and `/users.json` separately because the URLs differ. Traffic splits across two cache entries, reducing cache hit rate by 50%. After standardizing on Accept header, a single cache entry serves all clients.

### Preferred Alternative
Choose one mechanism: Accept header (preferred for REST APIs), URL extension, or query parameter. Standardize across all endpoints.

### Refactoring Strategy
1. Choose the primary format negotiation mechanism (Accept header recommended)
2. Remove alternative mechanisms (extensions or query params)
3. Add redirects for old URLs that used extensions
4. Update all client documentation

### Detection Checklist
- [ ] Multiple format selection mechanisms exist
- [ ] Route definitions include optional `.{format}` parameter
- [ ] Different endpoints use different format selection methods
- [ ] Cache utilization shows split entries for same content

### Related Rules/Skills/Trees
- Rule: API-CONSISTENCY-001
- Skill: url-structure-design
- Tree: api-consistency

---

## 4. Negotiation Without Vary Header

### Category
Cache Invalidation Bug

### Description
Responses vary based on `Accept` header (returning different formats) but the `Vary` header is missing or incomplete. Caches store one version of the response and serve it to clients requesting different formats.

### Why It Happens
The `Vary` header is an afterthought in content negotiation implementation. Developers focus on format selection logic and forget to tell caches to differentiate by request headers.

### Warning Signs
- `Vary` header is absent from responses
- `Vary` lists `Accept-Encoding` but not `Accept`
- Cached responses served in wrong format
- Clients report "got XML when I requested JSON"

### Why Harmful
Without proper `Vary` headers, CDNs and browser caches serve format-inappropriate responses. A client that requested JSON receives cached XML, causing parse failures.

### Real-World Consequences
A user requests `/users` with `Accept: application/json` and receives cached XML from a previous request that used `Accept: application/xml`. The JSON parser fails, and the user sees a blank page.

### Preferred Alternative
Set `Vary: Accept` on all responses that vary by content negotiation. Include other varying headers (`Accept-Encoding`, `Accept-Language`) as needed.

### Refactoring Strategy
1. Add `Vary: Accept` header to all responses that use content negotiation
2. Configure CDN to respect `Vary` header for cache key differentiation
3. Test that different Accept headers produce separate cache entries
4. Review and update `Vary` header quarterly

### Detection Checklist
- [ ] `Vary` header is missing from negotiated responses
- [ ] `Vary` lists only `Accept-Encoding` when content format varies
- [ ] Cached responses are served in incorrect formats
- [ ] CDN configuration ignores `Vary` header

### Related Rules/Skills/Trees
- Rule: API-CACHE-003 (Vary Header Correctness)
- Skill: response-caching-headers
- Tree: caching-strategy

---

## 5. Silent Defaulting to JSON

### Category
Poor User Experience

### Description
When a client sends an unsupported `Accept` header (e.g., `text/html`), the API silently defaults to JSON without informing the client that their requested format is unavailable.

### Why It Happens
Developers assume "JSON is better than nothing" and prefer a working response over a 406 error. This hides the API's format limitations from clients.

### Warning Signs
- `Accept: text/html` returns JSON without warning
- No 406 response is ever returned
- Client format negotiation doesn't know JSON is the only option
- Documentation doesn't specify supported Accept header values

### Why Harmful
Clients believe their requested format is supported because the API responds successfully. They only discover the mismatch when their parser fails, leading to confusing errors. Silent defaults hide integration problems.

### Real-World Consequences
A client library sends `Accept: text/html` because its default is "any format." The API returns JSON, which the library parses successfully until a security update changes the library's parser behavior. The previously-working integration breaks.

### Preferred Alternative
Validate the `Accept` header and return 406 with a clear message listing supported formats. This makes the API's format support explicit.

### Refactoring Strategy
1. Add `Accept` header validation middleware
2. Return 406 with list of supported formats for unsupported Accept values
3. Document supported Accept header values in OpenAPI
4. Add tests that verify 406 for unsupported Accept headers

### Detection Checklist
- [ ] `Accept: text/html` returns JSON
- [ ] API never returns 406 status code
- [ ] No `Accept` header validation documentation exists
- [ ] Clients are unaware of supported formats

### Related Rules/Skills/Trees
- Rule: API-ERROR-005 (Explicit Error Responses)
- Skill: error-response-documentation
- Tree: client-experience
