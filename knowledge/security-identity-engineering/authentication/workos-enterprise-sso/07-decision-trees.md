# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** WorkOS Enterprise SSO
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | WorkOS vs Direct SAML/OIDC | Managed SSO service vs per-IdP integrations | maintainability, cost, architectural |
| 2 | SSO Auth Flow: Stateful vs Stateless | Session handling after WorkOS authentication | architectural, security |
| 3 | Directory Sync (SCIM) Enablement | Automatic vs manual user provisioning | maintainability, architectural |

---

# Architecture-Level Decision Trees

---

## WorkOS vs Direct SAML/OIDC

---

## Decision Context

Choosing between WorkOS (managed SSO service) and direct SAML 2.0 or OIDC integrations for enterprise single sign-on.

---

## Decision Criteria

* maintainability
* cost
* architectural

---

## Decision Tree

How many enterprise IdPs do you need to support?
↓
1-2 → Is per-IdP integration effort acceptable?
    YES → Direct SAML/OIDC (no recurring cost, more control)
    NO → WorkOS (but evaluate if cost justifies it for 1-2 IdPs)
3+ → WorkOS (managed multi-IdP support, per-IdP integration effort is high)

Do you need SCIM directory sync for user provisioning?
↓
YES → WorkOS (SCIM support out of box, handles IdP-specific SCIM variations)
NO → Direct SAML/OIDC (simpler without directory sync)

Is SSO a critical time-to-market feature?
↓
YES → WorkOS (faster integration, single API for any IdP)
NO → Direct integration (more control, no vendor lock-in)

Does the budget support WorkOS per-organization pricing?
↓
YES → WorkOS (reduced engineering maintenance)
NO → Direct SAML/OIDC (open source, no per-org cost)

---

## Rationale

WorkOS abstracts IdP-specific variations (SAML metadata, OIDC discovery, certificate management, SCIM) behind a unified API. Direct SAML/OIDC requires per-IdP integration effort and ongoing maintenance. WorkOS is cost-effective when supporting many IdPs; direct integration is cheaper for 1-2 IdPs or when budget is constrained. WorkOS also provides SCIM, which is complex to implement per-IdP.

---

## Recommended Default

**Default:** WorkOS for 3+ enterprise IdPs or when SCIM is required; direct SAML/OIDC for 1-2 IdPs without SCIM needs
**Reason:** The breakeven point is typically 3-5 enterprise IdPs. Below that, direct integration effort is manageable. Above that, WorkOS saves significant engineering time. SCIM integration alone can justify WorkOS, as per-IdP SCIM variations are complex.

---

## Risks Of Wrong Choice

- Direct SAML/OIDC for many IdPs: per-IdP maintenance burden, certificate management, IdP-specific bugs
- WorkOS for single IdP: recurring cost that may not be justified, vendor dependency
- Neither: no enterprise SSO capability, password-only authentication for enterprise users
- Direct integration without SCIM: manual user provisioning for enterprise customers

---

## Related Rules

- Match WorkOS Users by Email Across IdPs (05-rules.md)
- Create Local Session/Token After WorkOS Auth (05-rules.md)
- Verify WorkOS Webhook Signatures (05-rules.md)

---

## Related Skills

- Integrate WorkOS Enterprise SSO for Multi-IdP Single Sign-On (06-skills.md)
- Implement SAML 2.0 SSO (06-skills.md)
- Integrate OpenID Connect (OIDC) SSO (06-skills.md)

---

## SSO Auth Flow: Stateful vs Stateless

---

## Decision Context

Whether to use stateful (session-based) or stateless (token-based) authentication after WorkOS SSO callback.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Is the client a browser-based application?
↓
YES → Stateful session (Laravel session after WorkOS callback)
NO → Is the client a mobile app or API consumer?
    YES → Stateless token (Sanctum/Passport token after WorkOS callback)
    NO → Stateless token (API-based clients)

Do you need API access for the authenticated user?
↓
YES → Issue both session (for web) and API token (for API) after WorkOS auth
NO → Session-only is sufficient

Is the WorkOS SSO used for first-party authentication only?
↓
YES → Stateful session (standard web app pattern)
NO → Stateless token (if third-party APIs need access on behalf of user)

---

## Rationale

WorkOS handles the enterprise authentication; your application creates its own auth context afterward. For browser applications, a Laravel session is the standard approach. For API/mobile clients, issue a Sanctum token. Many applications need both — issue a session for the web UI and an API token for SPA/mobile access. Never pass the WorkOS token directly to the client.

---

## Recommended Default

**Default:** Stateful session for browser apps; Sanctum API token for mobile/API clients; both for hybrid apps
**Reason:** WorkOS authenticates the user; your application manages its own auth context. Session for web, tokens for API. Both can coexist. The WorkOS token should never be exposed to the client.

---

## Risks Of Wrong Choice

- Passing WorkOS token to client: token exposure, XSS, unauthorized WorkOS API access
- Session only for API client: cookies not available in native HTTP clients
- Token only for browser: missing session benefits (httpOnly cookies, CSRF protection)
- Neither: user has no auth context after WorkOS redirects back

---

## Related Rules

- Create Local Session/Token After WorkOS Auth (05-rules.md)
- Match WorkOS Users by Email Across IdPs (05-rules.md)
- Log WorkOS SSO and Directory Sync Events for Audit (05-rules.md)

---

## Related Skills

- Integrate WorkOS Enterprise SSO for Multi-IdP Single Sign-On (06-skills.md)

---

## Directory Sync (SCIM) Enablement

---

## Decision Context

Whether to enable WorkOS Directory Sync (SCIM) for automatic user provisioning/deprovisioning or manage users manually.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Do enterprise customers need automatic user provisioning from their IdP?
↓
YES → WorkOS Directory Sync (SCIM) — implement webhook handlers
NO → Manual provisioning (admin creates users, or user self-registration via SSO)

Are there compliance requirements for timely deprovisioning (offboarding)?
↓
YES → WorkOS Directory Sync (real-time deprovisioning via webhooks)
NO → Periodic deprovisioning may be acceptable

Does the enterprise customer have complex team/group structures?
↓
YES → WorkOS Directory Sync with group mapping (map IdP groups to local roles)
NO → Simple user provisioning (create user on first SSO login is sufficient)

Can the engineering team maintain SCIM webhook handlers?
↓
YES → Implement WorkOS Directory Sync
NO → Manual or delayed provisioning (weigh against enterprise requirements)

---

## Rationale

SCIM directory sync provides real-time user provisioning and deprovisioning. WorkOS handles IdP-specific SCIM variations. The application needs to implement webhook handlers for `user.created`, `user.updated`, `user.deactivated`, and `group.assigned` events. Without SCIM, users are provisioned on first SSO login (JIT provisioning) and must be manually deprovisioned.

---

## Recommended Default

**Default:** JIT provisioning on first SSO login for small deployments; WorkOS SCIM for enterprise customers requiring automated provisioning/deprovisioning
**Reason:** Just-in-time provisioning is simpler and works for many cases. SCIM is necessary when enterprise compliance requires timely deprovisioning or when IdP groups need to map to local roles. WorkOS SCIM handles IdP-specific variations that would require per-IdP implementation.

---

## Risks Of Wrong Choice

- No SCIM for enterprise: manual deprovisioning, offboarding delays, compliance violations
- SCIM without webhook verification: forged webhooks cause unauthorized provisioning/deactivation
- SCIM without group mapping: IdP group structure not reflected in local permissions
- JIT provisioning for large organizations: users created on first login, but no bulk provisioning

---

## Related Rules

- Verify WorkOS Webhook Signatures (05-rules.md)
- Match WorkOS Users by Email Across IdPs (05-rules.md)
- Log WorkOS SSO and Directory Sync Events for Audit (05-rules.md)

---

## Related Skills

- Integrate WorkOS Enterprise SSO for Multi-IdP Single Sign-On (06-skills.md)
- Configure Multi-Tenancy (Stancl Tenancy) (06-skills.md)
