# Skill: Implement MFA/TOTP Two-Factor Authentication with Fortify

## Purpose
Enable and configure Fortify's TOTP-based two-factor authentication to add an additional security layer beyond passwords for user accounts.

## When To Use
- Applications requiring additional login security beyond passwords
- Admin panels and privileged user accounts
- Compliance requirements (SOC2, HIPAA, PCI DSS) mandating MFA
- User-facing products with security-sensitive features

## When NOT To Use
- High-frequency automated logins (M2M API — use token-based auth)
- Applications where user friction must be minimized
- Passwordless systems using Passkeys (WebAuthn offers built-in verification)

## Prerequisites
- Laravel Fortify installed and configured
- Frontend UI for authentication flows
- Mail configured for recovery notifications
- `simple-qrcode` package for QR code generation

## Inputs
- Fortify features configuration (2FA with confirm and confirmPassword)
- MFA enforcement rules (optional for users, required for admins)
- Recovery code display and storage approach
- Rate limiting configuration for 2FA challenge

## Workflow (numbered)
1. Enable 2FA in `config/fortify.php`: `Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true])`
2. Configure 2FA rate limiting in `FortifyServiceProvider`
3. Build frontend UI for 2FA setup (QR code scanning, recovery codes display)
4. Implement MFA enforcement policy for admin/privileged roles
5. Set up recovery code fallback flow (verify hashed codes, consume on use)
6. Implement 2FA event logging (enable, disable, reset)
7. Document recovery flow for lost authenticator devices
8. Test complete 2FA flow: enable → login → challenge → recovery → disable

## Validation Checklist
- [ ] Password confirmation required for 2FA setup changes
- [ ] Recovery codes hashed (bcrypt) and displayed once during setup
- [ ] TOTP verification rate-limited (not unlimited)
- [ ] Admin accounts enforced to have MFA enabled
- [ ] 2FA events logged with user ID, IP, timestamp
- [ ] Documented recovery flow for lost authenticator

## Common Failures
- No password confirmation for 2FA disable (session hijacker can remove 2FA)
- No recovery code fallback (users locked out when device is lost)
- No rate limiting on TOTP challenge (brute force on 6-digit code)
- 2FA optional for admins (high-value accounts with weaker protection)

## Decision Points
- **Optional vs Required**: Optional for regular users, required for admin/privileged roles
- **Recovery method**: Recovery codes (self-service) + support verification (human fallback)
- **TOTP vs SMS**: Always prefer TOTP over SMS (SIM-swap vulnerability)

## Performance Considerations
- TOTP verification is local (~50ms per challenge) — no external API calls
- QR code generation requires `simple-qrcode` (~200ms one-time setup cost)
- Recovery code hashing (bcrypt) on generation

## Security Considerations
- TOTP secret encrypted in database using Laravel's encryption
- Recovery codes hashed after initial display — never stored in plaintext
- Rate limiting prevents brute force on 6-digit TOTP code (1M combinations)
- Session security: 2FA challenge state stored in session

## Related Rules (from 05-rules.md)
- Require Password Confirmation for 2FA Setup Changes
- Enforce MFA for Admin and Privileged Roles
- Store Recovery Codes Securely and Display Once
- Prefer TOTP Over SMS-Based 2FA
- Log All 2FA Enable and Disable Events
- Provide a Documented Recovery Flow for Lost Authenticator
- Rate-Limit TOTP Verification Attempts

## Related Skills
- Customize Fortify Headless Auth Backend
- Implement Passkeys/WebAuthn Authentication
- Configure Auth Guards and Providers
- Audit Logging with Spatie Activitylog

## Success Criteria
- Users can enable 2FA with authenticator app QR code
- Login requires TOTP code after password verification
- Recovery codes work as fallback when authenticator unavailable
- Password confirmation required for 2FA disable
- Admin accounts enforced to have MFA
- Rate limiting blocks rapid TOTP attempts
