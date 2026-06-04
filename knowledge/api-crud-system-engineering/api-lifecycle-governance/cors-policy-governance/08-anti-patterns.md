# Anti-Patterns: CORS Policy Governance

## AP-1: Wildcard Origin with Credentials
**Category**: Security

**Description**: Setting `Access-Control-Allow-Origin: *` together with `Access-Control-Allow-Credentials: true`. Browsers reject this combination outright, making all CORS responses invalid for credentialed requests. Additionally, even if it worked, it would allow any origin to send authenticated requests.

**Warning Signs**:
- CORS configuration has both `*` origin and `true` for credentials
- Browser console shows CORS errors for authenticated requests
- "The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*' when credentials flag is true" error
- SPA integration works without credentials but breaks when auth is required

**Harms**:
- All authenticated CORS requests fail in browsers
- SPAs cannot authenticate with the API
- No warning from server — error only visible in browser console
- If browser didn't enforce this, any origin could make authenticated requests

**Real-World Consequence**: An API sets `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Credentials: true`. All browser-based SPA consumers receive opaque CORS errors. The team spends 3 days debugging authentication before discovering the CORS configuration conflict. No production SPA can authenticate with the API.

**Preferred Alternative**: Use explicit origin echoing for authenticated endpoints. Read the request `Origin` header, validate against an allowlist, and echo the specific origin back.

**Refactoring Strategy**: Replace `*` with dynamic origin validation, implement origin allowlist per environment, add `withCredentials` conditional check that switches between wildcard (public, no auth) and specific origin (authenticated).

**Detection Checklist**:
- `[ ]` Is `Access-Control-Allow-Origin: *` ever set with credentials?
- `[ ]` Do authenticated CORS requests succeed in browsers?
- `[ ]` Is origin echoing implemented for credentialed endpoints?
- `[ ]` Are there browser CORS errors for authenticated requests?

**Related**: 05-rules.md (Rule 1: Never Use Wildcard Origin with Credentials), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-2: Localhost in Production CORS Allowlist
**Category**: Security

**Description**: Including `http://localhost:*` or similar local development origins in the production CORS allowlist. Any malicious site running on the same local network, or a browser extension running locally, can make cross-origin requests to the production API.

**Warning Signs**:
- Production CORS allowlist contains `localhost`, `127.0.0.1`, or `0.0.0.0`
- Same allowlist used across all environments
- Development and production share CORS configuration file
- No environment-specific CORS configuration

**Harms**:
- Any malicious site served from localhost can access the API
- Browser extensions with localhost access can exfiltrate data
- Security audit findings for CORS misconfiguration
- Compliance violations for production API exposure

**Real-World Consequence**: A production API has `http://localhost:3000` in its CORS allowlist (copy-pasted from development config). An employee visits a malicious website that runs JavaScript making fetch requests to `http://localhost:3000` — but actually to the production API via CORS. The script exfiltrates data using the employee's existing authentication session.

**Preferred Alternative**: Maintain environment-specific CORS origin lists. Allow `localhost` and `127.0.0.1` only in development and local environments. Production must have a curated allowlist of explicitly approved origins.

**Refactoring Strategy**: Split CORS configuration per environment, remove localhost from production config, add CI check that validates production CORS config has no localhost entries, add security review gate for production origin changes.

**Detection Checklist**:
- `[ ]` Is localhost in the production CORS allowlist?
- `[ ]` Are CORS configurations environment-specific?
- `[ ]` Is there a CI check preventing localhost in production?
- `[ ]` Has a security audit flagged CORS configuration?

**Related**: 05-rules.md (Rule 2: Use Environment-Specific Origin Lists), 04-standardized-knowledge.md, 06-skills.md

---

## AP-3: Missing Expose-Headers for Custom Headers
**Category**: Design

**Description**: Not listing custom response headers in `Access-Control-Expose-Headers`. Browsers only expose six simple response headers (Cache-Control, Content-Language, Content-Length, Content-Type, Expires, Last-Modified) to JavaScript by default. All custom headers (X-Request-Id, Deprecation, Link, Rate-Limit headers) are invisible to browser-based consumers.

**Warning Signs**:
- `Access-Control-Expose-Headers` is missing or empty
- Browser JavaScript cannot read custom response headers
- Consumer tooling expects X-Request-Id but gets undefined
- Deprecation warnings are invisible to browser consumers
- Rate limit headers are inaccessible from browser JS

**Harms**:
- Browser-based consumers cannot read custom headers
- Request tracing (X-Request-Id) unavailable in browser
- Deprecation warnings invisible — consumers break without notice
- Rate limit awareness impossible for browser clients
- Debugging and monitoring tools broken in browser context

**Real-World Consequence**: An API includes `Deprecation` and `Sunset` headers to warn consumers of upcoming breaking changes. The `Access-Control-Expose-Headers` header is not configured. Browser-based SPA consumers never see these headers — they are completely unaware of deprecation warnings. The API team makes a breaking change and all browser consumers break without prior notice.

**Preferred Alternative**: List every custom response header in `Access-Control-Expose-Headers`. Include all headers that browser consumers might need: `X-Request-Id`, `Deprecation`, `Sunset`, `Link`, rate limit headers, pagination headers.

**Refactoring Strategy**: Audit all custom response headers, create a centralized `Expose-Headers` configuration, add tests verifying custom headers are exposed, include in CORS middleware for every response type (including errors).

**Detection Checklist**:
- `[ ]` Are all custom response headers exposed via `Access-Control-Expose-Headers`?
- `[ ]` Are rate limit headers accessible from browser JS?
- `[ ]` Are `Deprecation` and `Sunset` headers exposed?
- `[ ]` Is `X-Request-Id` accessible from browser JS?

**Related**: 05-rules.md (Rule 3: Explicitly Expose All Custom Headers), 04-standardized-knowledge.md, 06-skills.md

---

## AP-4: No Preflight Cache (Max-Age Missing or Too Low)
**Category**: Performance

**Description**: Setting `Access-Control-Max-Age` too low or omitting it entirely. Every cross-origin request triggers a preflight OPTIONS request, adding a full round-trip before every actual request. At scale, this doubles latency and server load for all browser-based consumers.

**Warning Signs**:
- `Access-Control-Max-Age` is not set on preflight responses
- Max-Age is set to a very short duration (< 1 hour)
- OPTIONS requests account for a significant percentage of API traffic
- Browser consumers experience higher latency than non-browser consumers
- Server handles many OPTIONS requests that could be cached

**Harms**:
- Unnecessary OPTIONS round-trips for every cross-origin request
- Double latency for all browser-based API consumers
- Increased server load from OPTIONS request handling
- Higher infrastructure costs from preflight traffic
- Poor perceived performance for SPA consumers

**Real-World Consequence**: An API has no `Access-Control-Max-Age` header. An SPA makes 100 API calls per page load. Each call triggers an OPTIONS preflight before the actual request. The SPA goes from 100 requests to 200 requests per page load — doubling latency from 500ms to 1000ms. At 10,000 users, the server handles an extra 1,000,000 OPTIONS requests per day.

**Preferred Alternative**: Set `Access-Control-Max-Age: 86400` (24 hours) on all preflight responses to eliminate preflight overhead for the vast majority of subsequent requests.

**Refactoring Strategy**: Add Max-Age header with 24-hour value to OPTIONS response handler, verify preflight caching in browser developer tools, monitor OPTIONS request volume reduction.

**Detection Checklist**:
- `[ ]` Is `Access-Control-Max-Age` set on preflight responses?
- `[ ]` Is Max-Age set to at least 86400 (24 hours)?
- `[ ]` What percentage of API traffic is OPTIONS requests?
- `[ ]` Are browser consumers observing higher latency than expected?

**Related**: 05-rules.md (Rule 4: Cache Preflight Responses for 24 Hours), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-5: No CORS Headers on Error Responses
**Category**: Reliability

**Description**: Including CORS headers only on successful responses (2xx) but omitting them on error responses (4xx, 5xx). Browsers block JavaScript from reading the error response body when CORS headers are missing, making all errors opaque to browser-based consumers.

**Warning Signs**:
- CORS headers added only in success response code path
- Error responses (validation errors, 404, 500) lack CORS headers
- Browser console shows CORS errors on 4xx/5xx responses
- Browser consumers report "opaque errors"
- API debugging from browser is impossible for error cases

**Harms**:
- Browser consumers cannot read error response bodies
- Validation errors are invisible to browser clients
- Debugging from browser is impossible
- Support escalations for "silent failures"
- Consumer integration delayed because errors are opaque

**Real-World Consequence**: An API has comprehensive CORS headers on all success responses but omits them on error responses. A browser consumer sends an invalid request and receives a 422 response with detailed validation errors. The browser blocks JavaScript from reading the response body because CORS headers are missing. The consumer sees only a generic "Failed to fetch" error.

**Preferred Alternative**: Apply CORS headers to ALL responses, including errors. Use middleware that adds CORS headers after the application response is generated, regardless of status code.

**Refactoring Strategy**: Move CORS header addition to a response middleware that runs after the controller/error handler, test CORS headers on 4xx and 5xx responses, verify browser can read error response body.

**Detection Checklist**:
- `[ ]` Do error responses (4xx, 5xx) include CORS headers?
- `[ ]` Is CORS applied in a post-response middleware?
- `[ ]` Can browser consumers read validation error bodies?
- `[ ]` Are there browser CORS errors on API error responses?

**Related**: 05-rules.md (Rule 6: Include CORS Headers on Error Responses), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: Stale Origin Allowlist (No Quarterly Audit)
**Category**: Security

**Description**: Allowing the CORS origin allowlist to grow without periodic cleanup. Acquired companies, deprecated apps, and abandoned projects leave their origins in the allowlist, expanding the attack surface with unused entries that could be exploited.

**Warning Signs**:
- Origin allowlist has 20+ entries
- Origins from acquired or defunct companies are still listed
- No one knows why certain origins are in the allowlist
- No process for removing origins when apps are deprecated
- Security audit recommends allowlist cleanup

**Harms**:
- Unnecessary attack surface from unused origins
- Compromised abandoned origin can access the API
- Compliance audit findings for uncontrolled origin access
- Unable to determine which origins are legitimate
- Increased validation overhead (O(n) against large list)

**Real-World Consequence**: An API's CORS allowlist has 47 origins accumulated over 5 years. A startup acquired 3 years ago (origin `https://dashboard.acquired-startup.io`) is compromised. The attacker uses the existing CORS permission to make authenticated requests to the API. The origin was never removed after acquisition because no audit existed.

**Preferred Alternative**: Audit the CORS origin allowlist quarterly. Remove unused or expired origins. Document the purpose and ownership for each origin.

**Refactoring Strategy**: Add quarterly scheduled task to audit origin allowlist, implement origin usage tracking to identify unused origins, create notification workflow for stale origin removal, maintain ownership documentation per origin.

**Detection Checklist**:
- `[ ]` Is the origin allowlist audited at least quarterly?
- `[ ]` Is there ownership documentation for each origin?
- `[ ]` Are unused origins identified and removed?
- `[ ]` Has a security audit flagged allowlist size or stale entries?

**Related**: 05-rules.md (Rule 7: Audit Origin Allowlist Quarterly), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md
