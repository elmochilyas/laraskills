# Skill: Implement WebAuthn Ceremonies for Passwordless Authentication

## Purpose
Understand and implement WebAuthn attestation (registration) and assertion (authentication) ceremonies for passwordless public-key-based user verification.

## When To Use
- Implementing passkey/WebAuthn authentication with custom requirements
- Understanding the underlying ceremony protocol when using packages like laravel/passkeys
- Enterprise environments requiring custom attestation verification

## When NOT To Use
- Standard passkey implementation (use laravel/passkeys or spatie/laravel-passkeys)
- When an existing package meets all requirements (always prefer packages)
- Non-browser-based authentication (WebAuthn requires browser API)

## Prerequisites
- HTTPS environment (WebAuthn requires secure context)
- Browser supporting WebAuthn API (modern Chrome, Firefox, Safari, Edge)
- Server-side credential storage (public key + credential ID + user association)
- PHP with `openssl` or `gmp` extension for cryptographic operations

## Inputs
- User identifier for credential registration
- Relying Party configuration (name, domain ID, origin)
- User verification requirement (required, preferred, discouraged)
- Challenge source (cryptographically random bytes)

## Workflow (numbered)
1. Generate unique cryptographically random challenge using `random_bytes(32)`
2. Store challenge in session/cache with TTL (5 minutes recommended)
3. Build `PublicKeyCredentialCreationOptions` for attestation (registration)
4. Send options to client → `navigator.credentials.create()` → receive credential
5. Verify attestation: validate clientDataJSON, attestationObject, check origin
6. Store public key, credential ID, sign count, and user association in database
7. For assertion (login): generate new challenge, build `PublicKeyCredentialRequestOptions`
8. Send to client → `navigator.credentials.get()` → receive assertion
9. Verify assertion: validate signature using stored public key, check challenge, verify origin
10. Update sign count to detect cloned authenticators

## Validation Checklist
- [ ] Unique random challenge generated per ceremony
- [ ] Challenge has short TTL (5 minutes max)
- [ ] Attestation origin validated against RP origin
- [ ] Assertion signature verified with stored public key
- [ ] Sign count tracked and compared for clone detection
- [ ] Credential ID and public key stored securely in database
- [ ] User verification respected (required/discouraged)
- [ ] Existing packages evaluated before manual implementation

## Common Failures
- Reusing or predicting challenges (replay attack vulnerability)
- Not validating origin (cross-origin credential reuse)
- No sign count tracking (missing clone detection)
- Not using existing WebAuthn packages (unnecessary complexity and risk)
- Not setting challenge TTL (challenge replay window too large)

## Decision Points
- **Package vs Manual**: Always prefer packages (laravel/passkeys, spatie/laravel-passkeys, laragear/webauthn)
- **User verification**: `required` for production; `discouraged` for low-security only
- **Attestation type**: `none` for consumer apps; `direct` or `enterprise` for enterprise

## Performance Considerations
- Challenge generation: negligible
- Cryptographic signature verification: ~1-5ms per operation
- Credential storage: public keys are ~100-200 bytes each
- No server-side hashing overhead compared to passwords

## Security Considerations
- Challenge uniqueness prevents replay attacks
- Origin validation prevents cross-origin credential misuse
- Sign count tracking detects cloned authenticators
- Private key never leaves user's device — phishing resistant
- HTTPS mandatory — no exceptions for WebAuthn

## Related Rules (from 05-rules.md)
- Use Existing WebAuthn Packages Rather Than Manual Ceremony Implementation
- Generate Unique, Cryptographically Random Challenges Per Ceremony
- Store Challenge Temporarily With Short TTL
- Validate Origin Against RP ID During Both Ceremonies
- Track Sign Count for Clone Detection
- Respect User Verification Requirement
- Use Attestation Statement Validation Only When RP Policy Requires It

## Related Skills
- Implement First-Party Passkeys/WebAuthn
- Configure Spatie Passkeys/WebAuthn
- Configure MFA/TOTP with Fortify
- Configure Auth Guards and Providers

## Success Criteria
- Registration ceremony creates credential with public key stored on server
- Login ceremony verifies signature using stored public key
- Unique challenge per ceremony prevents replay attacks
- Origin validated against configured RP origin
- Sign count tracked and clone detection working
- Challenge TTL enforced
- Existing packages evaluated and documented before manual implementation
