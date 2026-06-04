# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Signed Routes
**Generated:** 2026-06-03

---

# Decision Inventory

* Temporary Signed Routes vs Permanent Signed Routes
* Signed Routes vs Authentication for Action Verification
* Dedicated Signed Routes vs Shared Signed+Authenticated Routes
* Server-Side Consumption Tracking vs Expiration-Only Protection

---

# Architecture-Level Decision Trees

---

## Decision 1: Temporary Signed Routes vs Permanent Signed Routes

---

## Decision Context

Whether to use `temporarySignedRoute()` (with expiration) or `signedRoute()` (valid indefinitely) for a given action URL.

---

## Decision Criteria

* Whether the action is time-sensitive
* Whether the signed URL can be intercepted before use
* Whether the action should be available indefinitely

---

## Decision Tree

Does the action need to be performed within a specific time window?
↓
YES → ALWAYS use `temporarySignedRoute()` — expiration is a security boundary
    ↓
    YES → Is the action a critical security operation (password reset, email verification)?
        ↓
        YES → Short expiration: 1-24 hours depending on risk
        NO → Longer expiration: 7-30 days for non-critical (unsubscribe, preferences)
    YES → Is there a requirement for indefinite access?
        ↓
        YES → `temporarySignedRoute()` with very long expiration (1 year max) — NOT `signedRoute()`
        NO → `temporarySignedRoute()` with appropriate window
NO → Does the signed URL have interception risk (email, chat, logs)?
    ↓
    YES → ALWAYS use `temporarySignedRoute()` — limits the window of vulnerability
    NO → Is the action truly idempotent and non-sensitive?
        ↓
        YES → `signedRoute()` is acceptable — indefinite URL with no security impact
        NO → `temporarySignedRoute()` — any sensitivity requires expiration

---

## Rationale

`temporarySignedRoute()` embeds an expiration timestamp in the signature, making the URL invalid after the specified time. `signedRoute()` generates a permanent signature valid indefinitely. An intercepted permanent signed URL can be used at any future time by anyone who possesses it. Temporary URLs limit the exploitation window.

---

## Recommended Default

**Default:** `temporarySignedRoute()` for ALL user-facing signed URLs. `signedRoute()` only for truly permanent, non-sensitive links.
**Reason:** Indefinite signed URLs are a security liability. Expiration limits the window of vulnerability for intercepted links.

---

## Risks Of Wrong Choice

* Permanent signed URLs on password reset: Intercepted email link can be used weeks later to change password
* Temporary signed URLs with short expiration: Legitimate users get 403; frustrated user experience
* Permanent signed URLs on unsubscribe: Intercepted link permanently unsubscribes on anyone who clicks it
* No expiration on verification links: Email confirmation can be performed years after initial registration

---

## Related Rules

* Enforce temporarySignedRoute() Over signedRoute() for User-Facing Links
* Enforce Server-Side Consumption Tracking for One-Time Signed URLs

---

## Related Skills

* Generate Temporary Signed Routes for Time-Sensitive Actions
* Validate Parameters in Signed Route Handlers

---

---

## Decision 2: Signed Routes vs Authentication for Action Verification

---

## Decision Context

Whether to use signed routes (HMAC signature) or require the user to be logged in (authentication) for action verification.

---

## Decision Criteria

* Whether the user has an active session when clicking the link
* Whether the action should be performable without authentication
* Whether the action requires user identity verification

---

## Decision Tree

Is the user logged in when they receive/click the link?
↓
YES → Use authentication — the user is already identified; signed routes add complexity
NO → Can the user log in before performing the action?
    ↓
    YES → Is the action sensitive enough to require authentication (account deletion, payment)?
        ↓
        YES → Require authentication — signed routes are not a substitute for user identity verification
        NO → Use signed routes — authentication is unnecessary overhead for the action
    NO → Signed routes are the only option — user cannot authenticate (no account, no session)
NO → Does the action need to verify the recipient's identity (email ownership)?
    ↓
    YES → Signed route + parameter validation — verify the email hash in the signed URL matches the stored hash
    NO → Signed route is sufficient — the HMAC proves the URL wasn't tampered with

---

## Rationale

Signed routes verify URL integrity (the URL hasn't been modified), not user identity. Authentication verifies who the user is. For actions where the user has an active session (e.g., clicking a link while logged in), authentication is the correct mechanism. Signed routes are for scenarios where the user is NOT authenticated — email verification, password reset via email link, unsubscribe from email.

---

## Recommended Default

**Default:** Signed routes for email-based actions (verification, reset, unsubscribe). Authentication for actions performed within an active session.
**Reason:** Signed routes are designed for the verified-but-unauthenticated scenario. Don't use them as a substitute for authentication.

---

## Risks Of Wrong Choice

* Signed routes for authenticated actions: URL integrity doesn't verify user identity; anyone with the URL can act
* Authentication for email verification: User would need an account to verify their email — circular dependency
* Signed routes without authentication for sensitive actions: No proof of user identity; URL leak bypasses all security
* Authentication without signed routes for email: User must be logged in to verify email — impractical UX

---

## Related Rules

* Enforce Separate Signed Routes (Not Sharing with Authenticated Routes)
* Enforce Server-Side Consumption Tracking for One-Time Signed URLs

---

## Related Skills

* Generate Temporary Signed Routes for Time-Sensitive Actions
* Validate Parameters in Signed Route Handlers

---

---

## Decision 3: Dedicated Signed Routes vs Shared Signed+Authenticated Routes

---

## Decision Context

Whether to define separate routes for signed access and authenticated access, or share a single route that supports both.

---

## Decision Criteria

* Whether the same action is available both via signed link and authenticated UI
* Whether the security model differs between signed and authenticated access
* Whether the controller logic differs between signed and authenticated access

---

## Decision Tree

Is the same action accessible both via signed link AND from the authenticated UI?
↓
NO → Dedicated signed route — the action is only available via signed link; no sharing needed
YES → Does the signed route execute different logic than the authenticated route?
    ↓
    YES → Dedicated signed route — the signed handler has different requirements (no auth check, different response)
    NO → Does the security model differ (different middleware, different validation)?
        ↓
        YES → Dedicated signed route — different middleware stacks create ambiguity if shared
        NO → Can the controller determine the access method (signed vs authenticated)?
            ↓
            YES → Shared route — controller checks request attributes to determine context
            NO → Dedicated signed route — avoid conditional logic in the controller
NO → Is there a risk of signed access bypassing intended authentication checks?
    ↓
    YES → ALWAYS use dedicated signed routes — signed access should NOT share session-based auth logic
    NO → Shared route is acceptable — both access methods have equivalent security

---

## Rationale

Signed routes bypass session authentication — they verify URL integrity, not user identity. Sharing a route between signed and authenticated access creates ambiguity: the middleware stack must handle both cases, and the controller must determine the access method. Dedicated routes are explicit about the security model and avoid conditional logic.

---

## Recommended Default

**Default:** Always define separate routes for signed and authenticated access to the same action.
**Reason:** Signed and authenticated access have different security models. Shared routes create ambiguity and risk of accidental auth bypass.

---

## Risks Of Wrong Choice

* Shared route without `signed` middleware: Signed links work but no signature validation — anyone with the URL can access
* Shared route with both middleware: `signed` middleware on authenticated route confuses the security model
* Shared route with conditional `signed` middleware: Complex middleware logic; easy to misconfigure
* Dedicated route duplication: Controller code may be duplicated — extract common logic into a shared service

---

## Related Rules

* Enforce Separate Signed Routes (Not Sharing with Authenticated Routes)
* Enforce Server-Side Consumption Tracking for One-Time Signed URLs

---

## Related Skills

* Generate Temporary Signed Routes for Time-Sensitive Actions
* Validate Parameters in Signed Route Handlers

---

---

## Decision 4: Server-Side Consumption Tracking vs Expiration-Only Protection

---

## Decision Context

Whether to mark a signed URL as used on the server side after first access, or rely solely on the built-in expiration mechanism.

---

## Decision Criteria

* Whether the action should be performable only once
* Whether the signed URL grants access to a sensitive operation
* Whether replay attacks are a concern even within the expiration window

---

## Decision Tree

Should the action be performable only once?
↓
YES → ALWAYS implement server-side consumption tracking — expiration alone is not enough
    ↓
    YES → Does the action modify state (password reset, account deletion)?
        ↓
        YES → Mark consumed on successful execution — prevent replay of the same URL
        NO → Is the action a sensitive information disclosure?
            ↓
            YES → Mark consumed on access — prevent repeated information exposure
            NO → Mark consumed on access — one-time actions should be one-time
    YES → Is the action idempotent (view a page, download a file)?
        ↓
        YES → Expiration-only is sufficient — replay is not harmful; consumption tracking adds complexity
        NO → Server-side tracking — non-idempotent actions must track consumption
NO → Can a replay attack within the expiration window cause damage?
    ↓
    YES → Server-side tracking with early consumption — mark consumed immediately after first use
    NO → Expiration-only — expiration window is the only required protection

---

## Rationale

Expiration-only protection prevents the signed URL from being used after the expiration time, but allows unlimited replays within the window. For one-time actions (password reset, email verification), a replay within the window is a security issue — anyone with the link can perform the action multiple times. Server-side tracking (storing `used_at` or `consumed` flag) prevents replays entirely.

---

## Recommended Default

**Default:** Server-side consumption tracking for ALL state-modifying one-time actions. Expiration-only for idempotent read-only actions.
**Reason:** Expiration limits the window but doesn't prevent replays within the window. Consumption tracking prevents the same URL from being used twice.

---

## Risks Of Wrong Choice

* Expiration-only for password reset: Link can be replayed multiple times within the expiration window
* Server-side tracking with race condition: Two simultaneous requests may both succeed — use database locking
* No consumption tracking on email verification: Same link can verify multiple accounts or be replayed
* Overly aggressive consumption tracking: Verifying idempotent actions (already verified) should return success, not 403

---

## Related Rules

* Enforce temporarySignedRoute() Over signedRoute() for User-Facing Links
* Enforce Server-Side Consumption Tracking for One-Time Signed URLs

---

## Related Skills

* Generate Temporary Signed Routes for Time-Sensitive Actions
* Validate Parameters in Signed Route Handlers
