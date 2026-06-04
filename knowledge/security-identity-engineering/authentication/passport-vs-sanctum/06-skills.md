# Skill: Select Between Sanctum and Passport for API Authentication

## Purpose
Evaluate API authentication requirements and choose between Sanctum (first-party auth) and Passport (third-party OAuth2 provider) to select the appropriate package with correct complexity level.

## When To Use
- Every Laravel project requiring API authentication
- Architecture decision point before implementing API auth
- When evaluating existing auth setup for correctness

## When NOT To Use
- Applications already correctly using one package with clear requirements
- CLI-only or queue-worker-only applications (no API auth needed)

## Prerequisites
- Clear understanding of API client types (first-party SPA, mobile, third-party app)
- Authentication requirements documented (delegated authorization needed?)
- Laravel application with `config/auth.php`

## Inputs
- Client types consuming the API (first-party SPA, mobile app, third-party OAuth2 clients)
- Authentication patterns needed (cookie-based sessions, Bearer tokens, OAuth2 grants)
- Delegated authorization requirements (can third-party apps act on behalf of users?)

## Workflow (numbered)
1. Identify all API client types consuming the application
2. Determine if third-party OAuth2 delegated authorization is required
3. If only first-party clients: choose Sanctum
4. If third-party OAuth2 provider required: choose Passport
5. If both: use Sanctum for first-party + Passport for third-party with separate guards
6. For first-party SPAs: configure Sanctum cookie auth (more secure than Bearer tokens)
7. For mobile apps: configure Sanctum token auth (Bearer tokens)
8. Avoid dual setup unless third-party OAuth2 requirements are confirmed

## Validation Checklist
- [ ] Sanctum chosen for first-party, Passport for third-party (or both with separate guards)
- [ ] No unnecessary dual setup (Passport added only if confirmed needed)
- [ ] Guard configuration matches selected packages
- [ ] SPA uses Sanctum cookie auth, not Bearer tokens
- [ ] Password Grant not used in either package

## Common Failures
- Using Passport for first-party SPA (unnecessary OAuth2 complexity)
- Using Sanctum when third-party OAuth2 is needed (Sanctum cannot do delegated authorization)
- Installing both "just in case" (unnecessary infrastructure)
- Using Password Grant in either package (deprecated)
- Storing Sanctum Bearer tokens in localStorage for SPAs (XSS vulnerability)

## Decision Points
- **First-party SPA on same domain**: Sanctum cookie auth (httpOnly cookies, CSRF protected)
- **Mobile app consuming your API**: Sanctum token auth (Bearer tokens)
- **Third-party app delegated access**: Passport Authorization Code + PKCE
- **M2M service-to-service**: Passport Client Credentials grant

## Performance Considerations
- Sanctum: SHA-256 hash lookup — minimal DB overhead
- Passport: JWT signature verification + token DB lookup — slightly more overhead
- Sanctum token creation simpler (no authorization code flow)
- Both can coexist without significant performance impact

## Security Considerations
- Sanctum SPA mode: cookie auth provides CSRF + XSS protection (httpOnly cookies)
- Sanctum token mode: SHA-256 hashed tokens — DB compromise doesn't expose plaintext
- Passport: OAuth2 standards-compliance (PKCE for public clients, token revocation)
- Password Grant deprecated in OAuth2; unnecessary in Sanctum

## Related Rules (from 05-rules.md)
- Default to Sanctum for API Authentication
- Use Sanctum for First-Party, Passport for Third-Party OAuth2
- Use Sanctum Cookie Auth for Same-Domain SPAs
- Avoid Dual Setup Unless Third-Party OAuth2 Is Confirmed
- Configure SPA Routes With Sanctum, Not Passport
- Never Use Password Grant in Sanctum or Passport

## Related Skills
- Configure Sanctum SPA and Token Authentication
- Configure Passport OAuth2 Server
- Configure Auth Guards and Providers
- Implement OIDC Integration

## Success Criteria
- Correct package selected based on documented requirements
- Sanctum/Payport decision justified in architecture documentation
- First-party SPAs use Sanctum cookie auth (not Bearer tokens in localStorage)
- No Password Grant used in either package
- Dual setup only if third-party OAuth2 is confirmed required
