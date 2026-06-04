# Domain: Security & Identity Engineering
# Subdomain: Additional Security Concerns

---

## Rule Name

Centralize Password Rules via Password::defaults()

## Category

Maintainability

## Rule

Define `Password::defaults()` in a service provider's `boot()` method. Never copy-paste password validation rules into individual Form Requests.

## Reason

Password policy is a security concern that must apply uniformly across all authentication endpoints (registration, password change, admin user creation, password reset). Copy-pasting rules creates drift: some forms may have stricter rules than others, and policy updates require finding and modifying every Form Request. Centralized defaults ensure one source of truth for password policy.

## Bad Example

```php
// FormRequest 1 — password rules defined inline
'password' => ['required', 'confirmed', 'min:8', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'regex:/[@$!%*#?&]/'],

// FormRequest 2 — different rules, different order
'password' => ['required', 'min:10', 'confirmed'],
// Policy drift — admin registration is weaker than user registration
```

## Good Example

```php
// AppServiceProvider::boot()
use Illuminate\Validation\Rules\Password;

Password::defaults(fn () => Password::min(8)
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->uncompromised()
);

// All Form Requests — uniform policy, zero drift
'password' => ['required', 'confirmed', Password::defaults()],
```

## Exceptions

Admin/high-security endpoints that require stricter rules than the general policy. Use explicit `Password::min(12)->...` for these, not a separate defaults override.

## Consequences Of Violation

Security: Inconsistent password policies across endpoints leave some entry points with weaker validation. Maintenance: Policy changes require touching every Form Request.

---

## Rule Name

Always Enable uncompromised() Password Check

## Category

Security

## Rule

Add `->uncompromised()` to all password validation rules. Never disable it due to latency concerns without a documented risk acceptance.

## Reason

`uncompromised()` checks the password against the Have I Been Pwned (HIBP) database of over 600 million known breached passwords using a k-anonymity protocol. A password that appears in a known breach is trivially guessable — no password complexity requirement protects against a password that attackers already possess. The 200-500ms latency is negligible compared to the security benefit.

## Bad Example

```php
// uncompromised() omitted — breached passwords accepted
Password::min(8)->mixedCase()->numbers()->symbols()
// "Password1!" — passes complexity but is breached
```

## Good Example

```php
Password::min(8)->mixedCase()->numbers()->symbols()->uncompromised()
// Breached password rejected at validation
```

## Exceptions

Environments without outbound internet access (air-gapped networks, isolated internal applications). In this case, document why HIBP cannot be reached and consider a local breached-password database or alternative.

## Consequences Of Violation

Security: Known-breached passwords accepted, enabling credential stuffing attacks. Compliance: Fails OWASP password policy guidelines.

---

## Rule Name

Handle uncompromised() API Failures Gracefully

## Category

Reliability

## Rule

Always provide a graceful failure callback for `uncompromised()`. Never let a HIBP API outage block all user registrations.

## Reason

`uncompromised()` makes an HTTP request to the HIBP API. Like any external dependency, this API can experience downtime, network issues, or rate limiting. Without a graceful failure handler, a temporary HIBP outage blocks all new user registrations and password changes — a critical business impact for most applications.

## Bad Example

```php
// No graceful failure — HIBP outage blocks registration
Password::min(8)->mixedCase()->numbers()->symbols()->uncompromised()
```

## Good Example

```php
Password::min(8)
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->uncompromised(function ($failedPayload) {
        // Log the failure but allow registration to proceed
        Log::warning('HIBP check failed', ['error' => $failedPayload]);
        return false; // Gracefully skip the check
    })
```

## Exceptions

Security-critical applications (banking, government) where known-breached passwords must be rejected even at the cost of availability. In this case, implement a local breached-password cache as a fallback.

## Consequences Of Violation

Reliability: External API outage blocks all user onboarding. Business: Lost registrations during HIBP downtime.

---

## Rule Name

Never Impose Arbitrary Maximum Password Length

## Category

Security

## Rule

Do not use `->max()` below 128 characters on password validation. Remove `->max()` entirely to allow passphrase-style passwords.

## Reason

Passphrase passwords (e.g., `correct-horse-battery-staple`) are longer but more memorable and harder to crack than short complex passwords. An arbitrary maximum length (e.g., 64 chars) blocks users who prefer passphrases, forcing them into shorter, weaker passwords. Bcrypt hashes any input up to 72 bytes, so there is no technical reason for a short max.

## Bad Example

```php
// Arbitrary max blocks passphrase users
Password::min(8)->max(20)->mixedCase()->numbers()->symbols()
// "my-cat-loves-sunny-windowsills" — 38 chars, rejected
```

## Good Example

```php
// No max — passphrases welcome
Password::min(8)->mixedCase()->numbers()->symbols()->uncompromised()
```

## Exceptions

Integration with external identity providers or legacy systems that enforce a maximum password length. In this case, set max to match the external system's limit.

## Consequences Of Violation

Security: Users choose weaker short passwords because passphrases are blocked. User Experience: Frustration with arbitrary length limits.

---

## Rule Name

Review and Increase Bcrypt Cost Annually

## Category

Security

## Rule

Review the bcrypt cost factor (`config/hashing.php`) annually. Implement `Hash::needsRehash()` on login to seamlessly upgrade existing hashes when cost is increased.

## Reason

Bcrypt cost determines the computational difficulty of password hashing. As hardware improves, the default cost (10, ~100ms per hash in 2026) becomes increasingly susceptible to GPU-based brute force. Annual review ensures the cost keeps pace with hardware advancement. `Hash::needsRehash()` ensures existing users' passwords are rehashed to the new cost on their next login, avoiding a forced password reset.

## Bad Example

```php
// config/hashing.php — never reviewed
'rounds' => 10,
// Same cost for 5 years — increasingly vulnerable
```

## Good Example

```php
// config/hashing.php
'rounds' => 12, // Reviewed 2026 — target ~400ms per hash

// Login controller
if (Hash::needsRehash($user->password)) {
    $user->update(['password' => Hash::make($request->password)]);
}
```

## Exceptions

Applications with very high login volume where increased hash time causes unacceptable latency. In this case, document the performance-security trade-off and set the highest acceptable cost.

## Consequences Of Violation

Security: Increasingly brute-forceable password hashes over time. Compliance: Fails password storage security requirements for regulated data.

---

## Rule Name

Use Password Rule Object, Not Plain String min:8

## Category

Security

## Rule

Always use `Illuminate\Validation\Rules\Password` for password validation. Never use plain string rules like `min:8` or `regex:` chains for password validation.

## Reason

The `Password` rule object provides built-in, properly implemented character class checks (`letters()`, `mixedCase()`, `numbers()`, `symbols()`) and the `uncompromised()` breached-password check. Plain `min:8` allows `12345678` to pass. Hand-rolled `regex:` chains are error-prone (wrong character escaping, Unicode issues) and do not include breached-password checking.

## Bad Example

```php
// Plain string rule — no character class requirements
'password' => ['required', 'confirmed', 'min:8'],
// "12345678" passes validation
```

## Good Example

```php
use Illuminate\Validation\Rules\Password;

'password' => ['required', 'confirmed', Password::min(8)
    ->mixedCase()
    ->numbers()
    ->symbols()
    ->uncompromised()
],
```

## Exceptions

Passwordless authentication systems (passkeys, WebAuthn, OAuth-only) where no password field exists for validation.

## Consequences Of Violation

Security: Weak passwords pass validation. Compliance: Fails OWASP password policy requirements.

---

## Rule Name

Never Log or Expose Password Input Values

## Category

Security

## Rule

Ensure password validation and processing never logs the raw password value. Never add password fields to exception reports, debug dumps, or audit logs.

## Reason

Laravel's validation system masks password fields by default, but custom validation rules, logging middleware, or exception handlers may inadvertently expose raw passwords. A logged password in a production error report or a debugging dump is a credential leak — attackers who access logs gain authentication credentials.

## Bad Example

```php
// Custom validation rule that logs password
Validator::extend('strong_password', function ($attribute, $value, $parameters) {
    Log::debug('Password check', ['password' => $value]); // NEVER log password
    return strlen($value) >= 8;
});
```

## Good Example

```php
Validator::extend('strong_password', function ($attribute, $value, $parameters) {
    return strlen($value) >= 8; // No logging of password value
});

// If logging is needed for audit, log only metadata
Log::info('Password validation passed', [
    'user_id' => auth()->id(),
    'length' => strlen($value), // Log metadata, not value
]);
```

## Exceptions

No common exceptions. Passwords must never be logged in any environment, including development and staging.

## Consequences Of Violation

Security: Credential leak via logs. Compliance: Fails data protection requirements (GDPR, PCI-DSS, SOC2).
