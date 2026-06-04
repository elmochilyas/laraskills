# ECC Anti-Patterns — Sanctum SPA Cookie Auth

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | Sanctum SPA Cookie Auth |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Non-Cookie Session Driver with SPA Auth
2. Missing withCredentials: true in Frontend Requests
3. Cross-Domain SPA Cookie Auth Without Proper Session Domain
4. CSRF Cookie Route Behind Authentication Middleware
5. Storing Large Data in Cookie Session

---

## Repository-Wide Anti-Patterns



---

## Anti-Pattern 1: Non-Cookie Session Driver with SPA Auth

### Category
Framework Usage

### Description
Using `SESSION_DRIVER=file`, `redis`, or `database` instead of `cookie` with Sanctum SPA cookie auth, causing Sanctum's `EnsureFrontendRequestsAreStateful` middleware to fail silently and all requests to appear unauthenticated.

### Why It Happens
Developers use the default session driver from their existing configuration without understanding Sanctum SPA mode's dependency on the cookie driver.

### Warning Signs
- All SPA requests return 401 despite correct login flow
- Sanctum's `EnsureFrontendRequestsAreStateful` middleware is applied but requests are unauthenticated
- `SESSION_DRIVER` is not `cookie` in `.env`
- Session data stored server-side instead of in the encrypted cookie

### Why It Is Harmful
SPA cookie authentication silently fails. The login endpoint returns 200, but subsequent authenticated requests all return 401. Hours of debugging wasted on CORS, middleware, and route configuration while the root cause is the session driver.

### Real-World Consequences
The login flow appears to work — the server accepts credentials and returns a response. But every subsequent API request returns 401. The frontend team spends days debugging CORS and middleware while the actual issue is a single `.env` configuration value.

### Preferred Alternative
Set `SESSION_DRIVER=cookie` in the environment when using Sanctum SPA cookie auth.

### Refactoring Strategy
1. Change `SESSION_DRIVER=cookie` in `.env`
2. Verify `SESSION_SECURE_COOKIE=true` in production
3. Restart the application and test the full login → authenticated request flow

### Detection Checklist
- [ ] Check `SESSION_DRIVER` in `.env` — must be `cookie`
- [ ] Verify Sanctum SPA auth works with a test login → request flow

### Related Rules
- Use Session Driver of cookie for SPA Auth (05-rules.md)

### Related Skills
- Implement Sanctum SPA Cookie Authentication (06-skills.md)

### Related Decision Trees
- (Sanctum vs Passport decision covers this)

---

## Anti-Pattern 2: Missing withCredentials: true in Frontend Requests

### Category
Framework Usage

### Description
Not setting `withCredentials: true` (Axios) or `credentials: 'include'` (fetch) on SPA requests, causing the browser to omit the session cookie and all API requests to appear unauthenticated.

### Why It Happens
Developers forget that cookies are not included in cross-origin requests by default. The frontend code uses standard `axios.get()` without the credentials flag.

### Warning Signs
- Axios requests from SPA do not include cookies in request headers
- Login succeeds but all subsequent API calls return 401
- `axios.defaults.withCredentials` not set to `true`
- `credentials: 'include'` absent from `fetch()` options

### Why It Is Harmful
The session cookie is never sent with API requests. Every request appears as a new, unauthenticated visitor. The entire authentication flow is broken at the network level.

### Real-World Consequences
Users log in successfully (the server sets the session cookie), but every SPA navigation that triggers an API call returns 401. Users see an empty or error state. The app is completely non-functional behind authentication.

### Preferred Alternative
Set `axios.defaults.withCredentials = true` globally or pass `{ withCredentials: true }` on every request.

### Refactoring Strategy
1. Add `axios.defaults.withCredentials = true` in the Axios configuration file
2. For fetch, add `credentials: 'include'` to all requests
3. Verify cookies appear in request headers using browser dev tools
4. Test the full auth flow end-to-end

### Detection Checklist
- [ ] Check frontend code for `withCredentials` or `credentials: 'include'`
- [ ] Verify cookies are sent with authenticated requests in browser dev tools

### Related Rules
- Use withCredentials: true in Axios/Fetch Requests (05-rules.md)

### Related Skills
- Implement Sanctum SPA Cookie Authentication (06-skills.md)

### Related Decision Trees
- (CORS credentialed mode decision tree)

---

## Anti-Pattern 3: Cross-Domain SPA Cookie Auth Without Proper Session Domain

### Category
Architecture

### Description
Hosting the SPA and API on different subdomains without configuring `SESSION_DOMAIN` or using `SameSite=None; Secure` cookies, causing the browser to block cookie transmission cross-origin.

### Why It Happens
Developers assume cookies work across any two origins. The subdomain separation (`app.example.com` → `api.example.com`) is not recognized as cross-origin.

### Warning Signs
- SPA on `app.example.com`, API on `api.example.com`
- Cookies set by API are not sent by SPA in requests
- `SESSION_DOMAIN` not configured
- `SameSite` attribute blocks cross-subdomain cookie transmission

### Why It Is Harmful
Cookies are scoped to the exact subdomain by default. Without `SESSION_DOMAIN=.example.com`, the cookie set by `api.example.com` is not sent by `app.example.com`. The SPA cannot authenticate.

### Real-World Consequences
Users are on `app.example.com`. The SPA calls `api.example.com/login` and gets a session cookie scoped to `api.example.com`. When the SPA calls `api.example.com/user`, the browser does not send the cookie because `app.example.com` is a different origin.

### Preferred Alternative
Set `SESSION_DOMAIN=.example.com` (leading dot) in `.env` to share cookies across subdomains. Use `SameSite=None; Secure` for cross-origin cookie transmission.

### Refactoring Strategy
1. Set `SESSION_DOMAIN=.example.com` in `.env`
2. Ensure `SESSION_SECURE_COOKIE=true` (required for SameSite=None)
3. Set `SESSION_SAME_SITE=none` for cross-origin transmission
4. Verify cookies are shared across subdomains

### Detection Checklist
- [ ] Check `SESSION_DOMAIN` configuration
- [ ] Verify SameSite attribute allows cross-origin sending
- [ ] Test cookie transmission across subdomains

### Related Rules
- Set SESSION_DOMAIN for Subdomain Sharing (05-rules.md)

### Related Skills
- Implement Sanctum SPA Cookie Authentication (06-skills.md)

### Related Decision Trees
- (Deployment topology decisions for Sanctum auth)

---

## Anti-Pattern 4: CSRF Cookie Route Behind Authentication Middleware

### Category
Security

### Description
Placing the `/sanctum/csrf-cookie` route behind authentication middleware, making the CSRF token unobtainable before login and breaking the entire authentication flow.

### Why It Happens
Developers apply auth middleware globally or to all routes in the API group without exempting the CSRF cookie endpoint.

### Warning Signs
- `GET /sanctum/csrf-cookie` returns 401 instead of 204
- CSRF cookie is not set on the initial request
- SPA cannot proceed past the CSRF fetch step
- Auth middleware applied to Sanctum's own routes

### Why It Is Harmful
The CSRF cookie must be fetched before the user is authenticated — it's part of the login flow. If this endpoint requires authentication, users can never obtain a CSRF token to submit the login form. The login flow is deadlocked.

### Real-World Consequences
The SPA calls `GET /sanctum/csrf-cookie` to initialize the CSRF token. The server returns 401 because the auth middleware blocks it. The SPA never gets the XSRF-TOKEN cookie. Every login attempt returns 419 (CSRF token mismatch).

### Preferred Alternative
Ensure `/sanctum/csrf-cookie` is publicly accessible. Sanctum registers this route automatically without auth middleware — do not add auth to it.

### Refactoring Strategy
1. Remove auth middleware from the `/sanctum/csrf-cookie` route
2. Verify the route returns 204 without authentication
3. Test the SPA login flow from initial CSRF fetch to authenticated request

### Detection Checklist
- [ ] Test `GET /sanctum/csrf-cookie` without authentication — should return 204
- [ ] Check for middleware applied to Sanctum's routes

### Related Rules
- Make CSRF Cookie Route Publicly Accessible (05-rules.md)

### Related Skills
- Implement Sanctum SPA Cookie Authentication (06-skills.md)

### Related Decision Trees
- (Stateful vs stateless detection decisions)

---

## Anti-Pattern 5: Storing Large Data in Cookie Session

### Category
Performance

### Description
Storing large objects or sensitive data in the session when using the cookie session driver, causing oversized cookies that exceed proxy size limits and break requests.

### Why It Happens
Developers use the session for caching user preferences or temporary data without considering that the cookie driver stores everything in an encrypted cookie, not on the server side.

### Warning Signs
- Session contains large serialized objects (>8KB)
- Intermittent request failures with 413 (Request Entity Too Large) or empty responses
- Proxy/CDN rejecting requests due to oversized cookies
- `session(['key' => $largeData])` pattern in code

### Why It Is Harmful
Proxies (Nginx, Cloudflare, AWS ALB) typically reject cookies larger than 8KB or 16KB. Oversized cookies cause request failures, and the errors are opaque — the client sees a generic error or empty response.

### Real-World Consequences
A user profile update stores a large preferences object in the session. The encrypted cookie grows to 12KB. Nginx rejects the request with 413. The user sees a generic error page. Debugging reveals oversized cookies after hours of investigation.

### Preferred Alternative
Keep session data minimal — store only identifiers. Store large data server-side (database, Redis) and reference by ID in the session.

### Refactoring Strategy
1. Identify all `session([...])` calls storing large data
2. Move large data to server-side storage (DB, Redis)
3. Store only a reference key in the session
4. Measure cookie size before and after

### Detection Checklist
- [ ] Check cookie size in browser dev tools
- [ ] Search for `session([` with large data objects
- [ ] Verify proxy limits are not exceeded

### Related Rules
- Never Store Sensitive Data in Session (05-rules.md)

### Related Skills
- Implement Sanctum SPA Cookie Authentication (06-skills.md)

### Related Decision Trees
- (Session driver selection decisions)

---
