# Anti-Patterns: WebAuthn Ceremonies (Attestation, Assertion)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | WebAuthn Ceremonies (Attestation, Assertion) |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-WC-01 | Manual Ceremony Implementation | Critical | Medium | High |
| AP-WC-02 | Challenge Reuse or Predictability | Critical | Medium | Medium |
| AP-WC-03 | Indefinite Challenge Storage | High | Medium | Low |
| AP-WC-04 | Signature Counter Neglect | High | High | Medium |
| AP-WC-05 | Invalid RP ID Format | High | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Attestation Overuse in Consumer Apps**: Requiring attestation verification (`direct`) for consumer applications where it adds privacy concerns and ceremony failures
- **Missing Origin Validation**: Not validating the WebAuthn origin against the configured RP origin during ceremonies
- **Private Key on Server Side**: Attempting to store or handle the WebAuthn private key server-side

---

## 1. Manual Ceremony Implementation

### Category
Security · Architecture

### Description
Implementing WebAuthn attestation and assertion ceremonies manually instead of using established packages (`laravel/passkeys`, `spatie/laravel-passkeys`, `laragear/webauthn`), introducing cryptographic protocol bugs and security vulnerabilities.

### Why It Happens
WebAuthn's protocol seems approachable at first glance — generate a challenge, call the browser API, verify a signature. Developers underestimate the complexity of the specification. The desire for "full control" or "avoiding dependencies" leads to custom implementations that miss edge cases in origin validation, challenge management, attestation parsing, and browser compatibility.

### Warning Signs
- Custom classes for WebAuthn challenge generation, credential storage, and signature verification
- No Composer package for WebAuthn in `composer.json`
- Directly calling `navigator.credentials.create()` and `navigator.credentials.get()` with custom JavaScript
- Manual CBOR parsing or COSE key decoding in the codebase
- Custom signature verification logic using `openssl_verify` or `sodium_crypto_sign_verify`

### Why Harmful
The WebAuthn specification is hundreds of pages covering cryptographic verification, origin validation, authenticator data parsing, attestation statement verification, and browser compatibility quirks. Existing packages have already solved these problems. Manual implementations routinely miss: proper clientDataJSON verification, authenticator data parsing, counter extraction, origin comparison, challenge binding, RP ID validation, and attestation handling. Each omission creates a security vulnerability.

### Real-World Consequences
- Missing origin validation allows cross-origin credential reuse — authenticator registered for a phishing site can authenticate to the real application
- Incorrect CBOR parsing causes signature verification to pass with crafted data
- Browser compatibility bugs: registration works in Chrome but not Safari
- Security audit reveals "custom WebAuthn implementation with multiple protocol violations"
- Private key material exposed due to incorrect handling

### Preferred Alternative
Use `laravel/passkeys`, `spatie/laravel-passkeys`, or `laragear/webauthn`. These packages handle ceremony logic, cryptographic operations, and browser compatibility. Only implement manually when no package supports custom attestation verification requirements.

### Refactoring Strategy
1. Evaluate existing WebAuthn packages against project requirements
2. Remove manual ceremony implementation code
3. Install the selected package: `composer require laravel/passkeys` (or Spatie/laragear)
4. Configure the package's RP settings
5. Integrate the package's client-side library (`@laravel/passkeys` or package-specific JS)
6. Test attestation and assertion flows in all target browsers
7. Document why a package was chosen over manual implementation

### Detection Checklist
- [ ] Is there a WebAuthn package in `composer.json`?
- [ ] Is the ceremony logic custom-written in controllers or services?
- [ ] Are there custom CBOR/COSE parsing classes?
- [ ] Is `navigator.credentials` called directly with custom verification?
- [ ] Does the code manually verify WebAuthn signatures using cryptographic functions?

### Related Rules/Skills/Trees
- Use Existing WebAuthn Packages Rather Than Manual Ceremony Implementation (05-rules.md)
- Implement WebAuthn Ceremonies for Passwordless Authentication (06-skills.md)
- Package vs Manual Ceremony Implementation decision tree (07-decision-trees.md)

---

## 2. Challenge Reuse or Predictability

### Category
Security · Critical

### Description
Reusing the same WebAuthn challenge across multiple ceremonies or generating predictable challenge values, enabling replay attacks where an attacker can reuse a captured signed response.

### Why It Happens
Challenge generation is easy to get wrong. Developers might use a static string for simplicity, use `mt_rand()` or `time()` instead of cryptographically secure randomness, or cache a challenge for performance. The "it works in testing" mentality prevails because the browser API accepts any challenge format, so the vulnerability is not immediately visible.

### Warning Signs
- Challenge is a hardcoded string like `'test-challenge'` or `'default'`
- Challenge generated with `mt_rand()`, `uniqid()`, `time()`, or `rand()` instead of `random_bytes()`
- Same challenge used for multiple registration or authentication attempts
- Challenge is derived from user input (predictable)
- No verification that the challenge in the response matches the issued challenge

### Why Harmful
If an attacker captures a valid assertion response (signed challenge + authenticator data), and the server reuses the same challenge, the attacker can replay the captured response to authenticate without possessing the private key. This completely bypasses WebAuthn's cryptographic proof of possession. Predictable challenges allow the attacker to pre-compute a valid response.

### Real-World Consequences
- Attacker captures a network packet containing an assertion response — replays it to authenticate as the victim
- Mobile authenticator's signed challenge reused across sessions — replay attack succeeds
- Security penetration test identifies challenge reuse as a critical finding
- Unauthorized access to accounts via replayed WebAuthn assertions
- Compliance audit fails due to "insufficient challenge randomness"

### Preferred Alternative
Generate a new, cryptographically random challenge using `random_bytes(32)` for every single ceremony. Never reuse challenges.

### Refactoring Strategy
1. Replace all challenge generation with `$challenge = random_bytes(32)`
2. Store each challenge with a unique identifier for the specific ceremony
3. After successful verification, immediately remove the challenge from storage
4. Add validation that compares the received challenge against the stored challenge
5. Log and reject any attempt to reuse an already-verified challenge
6. Add a test that verifies challenge uniqueness across ceremonies

### Detection Checklist
- [ ] Are challenges generated with `random_bytes()` or `bin2hex(random_bytes())`?
- [ ] Are non-cryptographic functions (mt_rand, time, uniqid) used for challenge generation?
- [ ] Is the same challenge stored for multiple pending ceremonies?
- [ ] Is the challenge compared against the stored value during verification?
- [ ] Is the challenge removed from storage after successful use?

### Related Rules/Skills/Trees
- Generate Unique, Cryptographically Random Challenges Per Ceremony (05-rules.md)
- Implement WebAuthn Ceremonies for Passwordless Authentication (06-skills.md)

---

## 3. Indefinite Challenge Storage

### Category
Security

### Description
Storing WebAuthn challenges in the session or database without an expiry time, allowing captured challenges to be used for replay attacks long after the original ceremony window.

### Why It Happens
Challenge storage is often an afterthought in WebAuthn implementations. Developers store the challenge in the session to make it available for callback verification, but no expiry is set. The session itself has a lifetime, but the challenge remains valid for the entire session duration — potentially hours or days.

### Warning Signs
- Challenge stored without a `created_at` or `expires_at` timestamp
- No TTL check during challenge verification
- Challenge storage schema has no expiry column
- Old challenge entries accumulate in the database or cache without cleanup
- Challenge accepted even if the user took 30+ minutes to complete the ceremony

### Why Harmful
A captured challenge response can be replayed at any time before the challenge expires. Without an explicit short TTL, the challenge may remain valid for hours or days. This dramatically increases the window of opportunity for replay attacks. Combined with challenge reuse (anti-pattern WC-02), the attacker can authenticate at their leisure.

### Real-World Consequences
- Attacker captures a challenge from server logs — replays it 24 hours later successfully
- Session lifetime of 24 hours means challenges are valid for 24 hours
- Database of challenges grows indefinitely — stale entries never cleaned up
- Re-authentication flow accepts 30-minute-old challenges, enabling delayed replay

### Preferred Alternative
Set a 5-minute maximum TTL on all WebAuthn challenges. Remove the challenge after successful verification or expiry.

### Refactoring Strategy
1. Add an `expires_at` field to challenge storage
2. Set `expires_at` to `now()->addMinutes(5)` when storing each challenge
3. Check expiry during verification — reject expired challenges
4. Add a cleanup job or garbage collection for expired challenges
5. Remove the challenge from storage immediately after successful verification
6. Add monitoring for expired challenge attempts (possible attack indicator)

### Detection Checklist
- [ ] Do stored challenges have an expiry timestamp?
- [ ] Is the expiry checked during challenge verification?
- [ ] Is the TTL 5 minutes or less?
- [ ] Are challenges removed after successful or failed verification?
- [ ] Are stale challenge entries cleaned up periodically?

### Related Rules/Skills/Trees
- Store Challenge Temporarily With Short TTL (05-rules.md)
- Expire Challenges After 5 Minutes (05-rules.md)
- Implement WebAuthn Ceremonies for Passwordless Authentication (06-skills.md)

---

## 4. Signature Counter Neglect

### Category
Security

### Description
Failing to track the WebAuthn authenticator's signature counter across assertions, making it impossible to detect cloned authenticators and allowing unauthorized access with copied key material.

### Why It Happens
The signature counter is an optional part of the WebAuthn specification. Many tutorials skip it. The counter check adds complexity — storing, comparing, and updating on every assertion. Developers may not understand how a cloned authenticator works or may consider the risk too low to justify the implementation effort.

### Warning Signs
- Credential storage schema has no `counter` or `sign_count` column
- Counter is stored but never compared or validated
- Counter comparison uses `!=` instead of checking for increase (`<=`)
- No alerting or logging when counter decreases or stays the same
- Counter tracking code is commented out or marked "TODO"

### Why Harmful
If a user's private key material is extracted from their device (or the device is backed up and restored), the cloned authenticator starts its counter from the original value. Without counter tracking, the cloned authenticator can authenticate indefinitely without detection. The server has no way to distinguish between the legitimate authenticator and the clone.

### Real-World Consequences
- User backs up their device — authenticator key material is copied. Both original and backup can authenticate simultaneously
- Attacker extracts key material from a compromised device — counter starts fresh, no detection
- Security audit identifies "missing signature counter tracking" as a finding
- Compliance violation for applications requiring authenticator cloning detection
- Post-incident analysis finds cloned authenticator was active for months undetected

### Preferred Alternative
Store and verify the signature counter on every assertion. Reject assertions where the counter does not increase. Log and alert on potential cloning events.

### Refactoring Strategy
1. Add a `counter` column to the credential storage table (integer, default 0)
2. On each assertion, extract the counter from the authenticator data
3. Compare: if `$newCounter <= $storedCredential->counter`, reject the assertion
4. Update the stored counter to the new value on successful assertion
5. Log counter anomalies for security monitoring
6. Force re-registration for credentials with suspected cloning

### Detection Checklist
- [ ] Does the credential storage schema include a `counter` column?
- [ ] Is the counter extracted from authenticator data during assertion verification?
- [ ] Is the counter validated to ensure it increased?
- [ ] Are cloning events logged or monitored?
- [ ] Is there a re-registration flow for suspected cloned credentials?

### Related Rules/Skills/Trees
- Track Signature Counter to Detect Cloned Authenticators (05-rules.md)
- Implement WebAuthn Ceremonies for Passwordless Authentication (06-skills.md)

---

## 5. Invalid RP ID Format

### Category
Architecture

### Description
Configuring the WebAuthn Relying Party ID with the wrong format — including protocol (`https://`), port (`:3000`), or path (`/app`) instead of providing the bare effective domain.

### Why It Happens
The RP ID is conceptually the server's identifier, so developers naturally include the full URL they use to access the application. Documentation sometimes shows the bad example inadvertently. The error is confusing because the ceremony partially works — registration may succeed, but assertion fails, or the credential cannot be found.

### Warning Signs
- RP ID configured as `https://example.com` or `https://example.com:443`
- RP ID includes a port number (`example.com:3000`)
- RP ID includes a path (`example.com/app`)
- Credentials can be registered but assertion always fails
- Browser console shows "The operation couldn't be completed" or cross-origin errors
- Multiple credentials registered for the same user but none work for authentication

### Why Harmful
An incorrectly formatted RP ID causes the WebAuthn ceremony to fail at the browser level. The credential is scoped to the incorrect RP ID (e.g., `example.com:3000` instead of `example.com`). When the user tries to authenticate, the browser cannot find any credentials matching the correctly-configured RP ID. The credential registration worked, but the credential is essentially useless.

### Real-World Consequences
- Users register passkeys but cannot use them to log in — every assertion fails
- Developer adds a new credential that "works" but the old ones all fail
- Multiple credentials pile up in the database — none actually usable
- QA reports "WebAuthn login never works" — regression from working registration
- Production incident: all users who registered passkeys during a specific window cannot authenticate
- Hours of debugging the ceremony logic when the actual cause is a configuration string

### Preferred Alternative
Set the RP ID to the exact effective domain only — no protocol, no port, no path.

### Refactoring Strategy
1. Identify all locations where RP ID is configured (config files, environment variables)
2. Strip the protocol, port, and path: `example.com` not `https://example.com:3000/app`
3. For multi-port development setups, use separate RP IDs per port or configure the browser to allow it
4. Keep the origin separate from the RP ID — origin includes the full URL
5. Register a new credential with the corrected RP ID and verify assertion works
6. Clean up any credentials registered with the incorrect RP ID

### Detection Checklist
- [ ] Does the RP ID contain any protocol prefix (`http://`, `https://`)?
- [ ] Does the RP ID include a port number?
- [ ] Does the RP ID include a path?
- [ ] Is the RP ID set to the bare domain (e.g., `example.com`)?
- [ ] Are credentials usable after being registered (can they authenticate)?

### Related Rules/Skills/Trees
- Configure RP ID as Domain Only, No Port or Path (05-rules.md)
- Validate Origin Against RP ID During Both Ceremonies (05-rules.md)
- Implement WebAuthn Ceremonies for Passwordless Authentication (06-skills.md)
