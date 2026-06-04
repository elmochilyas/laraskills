# Decomposition: workos enterprise sso

## Topic Overview

WorkOS provides a managed enterprise SSO abstraction layer that replaces direct SAML/OIDC integration complexity with a single JSON API. Your Laravel app redirects users to WorkOS AuthKit or calls the WorkOS API directly; WorkOS handles SAML/OIDC protocol negotiation with the enterprise IdP (Okta, Azure AD, Google Workspace, etc.) and returns user profile data as JSON. Beyond SSO, WorkOS provides SCIM (System for Cross-domain Identity Management) for automated user provisioning/deprovisioning...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
workos-enterprise-sso/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### workos enterprise sso
- **Purpose:** WorkOS provides a managed enterprise SSO abstraction layer that replaces direct SAML/OIDC integration complexity with a single JSON API. Your Laravel app redirects users to WorkOS AuthKit or calls the WorkOS API directly; WorkOS handles SAML/OIDC protocol negotiation with the enterprise IdP (Okta, Azure AD, Google Workspace, etc.) and returns user profile data as JSON. Beyond SSO, WorkOS provides SCIM (System for Cross-domain Identity Management) for automated user provisioning/deprovisioning...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: SAML 2.0 SSO, OIDC integration (conceptual understanding of enterprise SSO), Related: Socialite OAuth client (alternative for consumer SSO), Multi-tenancy security (organization context), Advanced Follow-up: WorkOS AuthKit customization, Custom IdP connection management, and SCIM attribute reconciliation strategies

## Dependency Graph
**Depends on:** Prerequisites: SAML 2.0 SSO, OIDC integration (conceptual understanding of enterprise SSO), Related: Socialite OAuth client (alternative for consumer SSO), Multi-tenancy security (organization context), Advanced Follow-up: WorkOS AuthKit customization, Custom IdP connection management, and SCIM attribute reconciliation strategies
**Depended on by:** Knowledge units that leverage or extend workos enterprise sso patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for workos enterprise sso.
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