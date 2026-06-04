# Decomposition: saml sso

## Topic Overview

SAML 2.0 Single Sign-On in Laravel is implemented via the `socialiteproviders/saml2` package, which extends Socialite with SAML protocol support. It enables your Laravel app to act as a SAML Service Provider (SP), authenticating users through enterprise Identity Providers (IdPs) like Azure AD, Okta, Keycloak, or ADFS. The SAML protocol is XML-based, uses signed assertions for security, and supports IdP-initiated and SP-initiated SSO flows. Unlike OAuth2's JSON tokens, SAML uses XML signatures...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
saml-sso/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### saml sso
- **Purpose:** SAML 2.0 Single Sign-On in Laravel is implemented via the `socialiteproviders/saml2` package, which extends Socialite with SAML protocol support. It enables your Laravel app to act as a SAML Service Provider (SP), authenticating users through enterprise Identity Providers (IdPs) like Azure AD, Okta, Keycloak, or ADFS. The SAML protocol is XML-based, uses signed assertions for security, and supports IdP-initiated and SP-initiated SSO flows. Unlike OAuth2's JSON tokens, SAML uses XML signatures...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Socialite OAuth1/OAuth2 client, XML signature basics, Related: OIDC integration (jwks validation, nonce, discovery), WorkOS enterprise SSO, Advanced Follow-up: Multiple IdP configuration management, SAML Single Logout implementation, and Dynamic SAML metadata generation

## Dependency Graph
**Depends on:** Prerequisites: Socialite OAuth1/OAuth2 client, XML signature basics, Related: OIDC integration (jwks validation, nonce, discovery), WorkOS enterprise SSO, Advanced Follow-up: Multiple IdP configuration management, SAML Single Logout implementation, and Dynamic SAML metadata generation
**Depended on by:** Knowledge units that leverage or extend saml sso patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for saml sso.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization