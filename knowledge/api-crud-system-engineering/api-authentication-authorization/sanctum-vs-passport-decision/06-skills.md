# Skill: Implement Sanctum vs Passport Decision

## Purpose
Choose between Sanctum (token-based API auth for first-party + SPA) and Passport (full OAuth2 for third-party) based on consumer types, OAuth2 requirements, and maintenance capacity.

## When To Use
- Evaluating Laravel API authentication packages
- Before implementing any API authentication
- When considering OAuth2 for third-party consumption

## When NOT To Use
- Simple session-based auth (non-API)
- External auth provider (Socialite, Auth0, Firebase)

## Prerequisites
- Understanding of API auth requirements
- Consumer type enumeration

## Inputs
- Consumer types (first-party SPA, mobile, third-party, M2M)
- Auth requirements (token scopes, OAuth2 flows, refresh tokens)

## Workflow
1. Evaluate consumer types — first-party only favors Sanctum, third-party favors Passport
2. Assess OAuth2 requirement — Passport required for Authorization Code, Client Credentials grants
3. Evaluate token scope complexity — both support abilities/scopes, Passport has richer management
4. Consider maintenance overhead — Sanctum is simpler, Passport has more moving parts
5. Check SPA cookie auth requirement — Sanctum has built-in SPA support
6. Check mobile client requirement — both support token auth
7. Check third-party developer requirement — Passport has standard OAuth2 flows
8. Make decision following the matrix:
   - **Sanctum**: First-party SPA, mobile app, simple token auth, no OAuth2
   - **Passport**: Third-party API consumers, OAuth2 grants, complex scope management
9. Document decision rationale in architecture record
10. Implement chosen package with configuration and first endpoint

## Decision Matrix

| Factor | Sanctum | Passport |
|--------|---------|----------|
| First-party SPA cookie auth | ✓ Built-in | ✗ Manual |
| Simple token auth | ✓ Minimal config | ✓ (overkill) |
| Third-party OAuth2 | ✗ Not supported | ✓ Full OAuth2 |
| Authorization Code grant | ✗ | ✓ |
| Client Credentials (M2M) | ✗ (use API keys) | ✓ |
| Token abilities/scopes | ✓ Basic | ✓ Advanced |
| Maintenance complexity | Low | Medium-High |
| Package size | Small | Large |
| Mobile app auth | ✓ Token-based | ✓ OAuth2 |

## Common Failures
- Choosing Passport for first-party SPA — unnecessary complexity
- Choosing Sanctum for third-party OAuth2 — doesn't support Authorization Code grant
- Not considering future needs — starting with Sanctum, migrating to Passport later is painful
- Not documenting decision — future developers don't know why choice was made
- Using both — increases complexity with no benefit

## Decision Points
- Sanctum vs Passport — Sanctum for first-party/token, Passport for third-party/OAuth2
- Future expansion — start with Sanctum if only first-party, consider upgrade path
- SPA auth — Sanctum's SPA cookie auth is simpler than Passport's OAuth2 for same-domain apps

## Performance Considerations
- Sanctum has smaller footprint and faster middleware than Passport
- Passport adds OAuth2 endpoints and token generation overhead
- Token validation in Sanctum is DB lookup; Passport uses encrypted tokens (no DB on validation)
- Passport requires oauth_clients, oauth_access_tokens, oauth_refresh_tokens tables

## Security Considerations
- Passport provides standard OAuth2 security model (refresh tokens, PKCE, state param)
- Sanctum provides simpler token model with CSRF protection for SPA
- Passport supports more grant types but each has specific security requirements
- Sanctum tokens are stored hashed in DB; Passport tokens are encrypted

## Related Rules
- Evaluate Consumer Types First
- Choose Sanctum For First-Party/SPA, Passport For Third-Party/OAuth2
- Consider Maintenance Overhead In Decision
- Document Decision Rationale
- Plan For Future Auth Needs

## Related Skills
- Sanctum Token Auth — for Sanctum implementation
- Sanctum SPA Cookie Auth — for Sanctum SPA flow
- Passport OAuth2 Configuration — for Passport implementation
- Token Ability Design — for scope/ability design

## Success Criteria
- Auth package matches current and near-future consumer types
- No unnecessary OAuth2 complexity for first-party-only APIs
- SPA cookie auth supported where needed
- Third-party OAuth2 supported where needed
- Decision documented for team reference
- Auth implementation follows package's best practices
