# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | SAML 2.0 SSO |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

SAML 2.0 integration in Laravel is primarily handled through `SocialiteProviders/Saml2`, a community Socialite provider. SAML (Security Assertion Markup Language) is an XML-based enterprise SSO protocol where an Identity Provider (IdP) — Azure AD, Okta, Keycloak — authenticates the user and sends an assertion (XML document) to the Service Provider (your Laravel app). Key concepts: SP-initiated SSO (user visits your app, gets redirected to IdP, comes back with assertion), IdP-initiated SSO (user logs into IdP portal, clicks your app icon), and metadata exchange (XML documents describing endpoints and certificates).

---

## Core Concepts

- **SP (Service Provider)**: Your Laravel application that delegates authentication to the IdP.
- **IdP (Identity Provider)**: The enterprise authentication server (Azure AD, Okta, Keycloak, ADFS).
- **SAML Assertion**: XML document containing user identity (`NameID`), attributes (email, name, roles), and authentication context.
- **Metadata**: XML describing endpoints (ACS URL, Entity ID, logout URL), certificates, and binding types.
- **ACS (Assertion Consumer Service) URL**: The endpoint on your app where the IdP POSTs the SAML assertion.
- **SP-Initiated SSO**: User clicks "Login" on your app → redirected to IdP → returns with assertion.
- **IdP-Initiated SSO**: User logs into IdP portal → clicks your app → IdP sends unsolicited assertion to your ACS URL.

---

## When To Use

- Enterprise SSO with SAML-supporting IdPs (Azure AD, Okta, OneLogin, Keycloak, ADFS)
- Enterprise contracts requiring SAML 2.0 compliance
- Migration from legacy SAML infrastructure

## When NOT To Use

- Simple social login (Google, GitHub) — use Socialite's first-party providers
- When OIDC is available (modern, simpler protocol) — prefer OIDC over SAML
- Consumer-facing applications (SAML is enterprise-focused)
- Machine-to-machine auth (OAuth2 Client Credentials is more appropriate)

---

## Best Practices

- **Metadata Exchange**: Share SP metadata with the IdP. Import IdP metadata into your app. Avoid manual URL/certificate configuration.
- **ACS URL Stability**: The ACS URL must be stable and reachable. Changing it breaks integrations until the IdP updates.
- **Certificate Management**: SAML assertions are signed with the IdP's certificate. SP may also sign auth requests. Track certificate expiry.
- **IdP-Specific Testing**: Each IdP has variations (Azure AD vs Okta vs Keycloak). Test with the specific IdP.
- **Assertion Validation**: Validate signature, audience, recipient, timestamps (NotBefore, NotOnOrAfter), and subject.

---

## Architecture Guidelines

- Install `socialiteproviders/saml2` via Composer and register the provider
- Configure SP entity ID, ACS URL, and certificate in `config/services.php`
- Import IdP metadata (or manually configure IdP endpoints and certificate)
- SP-initiated flow: route → Socialite redirect to IdP → IdP login → callback → assertion processing → user login/registration
- IdP-initiated flow: IdP POSTs assertion to ACS URL → process assertion → match/create user → start session

---

## Performance Considerations

- SAML assertion verification: XML signature validation + timestamp checks + attribute extraction — ~10-50ms
- IdP redirect adds network latency (user redirected to IdP, authenticates, redirected back)
- Metadata is cached — no repeated IdP fetch

---

## Security Considerations

- **Assertion Signature**: Always validate the XML signature against the IdP's certificate. Unsigned assertions must be rejected.
- **Timestamps**: Validate `NotBefore` and `NotOnOrAfter` conditions. Clock skew allowance (typically 5 minutes).
- **Audience Restriction**: Validate the `Audience` element matches your SP entity ID.
- **Recipient Check**: Validate the `SubjectConfirmationData Recipient` matches your ACS URL.
- **Replay Prevention**: Validate `AssertionID` against previously processed assertions (store used assertion IDs).
- **HTTPS**: All SAML endpoints must be HTTPS. SAML assertions contain sensitive identity data.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not validating assertion signature | Assuming HTTPS is sufficient | Accepting forged assertions | Always validate XML signature |
| Hardcoding ACS URL | Copy-paste from documentation | Integration breaks if URL changes | Use `route()` helper for ACS URL |
| Ignoring clock skew | Strict timestamp validation | Valid assertions rejected when clocks differ | Allow 5-minute clock skew |
| Skipping IdP-specific testing | Testing only with one IdP | Integration breaks with customer's IdP | Set up IdP-specific test fixtures |
| Not handling IdP certificate expiry | One-time setup | SSO breaks when IdP rotates certificate | Monitor certificate expiry; automate updates |

---

## Anti-Patterns

- **Manual SAML assertion parsing**: Use SocialiteProviders/Saml2 — handles XML parsing, signature validation, attribute extraction
- **Hardcoding IdP endpoints**: Import IdP metadata or use discovery
- **Ignoring IdP-initiated SSO**: Enterprise users may expect to launch apps from an IdP portal

---

## Examples

**SAML configuration (SocialiteProviders):**
```php
// config/services.php
'saml2' => [
    'metadata' => env('SAML2_IDP_METADATA'), // URL or file path to IdP metadata XML
    'entityid' => env('SAML2_SP_ENTITY_ID', route('saml.metadata')),
    'acs' => route('saml.acs'),
    'logout' => route('saml.logout'),
    'certificate' => storage_path('app/saml/sp.crt'),
    'private_key' => storage_path('app/saml/sp.key'),
],
```

**IdP-specific Azure AD configuration:**
```php
// Key considerations for Azure AD
'tenant' => env('AZURE_AD_TENANT_ID'),
'metadata' => 'https://login.microsoftonline.com/' . env('AZURE_AD_TENANT_ID') . '/federationmetadata/2007-06/federationmetadata.xml',
```

---

## Related Topics

- OIDC integration (modern alternative to SAML)
- Socialite OAuth client configuration
- WorkOS Enterprise SSO
- Multi-tenant SSO considerations

---

## AI Agent Notes

- SAML is enterprise-only — consumer apps should use Socialite or OIDC.
- IdP-specific variations are the biggest challenge. Maintain test fixtures for each IdP.
- Certificate expiry is a common production issue — monitor and automate renewal.
- WorkOS provides a managed alternative that abstracts SAML complexity for enterprise SSO.

---

## Verification

- [ ] SAML SP metadata generated and shared with IdP
- [ ] IdP metadata imported (not manually configured)
- [ ] Assertion signature validated on every login
- [ ] Timestamp validation with clock skew allowance (5 min)
- [ ] Audience restriction validated against SP entity ID
- [ ] ACS URL stable and reachable (HTTPS)
- [ ] IdP certificate expiry monitored
- [ ] SP-initiated and IdP-initiated flows tested
- [ ] Replay prevention implemented (used assertion IDs tracked)
- [ ] Test fixtures for each IdP variant
