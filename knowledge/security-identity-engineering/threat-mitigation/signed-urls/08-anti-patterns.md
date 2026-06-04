# Anti-Patterns: Signed URLs and Signed Routes

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Signed URLs |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-SU-01 | Permanent Signed URL for Sensitive Actions | Critical | Medium | Low |
| AP-SU-02 | Missing signed Middleware | Critical | Medium | Low |
| AP-SU-03 | Sensitive Data in URL Parameters | High | High | Medium |
| AP-SU-04 | No Signature Validation Logging | Medium | High | Low |
| AP-SU-05 | No Single-Use Tracking | Medium | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **No Expiry on Temporary URLs**: `temporarySignedRoute` with `addYears(1)` is effectively permanent
- **No Friendly Error for Invalid Signatures**: Users see generic 403, no recovery option
- **APP_KEY Rotation Breaks All Signed URLs**: No migration plan for existing signed URLs

---

## 1. Permanent Signed URL for Sensitive Actions

### Category
Security · Critical

### Description
Using `URL::signedRoute()` (permanent, no expiry) for sensitive actions like password reset, email verification, or file downloads.

### Why It Happens
Developers use `signedRoute()` out of habit or convenience, without considering whether the link should expire.

### Warning Signs
- `URL::signedRoute()` used for password reset, email verification, or downloads
- Signed URLs have no `expires` parameter in the query string
- Link can be used indefinitely after interception

### Why Harmful
A permanent signed URL that is intercepted (forwarded email, stored in log file, leaked) can be used forever. For sensitive actions like password reset, this means an attacker can reset a user's password at any time in the future.

### Real-World Consequences
- Password reset email forwarded — anyone with the link can reset password
- Signed URL stored in browser history — accessible to other browser users
- Download link in email — intercepted, file accessible forever

### Preferred Alternative
Use `URL::temporarySignedRoute()` with an appropriate expiry.

### Refactoring Strategy
1. Replace `URL::signedRoute()` with `URL::temporarySignedRoute()`
2. Set expiry: `now()->addMinutes(60)` for verification, `now()->addHours(24)` for downloads

### Detection Checklist
- [ ] Are sensitive actions using permanent signed URLs?
- [ ] Do signed URLs have an expiration?
- [ ] Could an intercepted link be used indefinitely?
- [ ] Is there a use case for permanent signed URLs?

### Related Rules/Skills/Trees
- Set the Shortest Practical Expiration for Temporary Signed URLs (05-rules.md)
- Generate and Verify Signed URLs for Tamper-Proof Links (06-skills.md)
- Permanent vs Temporary Signed URL decision tree (07-decision-trees.md)

---

## 2. Missing signed Middleware

### Category
Security · Critical

### Description
Generating signed URLs for a route but not applying the `signed` middleware to verify the signature on incoming requests.

### Why It Happens
Developers generate the signed URL correctly but forget to add `->middleware('signed')` to the route definition. The URL has a signature parameter, but the route accepts requests without validating it.

### Warning Signs
- Route does not have `signed` middleware
- `URL::signedRoute()` used but route middleware is missing
- Removing `?signature=...` from the URL still works
- Route accepts requests without valid signature

### Why Harmful
Anyone can access the route by simply omitting or manipulating the signature parameter. The signed URL provides zero protection — it's a signed URL that doesn't validate signatures.

### Real-World Consequences
- Password reset route accessible without valid signature
- Anyone can unsubscribe any user by guessing the route pattern
- Download link without signature — anyone can access

### Preferred Alternative
Always apply `signed` middleware to routes that receive signed URLs.

### Refactoring Strategy
1. Add `->middleware('signed')` to all signed URL routes
2. Verify that unsigned requests are rejected

### Detection Checklist
- [ ] Does the route have `signed` middleware?
- [ ] Can the route be accessed without a valid signature?
- [ ] Is signature validation enforced?
- [ ] Are all signed URL routes protected?

### Related Rules/Skills/Trees
- Validate Signed URLs in the Controller or Middleware (05-rules.md)
- Generate and Verify Signed URLs for Tamper-Proof Links (06-skills.md)
- Validation Location decision tree (07-decision-trees.md)

---

## 3. Sensitive Data in URL Parameters

### Category
Security · High

### Description
Including sensitive data (user IDs, tokens, secrets) in signed URL parameters, which are visible in browser history, server logs, and referrer headers.

### Why It Happens
The natural approach is to include the user ID or email in the signed URL: `URL::signedRoute('verify-email', ['user' => 123])`. The parameter is part of the URL and is included in the signature.

### Warning Signs
- User IDs, email addresses, or tokens in signed URL parameters
- Signed URLs contain PII in query parameters
- URLs are logged in server access logs with sensitive parameters
- Browser history contains sensitive data in URLs

### Why Harmful
URLs are logged by web servers, proxies, and analytics tools. Browser history stores the full URL including parameters. Referrer headers may leak the URL to third-party sites. Even with signature protection, the parameter values are visible.

### Real-World Consequences
- User ID 123 in signed URL — easily enumerable
- Email address in signed URL appears in server logs
- Signed URL shared by user contains their personal data

### Preferred Alternative
Use opaque references (UUIDs, hashed IDs) instead of sensitive data in URL parameters.

### Refactoring Strategy
1. Replace predictable parameters with UUIDs or reference codes
2. Look up the actual data server-side
3. For email, use a hashed version: `hash('sha256', $user->email)`

### Detection Checklist
- [ ] Do signed URLs contain PII or sensitive data?
- [ ] Are user IDs predictable (sequential)?
- [ ] Are parameters visible in server logs?
- [ ] Could referrer headers leak sensitive data?

### Related Rules/Skills/Trees
- Log Signed URL Access for Audit (05-rules.md)
- Generate and Verify Signed URLs for Tamper-Proof Links (06-skills.md)

---

## 4. No Signature Validation Logging

### Category
Security · Medium

### Description
Not logging invalid signed URL attempts, making signature tampering attempts invisible.

### Why It Happens
The `signed` middleware returns a 403 without logging. Developers may not add logging because they assume the middleware handles everything.

### Warning Signs
- `signed` middleware used but no logging
- No monitoring for invalid signature attempts
- Cannot detect if someone is tampering with signed URLs
- No audit trail for signed URL access

### Why Harmful
Repeated invalid signature attempts may indicate an attacker scanning for valid signed URLs or attempting to brute-force the HMAC. Without logging, this probing goes undetected.

### Real-World Consequences
- Attacker probes signed URL patterns — undetected for weeks
- HMAC brute force attempt not logged
- Compliance requirement for audit trails unmet

### Preferred Alternative
Log all signed URL validation attempts, especially failures.

### Refactoring Strategy
1. Override the signed middleware or use manual `hasValidSignature()`
2. Log invalid signature attempts with IP, URL, and timestamp
3. Monitor for repeated failures

### Detection Checklist
- [ ] Are invalid signature attempts logged?
- [ ] Is there monitoring for signature tampering?
- [ ] Can the team detect brute force on signed URLs?
- [ ] Is there an audit trail for signed URL access?

### Related Rules/Skills/Trees
- Log Signed URL Access for Audit (05-rules.md)
- Generate and Verify Signed URLs for Tamper-Proof Links (06-skills.md)

---

## 5. No Single-Use Tracking

### Category
Security · Medium

### Description
Not implementing server-side tracking to prevent replay of signed URLs that should be single-use (password reset, email verification).

### Why It Happens
Signed URLs are cryptographically verifiable but can be replayed until expiration. Developers may assume the HMAC and expiry are sufficient protection.

### Warning Signs
- Password reset link can be used multiple times
- Email verification link can be clicked repeatedly
- No server-side tracking of consumed signed URLs
- Action state not checked before processing

### Why Harmful
An intercepted signed URL for password reset can be used by anyone who has the link. If the user resets their password and the link is still valid, the attacker can also use it to reset the password again.

### Real-World Consequences
- Password reset link intercepted — attacker can reset password multiple times
- Email verification replayed — account verified multiple times (low impact but bad UX)
- Download link shared — usable by anyone before expiration

### Preferred Alternative
Check action state server-side or track consumed URLs.

### Refactoring Strategy
1. For email verification: check `email_verified_at` before processing
2. For password reset: invalidate token after first use
3. For downloads: track consumed tokens in cache/database

### Detection Checklist
- [ ] Can signed URLs be used multiple times?
- [ ] Is there server-side tracking of used URLs?
- [ ] Are action states checked before processing?
- [ ] Could a replayed URL cause harm?

### Related Rules/Skills/Trees
- Invalidate Signed URLs After Single Use When Appropriate (05-rules.md)
- Generate and Verify Signed URLs for Tamper-Proof Links (06-skills.md)
- Single-Use vs Multi-Use Signed URL decision tree (07-decision-trees.md)
