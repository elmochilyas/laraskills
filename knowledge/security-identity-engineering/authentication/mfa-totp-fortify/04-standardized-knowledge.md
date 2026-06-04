# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | MFA/TOTP with Fortify |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel Fortify provides built-in two-factor authentication (2FA) using TOTP (Time-based One-Time Passwords). When enabled, users configure a TOTP authenticator app (Google Authenticator, Authy, 1Password) by scanning a QR code. Subsequent logins require both the password and a 6-digit TOTP code. Fortify also generates recovery codes for account access when the authenticator device is unavailable. 2FA can be configured as optional (user choice) or required (for specific roles like admin).

---

## Core Concepts

- **TOTP (Time-based One-Time Password)**: 6-digit code generated from a shared secret + current time. Changes every 30 seconds.
- **QR Code Setup**: Users scan a QR code in their authenticator app. The secret is shared between the app and Fortify.
- **Recovery Codes**: 10 single-use codes generated on 2FA setup. Each code can be used once to bypass TOTP.
- **Challenge Flow**: After password verification, a "challenge" view asks for TOTP code or recovery code.
- **Fortify Confirmation**: 2FA setup requires password confirmation (`password.confirm` middleware) for security.

---

## When To Use

- Applications requiring additional login security beyond passwords
- Admin panels and privileged user accounts
- Compliance requirements (SOC2, HIPAA, PCI DSS) often mandate MFA
- User-facing products where security-sensitive features warrant 2FA

## When NOT To Use

- High-frequency automated logins (M2M API authentication — use token-based auth)
- Applications where user friction must be minimized (evaluate risk tolerance)
- Passwordless authentication systems using Passkeys (WebAuthn offers built-in device verification)

---

## Best Practices

- **Make MFA Optional for Users, Required for Admins**: Feature flag for regular users; enforced for privileged roles.
- **Store Recovery Codes Securely**: Recovery codes are hashed in the database (bcrypt). Users must save them on setup.
- **Use Password Confirmation**: Require password re-entry before allowing 2FA setup changes.
- **Handle Lost Authenticator**: Provide a documented recovery flow (recovery codes, support team intervention via email verification).
- **Monitor 2FA Events**: Log 2FA enable/disable events. Alert on disable with password verification.

---

## Architecture Guidelines

- Enable 2FA feature in `config/fortify.php`: `Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true])`
- Customize `App\Actions\Fortify\TwoFactorAuthentication` action for custom 2FA behavior
- Recovery codes: 10 codes by default, configurable. Each code is single-use.
- Challenge middleware automatically applied after login for users with 2FA enabled

---

## Performance Considerations

- TOTP verification is local — no external API calls. ~50ms per challenge.
- QR code generation requires the `simple-qrcode` package. ~200ms one-time setup cost.
- Recovery code hashing (bcrypt) on generation — configurable cost.

---

## Security Considerations

- **TOTP Secret Storage**: Fortify encrypts the TOTP secret in the database using Laravel's encryption.
- **Recovery Code Exposure**: Recovery codes are displayed only once during setup (plain text). After that, only hashed versions are stored.
- **Brute Force Protection**: Fortify rate-limits TOTP verification attempts.
- **Session Security**: 2FA session state is stored in the session — must use secure session configuration.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not requiring password confirmation for 2FA setup | Skipping confirmation configuration | Attacker with active session can disable victim's 2FA | Enable `confirmPassword` in 2FA feature config |
| Not providing recovery code fallback | Assuming authenticator is always available | Users locked out when device is lost | Generate and display recovery codes; document recovery flow |
| Making 2FA mandatory without exception handling | Universal enforcement | Users without compatible devices cannot log in | Allow support team recovery flow as last resort |
| Not logging 2FA changes | No audit trail | Can't detect unauthorized 2FA changes | Log all 2FA enable/disable/reset events |

---

## Anti-Patterns

- **SMS-based 2FA instead of TOTP**: SMS is less secure (SIM swapping, interception). Prefer TOTP.
- **Hardcoding TOTP secrets**: Secrets must be generated per-user at setup time.
- **Disabling 2FA for "power users"**: Creates a weaker security profile for high-value targets.

---

## Examples

**Enable 2FA in Fortify:**
```php
// config/fortify.php
'features' => [
    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]),
],
```

**Check if user has 2FA enabled:**
```php
if (Auth::user()->two_factor_secret) {
    // User has 2FA configured
}

// In a policy or gate
public function accessAdmin(User $user): bool
{
    return $user->hasRole('admin') && $user->two_factor_secret !== null;
}
```

---

## Related Topics

- Fortify headless auth backend
- Passkeys/WebAuthn (alternative MFA method)
- Authentication middleware
- Recovery codes and account recovery

---

## AI Agent Notes

- Fortify's 2FA is the standard MFA implementation for Laravel. Check `config/fortify.php` features array to verify it's enabled.
- 2FA should be required for admin/privileged users. Check for enforcement policies or middleware.
- Recovery codes are a critical UX concern — verify the frontend displays them properly during setup.
- TOTP secrets are encrypted in the database — check the encryption key is properly configured.

---

## Verification

- [ ] 2FA feature enabled in `config/fortify.php`
- [ ] Password confirmation required for 2FA setup
- [ ] Recovery codes generated and displayed on setup
- [ ] Rate limiting configured for 2FA challenge
- [ ] TOTP secret stored encrypted in database
- [ ] Admin accounts require MFA (enforced by policy/middleware)
- [ ] 2FA events logged (enable, disable, reset)
- [ ] Documented recovery flow for lost authenticator device
- [ ] Mail configuration for recovery notifications
