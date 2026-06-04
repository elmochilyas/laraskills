# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Password Validation Rule Objects |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel's `Password` rule object (`Illuminate\Validation\Rules\Password`) provides configurable password validation beyond simple string length rules. Default rules via `Password::defaults()` enable centralized password policy configuration. Methods: `min()`, `max()`, `letters()`, `mixedCase()`, `numbers()`, `symbols()`, `uncompromised()` (haveibeenpwned API check). The `uncompromised` method checks the password against the Have I Been Pwned password database via k-anonymity (only the first 5 characters of the SHA-1 hash are sent to the API). Password rule objects should be used in ALL user registration and password change Form Requests.

---

## Core Concepts

- **Password Rule Object**: `new Password(min: 8)` or `Password::min(8)->letters()->mixedCase()->numbers()->symbols()` — returns a rule object for the validator.
- **Password::defaults()**: Set global defaults in `AppServiceProvider` or `FortifyServiceProvider`. All subsequent `Password` rule instances use these defaults.
- **uncompromised()**: Checks against Have I Been Pwned (HIBP) via k-anonymity API. The password's SHA-1 hash prefix (first 5 chars) is sent; the API returns all hashes with that prefix; the client checks if the full hash appears in the response. The actual password never leaves the server.
- **Bcrypt Hashing**: Laravel hashes passwords with bcrypt (default cost: 10). `Hash::make()`. `Hash::needsRehash()` checks if current cost matches configured cost.

---

## When To Use

- **Every** user registration and password change Form Request
- Centralized password policy across all endpoints
- Admin account registration (stricter rules)

## When NOT To Use

- Passwordless authentication systems (Passkeys, WebAuthn) — no passwords to validate
- Internal system accounts where password policy is enforced by upstream identity provider

---

## Best Practices

- **Set Defaults**: `Password::defaults(fn() => Password::min(8)->mixedCase()->numbers()->symbols()->uncompromised())` in `AppServiceProvider::boot()`.
- **Enable uncompromised()**: HIBP API is free, fast, and the k-anonymity protocol preserves privacy. Handle API errors gracefully.
- **Review Bcrypt Cost Annually**: Default cost 10 is acceptable in 2026 but should increase as hardware improves. Use `Hash::needsRehash()` on login.
- **Avoid Arbitrary Max Length**: `Password::min(8)->max(64)` prevents passphrase-style passwords. Let max be higher (128+) or remove max entirely.

---

## Architecture Guidelines

- Centralized defaults in `AppServiceProvider` for 90% of endpoints
- Override for admin or high-security contexts: `Password::min(12)->mixedCase()->numbers()->symbols()->uncompromised()`
- Graceful failure for uncompromised(): Use callback to handle HIBP API errors

---

## Performance Considerations

- `uncompromised()` adds 200-500ms to password validation (HTTP request to HIBP API)
- Without `uncompromised()`, password validation is entirely local
- Bcrypt hashing: default cost 10 (~100ms per hash). Cost 12 (~400ms) for admin accounts
- HIBP response cached per request — subsequent uncompromised() calls reuse

---

## Security Considerations

- **k-Anonymity**: Only the first 5 characters of the password's SHA-1 hash are sent to HIBP. The password never leaves the server.
- **Bcrypt Default Cost**: Cost 10 provides ~100ms per hash. Review annually and increase as hardware improves.
- **Rehash on Login**: When bcrypt cost is increased, existing passwords still work. Implement `Hash::needsRehash()` check on login to seamlessly rehash.
- **No Plain-Text Passwords in Logs**: Ensure password validation does not log input values.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not setting defaults | Copy-pasting rules to each FormRequest | Policy change requires updating every form | Use `Password::defaults()` |
| Using plain `min:8` string rule | Unaware of Password rule object | "12345678" passes validation | Use `Password::min(8)->letters()->mixedCase()->numbers()->symbols()` |
| uncompromised() without error handling | Assuming HIBP API is always available | API outage blocks all registrations | Use graceful failure callback |
| Bcrypt cost too low | Never reviewed | Passwords increasingly vulnerable to brute force | Review cost annually; rehash on login |
| Arbitrary max length restriction | Following outdated patterns | Blocks passphrase-style passwords | Remove max or set high (128+) |

---

## Anti-Patterns

- **Storing passwords in plaintext**: Use `Hash::make()` — never store raw passwords
- **Rolling custom password validation**: Use Laravel's Password rule object — covers OWASP guidelines
- **Disabling uncompromised() due to latency concern**: 200-500ms is acceptable for registration; security benefit outweighs delay

---

## Examples

**Centralized defaults:**
```php
// AppServiceProvider::boot()
use Illuminate\Validation\Rules\Password;

Password::defaults(fn () => Password::min(8)
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->uncompromised()
);
```

**Usage in Form Request:**
```php
// No explicit rules — defaults apply
'password' => ['required', 'confirmed', Password::defaults()],
```

**Admin override:**
```php
'password' => ['required', 'confirmed', Password::min(12)
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->uncompromised()
],
```

---

## Related Topics

- Form Request validation rules
- Hash facade (Bcrypt)
- Fortify password validation configuration
- MFA/TOTP (complementary security)
- Passkeys (alternative authentication)

---

## AI Agent Notes

- When auditing a Laravel project, check for `Password::defaults()` in any Service Provider. If not set, recommend centralizing the password policy.
- The uncompromised() rule should be enabled in production. If disabled, ask why — latency concerns can be mitigated with graceful failure handling.
- Bcrypt cost should be reviewed annually. Check `config/hashing.php` for the `rounds` value.

---

## Verification

- [ ] `Password::defaults()` configured in a service provider
- [ ] ALL registration Form Requests use `Password::defaults()`
- [ ] `uncompromised()` enabled with graceful error handling
- [ ] Bcrypt cost reviewed and appropriate (min 10 for 2026)
- [ ] No hardcoded password rules in individual Form Requests
- [ ] Passwords not stored in plaintext in any table
- [ ] Password change form uses same validation rules as registration
- [ ] No arbitrary max length blocking passphrase passwords
