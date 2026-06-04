# Anti-Patterns: MFA/TOTP with Fortify

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | MFA/TOTP with Fortify |
| Audience | Architects, Security Engineers, Developers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-MF-01 | Missing Password Confirmation for 2FA Changes | Critical | High | Low |
| AP-MF-02 | Admin MFA Exemption | Critical | Medium | Medium |
| AP-MF-03 | Unthrottled TOTP Challenge | Critical | Medium | Low |
| AP-MF-04 | No Recovery Code Fallback | High | High | Medium |
| AP-MF-05 | SMS-Based 2FA as Primary MFA | High | Medium | High |

---

## Repository-Wide Anti-Patterns

- **Unlogged 2FA Events**: No audit trail for enable/disable/reset, making incident response blind to 2FA tampering
- **Invisible 2FA Status**: No indicator in admin UI showing which users have MFA enabled — compliance blind spot
- **TOTP Secret in Plaintext**: Encryption key misconfigured, storing TOTP secrets unencrypted in database

---

## 1. Missing Password Confirmation for 2FA Changes

### Category
Security · Critical

### Description
Not requiring password re-entry before allowing users to enable or disable two-factor authentication, leaving 2FA settings unprotected against session hijacking.

### Why It Happens
The `confirmPassword` option is disabled or omitted in the `twoFactorAuthentication` feature configuration. Developers either miss the option in the config or disable it for "better UX."

### Warning Signs
- `Features::twoFactorAuthentication(['confirm' => true])` without `'confirmPassword' => true`
- 2FA enable/disable endpoints accessible with just `auth` middleware, no `password.confirm`
- No password prompt shown when user navigates to 2FA settings
- Session hijacker can disable victim's 2FA instantly

### Why Harmful
2FA is the last line of defense against account takeover. An attacker who gains session access (through XSS, unlocked workstation, or session fixation) can silently disable 2FA, then exfiltrate data at their leisure — the victim never receives a TOTP challenge alert.

### Real-World Consequences
- Session hijacking leads to permanent account takeover because 2FA is disabled without password check
- Compliance auditors flag missing 2FA confirmation as a finding (OWASP, SOC2)
- Support team cannot determine whether 2FA disable was legitimate or malicious
- Password reset flows bypass 2FA, creating a weaker combined security posture

### Preferred Alternative
Enable password confirmation in the 2FA feature config:
```php
Features::twoFactorAuthentication([
    'confirm' => true,
    'confirmPassword' => true,
]);
```

### Refactoring Strategy
1. Update `config/fortify.php` to include `'confirmPassword' => true`
2. Test that 2FA enable/disable prompts for password confirmation
3. Verify that inactive password confirmation sessions (older than configured timeout) reject the action
4. Add logging for 2FA changes regardless of confirmation

### Detection Checklist
- [ ] Read `config/fortify.php` — does 2FA feature config include `confirmPassword => true`?
- [ ] Test: login, navigate to 2FA settings — does it ask for password?
- [ ] Test: open an old session, try to disable 2FA — does it require fresh password entry?
- [ ] Code review: check routes for `password.confirm` middleware on 2FA endpoints

### Related Rules/Skills/Trees
- Require Password Confirmation for 2FA Setup Changes (05-rules.md)
- MFA Enforcement Strategy decision tree (07-decision-trees.md)

---

## 2. Admin MFA Exemption

### Category
Security · Critical

### Description
Not enforcing MFA for admin and privileged user accounts, leaving high-value targets protected only by passwords.

### Why It Happens
Making MFA optional for everyone is simpler than role-based enforcement. Developers may believe "admin users are careful with passwords" or that MFA adds too much friction for internal users. Compliance requirements may not be understood.

### Warning Signs
- No middleware, policy, or gate checking `$user->two_factor_secret !== null` for admin routes
- Admin accounts without MFA exist in production
- No alerting when an admin disables MFA
- Compliance documentation shows "MFA optional for all users"

### Why Harmful
Admin accounts are high-value targets with access to sensitive data, user management, and system configuration. A compromised admin account causes disproportionate damage compared to regular user compromise. Without enforced MFA, a single phishing email or password reuse incident can lead to full system compromise.

### Real-World Consequences
- Admin account compromised via credential stuffing — full database exported
- SOC2/HIPAA audit fails due to missing MFA enforcement for privileged users
- Customer PII accessed through compromised admin account — GDPR breach notification required
- Ransomware attack uses compromised admin to deploy encryption across infrastructure

### Preferred Alternative
Implement role-based MFA enforcement:
```php
public function accessAdmin(User $user): bool
{
    return $user->hasRole('admin') && $user->two_factor_secret !== null;
}
```

### Refactoring Strategy
1. Create a middleware or policy that checks for MFA on admin routes
2. Run a script to identify all admin users without MFA and notify them
3. Set a grace period for enrollment (e.g., 7 days) before forced enforcement
4. Add an admin report showing MFA adoption rates by role
5. Configure alerting for admin MFA disable events

### Detection Checklist
- [ ] Query users with role='admin' and two_factor_secret IS NULL
- [ ] Test admin routes without MFA — are they accessible?
- [ ] Check for middleware enforcing MFA on admin route groups
- [ ] Review compliance documentation for MFA requirements

### Related Rules/Skills/Trees
- Enforce MFA for Admin and Privileged Roles (05-rules.md)
- MFA Enforcement Strategy decision tree (07-decision-trees.md)

---

## 3. Unthrottled TOTP Challenge

### Category
Security · Critical

### Description
Not rate-limiting the TOTP verification endpoint, allowing brute force attacks against the 6-digit one-time password.

### Why It Happens
Developers rely on TOTP's 30-second window and assume the code is "temporary enough." They may also simply forget to add a rate limiter for the 2FA challenge endpoint, as Fortify does not enforce one by default.

### Warning Signs
- No `RateLimiter::for('two-factor', ...)` in `FortifyServiceProvider`
- No 429 errors when rapidly submitting TOTP codes
- The 2FA challenge endpoint is not listed in rate-limited routes
- Penetration test report shows TOTP brute force as a finding

### Why Harmful
TOTP codes are only 6 digits — 1,000,000 combinations. Without rate limiting, an attacker can try 1,000 codes per second, exhausting the keyspace in ~16 minutes. With rate limiting of 5 attempts per minute, the same attack takes 138 days. Rate limiting is the only practical defense against TOTP brute force.

### Real-World Consequences
- Attacker brute-forces TOTP after compromising password, achieving full account takeover
- Compliance scanners flag missing rate limiting on MFA endpoint (OWASP ASVS 2.8)
- Automated bot scripts can rapidly test TOTP codes, creating account lockout (if lockout is implemented)
- Insurance/audit requirements for MFA are not met without rate limiting

### Preferred Alternative
Configure TOTP rate limiting with IP-based throttling:
```php
RateLimiter::for('two-factor', function (Request $request) {
    return Limit::perMinute(5)->by($request->ip().'|'.$request->user()?->id);
});
```

### Refactoring Strategy
1. Add `configureRateLimiting()` with a `two-factor` rate limiter in `FortifyServiceProvider`
2. Set threshold to 5 attempts per minute per user+IP
3. Test that exceeding the limit returns 429 Too Many Requests
4. Ensure cache driver is Redis (not file) for shared rate limiter state in production

### Detection Checklist
- [ ] Search for `RateLimiter::for('two-factor')` in service providers
- [ ] Send 10 rapid TOTP codes — verify 429 on the 6th attempt
- [ ] Check cache driver configuration for production
- [ ] Penetration test the 2FA challenge endpoint

### Related Rules/Skills/Trees
- Rate-Limit TOTP Verification Attempts (05-rules.md)
- Never Disable Login Rate Limiting in Production (05-rules.md)

---

## 4. No Recovery Code Fallback

### Category
Security · Reliability

### Description
Not generating, displaying, or documenting recovery codes for users who lose access to their authenticator device, creating permanent account lockout risk.

### Why It Happens
Developers focus on the 2FA setup flow (QR code scanning) but neglect the recovery flow. Recovery codes are generated by Fortify by default, but the frontend may not display them properly, or the feature may be disabled to simplify the setup UI.

### Warning Signs
- No recovery codes displayed during 2FA setup
- `two_factor_recovery_codes` column is always null for users with 2FA enabled
- No "lost authenticator" flow documented in help/support
- Support tickets about users locked out after device change

### Why Harmful
Hardware failure, device upgrade, app reset, or accidental uninstall of the authenticator app makes TOTP generation impossible. Without recovery codes, the user has no way to authenticate. Account recovery requires manual support intervention or is impossible, leading to permanent data loss.

### Real-World Consequences
- User switches phones, cannot reinstall authenticator, permanently locked out
- Authenticator app bug causes data loss on device — user loses access to all accounts
- Support team spends hours manually verifying identity and resetting 2FA
- Customer churn due to frustration with permanent lockout

### Preferred Alternative
Display recovery codes during 2FA setup and document the recovery flow:
```php
// Fortify generates 10 hashed recovery codes by default
// Display them once during setup and prompt user to save them
```

### Refactoring Strategy
1. Verify recovery codes are displayed during the 2FA setup UI flow
2. Ensure the frontend prompts users to save codes (download, print, copy)
3. Implement a recovery code verification endpoint for login
4. Document the recovery process in help/FAQ
5. Implement a support-assisted recovery flow with identity verification as last resort

### Detection Checklist
- [ ] Test 2FA setup — are recovery codes displayed after QR scan?
- [ ] Check database for hashed recovery codes after 2FA enable
- [ ] Test login with recovery code — verify single-use consumption
- [ ] Verify recovery code is invalid after use
- [ ] Check for "lost authenticator" documentation or help page

### Related Rules/Skills/Trees
- Store Recovery Codes Securely and Display Once (05-rules.md)
- Provide a Documented Recovery Flow for Lost Authenticator (05-rules.md)
- Recovery and Fallback Strategy decision tree (07-decision-trees.md)

---

## 5. SMS-Based 2FA as Primary MFA

### Category
Security · Architecture

### Description
Implementing SMS-delivered one-time codes as the primary or only two-factor authentication method instead of TOTP-based authenticator apps.

### Why It Happens
SMS feels familiar and convenient — users understand text messages. Product teams may believe SMS has wider reach (no app installation required). Third-party SMS 2FA packages are easy to integrate with Laravel.

### Warning Signs
- 2FA implementation uses an SMS API (Twilio, Vonage) instead of Fortify's TOTP
- User must have a phone number on file for authentication
- Users report delayed or missing SMS codes
- Support tickets about international SMS delivery failures

### Why Harmful
SMS 2FA is vulnerable to SIM-swapping attacks where an attacker convinces the carrier to transfer the victim's number to a SIM in their possession. SMS messages can also be intercepted via SS7 protocol vulnerabilities, targeted signaling attacks, or malware on the device. SMS depends on carrier infrastructure — outages or roaming issues block login.

### Real-World Consequences
- SIM-swap attack leads to account takeover — attacker receives SMS codes
- User traveling internationally cannot receive SMS codes (roaming issues)
- Carrier outage blocks all users from logging in
- Compliance frameworks (NIST, PCI DSS) deprecate SMS as an out-of-band verification method
- SMS costs scale with user base (per-message pricing)

### Preferred Alternative
Use TOTP-based 2FA with authenticator apps:
```php
Features::twoFactorAuthentication([
    'confirm' => true,
    'confirmPassword' => true,
]);
```

### Refactoring Strategy
1. Adopt Fortify's built-in TOTP 2FA as the primary MFA method
2. Migrate existing SMS users to TOTP (force setup on next login)
3. Keep SMS as a secondary fallback for users without smartphone access (with security notice)
4. Remove SMS dependency code and associated API costs
5. Update documentation and support flows for TOTP setup

### Detection Checklist
- [ ] Does the app use Fortify's built-in 2FA or a custom SMS implementation?
- [ ] Check composer.json for SMS-related packages (twilio/sdk, vonage)
- [ ] Are TOTP secrets stored in the database (two_factor_secret column)?
- [ ] Review auth flow — is TOTP QR code presented or phone number asked?

### Related Rules/Skills/Trees
- Prefer TOTP Over SMS-Based 2FA (05-rules.md)
- MFA Method Selection decision tree (07-decision-trees.md)
