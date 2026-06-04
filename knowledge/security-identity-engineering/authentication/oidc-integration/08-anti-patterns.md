# Anti-Patterns: OIDC Integration

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | OIDC Integration |
| Audience | Architects, Developers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-OI-01 | Token Signature Bypass | Critical | High | Medium |
| AP-OI-02 | Nonce Omission | Critical | High | Low |
| AP-OI-03 | Hardcoded IdP Endpoints | High | Medium | Medium |
| AP-OI-04 | Stale JWKS Indefinite Cache | High | Medium | Low |
| AP-OI-05 | IdP Single Point of Failure | High | Medium | High |

---

## Repository-Wide Anti-Patterns

- **Missing Audience Validation**: Not checking `aud` claim against client ID, allowing cross-client token reuse
- **HTTP OIDC Flows**: Allowing non-HTTPS redirect URIs, exposing authorization codes in transit
- **Single-Contributor Package Dependency**: Using community OIDC drivers without fallback plan

---

## 1. Token Signature Bypass

### Category
Security · Critical

### Description
Accepting OIDC `id_token` without verifying the JWT signature using the IdP's JWKS endpoint, trusting that HTTPS transport alone provides sufficient security.

### Why It Happens
Socialite's default `user()` method does not explicitly validate `id_token` signatures. Developers unaware of OIDC's security model assume HTTPS protects the entire flow. The "it works in development" trap — without signature verification, forged tokens work during testing.

### Warning Signs
- `id_token` from `$user->id_token` is used directly without any signature verification call
- No JWKS fetching or caching logic in the authentication flow
- No JWT library dependency for signature verification
- Custom OIDC driver that skips the `verify()` step

### Why Harmful
Without signature verification, any intercepted or forged `id_token` authenticates as any user. An attacker who compromises the HTTPS channel (or tricks the callback endpoint) can forge a token claiming any `sub` claim and gain access to any account. The entire OIDC security model relies on asymmetric signature verification.

### Real-World Consequences
- Attacker forges `id_token` with victim's email/sub, gains full account access
- Internal tool compromised through a crafted `id_token` from an untrusted source
- Penetration test discovers "OIDC signature validation missing — critical severity"
- SSO integration audited as non-compliant with OIDC specification

### Preferred Alternative
Always verify `id_token` signature using cached JWKS keys on every authentication callback. Use a JWT library for verification.

### Refactoring Strategy
1. Add a JWT library (e.g., `firebase/php-jwt`) to the project
2. Implement JWKS fetching from the IdP's `jwks_uri` discovery endpoint
3. Cache JWKS with appropriate TTL
4. Verify each `id_token` signature using the cached keys on every callback
5. Fail authentication if signature verification throws an exception

### Detection Checklist
- [ ] Does the OIDC callback code call a JWT `verify()` or `decode()` method?
- [ ] Are JWKS keys fetched and cached from the IdP's discovery endpoint?
- [ ] Is there a code path where `id_token` is accepted without verification?
- [ ] Can a forged `id_token` authenticate successfully in a test environment?

### Related Rules/Skills/Trees
- Always Validate id_token Signature Using JWKS (05-rules.md)
- Integrate OIDC for Enterprise SSO (06-skills.md)
- OIDC vs SAML vs Social Login decision tree (07-decision-trees.md)

---

## 2. Nonce Omission

### Category
Security · Critical

### Description
Not generating or validating the OIDC `nonce` parameter, leaving the authentication flow vulnerable to replay attacks.

### Why It Happens
OIDC builds on OAuth2, and developers familiar with plain OAuth2 flows may not add the nonce parameter. Socialite's OAuth2 provider does not include nonce by default. The additional implementation effort (generate, store in session, validate on callback) is easily skipped.

### Warning Signs
- No `nonce` parameter in the OIDC authorization request
- No session storage of nonce value before redirect
- No comparison of returned nonce against stored value in callback
- OAuth2-only flow implemented without OIDC-specific additions

### Why Harmful
An attacker who intercepts an authorization code or `id_token` can replay it to authenticate as the victim. The nonce ties each authentication request to a specific session, ensuring that a captured token cannot be used with a different session. Without it, the same `id_token` can authenticate multiple sessions.

### Real-World Consequences
- Authorization code interceptor replays captured code to gain authenticated access
- Session hijacking via token replay — attacker reuses a token from a different context
- Compliance auditors flag missing replay protection as a security finding
- SSO integration fails penetration testing for replay attacks

### Preferred Alternative
Generate a cryptographically random nonce, store it in the session, include it in the authorization request, and validate it on callback.

### Refactoring Strategy
1. Generate a random nonce using `Str::random(32)` before OIDC redirect
2. Store nonce in session: `session(['oidc_nonce' => $nonce])`
3. Include nonce in the authorization request via `->with(['nonce' => $nonce])`
4. On callback, retrieve nonce from session and compare with `id_token` nonce claim
5. Destroy session nonce after validation to prevent reuse

### Detection Checklist
- [ ] Search for `nonce` in the OIDC authorization request code
- [ ] Is nonce stored in session before redirect?
- [ ] Is nonce claim validated on callback?
- [ ] Can the same authorization code be reused to authenticate twice?

### Related Rules/Skills/Trees
- Generate and Validate Nonce for Replay Protection (05-rules.md)
- Integrate OIDC for Enterprise SSO (06-skills.md)
- OIDC Implementation Approach decision tree (07-decision-trees.md)

---

## 3. Hardcoded IdP Endpoints

### Category
Maintainability · Reliability

### Description
Hardcoding the authorization, token, and JWKS endpoints in configuration instead of loading them dynamically from the OIDC discovery URL.

### Why It Happens
Copy-paste configuration from documentation or examples contains explicit URLs. The discovery URL pattern is not obvious to developers new to OIDC. It's simpler to copy the three URLs than implement dynamic loading from `/.well-known/openid-configuration`.

### Warning Signs
- `config/services.php` or similar contains hardcoded `authorize`, `token`, and `jwks` URLs
- No code referencing the IdP's `/.well-known/openid-configuration` endpoint
- After IdP maintenance, SSO breaks with no clear error
- Different environments have hardcoded URLs that need manual updating

### Why Harmful
IdPs change endpoint URLs during platform updates, domain migrations, or version upgrades. Hardcoded endpoints require code changes and redeployment when the IdP's configuration changes. The discovery URL is the OIDC standard for dynamic endpoint resolution — ignoring it makes the integration brittle.

### Real-World Consequences
- Azure AD tenant migration changes endpoints — SSO broken until hotfix deployed
- Okta org URL change requires emergency config update across environments
- Keycloak version upgrade adds a new JWKS endpoint — old hardcoded endpoint fails
- Deployment to a different IdP environment (dev vs prod) requires manual URL changes

### Preferred Alternative
Load OIDC configuration from the discovery URL on application boot, caching the result.

### Refactoring Strategy
1. Configure the discovery URL as the single endpoint setting
2. Implement discovery URL loading in a service provider
3. Cache the discovered configuration (e.g., cache for 24 hours)
4. Remove all hardcoded endpoint URLs
5. Add a health check that verifies the discovery URL is reachable

### Detection Checklist
- [ ] Search for authorization, token, and JWKS URL patterns in config files
- [ ] Is there a discovery URL loading step in the OIDC flow?
- [ ] Can the app handle an IdP endpoint change without code deployment?
- [ ] Is the discovery URL different between environments?

### Related Rules/Skills/Trees
- Use OIDC Discovery URL Instead of Hardcoded Endpoints (05-rules.md)
- Integrate OIDC for Enterprise SSO (06-skills.md)
- OIDC vs SAML vs Social Login decision tree (07-decision-trees.md)

---

## 4. Stale JWKS Indefinite Cache

### Category
Security · Reliability

### Description
Caching the JWKS response indefinitely or not implementing cache invalidation, causing token verification to fail when the IdP rotates signing keys.

### Why It Happens
Developers implement JWKS caching for performance but do not set a TTL or implement refresh-on-failure. The cache is never invalidated, and key rotation at the IdP causes valid tokens to be rejected.

### Warning Signs
- JWKS cache has no TTL or uses `cache()->forever()`
- After some time, valid `id_token` verifications start failing intermittently
- No cache invalidation logic on JWT verification failure
- IdP documentation confirms regular key rotation (e.g., monthly)

### Why Harmful
When the IdP rotates its signing keys, the cached JWKS contains the old public keys. New `id_tokens` are signed with the new private key and verified against the old public key — verification fails. All OIDC authentications break until the cache is manually cleared. Users cannot log in.

### Real-World Consequences
- Monthly IdP key rotation causes 1-hour SSO outage every month until cache expires
- Emergency `php artisan cache:clear` required to restore authentication
- Users locked out during key rotation window — support tickets escalate
- Scheduled IdP maintenance that rotates keys causes unplanned downtime

### Preferred Alternative
Cache JWKS with a TTL aligned with the IdP's rotation schedule, and implement refresh-on-failure as a fallback.

### Refactoring Strategy
1. Set JWKS cache TTL to 24 hours (or align with IdP rotation schedule)
2. Implement catch for JWT verification exceptions
3. On verification failure, clear JWKS cache and re-fetch
4. Retry verification once with fresh keys
5. Log key rotation events for monitoring

### Detection Checklist
- [ ] Is there a TTL on the JWKS cache call?
- [ ] Are JWT verification exceptions caught and handled with cache refresh?
- [ ] Does the IdP document a key rotation schedule?
- [ ] Can a key rotation event be simulated in testing?

### Related Rules/Skills/Trees
- Cache JWKS Keys With Appropriate TTL (05-rules.md)
- JWKS Caching Strategy decision tree (07-decision-trees.md)

---

## 5. IdP Single Point of Failure

### Category
Reliability · Architecture

### Description
Making the OIDC IdP the only authentication method without a fallback, creating a single point of failure for all user authentication.

### Why It Happens
Enterprise SSO is often mandated as "the only auth method." Teams assume the IdP will always be available. The convenience of unified identity management overshadows the reliability risk of depending on an external authentication service.

### Warning Signs
- No password-based or backup authentication method available
- No cached/token-based session grace period for IdP outages
- IdP maintenance windows require application downtime
- Users cannot log in when the IdP is unreachable

### Why Harmful
When the IdP is down (planned maintenance, DNS failure, DDoS, misconfiguration), every user in the application is locked out. No administrative access is possible. No emergency access is available for support, incident response, or recovery. Application becomes completely unusable.

### Real-World Consequences
- Azure AD outage locks out all users for 4 hours
- Keycloak server misconfiguration after update blocks all logins
- Network partition between app and IdP prevents authentication during incident
- Compliance requirement for "maintain access during IdP outage" triggers audit finding

### Preferred Alternative
Maintain a fallback authentication method (password, recovery codes) and implement session grace periods.

### Refactoring Strategy
1. Implement password-based fallback authentication alongside OIDC
2. Designate emergency break-glass accounts with strong passwords and monitoring
3. Extend session lifetimes to allow continued access during short IdP outages
4. Add IdP health monitoring and alerting
5. Document and test IdP outage response plan

### Detection Checklist
- [ ] Is there a non-OIDC way for users to authenticate?
- [ ] Can administrators log in during an IdP outage?
- [ ] Are sessions invalidated immediately when IdP is unreachable?
- [ ] Is IdP uptime monitored with alerting?

### Related Rules/Skills/Trees
- Monitor IdP Token Expiry and Implement Refresh Token Flow (05-rules.md)
- Integrate OIDC for Enterprise SSO (06-skills.md)
- OIDC Implementation Approach decision tree (07-decision-trees.md)
