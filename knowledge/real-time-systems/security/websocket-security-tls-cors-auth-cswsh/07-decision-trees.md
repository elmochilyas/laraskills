# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Security
**Knowledge Unit:** WebSocket Security (TLS, CORS, Auth, CSWSH)
**Generated:** 2026-06-03

---

# Decision Inventory

* Authentication Method: Token-Based vs Cookie-Only
* Origin Validation Architecture: Single Layer vs Dual Layer
* TLS Termination Point: Nginx vs Reverb

---

# Architecture-Level Decision Trees

---

## Authentication Method: Token-Based vs Cookie-Only

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Browsers automatically send cookies with WebSocket upgrade requests, enabling Cross-Site WebSocket Hijacking (CSWSH) attacks where a malicious page opens an authenticated WebSocket to your server using the victim's cookies. Token-based authentication avoids this by requiring an explicitly provided Bearer token.

---

## Decision Criteria

* performance considerations — token validation overhead per connection
* architectural considerations — token generation and refresh flow
* security considerations — CSWSH resistance is the primary concern
* maintainability considerations — token lifecycle management

---

## Decision Tree

How should WebSocket authentication be implemented?
↓
Is the application internet-facing with untrusted users?
YES → [Token-based authentication: Bearer token in auth header]
NO → Is the application an internal tool on an isolated network?
    YES → [Cookie-only may be acceptable — limited CSWSH risk]
    NO → [Token-based authentication — app is internet-facing]

---

## Rationale

Token-based authentication is the recommended approach for all internet-facing applications because it provides explicit, revocable, scoped access that is not automatically sent by browsers. Bearer tokens must be included in the `auth.headers.Authorization` field of Echo's configuration. On each channel subscription, Echo sends the token to `/broadcasting/auth`. This prevents CSWSH because a malicious page cannot access the victim's token stored in JavaScript scope. Cookie-only auth is only acceptable for internal applications on isolated networks where CSWSH risk is negligible.

---

## Recommended Default

**Default:** Token-based authentication using Sanctum or JWT Bearer tokens with Echo's `auth.headers.Authorization`
**Reason:** Primary defense against CSWSH; tokens are scoped and revocable

---

## Risks Of Wrong Choice

Cookie-only auth on internet-facing applications enables CSWSH attacks. Tokens in query strings appear in server logs and browser history.

---

## Related Rules

Always Use Token-Based Authentication Over Cookie-Only (05-rules.md)

---

## Related Skills

Secure WebSocket Connections with TLS, Origin Validation, and Auth (06-skills.md)

---

## Origin Validation Architecture: Single Layer vs Dual Layer

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Origin validation is the primary defense against CSWSH. A single layer of validation can be bypassed or misconfigured. Dual-layer validation (at Reverb and application middleware) provides redundancy.

---

## Decision Criteria

* performance considerations — O(n) origin string comparison is negligible
* architectural considerations — configuration at two independent layers
* security considerations — defense in depth against misconfiguration
* maintainability considerations — keeping two allowlists synchronized

---

## Decision Tree

How many layers of origin validation should be implemented?
↓
Is the application internet-facing with high security requirements?
YES → [Dual layer: Reverb allowed_origins + Laravel middleware]
NO → Is the application internal with controlled access?
    YES → [Single layer: Reverb allowed_origins is sufficient]
    NO → [Dual layer recommended for defense in depth]
↓
Are both allowlists kept synchronized?
YES → [Verify both lists match during CI/CD]
NO → [Set up automated synchronization or manual verification process]

---

## Rationale

Dual-layer origin validation provides defense in depth: if the Reverb config is accidentally set to `allowed_origins: ['*']` or misconfigured, the application middleware still validates origins. If the middleware is bypassed (e.g., direct connection to Reverb port), the Reverb-level validation still protects. The two layers are independent protection mechanisms that should be kept synchronized—any change to one should be reflected in the other.

---

## Recommended Default

**Default:** Dual-layer origin validation: Reverb `allowed_origins` + Laravel middleware checking `Origin` header
**Reason:** Independent layers provide redundancy against misconfiguration; defense in depth against CSWSH

---

## Risks Of Wrong Choice

Single layer is a single point of failure—misconfiguration leaves the application vulnerable. Unsynchronized dual layers create confusing debugging scenarios.

---

## Related Rules

Always Validate Origins at Both Reverb and Application Level (05-rules.md)

---

## Related Skills

Secure WebSocket Connections with TLS, Origin Validation, and Auth (06-skills.md)

---

## TLS Termination Point: Nginx vs Reverb

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

WSS encryption is mandatory in production. TLS can be terminated at the Nginx reverse proxy (recommended) or at Reverb directly. The choice affects performance, certificate management, and architecture.

---

## Decision Criteria

* performance considerations — TLS overhead on ReactPHP vs Nginx
* architectural considerations — Nginx reverse proxy architecture
* security considerations — WSS vs WS internal traffic
* maintainability considerations — certificate management location

---

## Decision Tree

Where should TLS be terminated?
↓
Is there an Nginx reverse proxy in front of Reverb?
YES → [Terminate TLS at Nginx — more efficient; centralized cert management]
NO → Is this a single-server deployment without a reverse proxy?
    YES → [Terminate TLS at Reverb directly — acceptable but less efficient]
    NO → [Local development — plain WS is acceptable]
↓
Is the internal network between Nginx and Reverb isolated?
YES → [Plain WS internally is acceptable and more performant]
NO → [Encrypt internal traffic with TLS or VPN]

---

## Rationale

TLS termination at Nginx is strongly preferred because Nginx handles TLS using native C code with hardware acceleration (AES-NI), session caching, and OCSP stapling. Reverb's PHP/ReactPHP runtime handles TLS 2-5x less efficiently. Centralizing TLS at Nginx also simplifies certificate management (one certificate on the LB vs one per Reverb instance). Plain WS internally between Nginx and Reverb is acceptable as long as the internal network is isolated (same VPC, firewalled).

---

## Recommended Default

**Default:** Terminate TLS at Nginx; forward plain WS to Reverb on `127.0.0.1:8080`
**Reason:** 2-5x more efficient than PHP TLS; simpler certificate management; standard architecture

---

## Risks Of Wrong Choice

TLS at Reverb increases CPU usage by 20-40%. Plain WS over a non-isolated network exposes all real-time data to eavesdropping.

---

## Related Rules

Always Use WSS in Production (05-rules.md)

---

## Related Skills

Secure WebSocket Connections with TLS, Origin Validation, and Auth (06-skills.md)
