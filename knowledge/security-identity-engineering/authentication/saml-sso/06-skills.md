# Skill: Implement SAML 2.0 SSO for Enterprise Authentication

## Purpose
Configure SAML 2.0 single sign-on via SocialiteProviders/Saml2 to enable enterprise users to authenticate through their corporate Identity Provider (Azure AD, Okta, Keycloak, ADFS).

## When To Use
- Enterprise SSO with SAML-supporting IdPs (Azure AD, Okta, OneLogin, Keycloak, ADFS)
- Enterprise contracts requiring SAML 2.0 compliance
- Migration from legacy SAML infrastructure

## When NOT To Use
- Simple social login (use Socialite's first-party providers)
- When OIDC is available (modern, simpler protocol)
- Consumer-facing applications (SAML is enterprise-focused)
- Machine-to-machine auth (OAuth2 Client Credentials grant)

## Prerequisites
- `composer require socialiteproviders/saml2`
- IdP metadata XML (from enterprise IdP administrator)
- SP certificate and private key generated
- HTTPS endpoint for ACS URL

## Inputs
- IdP metadata XML URL or file path
- SP entity ID (your application's SAML identifier)
- ACS URL (assertion consumer service endpoint)
- IdP-specific configuration (Azure AD tenant, Okta app, Keycloak realm)

## Workflow (numbered)
1. Generate SP certificate and private key for SAML signing
2. Install `socialiteproviders/saml2` and register the event listener
3. Configure SP in `config/services.php`: entity ID, ACS URL (via `route()`), metadata, certificate
4. Import IdP metadata (prefer URL import over manual endpoint configuration)
5. Share SP metadata XML with enterprise IdP administrator
6. Validate assertion signature against IdP certificate on every login
7. Validate timestamps with 5-minute clock skew allowance
8. Validate audience restriction matches SP entity ID
9. Implement replay prevention (track used assertion IDs)
10. Test both SP-initiated and IdP-initiated SSO flows

## Validation Checklist
- [ ] IdP metadata imported (not manually configured endpoints)
- [ ] Assertion XML signature validated on every login
- [ ] Timestamp validation with 5-minute clock skew
- [ ] Audience restriction validated against SP entity ID
- [ ] ACS URL stable and generated via `route()` helper
- [ ] Replay prevention (processed assertion IDs tracked)
- [ ] SP-initiated and IdP-initiated flows tested
- [ ] IdP certificate expiry monitored

## Common Failures
- Not validating assertion signature (accepting forged assertions)
- Hardcoding ACS URL (breaks on domain/route changes)
- No clock skew allowance (intermittent SSO failures)
- No replay prevention (assertion reuse attack)
- Tested with only one IdP (breaks when customer uses different IdP)

## Decision Points
- **SP-initiated vs IdP-initiated**: Support both — enterprises use either flow
- **Metadata import vs manual config**: Always prefer metadata import
- **Clock skew**: 5 minutes standard for SAML reliability
- **Certificate expiry monitoring**: Schedule daily check, warn 30 days before expiry

## Performance Considerations
- Assertion verification: XML signature + timestamps + attributes — ~10-50ms
- IdP redirect adds network latency (user leaves app, authenticates, returns)
- Metadata cached — no repeated IdP fetch

## Security Considerations
- XML signature validation is mandatory — unsigned assertions must be rejected
- Timestamp validation with clock skew: NotBefore/NotOnOrAfter
- Audience restriction prevents cross-service assertion reuse
- Replay prevention via AssertionID tracking
- All SAML endpoints must be HTTPS

## Related Rules (from 05-rules.md)
- Always Validate SAML Assertion XML Signature
- Import IdP Metadata Instead of Manual Configuration
- Use Stable ACS URL Generated From Route Helper
- Allow Clock Skew for Timestamp Validation
- Monitor IdP Certificate Expiry and Automate Renewal
- Implement Replay Prevention for SAML Assertions
- Validate Audience Restriction Against SP Entity ID
- Test With Each Specific IdP Variant

## Related Skills
- Integrate OpenID Connect (OIDC) SSO
- Configure Socialite OAuth Client Authentication
- Configure WorkOS Enterprise SSO
- Configure Auth Guards and Providers

## Success Criteria
- Enterprise users can SSO via their corporate IdP
- Assertion signature validated on every authentication
- Clock skew does not cause false rejections
- Same assertion cannot be replayed (replay prevention works)
- SP-initiated and IdP-initiated flows both work
- IdP certificate expiry monitored with automated alerts
- Supports multiple IdP variants (Azure AD, Okta, Keycloak)
