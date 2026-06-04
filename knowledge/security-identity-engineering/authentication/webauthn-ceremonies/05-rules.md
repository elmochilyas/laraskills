# Rules: WebAuthn Ceremonies (Attestation, Assertion)

## Use Existing WebAuthn Packages Rather Than Manual Ceremony Implementation
---
## Category
Architecture
---
## Rule
Use `laravel/passkeys`, `spatie/laravel-passkeys`, or `laragear/webauthn` for WebAuthn ceremony handling. Only implement ceremonies manually when absolute necessity is documented.
---
## Reason
WebAuthn ceremonies involve complex cryptographic operations (challenge generation, signature verification, attestation validation, counter tracking). Existing packages handle edge cases, browser compatibility, and security considerations. Manual implementation is error-prone and introduces security vulnerabilities.
---
## Bad Example
```php
// Manual ceremony implementation — fragile and risky
$challenge = random_bytes(32);
$publicKeyCredential = $request->input('credential');
// Custom verification logic
```
---
## Good Example
```php
// Use established package
$credential = (new WebauthnService())->register($user, $request->all());
```
---
## Exceptions
Enterprise environments requiring custom attestation verification not supported by any package.
---
## Consequences Of Violation
Protocol implementation bugs, security vulnerabilities, browser incompatibility.
---

## Generate Unique, Cryptographically Random Challenges Per Ceremony
---
## Category
Security
---
## Rule
Generate a new, cryptographically random challenge using `random_bytes(32)` for every WebAuthn ceremony. Never reuse or predict challenges.
---
## Reason
If a challenge is reused or predictable, an attacker can pre-compute a response or replay a captured response to authenticate without possessing the private key. Each ceremony must have a unique, unpredictable challenge to prove the authenticator is responding in real-time.
---
## Bad Example
```php
$challenge = 'fixed-challenge-value'; // Predictable — replay attack
```
---
## Good Example
```php
$challenge = random_bytes(32); // Cryptographically random
session(['webauthn_challenge' => base64_encode($challenge)]);
```
---
## Exceptions
No common exceptions — challenge randomness is essential to WebAuthn security.
---
## Consequences Of Violation
Replay attack, authentication bypass.
---

## Expire Challenges After 5 Minutes
---
## Category
Security
---
## Rule
Set a 5-minute expiry on WebAuthn challenges stored in session or temporary storage. Remove or invalidate the challenge after use.
---
## Reason
Old challenges can be captured and used for replay attacks. A 5-minute window gives legitimate users enough time to complete biometric verification while limiting the window for replay. Single-use semantics ensure a captured challenge cannot be reused.
---
## Bad Example
```php
// Challenge stored indefinitely — no expiry
session(['webauthn_challenge' => $challenge]); // Never expired
```
---
## Good Example
```php
session(['webauthn_challenge' => [
    'challenge' => base64_encode($challenge),
    'expires_at' => now()->addMinutes(5),
]]);
```
---
## Exceptions
No common exceptions — challenge expiry is mandatory.
---
## Consequences Of Violation
Replay attack using captured challenge, authentication bypass.
---

## Track Signature Counter to Detect Cloned Authenticators
---
## Category
Security
---
## Rule
Store and verify the authenticator's signature counter on every assertion. If the counter does not increase, flag the authenticator as potentially cloned.
---
## Reason
The signature counter monotonically increases with each authentication. If a cloned authenticator (backup of the key material) is used, the counter may reset or stay the same. Detecting a non-increasing counter indicates the private key material has been copied, requiring re-registration.
---
## Bad Example
```php
// Counter not tracked — cloned authenticator undetected
public function verify($credentialId, $signature) {
    // No counter check
}
```
---
## Good Example
```php
$storedCredential = Passkey::where('credential_id', $credentialId)->first();
$newCounter = $authenticatorData->getSignCount();
if ($newCounter <= $storedCredential->counter) {
    throw new AuthenticationException('Possible cloned authenticator');
}
$storedCredential->increment('counter');
```
---
## Exceptions
Authenticators that do not support counter (rare — most modern ones do).
---
## Consequences Of Violation
Undetected cloned authenticator, unauthorized access with copied key material.
---

## Configure RP ID as Domain Only, No Port or Path
---
## Category
Architecture
---
## Rule
Set the Relying Party ID to the exact effective domain. Never include protocol, port, or path in the RP ID.
---
## Reason
The RP ID determines the scope of the credential. A credential registered for `example.com:3000` would not be valid for `example.com`. The WebAuthn specification requires the RP ID to be the domain without port or path. Incorrect configuration causes ceremony failures.
---
## Bad Example
```php
'rp_id' => 'https://example.com:3000', // Full URL — invalid RP ID
```
---
## Good Example
```php
'rp_id' => 'example.com', // Domain only — correct
```
---
## Exceptions
No common exceptions — WebAuthn RP ID rules are strict.
---
## Consequences Of Violation
Ceremony failures, credentials cannot be registered or used.
---

## Set User Verification to Required for Production
---
## Category
Security
---
## Rule
Configure `userVerification` to `required` in production WebAuthn ceremonies to mandate biometric or PIN confirmation.
---
## Reason
`discouraged` verification allows authentication with device presence only. Anyone who possesses the unlocked device can authenticate. `required` ensures active user verification with fingerprint, face, or PIN.
---
## Bad Example
```php
'userVerification' => 'discouraged', // Presence-only
```
---
## Good Example
```php
'userVerification' => 'required', // Biometric/PIN required
```
---
## Exceptions
Read-only kiosk applications where frictionless access is prioritized.
---
## Consequences Of Violation
Device theft enables authentication without biometric verification.
---

## Enforce HTTPS for All WebAuthn Ceremonies
---
## Category
Architecture
---
## Rule
Serve all pages performing WebAuthn ceremonies over HTTPS. HTTP contexts block the WebAuthn API.
---
## Reason
The browser's WebAuthn API is only available in secure contexts (HTTPS or localhost). HTTP environments prevent `navigator.credentials.create()` and `navigator.credentials.get()` from executing, making passkey registration and login impossible.
---
## Bad Example
```bash
APP_URL=http://example.com  # HTTP — WebAuthn blocked by browser
```
---
## Good Example
```bash
APP_URL=https://example.com  # HTTPS — WebAuthn available
```
---
## Exceptions
`localhost` is considered a secure context for development.
---
## Consequences Of Violation
Ceremony fails, passkey features non-functional.
