# ECC Anti-Patterns — Private Channel Auth with JWT/Sanctum

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Channel Types & Authorization |
| **Knowledge Unit** | Private Channel Auth with JWT/Sanctum |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using Default web Guard for API-Driven Apps
2. Hardcoded Tokens in Echo JavaScript Config
3. No Multi-Guard Configuration
4. Ignoring Accept: application/json Header
5. Tokens Expiring Without Refresh During Session

---

## Repository-Wide Anti-Patterns

- Hardcoded Configuration
- Duplicate Business Logic

---

## Anti-Pattern 1: Using Default web Guard for API-Driven Apps

### Category
Security | Framework Usage

### Description
Not specifying the `guards` option on `Broadcast::channel()` for API-driven applications, causing the default `web` guard (session-based) to be used, which silently fails for token-authenticated clients.

### Warning Signs
- API clients receive 401 on `/broadcasting/auth`
- Session-based web clients work but mobile/SPA clients fail
- No `'guards' => ['sanctum']` option on channel registrations
- Token-authenticated requests never resolve a user

### Why It Is Harmful
Without the `guards` option, Laravel defaults to the `web` guard which uses session cookies. API-driven applications (SPAs, mobile apps) authenticate via tokens (Sanctum, Passport, JWT). The `web` guard cannot resolve a user from a Bearer token, so all API auth requests fail with 401.

### Real-World Consequences
A Laravel API serves both a web dashboard (Inertia) and a mobile app. The broadcast channel `orders.{id}` works for the web dashboard (sessions) but returns 401 for the mobile app (Sanctum tokens). Mobile users never receive real-time updates.

### Preferred Alternative
Specify `['guards' => ['sanctum']]` or multi-guard `['guards' => ['sanctum', 'web']]` on each channel registration.

### Refactoring Strategy
1. Identify all channel registrations serving API clients
2. Add `'guards' => ['sanctum', 'web']` option
3. Test auth with both session and token authentication

### Detection Checklist
- [ ] No `guards` option on channel registrations
- [ ] API clients fail on auth endpoint
- [ ] Session clients work but token clients don't

### Related Rules
- (Implied: configure guards for API-driven apps — from anti-patterns in knowledge)

---

## Anti-Pattern 2: Hardcoded Tokens in Echo JavaScript Config

### Category
Security

### Description
Baking Bearer tokens directly into JavaScript source code via environment variables or hardcoded strings, exposing tokens in build artifacts and browser dev tools.

### Warning Signs
- Tokens in `auth.headers.Authorization` as a literal string
- Environment variables containing tokens baked into JS bundle
- Token visible in browser DevTools Network tab on every auth request
- Build artifacts contain tokens

### Why It Is Harmful
Client-side JavaScript is fully accessible to the browser. Hardcoded tokens in Echo config are exposed in the network tab, accessible via XSS attacks, and leaked if build artifacts are exposed. Tokens should be dynamically injected at runtime.

### Real-World Consequences
A Laravel app bakes the API token into the Echo config via an env var that gets compiled into the JS bundle. The bundle is served as a static asset. Anyone who views the source or inspects network requests can extract the Bearer token.

### Preferred Alternative
Inject tokens dynamically from a secure source (localStorage, sessionStorage, or HTTP-only cookie with a runtime endpoint).

### Refactoring Strategy
1. Store token in `localStorage` after login
2. Reference `localStorage.getItem('token')` in Echo config
3. Implement token refresh before expiry
4. Verify token not visible in static assets

### Detection Checklist
- [ ] Token hardcoded or baked into JS bundle
- [ ] Token visible in static assets
- [ ] No dynamic token injection

### Related Rules
- (Implied: never hardcode tokens in Echo config — from anti-patterns in knowledge)

---

## Anti-Pattern 3: No Multi-Guard Configuration

### Category
Architecture

### Description
Configuring a single guard (e.g., only `sanctum` or only `web`) when the application serves both session-based and token-based clients, blocking one client type from private channels.

### Warning Signs
- Application has both web UI (sessions) and API (tokens)
- Only one guard type works for broadcast auth
- Channel registrations don't list both guards
- Switching between Inertia and mobile shows auth differences

### Why It Is Harmful
Single guard configuration means only one authentication method works for broadcast authorization. If only `sanctum` is configured, session-based clients (Inertia, Blade) fail. If only `web`, token-based clients (mobile, SPA) fail.

### Real-World Consequences
An app uses Sanctum for API and web sessions. The channel config specifies `['guards' => ['sanctum']]` only. Web users (Inertia) make session-based auth requests that fail because only the `sanctum` guard is checked.

### Preferred Alternative
Use multi-guard configuration: `['guards' => ['sanctum', 'web']]` for hybrid applications.

### Refactoring Strategy
1. Identify all client types and their auth mechanisms
2. Add both guards in order of preference
3. Test auth from all client types

### Detection Checklist
- [ ] Single guard for mixed client types
- [ ] One client type blocked from private channels
- [ ] Auth failures inconsistent across clients

### Related Rules
- (Implied: use multi-guard for hybrid apps — from best practices in knowledge)

---

## Anti-Pattern 4: Ignoring Accept: application/json Header

### Category
Framework Usage

### Description
Not including the `Accept: application/json` header in Echo's auth configuration, causing the auth endpoint to return HTML error pages instead of JSON, which WebSocket servers cannot parse.

### Warning Signs
- Auth endpoint returns HTML on failure instead of JSON
- WebSocket servers receive non-JSON responses
- Error responses not parseable by broadcast driver
- Generic auth failures with unclear errors

### Why It Is Harmful
Laravel's exception handler returns different response formats based on the `Accept` header. Without `Accept: application/json`, auth failures return HTML error pages or redirects. The WebSocket server expects JSON responses and cannot parse HTML, causing subscription failures.

### Real-World Consequences
An API token expires mid-session. The Echo auth request fails with a 401, but without `Accept: application/json`, the response is an HTML login page redirect. Reverb receives HTML instead of JSON and cannot parse the subscription response. Client shows cryptic error.

### Preferred Alternative
Set `Accept: application/json` in Echo's `auth.headers` configuration.

### Refactoring Strategy
1. Add `Accept: 'application/json'` to Echo auth headers
2. Test expired token scenarios
3. Verify JSON error responses

### Detection Checklist
- [ ] No `Accept: application/json` header configured
- [ ] Auth errors return HTML
- [ ] WebSocket servers receive non-JSON responses

### Related Rules
- (Implied: always include Accept header — from common mistakes in knowledge)

---

## Anti-Pattern 5: Tokens Expiring Without Refresh During Session

### Category
Reliability

### Description
Using short-lived tokens for Echo auth without implementing token refresh, causing WebSocket reconnections to fail after token expiry and leaving users without real-time updates.

### Warning Signs
- Tokens expire within the session duration (e.g., 15 minutes)
- Reconnections fail with 401 after token expiry
- Users see "disconnected" state after inactivity periods
- No token refresh logic on auth failure

### Why It Is Harmful
When a token expires, the Echo client attempts to re-authenticate during reconnection but the expired token is rejected. Without refresh logic, the client cannot re-establish private channel subscriptions and stops receiving real-time updates.

### Real-World Consequences
A user leaves their browser open overnight. Their Sanctum token expires after 2 hours. The WebSocket connection drops during the night. In the morning, the token is expired. Echo cannot re-authenticate. The user's dashboard shows no updates but they don't realize they're disconnected.

### Preferred Alternative
Implement token refresh on auth failure, or use longer-lived tokens for WebSocket auth, or implement silent token refresh before expiry.

### Refactoring Strategy
1. Add token refresh logic in Echo's auth header configuration
2. Refresh token before expiry (detect via expiry claims)
3. On auth failure 401, attempt token refresh, then retry auth
4. Update Echo `auth.headers` dynamically with refreshed token

### Detection Checklist
- [ ] Short-lived tokens without refresh mechanism
- [ ] Reconnections fail after token expiry
- [ ] No token refresh in auth failure handling

### Related Rules
- (Implied: handle token expiry gracefully — from best practices in knowledge)
