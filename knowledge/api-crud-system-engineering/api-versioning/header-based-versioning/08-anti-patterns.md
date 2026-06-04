# Header-Based Versioning: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Header-Based Versioning |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Silent Defaulting** — Client sends malformed header, server defaults to latest version without warning
2. **No Response Version Header** — Support can't determine which version was served
3. **Proxy Dependency** — Relying on a custom header that a reverse proxy strips
4. **Missing Vary Header** — Not setting `Vary: Accept`, causing CDN cache poisoning
5. **Strict Regex Rejection** — Version regex too strict, rejecting valid vendor MIME extensions

## Repository-Wide Anti-Patterns

- Using `X-API-Version` when the team already uses Accept header for content type negotiation
- Not logging the raw Accept header alongside the resolved version
- No fallback chain for version resolution
- Not having a `/version` endpoint for client debugging

---

## 1. Silent Defaulting

### Category
Operational Risk

### Description
When a client sends a malformed or missing version header, the server silently defaults to the latest version. The client receives a response for a version they didn't request, and neither side detects the mismatch.

### Why It Happens
"Default to latest" seems like the safe choice — the client gets the most recent version. The developer doesn't consider that the client may be expecting an older version's behavior.

### Warning Signs
- Missing or malformed version header defaults to latest without notification
- No warning or error returned for invalid version headers
- Client errors traced to version mismatch
- No logging of header parsing failures
- Support tickets about unexpected behavior that turns out to be version mismatch

### Why Harmful
The client thinks they're using version X but is actually using version Y. They may encounter breaking changes they didn't expect. Debugging is extremely difficult because both sides have different version assumptions.

### Real-World Consequences
A client's code has a bug that sends `X-API-Version: v1` with a typo (`X-API-Version: v`). The server silently defaults to V2. The V2 response has a different field structure, and the client's parser breaks. The client spends days debugging without realizing the version mismatch.

### Preferred Alternative
Validate the version header explicitly. Return 406 for unrecognized versions. Log header parsing failures and monitor them.

### Refactoring Strategy
1. Add explicit version validation to middleware
2. Return 406 with supported versions listed for unrecognized version headers
3. Include the resolved version in the response header
4. Log all header parsing failures for monitoring
5. Add a `/version` endpoint that echoes back the resolved version

### Detection Checklist
- [ ] Invalid version headers silently default
- [ ] No 406 returned for bad version headers
- [ ] No resolved version in response headers
- [ ] Header parsing failures not logged

### Related Rules/Skills/Trees
- Rule: API-VERSION-005 (Explicit Version Validation)
- Skill: header-based-versioning
- Tree: api-versioning

---

## 2. No Response Version Header

### Category
Operational Blindness

### Description
The API resolves the version from the request header but doesn't include the resolved version in the response headers. Debugging, monitoring, and support teams cannot determine which version was served.

### Why It Happens
"Version is in the request, we know what we served." The team assumes request logs are sufficient for version tracking.

### Warning Signs
- No `X-API-Version` or similar header in responses
- Support asks "which version were they using?" and can't determine from logs
- Request logs show the header, but response logs don't echo it
- Analytics on version distribution is unavailable
- Consumer reports "I got the wrong response" but version is unverifiable

### Why Harmful
Without response version headers, every incident becomes harder to debug. Support cannot help consumers without knowing which version they received. Version distribution analytics are impossible.

### Real-World Consequences
A consumer reports "V1 is broken for me." The team checks the consumer's log and sees they're sending `X-API-Version: v1`. But the server might have defaulted to V2 due to a bug. Without a response header, the team cannot confirm which version was served.

### Preferred Alternative
Always include the resolved version in response headers: `X-API-Version: v1`. Include it in structured logs for analytics.

### Refactoring Strategy
1. Add response header injection to version middleware
2. Include resolved version in structured logs
3. Build a version distribution dashboard
4. Update support runbooks to check response version headers
5. Add tests verifying version echo in responses

### Detection Checklist
- [ ] No version header in responses
- [ ] Version distribution unknown
- [ ] Support can't determine served version
- [ ] No version echo in response

### Related Rules/Skills/Trees
- Rule: API-VERSION-006 (Version Echo in Response)
- Skill: header-based-versioning
- Tree: api-operations

---

## 3. Proxy Dependency

### Category
Infrastructure Coupling

### Description
Relying on a custom header (e.g., `X-API-Version`) for version resolution, but the header is stripped or modified by an intermediary proxy, CDN, or API gateway.

### Why It Happens
The API is designed to accept a specific header, but corporate proxies, cloud load balancers, or CDNs may strip unknown headers. This is discovered only in production.

### Warning Signs
- `X-API-Version` or other custom header used for versioning
- Version resolution works in development but fails in production
- Proxies between client and server strip unknown headers
- CDN is configured to forward only specific headers
- Corporate firewall rules remove non-standard headers

### Why Harmful
A subset of clients (those behind stripping proxies) always receive the default version. Behavior is inconsistent and unpredictable. Debugging is difficult because the header is missing from logs.

### Real-World Consequences
A corporate client's IT policy strips all `X-*` headers at the proxy level. Their API requests always lack the version header. The server defaults to the latest version. The client's V1 integration breaks because they're receiving V2 responses.

### Preferred Alternative
Use the standard `Accept` header with vendor media type for versioning. Accept headers are never stripped by proxies. If using custom headers, verify proxy compatibility.

### Refactoring Strategy
1. Check proxy/CDN/gateway configuration for header forwarding
2. Use the standard `Accept` header for version resolution
3. If custom headers are required, verify forwarding at every infrastructure layer
4. Add a fallback: Accept header → Custom header → Default version
5. Log which resolution method was used for each request

### Detection Checklist
- [ ] Custom headers used for versioning
- [ ] Proxies between client and server strip unknown headers
- [ ] Works in dev, fails in production
- [ ] No Accept header fallback

### Related Rules/Skills/Trees
- Rule: API-VERSION-007 (Proxy-Safe Versioning)
- Skill: header-based-versioning
- Tree: infrastructure

---

## 4. Missing Vary Header

### Category
Cache Poisoning

### Description
Using header-based versioning but not setting `Vary: Accept` on responses. CDNs and browsers cache responses by URL only, serving the wrong version to clients that requested a different version.

### Why It Happens
The team implements version resolution but forgets to tell the cache that responses vary by Accept header.

### Warning Signs
- Responses vary by version header but `Vary` header is missing
- CDN caching is aggressive but version-specific content is served to wrong clients
- Clients report "I got V1 data even though I requested V2"
- Cache hit ratio is high but correctness is low
- Only the first version requested gets cached

### Why Harmful
Cache poisoning — the CDN serves V1 content to V2 clients and vice versa. Cache hit ratio improves but correctness degrades. This is a data integrity issue.

### Real-World Consequences
Client A requests V2 posts and receives V1 data from the cache. Client A now displays V1-formatted data, which has different field names. The client's rendering breaks because it expects V2 field names.

### Preferred Alternative
Set `Vary: Accept` (and any other version-relevant headers) on all versioned responses. Configure CDN to respect the Vary header.

### Refactoring Strategy
1. Add `Vary: Accept` to all versioned responses
2. Include other version-relevant headers in Vary
3. Configure CDN to use Vary headers in cache keys
4. Test cache behavior with different version headers
5. Add architecture test enforcing Vary header on versioned routes

### Detection Checklist
- [ ] No `Vary` header on versioned responses
- [ ] Wrong version served from cache
- [ ] CDN not configured for Vary headers
- [ ] Cache correctness not verified

### Related Rules/Skills/Trees
- Rule: API-CACHE-004 (Vary for Versioned Content)
- Skill: response-caching-headers
- Tree: caching

---

## 5. Strict Regex Rejection

### Category
Fragile Parsing

### Description
The version parsing regex is too strict, rejecting valid vendor MIME type extensions or minor variations. For example, rejecting `application/vnd.myapp.v1+json; charset=utf-8` because the charset parameter wasn't expected.

### Why It Happens
The regex is written to match exactly one pattern without considering variations that are valid per HTTP spec.

### Warning Signs
- Valid Accept headers with charset parameters return 406
- Accept headers with quality values (`q=0.9`) are rejected
- Whitespace variations cause parsing failures
- Case-sensitivity issues reject uppercase header values
- Version middleware fails on header formats that curl/Postman generate by default

### Why Harmful
Clients with standard HTTP library behavior are rejected. Developers waste time debugging header formatting. Real clients fail while contrived test cases pass.

### Real-World Consequences
A client sends `Accept: application/vnd.myapp.v2+json; q=0.9`. The version regex doesn't handle the `q` parameter and returns 406. The client developer spends hours checking their version number, not realizing the quality value is the issue.

### Preferred Alternative
Use flexible header parsing that handles charset, quality values, and whitespace variations. Use dedicated header parsing libraries rather than hand-written regex.

### Refactoring Strategy
1. Test version parsing with real-world Accept header examples
2. Use `$request->getAcceptableContentTypes()` instead of raw regex
3. Handle charset, quality values, and whitespace
4. Add tests for edge cases: charset, whitespace, quality, multiple types
5. Log raw header alongside parsed version for debugging

### Detection Checklist
- [ ] Custom regex for version parsing
- [ ] Valid Accept headers rejected
- [ ] Charset or quality values cause failures
- [ ] Only one specific header format works

### Related Rules/Skills/Trees
- Rule: API-VERSION-008 (Robust Header Parsing)
- Skill: header-based-versioning
- Tree: content-negotiation
