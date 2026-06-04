# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** OIDC Integration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | OIDC vs SAML vs Social Login | Choosing enterprise SSO protocol | architectural, maintainability, security |
| 2 | OIDC Implementation Approach | Managed service vs custom Socialite driver | maintainability, architectural, security |
| 3 | JWKS Caching Strategy | How long to cache IdP signing keys | performance, security |

---

# Architecture-Level Decision Trees

---

## OIDC vs SAML vs Social Login

---

## Decision Context

Choosing between OIDC (modern), SAML 2.0 (legacy enterprise), and Social Login (OAuth2 without identity layer) for authentication.

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Is this an enterprise environment with an existing IdP?
↓
YES → Does the IdP support OIDC?
    YES → OIDC (modern, simpler, JWT-based)
    NO → Does the IdP support SAML 2.0?
        YES → SAML 2.0 (legacy but necessary for some IdPs)
        NO → Evaluate WorkOS or custom integration
NO → Is this a consumer-facing social login feature?
    YES → Socialite OAuth2 (Google, GitHub, Facebook — no identity layer needed)
    NO → Is this an M2M / API integration?
        YES → OAuth2 Client Credentials (Passport)
        NO → Evaluate authentication requirements

Do you need standardized identity claims (email, name, groups)?
↓
YES → OIDC (provides id_token with standardized claims)
NO → Social Login or OAuth2 (access token only)

---

## Rationale

OIDC is the modern standard for enterprise SSO — simpler than SAML, JWT-based, with standardized identity claims. SAML 2.0 is XML-based and more complex but required for some legacy enterprise IdPs. Social Login (plain OAuth2) is sufficient for consumer identity but lacks the standardized identity layer of OIDC.

---

## Recommended Default

**Default:** OIDC for enterprise SSO; Socialite OAuth2 for consumer social login
**Reason:** OIDC is the industry direction — simpler than SAML, JWT-based, widely supported. Social Login is appropriate for consumer use cases where standardized identity claims are not needed.

---

## Risks Of Wrong Choice

- SAML when OIDC available: unnecessary XML complexity, slower integration, harder to maintain
- OIDC for simple social login: over-engineering, requires IdP that supports OIDC
- Social Login for enterprise: no standardized identity claims, no id_token, harder to audit
- OIDC via custom driver for production-critical flows: single-contributor package risk

---

## Related Rules

- Always Validate id_token Signature Using JWKS (05-rules.md)
- Generate and Validate Nonce for Replay Protection (05-rules.md)
- Use OIDC Discovery URL Instead of Hardcoded Endpoints (05-rules.md)

---

## Related Skills

- Integrate OpenID Connect (OIDC) for Enterprise Single Sign-On (06-skills.md)
- Configure Socialite OAuth Client Authentication (06-skills.md)
- Implement SAML 2.0 SSO (06-skills.md)

---

## OIDC Implementation Approach

---

## Decision Context

Choosing between a managed service (WorkOS) or a custom Socialite driver for OIDC integration.

---

## Decision Criteria

* maintainability
* architectural
* security

---

## Decision Tree

How many enterprise IdPs do you need to support?
↓
1 → Do you want a managed, supported integration?
    YES → WorkOS (managed SSO, supports OIDC + SAML, support included)
    NO → Custom Socialite driver (free, single-contributor risk)
2+ → Do you want to avoid maintaining multiple drivers?
    YES → WorkOS (single integration for any IdP)
    NO → Multiple custom Socialite drivers (more maintenance)

Is this a production-critical authentication path?
↓
YES → WorkOS (SLAs, support, managed JWKS rotation, multi-IdP)
NO → Custom Socialite driver (sufficient for non-critical or internal apps)

Do you have budget for a paid SSO service?
↓
YES → WorkOS (faster integration, less maintenance)
NO → Custom Socialite driver (open source, self-maintained)

---

## Rationale

WorkOS abstracts OIDC/SAML complexity behind a single integration point — one package works with any IdP. Custom Socialite drivers require maintaining OIDC protocol compliance, JWKS handling, and nonce generation. For production-critical enterprise SSO, WorkOS reduces maintenance risk. For internal tools or single-IdP setups, a custom Socialite driver may be sufficient.

---

## Recommended Default

**Default:** WorkOS for production enterprise SSO; custom Socialite driver for internal tools or single-IdP setups
**Reason:** WorkOS reduces maintenance burden, provides SLAs, and handles multi-IdP support out of the box. Custom drivers are appropriate when budget is constrained or only one IdP needs support.

---

## Risks Of Wrong Choice

- Custom driver for production-critical SSO: single-contributor risk, no SLA, undocumented behavior changes
- WorkOS for single-IdP internal tool: unnecessary cost, dependency on third-party service
- No SSO at all: users manage separate passwords, no centralized identity management

---

## Related Rules

- Cache JWKS Keys With Appropriate TTL (05-rules.md)
- Validate aud Claim Matches Client ID (05-rules.md)
- Enforce HTTPS for All OIDC Communication (05-rules.md)

---

## Related Skills

- Integrate OpenID Connect (OIDC) for Enterprise Single Sign-On (06-skills.md)
- Configure WorkOS Enterprise SSO (06-skills.md)

---

## JWKS Caching Strategy

---

## Decision Context

How long to cache the IdP's JSON Web Key Set (public signing keys) to balance performance against key rotation handling.

---

## Decision Criteria

* performance
* security

---

## Decision Tree

Does the IdP publish a key rotation schedule?
↓
YES → Cache TTL = rotation interval × 0.8 (e.g., 30-day rotation → 24-day cache)
NO → Does the IdP return Cache-Control headers?
    YES → Respect Cache-Control max-age from JWKS response
    NO → Is this a high-throughput application?
        YES → 24 hours cache (reasonable default, schedule regular manual checks)
        NO → 12 hours (conservative)

Is token validation failing intermittently (stale JWKS)?
↓
YES → Reduce cache TTL or implement cache invalidation on validation failure
NO → Current TTL is appropriate

---

## Rationale

JWKS keys change infrequently (typically monthly or less). Caching prevents an HTTP request to the IdP on every authentication. Too-long TTL causes validation failures when keys rotate. Too-short TTL defeats caching benefits. Key rotation can be handled by catching JWT validation exceptions and refreshing the cache before retrying.

---

## Recommended Default

**Default:** 24 hours cache TTL with fallback — on validation failure, refresh JWKS and retry once
**Reason:** 24 hours is a conservative default that works for most IdPs. The fallback strategy (refresh on failure) ensures resilience against unexpected key rotation without requiring a very short TTL.

---

## Risks Of Wrong Choice

- No caching: HTTP request to IdP on every authentication, increased latency, IdP rate limiting
- Indefinite caching: valid tokens rejected after key rotation, user authentication failures
- Very short TTL (minutes): minimal caching benefit, frequent JWKS requests to IdP

---

## Related Rules

- Cache JWKS Keys With Appropriate TTL (05-rules.md)
- Monitor IdP Token Expiry and Implement Refresh Token Flow (05-rules.md)

---

## Related Skills

- Integrate OpenID Connect (OIDC) for Enterprise Single Sign-On (06-skills.md)
