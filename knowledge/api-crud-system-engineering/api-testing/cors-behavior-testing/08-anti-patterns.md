# Anti-Patterns — CORS Behavior Testing

## Anti-Pattern 1: Testing Only Actual Requests, Not Preflight

**Category**: Testing completeness

**Description**: Testing CORS headers only on actual GET/POST requests without testing the preflight OPTIONS request.

**Warning Signs**:
- CORS tests use only `getJson()` and `postJson()` with `Origin` headers
- No test uses `optionsJson()` to simulate preflight
- Preflight configuration (`Allow-Methods`, `Allow-Headers`, `Max-Age`) is never verified

**Why It's Harmful**: The browser sends a preflight OPTIONS request before many cross-origin requests. If the preflight response is missing headers (like `Allow-Methods` or `Allow-Headers`), the browser blocks the actual request. Tests that only check actual responses will pass even if the preflight configuration is completely broken.

**Real-World Consequence**: An API adds a custom header requirement (e.g., `X-Requested-With`) but never adds it to `allowed_headers` in CORS config. Preflight returns no `Allow-Headers` for this header. All browser POST requests fail. Server-side tests pass because they skip preflight.

**Preferred Alternative**: Test both preflight (OPTIONS) and actual requests (GET/POST) with CORS headers.

**Refactoring Strategy**:
1. Add preflight tests using `$this->optionsJson()` with `Origin` and `Access-Control-Request-Method` headers
2. Assert `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` on preflight responses
3. Keep actual-request tests for `Access-Control-Allow-Origin` and credentials

**Detection Checklist**:
- [ ] Preflight OPTIONS tests exist for CORS endpoints
- [ ] Preflight tests assert `Allow-Methods`, `Allow-Headers`, `Max-Age`
- [ ] Actual-request tests exist separately

**Related Rules**: Test Preflight OPTIONS Request
**Related Skills**: Test CORS Behavior
**Related Decision Trees**: Tree 1 — CORS Test Coverage Scope

---

## Anti-Pattern 2: No Disallowed Origin Tests

**Category**: Security

**Description**: Testing only that allowed origins work without verifying that disallowed origins are blocked.

**Warning Signs**:
- No test sends a request with an untrusted origin (e.g., `https://evil.com`)
- `assertHeaderMissing('Access-Control-Allow-Origin')` is never used
- CORS allowlist is assumed correct without verification

**Why It's Harmful**: A CORS configuration that returns `Access-Control-Allow-Origin: *` for every origin (including malicious ones) exposes the API to cross-origin data theft. Without a disallowed-origin test, the wildcard goes undetected.

**Real-World Consequence**: A developer changes `allowed_origins` from `['https://app.example.com']` to `['*']` to fix a local development CORS issue. The change is deployed to production. Any website can now read the API response. A malicious site steals user data via cross-origin requests. No test catches the wildcard.

**Preferred Alternative**: Always test with a clearly disallowed origin and assert `assertHeaderMissing('Access-Control-Allow-Origin')`.

**Refactoring Strategy**:
1. Pick a clearly disallowed origin (e.g., `https://evil.com`)
2. Add a preflight test with this origin
3. Assert `assertHeaderMissing('Access-Control-Allow-Origin')`

**Detection Checklist**:
- [ ] Disallowed origin tests exist
- [ ] `assertHeaderMissing` is used for disallowed origins
- [ ] Wildcard `*` is not present in `Access-Control-Allow-Origin` for credentialed endpoints

**Related Rules**: Test Both Allowed And Disallowed Origins
**Related Skills**: Test CORS Behavior
**Related Decision Trees**: Tree 2 — Disallowed Origin Testing

---

## Anti-Pattern 3: No CORS Headers on Error Responses

**Category**: Security

**Description**: CORS headers present on successful responses but missing from 4xx and 5xx error responses.

**Warning Signs**:
- CORS tests only hit successful endpoints (200, 201)
- No test triggers a 404, 422, or 500 with an `Origin` header and checks CORS headers
- Frontend developers report "network error" for API errors in the browser console

**Why It's Harmful**: When an API returns a 500 error without CORS headers, the browser blocks the response. The frontend JavaScript sees a generic network error instead of the actual API error response. Frontend debugging becomes nearly impossible — developers see red network errors with no details.

**Real-World Consequence**: An API returns 422 validation errors without CORS headers. The SPA's form validation never shows server-side errors. Users see "something went wrong" for every invalid form submission. The team blames the frontend for three days before discovering the CORS issue.

**Preferred Alternative**: Assert that error responses (4xx, 5xx) include the same CORS headers as success responses.

**Refactoring Strategy**:
1. Identify endpoints that can return 4xx/5xx errors
2. Trigger an error condition (e.g., missing resource for 404, invalid input for 422)
3. Assert CORS headers are present on the error response

**Detection Checklist**:
- [ ] At least one 404 response is tested for CORS headers
- [ ] At least one 422 response is tested for CORS headers
- [ ] At least one 500 response is tested for CORS headers (in production mode)
- [ ] All error types include CORS headers

**Related Rules**: Test CORS Headers On Error Responses
**Related Skills**: Test CORS Behavior

---

## Anti-Pattern 4: Missing Expose-Headers Tests

**Category**: Testing completeness

**Description**: Never testing that `Access-Control-Expose-Headers` includes all custom headers the frontend needs to read.

**Warning Signs**:
- No test asserts `Access-Control-Expose-Headers` value
- Frontend code tries to read custom headers (e.g., `X-RateLimit-Remaining`) but always gets `null`
- `Access-Control-Expose-Headers` is not configured in `config/cors.php`

**Why It's Harmful**: By default, browser JavaScript can only read simple response headers (Cache-Control, Content-Type). Custom headers like `X-RateLimit-Remaining`, `X-Request-Id`, or `Deprecation` are invisible to `fetch()` or `XMLHttpRequest` responses unless explicitly listed in `Access-Control-Expose-Headers`.

**Real-World Consequence**: The frontend tries to read `X-RateLimit-Remaining` to show remaining request count to the user. The header is present in the response but not in `Access-Control-Expose-Headers`. JavaScript always sees `null`. The feature appears broken despite the backend sending the correct header.

**Preferred Alternative**: Assert that `Access-Control-Expose-Headers` includes every custom header that browser JavaScript needs to read.

**Refactoring Strategy**:
1. List all custom headers the API returns (rate-limit, request-id, deprecation)
2. Add an assertion on the preflight response: `assertHeader('Access-Control-Expose-Headers', ...)`
3. Verify each custom header is included in the expose list

**Detection Checklist**:
- [ ] `Access-Control-Expose-Headers` is tested
- [ ] All custom response headers are included in the expose list
- [ ] Rate-limit headers (`X-RateLimit-*`) are exposed if used

**Related Rules**: Test Access-Control-Expose-Headers
**Related Skills**: Test CORS Behavior

---

## Anti-Pattern 5: Wildcard Origin with Credentials

**Category**: Security

**Description**: Configuring `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`, which is rejected by browsers.

**Warning Signs**:
- CORS config has `allowed_origins: ['*']` and `supports_credentials: true`
- No test explicitly verifies that origin is not wildcard when credentials are enabled
- Credentialed CORS requests fail silently in browser but work in curl/Postman

**Why It's Harmful**: The browser specification forbids `Access-Control-Allow-Origin: *` when credentials are involved. The response will be rejected by the browser even though the server sends it. This is a browser-enforced security restriction that cannot be overridden.

**Real-World Consequence**: A team sets `allowed_origins: ['*']` for development and `supports_credentials: true` for authentication. The API works in cURL and Postman (no CORS enforcement). The SPA cannot authenticate because the browser blocks the credentialed response with wildcard origin. Debugging takes days because server logs show successful responses.

**Preferred Alternative**: Never use wildcard `*` with `supports_credentials: true`. Test explicitly that origin is not `*` and credentials is `true`.

**Refactoring Strategy**:
1. Change `allowed_origins` from `['*']` to explicit origins
2. Add a test: `expect($response->headers->get('Access-Control-Allow-Origin'))->not->toBe('*')`
3. Add a test: `assertHeader('Access-Control-Allow-Credentials', 'true')`

**Detection Checklist**:
- [ ] `Access-Control-Allow-Origin` is not `*` when credentials are supported
- [ ] `Access-Control-Allow-Credentials: true` is present when configured
- [ ] Preflight test verifies both headers together

**Related Rules**: Test Credentialed Requests
**Related Skills**: Test CORS Behavior
