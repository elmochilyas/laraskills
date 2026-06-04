# Password Validation Rule Objects — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Password Validation Rule Objects |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Not Setting Centralized Password Defaults
2. Using Plain `min:8` String Rule Instead of Password Object
3. Disabling uncompromised() Due to Latency
4. uncompromised() Without Graceful Failure Handling
5. Imposing Arbitrary Maximum Password Length

---

## Repository-Wide Anti-Patterns

- **Inconsistent password rules across forms**: Some endpoints have weak rules, others stricter.
- **Never reviewing bcrypt cost**: Same cost for years — increasingly vulnerable to brute force.
- **No `Hash::needsRehash()` on login**: Passwords stay at outdated cost after upgrade.
- **Logging password values**: Passwords exposed in logs, exception reports, or debug dumps.

---

## Anti-Pattern 1: Not Setting Centralized Password Defaults

### Category

Maintainability

### Description

Not defining `Password::defaults()` in a service provider, leaving each Form Request to define its own password validation rules.

### Why It Happens

Developers may not know about `Password::defaults()`. They copy-paste `min:8|regex:/[A-Z]/|...` into each Form Request as needed.

### Warning Signs

- No `Password::defaults()` call in any service provider
- Each Form Request has independently defined password rules
- Some forms use `min:8`, others use `min:10`, others use `min:8|regex:/[A-Z]/`
- Password policy change requires updating 5+ Form Requests
- Rules differ between registration and password change forms

### Why Harmful

Password policy is a security concern that must apply uniformly across all authentication endpoints (registration, password change, admin user creation, password reset). Copy-pasting rules creates drift: some forms may have stricter rules than others, and policy updates require finding and modifying every Form Request. Centralized defaults ensure one source of truth for password policy.

### Consequences

- Inconsistent password policies across endpoints
- Some entry points accept weaker passwords
- Policy changes require project-wide search and replace
- Admin registration may have weaker rules than user registration

### Alternative

Define `Password::defaults()` in a service provider's `boot()` method. All Form Requests use `Password::defaults()` without individual rule definition.

### Refactoring Strategy

1. Add `Password::defaults(fn() => Password::min(8)->mixedCase()->numbers()->symbols()->uncompromised())` in `AppServiceProvider::boot()`
2. Update all Form Requests to use `Password::defaults()`
3. Remove inline password rule definitions
4. Verify all endpoints enforce the same policy

### Detection Checklist

- [ ] `Password::defaults()` is set in a service provider
- [ ] All Form Requests use `Password::defaults()`
- [ ] No inline password rules in individual Form Requests
- [ ] All endpoints enforce the same password policy
- [ ] Policy change is a single-line modification

### Related Rules

- Centralize Password Rules via Password::defaults() (05-rules.md)

### Related Skills

- Implement Secure Password Validation Rules (06-skills.md)

### Related Decision Trees

- Centralized Defaults vs Per-Form Rules (07-decision-trees.md)

---

## Anti-Pattern 2: Using Plain `min:8` String Rule Instead of Password Object

### Category

Security

### Description

Using `'password' => 'required|confirmed|min:8'` string validation instead of the `Illuminate\Validation\Rules\Password` rule object.

### Why It Happens

Plain string rules are simpler and familiar. Developers may not know about the `Password` rule object or may think string rules are sufficient.

### Warning Signs

- `'password' => 'required|confirmed|min:8'` in Form Requests
- No `Password::` usage anywhere in the codebase
- `12345678` passes password validation
- No character composition checks (uppercase, number, symbol)
- No breached-password checking

### Why Harmful

The `Password` rule object provides built-in, properly implemented character class checks (`letters()`, `mixedCase()`, `numbers()`, `symbols()`) and the `uncompromised()` breached-password check. Plain `min:8` allows `12345678` to pass. Hand-rolled `regex:` chains are error-prone (wrong character escaping, Unicode issues) and do not include breached-password checking.

### Consequences

- Weak passwords like `12345678` pass validation
- No character composition requirements
- No breached-password screening
- Hand-rolled regex rules may have Unicode or escaping errors

### Alternative

Always use `Illuminate\Validation\Rules\Password` for password validation with composition checks and `uncompromised()`.

### Refactoring Strategy

1. Replace plain string rules with `Password::defaults()`
2. Add composition methods: `->mixedCase()->numbers()->symbols()->uncompromised()`
3. Remove any hand-rolled regex character checks
4. Test that weak passwords (like `password`) are rejected

### Detection Checklist

- [ ] All password validation uses `Password::defaults()` or `Password::min(8)->...`
- [ ] No plain `min:8` string rules for passwords
- [ ] Character composition is enforced (mixed case, numbers, symbols)
- [ ] `uncompromised()` is enabled
- [ ] Weak passwords are rejected

### Related Rules

- Use Password Rule Object, Not Plain String min:8 (05-rules.md)

### Related Skills

- Implement Secure Password Validation Rules (06-skills.md)

### Related Decision Trees

- Centralized Defaults vs Per-Form Rules (07-decision-trees.md)

---

## Anti-Pattern 3: Disabling uncompromised() Due to Latency

### Category

Security

### Description

Choosing not to enable the `uncompromised()` breached-password check because it adds 200-500ms latency to registration and password change forms.

### Why It Happens

Performance-sensitive teams may view the latency as unacceptable. They may not understand that a breached password is trivially guessable regardless of complexity.

### Warning Signs

- `uncompromised()` is not included in password validation
- Team cites "latency concerns" as the reason
- Registration form is fast but accepts breached passwords
- No documented risk acceptance for disabling `uncompromised()`

### Why Harmful

A breached password is trivially guessable — no password complexity requirement protects against a password that attackers already possess. The 200-500ms latency is negligible compared to the security benefit. Registration and password change forms are infrequent operations that already take seconds (form fill, email delivery), so the additional latency is imperceptible to users.

### Consequences

- Known-breached passwords accepted, enabling credential stuffing
- "P@ssw0rd1" passes all complexity rules but is breached
- Compliance failure — OWASP password policy guidelines violated
- Users' accounts compromised via credential stuffing

### Alternative

Enable `uncompromised()` with graceful failure handling. The 200-500ms is negligible for infrequent operations.

### Refactoring Strategy

1. Add `->uncompromised()` to password validation rules
2. Add graceful failure callback: `->uncompromised(function ($payload) { Log::warning(...); return false; })`
3. Test that the HIBP check works (use a known breached password like "password")
4. Document the latency trade-off acceptance

### Detection Checklist

- [ ] `uncompromised()` is enabled on all password validation
- [ ] Graceful failure callback is implemented
- [ ] HIBP check works correctly with known breached passwords
- [ ] Registration latency is acceptable with the check enabled
- [ ] No documented decision to disable due to latency

### Related Rules

- Always Enable uncompromised() Password Check (05-rules.md)

### Related Skills

- Implement Secure Password Validation Rules (06-skills.md)

### Related Decision Trees

- uncompromised() Enablement (07-decision-trees.md)

---

## Anti-Pattern 4: uncompromised() Without Graceful Failure Handling

### Category

Reliability

### Description

Enabling `uncompromised()` without a graceful failure callback, allowing a HIBP API outage to block all user registrations and password changes.

### Why It Happens

Developers may not consider the HIBP API as an external dependency that can fail. The default behavior without a callback is to throw an exception on API failure.

### Warning Signs

- `->uncompromised()` used without the failure callback parameter
- No `Log::warning()` or fallback logic for HIBP API errors
- Registration fails when HIBP is unreachable
- No monitoring for HIBP API availability

### Why Harmful

`uncompromised()` makes an HTTP request to the HIBP API. Like any external dependency, this API can experience downtime, network issues, or rate limiting. Without a graceful failure handler, a temporary HIBP outage blocks all new user registrations and password changes — a critical business impact for most applications.

### Consequences

- HIBP API outage blocks all new user registrations
- Lost business during API downtime
- Password changes blocked — users cannot update credentials
- Critical business impact from an external dependency

### Alternative

Always provide a graceful failure callback for `uncompromised()` that logs the error and allows registration to proceed.

### Refactoring Strategy

1. Update `uncompromised()` calls to include the failure callback: `->uncompromised(function ($failedPayload) { Log::warning(...); return false; })`
2. Add monitoring for HIBP API failures (track the log warning)
3. Document the graceful failure policy
4. Test by simulating HIBP API unavailability

### Detection Checklist

- [ ] `uncompromised()` includes a graceful failure callback
- [ ] HIBP API failures are logged for monitoring
- [ ] Registration proceeds when HIBP is unavailable
- [ ] No business-critical dependency on HIBP uptime
- [ ] Graceful failure policy is documented

### Related Rules

- Handle uncompromised() API Failures Gracefully (05-rules.md)

### Related Skills

- Implement Secure Password Validation Rules (06-skills.md)

### Related Decision Trees

- uncompromised() Enablement (07-decision-trees.md)

---

## Anti-Pattern 5: Imposing Arbitrary Maximum Password Length

### Category

Security

### Description

Setting a low maximum password length (e.g., `->max(20)` or `max:20`) that blocks passphrase-style passwords.

### Why It Happens

Developers may follow outdated patterns that treat passwords like other form fields with length limits. They may not understand that longer passwords (passphrases) are more secure.

### Warning Signs

- Password validation includes `->max(20)` or `->max(30)`
- Plain string rule: `'password' => 'min:8|max:20'`
- Users cannot use passphrases like "correct-horse-battery-staple"
- Error messages about password being "too long"

### Why Harmful

Passphrase passwords (e.g., `correct-horse-battery-staple`) are longer but more memorable and harder to crack than short complex passwords. An arbitrary maximum length (e.g., 64 chars) blocks users who prefer passphrases, forcing them into shorter, weaker passwords. Bcrypt hashes any input up to 72 bytes, so there is no technical reason for a short max.

### Consequences

- Users forced into shorter, weaker passwords
- Passphrase-style passwords rejected
- Lower overall password entropy from blocked passphrases
- User frustration with arbitrary length limits

### Alternative

Remove `->max()` entirely or set it to at least 128 characters to allow passphrase passwords.

### Refactoring Strategy

1. Remove `->max()` from all password validation rules
2. If a max is required by external constraints, set it to 128+
3. Test that passphrase-length passwords (38+ characters) are accepted
4. Verify that bcrypt handles the longer passwords correctly

### Detection Checklist

- [ ] No `->max()` with values below 128 in password rules
- [ ] Passphrase-length passwords are accepted
- [ ] Bcrypt handles long passwords correctly
- [ ] Users have the option to use passphrases
- [ ] No arbitrary length restrictions on passwords

### Related Rules

- Never Impose Arbitrary Maximum Password Length (05-rules.md)

### Related Skills

- Implement Secure Password Validation Rules (06-skills.md)

### Related Decision Trees

- Centralized Defaults vs Per-Form Rules (07-decision-trees.md)
