# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** SAML 2.0 SSO
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | SAML vs OIDC vs WorkOS | Choosing enterprise SSO protocol | architectural, maintainability, security |
| 2 | SP-Initiated vs IdP-Initiated SSO Flow | Which SAML flow(s) to support | architectural, user-experience |
| 3 | Metadata Management Strategy | How to handle IdP metadata and certificates | maintainability, security |

---

# Architecture-Level Decision Trees

---

## SAML vs OIDC vs WorkOS

---

## Decision Context

Choosing between SAML 2.0 (XML-based, legacy enterprise), OIDC (modern JWT-based), and WorkOS (managed abstraction over both) for enterprise SSO.

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Does the enterprise IdP support OIDC?
↓
YES → Prefer OIDC (modern, simpler, JWT-based, better Laravel ecosystem support)
NO → Does the IdP support SAML 2.0?
    YES → Does the enterprise require SAML specifically?
        YES → SAML via SocialiteProviders/Saml2
        NO → Evaluate WorkOS (abstraction over both)
    NO → Cannot use either — evaluate custom integration

Do you need to support multiple IdPs (multi-tenant enterprise SSO)?
↓
YES → WorkOS (single integration for any IdP, OIDC or SAML)
NO → Single IdP → Direct SAML or OIDC integration

Do you have budget for a paid SSO service?
↓
YES → WorkOS (reduced maintenance, SLAs, managed certificate rotation)
NO → Direct SAML or OIDC integration (open source, self-maintained)

Is the integration timeline critical?
↓
YES → WorkOS (fastest integration, single API for any IdP)
NO → Direct integration (more control, no vendor dependency)

---

## Rationale

OIDC is the modern standard — simpler XML-free protocol, JWT-based, better Laravel ecosystem support via Socialite. SAML 2.0 is XML-heavy and older but required for IdPs that don't support OIDC (ADFS, some legacy IdPs). WorkOS abstracts both protocols behind a single integration point, reducing per-IdP integration effort at the cost of vendor dependency.

---

## Recommended Default

**Default:** OIDC when IdP supports it; SAML 2.0 only when OIDC is unavailable; WorkOS for multi-IdP enterprise SSO
**Reason:** OIDC is simpler, more maintainable, and has better Laravel support. SAML should be used only when the IdP doesn't support OIDC. WorkOS is worth the cost when supporting many enterprise IdPs.

---

## Risks Of Wrong Choice

- SAML when OIDC available: unnecessary XML complexity, harder to debug, more protocol surface area
- Custom SAML for multi-IdP: per-IdP integration effort, certificate management burden
- WorkOS for single IdP: unnecessary cost, vendor dependency for a simple integration
- No enterprise SSO: users manage separate passwords, no centralized identity management

---

## Related Rules

- Always Validate SAML Assertion XML Signature (05-rules.md)
- Import IdP Metadata Instead of Manual Configuration (05-rules.md)
- Monitor IdP Certificate Expiry and Automate Renewal (05-rules.md)

---

## Related Skills

- Implement SAML 2.0 SSO for Enterprise Authentication (06-skills.md)
- Integrate OpenID Connect (OIDC) for Enterprise Single Sign-On (06-skills.md)
- Configure WorkOS Enterprise SSO (06-skills.md)

---

## SP-Initiated vs IdP-Initiated SSO Flow

---

## Decision Context

Whether to support SP-initiated SSO (user logs in from your app) and/or IdP-initiated SSO (user logs in from enterprise IdP portal).

---

## Decision Criteria

* architectural
* user-experience

---

## Decision Tree

Do users typically access your app by navigating directly to it?
↓
YES → SP-initiated SSO required (user clicks "Login with SSO" → redirected to IdP)
NO → Do users access your app from an enterprise IdP portal (Okta dashboard, Azure AD My Apps)?
    YES → IdP-initiated SSO required (IdP sends unsolicited assertion to your ACS URL)
    NO → SP-initiated SSO likely sufficient

Are you replacing an existing SAML integration?
↓
YES → Support both flows (existing users may have bookmarks to either entry point)
NO → Start with SP-initiated; add IdP-initiated if enterprise customers request it

Do enterprise contracts specify which flow to use?
↓
YES → Implement specified flow(s)
NO → Support both for maximum compatibility

---

## Rationale

SP-initiated is the standard flow — user visits your app, clicks login, redirected to IdP, returns authenticated. IdP-initiated is used when enterprises launch apps from a central portal (Okta, Azure AD). Supporting only SP-initiated may break enterprise portal workflows. Supporting both adds complexity (handling unsolicited assertions, separate session management).

---

## Recommended Default

**Default:** Support both SP-initiated and IdP-initiated SSO flows
**Reason:** Enterprise environments commonly use both. IdP portals are standard in enterprise identity management. Supporting only SP-initiated can block enterprise adoption. The implementation overhead of supporting both is minor compared to the business impact of missing one flow.

---

## Risks Of Wrong Choice

- SP-initiated only: enterprise users cannot launch app from IdP portal, reduced adoption
- IdP-initiated only: users cannot navigate directly to your app for SSO login
- Neither: no enterprise SSO capability at all

---

## Related Rules

- Use Stable ACS URL Generated From Route Helper (05-rules.md)
- Allow Clock Skew for Timestamp Validation (05-rules.md)
- Implement Replay Prevention for SAML Assertions (05-rules.md)

---

## Related Skills

- Implement SAML 2.0 SSO for Enterprise Authentication (06-skills.md)

---

## Metadata Management Strategy

---

## Decision Context

How to handle IdP metadata XML (endpoints, certificates) — import URL, file-based, or manual configuration.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Does the IdP publish a metadata URL?
↓
YES → Import IdP metadata from URL (automatic updates on IdP changes)
NO → Does the IdP provide a downloadable metadata XML file?
    YES → Store metadata file in config, update on IdP changes
    NO → Manual endpoint and certificate configuration (last resort)

Is the IdP metadata subject to change (certificate rotation, endpoint updates)?
↓
YES → URL-based metadata import (auto-discovers changes)
NO → File-based import is acceptable

Do you need to monitor certificate expiry?
↓
YES → Schedule regular check against IdP metadata; alert 30 days before expiry
NO → Certificate expiry will cause unexpected SSO failures

Are you supporting multiple IdPs?
↓
YES → Abstract metadata loading per tenant (tenant-specific IdP metadata URL)
NO → Single IdP metadata configuration

---

## Rationale

URL-based metadata import is the best practice — it automatically picks up IdP configuration changes (certificate rotation, endpoint changes). File-based import is a reasonable alternative when the IdP doesn't publish a URL. Manual configuration is error-prone and should be avoided. Certificate expiry monitoring prevents production SSO outages.

---

## Recommended Default

**Default:** URL-based IdP metadata import with certificate expiry monitoring (30-day alert)
**Reason:** URL import auto-discovers IdP changes without manual intervention. Certificate monitoring prevents unexpected SSO failures from expired certificates. This approach minimizes maintenance while ensuring reliability.

---

## Risks Of Wrong Choice

- Manual endpoint configuration: breaks on IdP changes, hard to debug, per-IdP maintenance
- File-based metadata without update process: stale metadata when IdP rotates certificates
- No certificate monitoring: SSO fails silently when IdP certificate expires
- URL import without fallback: IdP metadata URL downtime prevents SSO

---

## Related Rules

- Import IdP Metadata Instead of Manual Configuration (05-rules.md)
- Allow Clock Skew for Timestamp Validation (05-rules.md)
- Monitor IdP Certificate Expiry and Automate Renewal (05-rules.md)

---

## Related Skills

- Implement SAML 2.0 SSO for Enterprise Authentication (06-skills.md)
- Configure WorkOS Enterprise SSO (06-skills.md)
