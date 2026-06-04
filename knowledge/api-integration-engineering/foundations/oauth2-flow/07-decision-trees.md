# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** oauth2-flow
**Generated:** 2026-06-03

---

# Decision Inventory

1. OAuth2 Grant Type Selection
2. Token Caching and Refresh Strategy
3. Token Error Recovery Strategy

---

# Architecture-Level Decision Trees

---

## OAuth2 Grant Type Selection

---

## Decision Context

Choosing the appropriate OAuth2 flow for the integration.

---

## Decision Criteria

* security
* architectural
* maintainability

---

## Decision Tree

Is this a server-to-server integration (no user)?
↓
YES → Use Client Credentials grant (simplest, no user interaction)
NO → Is there a user session in the browser?
  ↓
  YES → Is the client able to protect a secret (server-side app)?
    ↓
    YES → Use Authorization Code grant (most secure with PKCE)
    NO → Use Authorization Code with PKCE (mobile/SPA)
  NO → Use Client Credentials if machine-to-machine
  ↓
  Does the upstream API only support static API keys?
  ↓
  YES → Skip OAuth2; use API key directly (don't over-engineer)
  NO → Evaluate HMAC or custom signing

---

## Rationale

Client Credentials is the standard for M2M communication. Authorization Code grant with PKCE is for user-facing apps. Static keys are appropriate when upstream doesn't support OAuth2.

---

## Recommended Default

**Default:** Client Credentials grant for all server-to-server integrations
**Reason:** Simplest, most widely supported, no user interaction needed

---

## Risks Of Wrong Choice

Client Credentials for user-facing apps lacks user delegation. Authorization Code for M2M adds unnecessary redirect complexity.

---

## Related Rules

Use Client Credentials for M2M, store credentials in vault

---

## Related Skills

Implement OAuth2 Authentication

---

## Token Caching and Refresh Strategy

---

## Decision Context

Managing access token lifecycle to minimize auth requests.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

Is the token short-lived (<1 hour)?
↓
YES → Cache token with proactive refresh at 50% TTL
  ↓
  Multiple concurrent requests expected at expiry?
  ↓
  YES → Implement cache stampede protection (Cache::lock())
  NO → Simple Cache::remember() is sufficient
NO → Is the token long-lived (>1 day)?
  ↓
  YES → Cache with lock protection; no proactive refresh needed
  NO → Cache with TTL based on token expiry
  ↓
  Check expiry locally (decode JWT)?
  ↓
  YES → Avoid API call to check token validity
  NO → May need to attempt-call-and-retry on 401

---

## Rationale

Proactive refresh at 50% TTL prevents the thundering herd of all workers refreshing simultaneously at expiry. Lock protection prevents concurrent duplicate token requests.

---

## Recommended Default

**Default:** Cache with proactive refresh at 50% TTL + lock protection
**Reason:** Eliminates auth delays from the request path for most requests

---

## Risks Of Wrong Choice

No caching causes an auth request per API call (adds latency). No stampede protection causes spikes on token expiry. No proactive refresh causes periodic auth delays.

---

## Related Rules

Cache tokens with stampede protection, Proactive refresh at 50% TTL

---

## Related Skills

Implement OAuth2 Authentication

---

## Token Error Recovery Strategy

---

## Decision Context

Handling 401 responses due to expired or invalid tokens.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Does the API return 401 when token expires?
↓
YES → Implement 401 retry with fresh token in middleware
  ↓
  Is the retry idempotent?
  ↓
  YES → Retry same request once with fresh token
  NO → Return error; do not retry non-idempotent requests
NO → Does the API return other status for token issues?
  ↓
  YES → Handle based on API documentation
  NO → Monitor for unexpected auth failures
  ↓
  Log 401 attempts with context?
  ↓
  YES → Enable debugging and security monitoring
  NO → Add logging immediately

---

## Rationale

401 retry with fresh token handles the common case of token expiry between cache refresh and request. One retry is sufficient — if the fresh token also fails, something else is wrong.

---

## Recommended Default

**Default:** Single 401 retry with fresh token + log original and retry results
**Reason:** Handles common expiry case without infinite retry loops

---

## Risks Of Wrong Choice

No 401 retry causes failures during normal token rotation. Infinite 401 retry loops can exhaust rate limits or cause account lockout.

---

## Related Rules

Handle 401 with single retry using fresh token

---

## Related Skills

Implement OAuth2 Authentication
