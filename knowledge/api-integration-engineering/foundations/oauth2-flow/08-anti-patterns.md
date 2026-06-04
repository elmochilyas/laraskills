# ECC Anti-Patterns — OAuth 2.0 Flow for Client Credentials Grant

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | OAuth 2.0 Flow for Client Credentials Grant |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Fetching OAuth Token on Every Request (No Caching)
2. No Cache Stampede Protection on Token Refresh
3. Not Handling 401 Responses with Token Retry
4. Credentials Stored in Source Code or .env Without Vault
5. No Proactive Token Refresh (Waiting Until Expiry)

---

## Repository-Wide Anti-Patterns

- Premature Caching (inverse: no caching at all)
- Premature Optimization

---

## Anti-Pattern 1: Fetching OAuth Token on Every Request (No Caching)

### Category
Performance | Architecture

### Description
Calling the OAuth token endpoint on every API request instead of caching the access token. Each API call incurs an extra round-trip for authentication.

### Why It Happens
The simplest implementation fetches a token inline before each request. Developers don't consider that the token is reusable across multiple requests.

### Warning Signs
- Token endpoint called before every API request
- Auth endpoint showing high request volume
- API calls consistently take 200-500ms extra for token fetch

### Why It Is Harmful
Each API call latency increases by the token fetch time (typically 100-500ms). Token endpoint rate limits may be exhausted, preventing legitimate token refreshes.

### Real-World Consequences
50 API calls/minute to Stripe also generate 50 auth calls/minute to the token endpoint. The auth provider rate-limits the client. All integrations fail simultaneously.

### Preferred Alternative
Cache the access token with TTL matching token expiry. Use `Cache::remember()`.

### Refactoring Strategy
1. Create a token service class with cached token retrieval
2. Set cache TTL to token `expires_in` minus 10s safety margin
3. Replace inline token fetches with service method calls
4. Verify token endpoint calls drop to 1 per TTL period

### Detection Checklist
- [ ] Token fetched before each API call
- [ ] No cache layer around token retrieval
- [ ] Auth endpoint traffic equals API call traffic

### Related Rules
Cache Tokens with Stampede Protection (05-rules.md)

### Related Skills
Implement OAuth2 Client Credentials Flow for M2M Authentication (06-skills.md)

### Related Decision Trees
Token Caching and Refresh Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: No Cache Stampede Protection on Token Refresh

### Category
Performance | Scalability

### Description
Using simple `Cache::remember()` for token caching without lock protection. When the cache expires, all concurrent workers simultaneously hit the token endpoint.

### Why It Happens
`Cache::remember()` appears sufficient in single-threaded development. The stampede only manifests under production concurrency.

### Warning Signs
- Token endpoint traffic spikes at regular intervals (coinciding with cache TTL)
- 429 errors from auth provider at cache expiry boundaries
- All API calls fail simultaneously for a few seconds at regular intervals

### Why It Is Harmful
The token endpoint receives N concurrent requests (one per worker) when the cache expires. This can trigger rate limits on the auth provider, causing all API calls to fail until a worker successfully refreshes the token.

### Real-World Consequences
20 queue workers all hit the token endpoint simultaneously at TTL expiry. The auth provider returns 429 for all 20 requests. All 20 workers can't refresh the token. All API calls fail for 10 minutes until manual cache clear.

### Preferred Alternative
Use `Cache::lock()` around token refresh to ensure only one worker refreshes while others wait.

### Refactoring Strategy
1. Replace `Cache::remember()` with lock-based pattern
2. Use `Cache::lock('token:lock', 10)` to acquire refresh lock
3. Return cached token for requests that don't acquire the lock
4. Implement proactive refresh at 50% TTL to spread refresh load

### Detection Checklist
- [ ] `Cache::remember()` without lock for token caching
- [ ] Token endpoint traffic spikes at regular intervals
- [ ] Auth provider rate limits hit at expiry boundaries

### Related Rules
Cache Tokens with Stampede Protection (05-rules.md)

### Related Skills
Implement OAuth2 Client Credentials Flow for M2M Authentication (06-skills.md)

### Related Decision Trees
Token Caching and Refresh Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Not Handling 401 Responses with Token Retry

### Category
Reliability

### Description
Treating all 401 responses as authentication failures without attempting a single retry with a fresh token. Tokens can expire between cache check and request dispatch.

### Why It Happens
Developers assume the cached token is always valid. The race condition between "check token" and "use token" is not obvious.

### Warning Signs
- 401 errors in logs that resolve on automatic retry
- Periodic "unauthorized" errors that self-correct
- No 401 retry logic in HTTP middleware or service class

### Why It Is Harmful
Transient 401 failures (token expired between cache check and request) propagate to users as errors, even though a simple retry with fresh token would succeed.

### Real-World Consequences
Every 3600s (token TTL), 1-2% of requests fail with 401 before the cache expires. Users see "payment failed" errors. Support tickets spike. The issue disappears when the cache refreshes.

### Preferred Alternative
On 401 response, clear cached token, fetch fresh token, and retry the request once.

### Refactoring Strategy
1. Add 401 detection to HTTP middleware or service class
2. On 401, invalidate token cache and fetch fresh token
3. Retry the original request once with the new token
4. If second 401 occurs, propagate the error (real auth issue)

### Detection Checklist
- [ ] 401 errors that resolve on their own
- [ ] No 401 retry logic in API call code
- [ ] Token expiry-related failures in logs

### Related Rules
Handle 401 with Single Retry and Fresh Token (05-rules.md)

### Related Skills
Implement OAuth2 Client Credentials Flow for M2M Authentication (06-skills.md)

### Related Decision Trees
Token Error Recovery Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Credentials Stored in Source Code or .env Without Vault

### Category
Security | Compliance

### Description
Storing OAuth2 client credentials (client_id, client_secret) in source code, configuration files committed to version control, or .env files without vault integration.

### Why It Happens
`.env` files are the standard Laravel configuration pattern. Teams don't consider that `.env` files or `.env.example` may be committed, or that secrets in environment variables lack audit trails.

### Warning Signs
- Client credentials in `.env.example` (committed to repo)
- Credentials in config files committed to version control
- No secret manager or vault integration
- Credential rotation requires code deployment

### Why It Is Harmful
Committed credentials are exposed to everyone with repository access. No audit trail of who accessed credentials. Rotation requires a deployment. A single credential leak compromises the integration.

### Real-World Consequences
A contractor with read-only repo access extracts client_secret from `.env.example`. They authenticate as the application and make fraudulent API calls. No audit trail exists to trace the breach.

### Preferred Alternative
Store credentials in a secrets vault (AWS Secrets Manager, HashiCorp Vault). Fetch at runtime.

### Refactoring Strategy
1. Migrate credentials from .env/config to a vault service
2. Create a service class that fetches secrets from vault
3. Update the token service to use vault-fetched credentials
4. Rotate existing credentials and verify vault-based flow
5. Remove credentials from all config files

### Detection Checklist
- [ ] Client credentials in committed files
- [ ] No vault or secret manager integration
- [ ] Credential rotation requires deployment

### Related Rules
Store Secrets in Vault, Not .env (05-rules.md)

### Related Skills
Implement OAuth2 Client Credentials Flow for M2M Authentication (06-skills.md)

### Related Decision Trees
OAuth2 Grant Type Selection (07-decision-trees.md)

---

## Anti-Pattern 5: No Proactive Token Refresh (Waiting Until Expiry)

### Category
Performance | Reliability

### Description
Caching the token with TTL equal to the full token lifetime and only refreshing when the cache expires at the exact end of TTL.

### Why It Happens
The straightforward `Cache::remember('token', 3600, ...)` matches the token's `expires_in: 3600`. Developers don't think about what happens at the boundary.

### Warning Signs
- Cache TTL equals token lifetime exactly
- Periodic latency spikes at TTL expiry boundaries
- Workers wait for token refresh at consistent intervals

### Why It Is Harmful
At TTL expiry, the token is already expired or expiring. All requests that arrive at the boundary must wait for a token refresh. This creates periodic latency spikes. If token lifetime is shorter than expected, all requests fail simultaneously.

### Real-World Consequences
Token TTL is 3600s. At exactly 3600s, the cache expires. The next 50 requests all miss the cache and wait for token refresh. Average API latency spikes from 200ms to 600ms. This happens every hour.

### Preferred Alternative
Refresh the token at 50-80% of its TTL. Set cache TTL shorter than token lifetime.

### Refactoring Strategy
1. Read `expires_in` from token response
2. Set cache TTL to `expires_in * 0.8` or `expires_in - 60`
3. Implement proactive refresh via scheduler at 50% TTL
4. Add lock protection to prevent concurrent refreshes

### Detection Checklist
- [ ] Cache TTL equals token lifetime
- [ ] Periodic latency spikes at consistent intervals
- [ ] No proactive refresh mechanism

### Related Rules
Proactively Refresh at 50% TTL (05-rules.md)

### Related Skills
Implement OAuth2 Client Credentials Flow for M2M Authentication (06-skills.md)

### Related Decision Trees
Token Caching and Refresh Strategy (07-decision-trees.md)
