# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** Token Expiration & Rotation
**Generated:** 2026-06-03

---

# Decision Inventory

* Token TTL by ability sensitivity (short vs long)
* Rotation strategy on sensitive actions
* Grace period during token rotation

---

# Architecture-Level Decision Trees

---

## Token TTL by Ability Sensitivity — Short vs Long

---

## Decision Context

What expiration duration should be set for different token types? Arises when configuring token TTLs based on the sensitivity of assigned abilities.

---

## Decision Criteria

* security — breach exposure window for compromised tokens
* user experience — re-authentication frequency
* ability sensitivity — admin tokens vs read-only tokens
* implementation effort — custom middleware required for Sanctum

---

## Decision Tree

What abilities does the token carry?
↓
Admin/super-user abilities (`admin:*`)?
YES → Short TTL: 1-24 hours
NO → Write/billing abilities (`billing:write`, `users:delete`)?
    YES → Medium TTL: 7-30 days
    NO → Read-only abilities?
        YES → Long TTL: 30-90 days
        NO → Implement custom middleware to check `expires_at` for all tokens

---

## Rationale

Token TTL must scale with the damage potential of the abilities. Admin tokens with short TTLs (hours) minimize breach impact but require frequent refresh. Read-only tokens can have longer TTLs since their damage potential is limited. Sanctum does not enforce `expires_at` natively — custom middleware is mandatory regardless of TTL choice.

---

## Recommended Default

**Default:** Admin — 24 hours; Write — 7 days; Read — 90 days
**Reason:** Proportionate to damage potential. Admin tokens expire daily, write tokens weekly, read tokens quarterly.

---

## Risks Of Wrong Choice

Uniform TTL for all abilities: admin tokens have the same lifetime as read-only tokens, maximizing breach damage. No expiration at all: compromised tokens remain valid forever.

---

## Related Rules

- Implement Custom Expiration Middleware for Sanctum (from 05-rules.md)
- Set Shorter TTL for Sensitive Abilities (from 05-rules.md)

---

## Related Skills

- Implement Token Expiration and Rotation (from 06-skills.md)

---

## Rotation Strategy on Sensitive Actions

---

## Decision Context

Should all tokens or only the current token be rotated when a sensitive action occurs (password change, email change)? Arises when implementing token lifecycle management.

---

## Decision Criteria

* security — invalidating sessions from potentially compromised accounts
* user experience — forcing re-login on all devices
* attacker lockout — rotating all tokens immediately terminates active attacker sessions
* implementation — complexity of selective vs bulk token rotation

---

## Decision Tree

What sensitive action triggered the rotation?
↓
Password change (possible account compromise)?
YES → Rotate ALL tokens — attacker sessions terminated immediately
NO → Email change (high-security event)?
    YES → Rotate ALL tokens — same as password change
    NO → Role/ability change or logout?
        YES → Rotate current token only (or none for logout)
        NO → No rotation needed

---

## Rationale

Password and email changes suggest possible account compromise — rotating all tokens ensures any attacker sessions are terminated. Role changes may only need current token rotation since the security boundary is different. Blanket rotation on every action creates unnecessary friction.

---

## Recommended Default

**Default:** Rotate all tokens on password/email change; rotate current token on role change
**Reason:** Maximum security for account-critical events while minimizing disruption for routine changes.

---

## Risks Of Wrong Choice

Rotating current token only on password change: attacker sessions remain active. Rotating all tokens on logout: user must re-authenticate on all devices, creating poor UX.

---

## Related Rules

- Always Revoke Old Token During Rotation (from 05-rules.md)

---

## Related Skills

- Implement Token Expiration and Rotation (from 06-skills.md)

---

## Grace Period During Token Rotation

---

## Decision Context

Should there be a grace period where the old token and new token coexist during rotation? Arises when implementing token refresh to prevent race conditions.

---

## Decision Criteria

* reliability — preventing request failures during the rotation window
* security — both tokens active means double exposure
* concurrency — concurrent requests using the same token during rotation
* client behavior — staggered client updates in distributed systems

---

## Decision Tree

Can the client guarantee atomic token swap (old → new without concurrent requests)?
↓
YES → Immediate revocation — old token deleted, new token issued
NO → Are there concurrent requests that may use the old token after rotation?
    YES → Implement 5-minute grace period — old token remains valid for handover
    NO → Immediate revocation (safe)

---

## Rationale

Concurrent requests in flight during rotation may fail if the old token is revoked immediately. A short grace period (5 minutes) allows in-flight requests to complete using the old token. During this window, the old token is marked as "pending revocation" rather than immediately deleted.

---

## Recommended Default

**Default:** Immediate revocation (no grace period) for most cases; 5-minute grace period for high-traffic APIs
**Reason:** Immediate revocation is the security ideal. Grace period introduces a 5-minute double-exposure window but prevents failed requests from concurrent operations.

---

## Risks Of Wrong Choice

No grace period with concurrent clients: active requests fail with 401 during rotation window. Grace period without limiting: indefinite double-exposure if old token is never cleaned up.

---

## Related Rules

- Always Revoke Old Token During Rotation (from 05-rules.md)

---

## Related Skills

- Implement Token Expiration and Rotation (from 06-skills.md)
- Sanctum Token Auth (from 06-skills.md)
