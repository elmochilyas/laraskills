# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Passport OAuth2 Server
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | OAuth2 Grant Type Selection | Choosing appropriate grant for each client type | security, architectural |
| 2 | Scope Design Strategy | Granular vs broad scope definitions | security, maintainability |
| 3 | Token Lifetime Configuration | Access and refresh token expiry durations | security, user-experience |

---

# Architecture-Level Decision Trees

---

## OAuth2 Grant Type Selection

---

## Decision Context

Selecting the correct OAuth2 grant type for each client type — Authorization Code + PKCE, Client Credentials, or Device Code.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Is the client a browser-based application (SPA)?
↓
YES → Authorization Code + PKCE (public client, no secret)
NO → Is the client a mobile or desktop app?
    YES → Authorization Code + PKCE (public client, system browser for auth)
    NO → Is the client a server-side web app?
        YES → Authorization Code + PKCE (confidential client, secret required)
        NO → Is this machine-to-machine (service-to-service)?
            YES → Client Credentials grant (no user context, app-level access)
            NO → Is this a CLI, IoT, or headless device?
                YES → Device Code grant (user authenticates on separate device)
                NO → Is this a legacy client that cannot be updated?
                    YES → Password Grant (deprecated — accept only if unavoidable)

---

## Rationale

Authorization Code + PKCE is the universal grant for user-facing applications. PKCE is mandatory for public clients (SPAs, mobile) and recommended for confidential clients. Client Credentials is for server-to-server without user context. Device Code is for devices without browsers. Password Grant is deprecated and should never be used for new integrations.

---

## Recommended Default

**Default:** Authorization Code + PKCE for all user-facing clients; Client Credentials for M2M
**Reason:** Authorization Code + PKCE is the OAuth2 security best practice for both public and confidential clients. Client Credentials is the correct grant for service-to-service without user delegation.

---

## Risks Of Wrong Choice

- Password Grant: credentials exposed to client, no MFA support, deprecated
- Implicit Grant (deprecated): authorization code interception, no token rotation
- Client Credentials for user-facing apps: no user context, cannot identify user
- Auth Code without PKCE: authorization code interception vulnerability

---

## Related Rules

- Use PKCE for Public Clients (SPAs and Mobile Apps) (05-rules.md)
- Do Not Use Passport for First-Party SPA Authentication (05-rules.md)
- Schedule Token Pruning With passport:purge Command (05-rules.md)

---

## Related Skills

- Configure Passport OAuth2 Server for Delegated Authorization (06-skills.md)
- Configure Sanctum SPA and Token Authentication (06-skills.md)

---

## Scope Design Strategy

---

## Decision Context

Designing the OAuth2 scope list — defining what permissions third-party applications can request.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Does the API have distinct resource types (orders, users, products)?
↓
YES → Are there different operations per resource (read, write, delete)?
    YES → Granular scopes: `resource.action` format (e.g., `orders.read`, `orders.write`)
    NO → Resource-level scopes: `resource` format (e.g., `orders`, `users`)
NO → Are there feature areas that can be separated?
    YES → Feature-based scopes: `feature.action` (e.g., `billing.read`)
    NO → Action-level scopes: `read`, `write`, `admin`

Do you need a default scope for new tokens?
↓
YES → Set `Passport::setDefaultScope(['profile.read'])` — minimal access by default
NO → All scopes must be explicitly requested

Are there admin-only scopes?
↓
YES → Design separate `admin:*` scopes with middleware enforcement
NO → All scopes available to any authorized client

---

## Rationale

Granular scopes implement least-privilege access. `resource.action` format is the OAuth2 best practice — it's readable, hierarchical, and easy to enforce. A minimal default scope ensures tokens have only the permissions necessary for basic functionality. Admin scopes should be clearly separated and enforced by middleware.

---

## Recommended Default

**Default:** Granular scopes in `resource.action` format with a minimal `profile.read` default scope
**Reason:** Granular scopes follow the principle of least privilege. `profile.read` as default allows token-bearing clients to identify the user without automatically granting broader access. The `resource.action` naming convention is self-documenting.

---

## Risks Of Wrong Choice

- Single broad scope (`admin`): third-party apps get full access, defeats delegation purpose
- No default scope: all scopes must be requested, may break simple clients
- Too many granular scopes: scope negotiation complexity, user confusion on authorization screen
- Admin scopes available to all clients: privilege escalation via scope request

---

## Related Rules

- Design Scopes as Granular Permissions, Not Broad Roles (05-rules.md)
- Revoke Tokens on Security Events (05-rules.md)
- Set Short Access Token Lifetimes With Longer Refresh Windows (05-rules.md)

---

## Related Skills

- Configure Passport OAuth2 Server for Delegated Authorization (06-skills.md)

---

## Token Lifetime Configuration

---

## Decision Context

Setting access token expiry and refresh token lifetime durations.

---

## Decision Criteria

* security
* user-experience

---

## Decision Tree

Is this a high-security application (finance, healthcare, admin)?
↓
YES → Short access tokens (15 minutes), short refresh tokens (7 days)
NO → Is this a consumer application with infrequent usage?
    YES → Short access tokens (30-60 minutes), medium refresh tokens (14 days)
    NO → Is this a mobile app with offline usage patterns?
        YES → Medium access tokens (1 hour), long refresh tokens (30 days)
        NO → Standard: access 1 hour, refresh 14 days

Do you need refresh token rotation?
↓
YES → Enable rotation (each refresh invalidates previous refresh token)
NO → Rotation disabled (less secure, simpler implementation)

Are there compliance requirements for session duration?
↓
YES → Align token lifetimes with compliance requirements (SOC2, HIPAA, PCI DSS)
NO → Evaluate based on security posture

---

## Rationale

Short access tokens limit the window of a compromised token. Refresh tokens allow seamless re-authentication without user intervention. Refresh token rotation prevents replay attacks — if a stolen refresh token is used before the legitimate one, both are invalidated. Token lifetimes should balance security with user experience.

---

## Recommended Default

**Default:** Access token: 1 hour; Refresh token: 14 days; Refresh token rotation enabled
**Reason:** 1-hour access tokens balance security and UX — tokens are short-lived but not so short that they cause frequent re-requests. 14-day refresh tokens provide a reasonable session window. Rotation prevents replay attacks on refresh tokens.

---

## Risks Of Wrong Choice

- Access tokens lasting days: compromised token window is too large
- No refresh token rotation: stolen refresh tokens can be replayed indefinitely
- Very short access token (5 min) + short refresh: UX burden from frequent token renewal
- Very long refresh (90 days): compromised refresh tokens give extended access

---

## Related Rules

- Set Short Access Token Lifetimes With Longer Refresh Windows (05-rules.md)
- Revoke Tokens on Security Events (05-rules.md)
- Secure OAuth2 Private Key With 600 Permissions Outside Web Root (05-rules.md)

---

## Related Skills

- Configure Passport OAuth2 Server for Delegated Authorization (06-skills.md)
