# Rules: First-Party Passkeys/WebAuthn

## Maintain Password Fallback Alongside Passkeys
---
## Category
Reliability
---
## Rule
Always offer password-based authentication as a fallback when passkeys are enabled. Passkeys must be additive, not a replacement.
---
## Reason
Not all users have WebAuthn-capable devices or browsers. Passkeys require biometric sensors, platform support, and HTTPS. Users on shared devices, older browsers, or without biometric hardware need an alternative. Removing password fallback creates an accessibility barrier and potential lockout.
---
## Bad Example
```php
// Passkey-only authentication — no password login option
```
---
## Good Example
```php
// Login page offers both: password login AND passkey authentication
// User can choose either method
```
---
## Exceptions
Enterprise-managed devices where every device is guaranteed to support WebAuthn.
---
## Consequences Of Violation
User lockout, accessibility violation, support tickets.
---

## Pin Exact Version of laravel/passkeys
---
## Category
Reliability
---
## Rule
Pin the exact version of `laravel/passkeys` in `composer.json` since the package is pre-1.0 (v0.2.x) and may introduce breaking changes.
---
## Reason
Pre-1.0 packages follow semver where minor versions may include breaking API changes. Pinning the exact version prevents unexpected breakage on `composer update` and ensures the application code matches the installed package API.
---
## Bad Example
```json
"require": {
    "laravel/passkeys": "^0.2"
}
```
---
## Good Example
```json
"require": {
    "laravel/passkeys": "0.2.5" // Exact version pinned
}
```
---
## Exceptions
No common exceptions — pre-1.0 requires exact pinning.
---
## Consequences Of Violation
Breaking changes on composer update, ceremony failures.
---

## Use the Official npm Client for Browser Ceremonies
---
## Category
Framework Usage
---
## Rule
Use `@laravel/passkeys` npm package for browser-side WebAuthn API calls. Do not implement `navigator.credentials.create()` or `navigator.credentials.get()` manually.
---
## Reason
WebAuthn ceremony logic (challenge handling, credential creation, assertion verification) is complex and error-prone. The official npm package abstracts browser API differences, handles edge cases, and stays updated with browser specification changes. Manual implementation risks protocol bugs and security vulnerabilities.
---
## Bad Example
```javascript
// Manual WebAuthn ceremony — error-prone
const credential = await navigator.credentials.create({ publicKey: { ... } });
```
---
## Good Example
```javascript
import { create } from '@laravel/passkeys';
const credential = await create({ username: user.email });
```
---
## Exceptions
When using an alternative WebAuthn library like `@simplewebauthn/browser`.
---
## Consequences Of Violation
Ceremony failures, browser compatibility bugs, security vulnerabilities.
---

## Configure RP ID as Domain Without Port or Path
---
## Category
Architecture
---
## Rule
Set the Relying Party ID (`rp.id`) to the effective domain only — no port number, no path, no protocol.
---
## Reason
The RP ID determines which origins the credential is valid for. Including a port or path causes the WebAuthn ceremony to fail because the browser compares the RP ID against the origin's domain. A misconfigured RP ID prevents registration and authentication entirely.
---
## Bad Example
```php
'rp' => ['id' => 'example.com:3000'], // Port included — invalid
```
---
## Good Example
```php
'rp' => ['id' => 'example.com'], // Domain only — correct
```
---
## Exceptions
No common exceptions — WebAuthn specification mandates domain-only RP ID.
---
## Consequences Of Violation
Ceremony fails, passkeys cannot be registered or used.
---

## Serve HTTPS in All Environments for WebAuthn
---
## Category
Architecture
---
## Rule
Ensure the application is served over HTTPS in all environments where WebAuthn is used, including local development.
---
## Reason
WebAuthn requires a secure context (HTTPS or localhost). Browsers refuse to perform WebAuthn ceremonies on insecure origins. HTTP environments break passkey registration and authentication entirely with no workaround.
---
## Bad Example
```bash
APP_URL=http://localhost:8000  # HTTP — WebAuthn not available
```
---
## Good Example
```bash
APP_URL=https://localhost:8000  # HTTPS or valid certificate
```
---
## Exceptions
`localhost` is treated as a secure context by browsers — acceptable for development.
---
## Consequences Of Violation
WebAuthn API unavailable, passkey features non-functional.
---

## Monitor Changelog for Pre-1.0 API Changes
---
## Category
Maintainability
---
## Rule
Subscribe to the `laravel/passkeys` release feed and review changelog before upgrading. Test passkey flows after every package update.
---
## Reason
Pre-1.0 APIs are unstable. Breaking changes may alter ceremony behavior, data structures, or configuration format. Unmonitored upgrades can silently break passkey authentication flows without obvious errors.
---
## Bad Example
```bash
composer update laravel/passkeys  # Updated without reviewing changelog
```
---
## Good Example
```bash
# Review https://github.com/laravel/passkeys/releases first
# Run passkey registration + login tests after update
composer update laravel/passkeys
```
---
## Exceptions
No common exceptions — pre-1.0 requires diligence.
---
## Consequences Of Violation
Silent ceremony failures, broken passkey flows, user-facing authentication errors.
---

## Never Send Private Keys to the Server
---
## Category
Security
---
## Rule
Ensure the WebAuthn client-side code never transmits the private key to the server. Only the public key and credential ID are sent during registration.
---
## Reason
The private key never leaves the user's device — this is the fundamental security property of WebAuthn. If the private key is sent to the server, it can be stolen in a server breach, defeating the purpose of passkey authentication entirely.
---
## Bad Example
```javascript
// Never extract and send private key
const credential = await navigator.credentials.create({ publicKey });
socket.send(credential.privateKey); // DANGEROUS
```
---
## Good Example
```javascript
import { create } from '@laravel/passkeys';
// The npm package handles the ceremony correctly — private key never sent
const credential = await create({ username: user.email });
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Private key exposure, complete compromise of passkey authentication.
