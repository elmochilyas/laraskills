# Rules: Spatie Passkeys/WebAuthn

## Use Spatie Passkeys for Livewire Projects, Laravel/Passkeys for Other Stacks
---
## Category
Framework Usage
---
## Rule
Choose `spatie/laravel-passkeys` for Livewire-based applications and `laravel/passkeys` for React, Vue, Svelte, or other non-Livewire frontend stacks.
---
## Reason
Spatie's package ships pre-built Livewire components for passkey registration, login, and management. Using it with a non-Livewire stack requires overriding the UI, defeating the package's main advantage. The first-party package is stack-agnostic and pairs with any frontend framework via its npm client.
---
## Bad Example
```php
// Spatie passkeys installed for a React SPA
composer require spatie/laravel-passkeys
// Livewire components are unusable in React
```
---
## Good Example
```php
// Spatie for Livewire
composer require spatie/laravel-passkeys

// Laravel/passkeys for React/Vue/Svelte
composer require laravel/passkeys
npm install @laravel/passkeys
```
---
## Exceptions
No common exceptions — stack match determines package selection.
---
## Consequences Of Violation
Unused Livewire components, extra work to build custom UI.
---

## Maintain Password Fallback Alongside Passkeys
---
## Category
Reliability
---
## Rule
Always offer password-based authentication as a fallback when passkeys are enabled. Passkeys must be additive.
---
## Reason
Not all devices or browsers support WebAuthn. Users on shared devices, older operating systems, or without biometric hardware need an alternative. Removing password fallback creates an accessibility barrier and potential lockout.
---
## Bad Example
```php
// Passkey-only login — no password option
```
---
## Good Example
```php
// Login page offers both passkey AND password login
<livewire:passkeys::authenticate />
<!-- Plus standard email/password form -->
```
---
## Exceptions
Enterprise-managed devices where every device has WebAuthn support.
---
## Consequences Of Violation
User lockout, accessibility issues, support ticket load.
---

## Publish and Customize Livewire Components to Match Design
---
## Category
Maintainability
---
## Rule
Publish Spatie's Livewire components with `vendor:publish --tag=passkeys-views` and customize them to match the application's design system.
---
## Reason
Default components have generic styling. Publishing allows full control over templates, translations, and layout while maintaining the underlying business logic. Customization ensures the passkey UI feels native to the application.
---
## Bad Example
```blade
{{-- Using default components without customization -- generic look --}}
<livewire:passkeys::register />
```
---
## Good Example
```php
php artisan vendor:publish --tag=passkeys-views
// Customize published views in resources/views/vendor/passkeys/
```
---
## Exceptions
When the default component styling matches the design system exactly.
---
## Consequences Of Violation
Generic UI that does not match app design, inconsistent UX.
---

## Configure HTTPS in All Environments for WebAuthn
---
## Category
Architecture
---
## Rule
Ensure the application is served over HTTPS in every environment where passkeys are used, including staging and development.
---
## Reason
WebAuthn requires a secure context. Browsers refuse to perform WebAuthn ceremonies on insecure HTTP origins. HTTP environments break passkey registration and authentication entirely with no workaround.
---
## Bad Example
```bash
APP_URL=http://staging.example.com  # HTTP — WebAuthn unavailable
```
---
## Good Example
```bash
APP_URL=https://staging.example.com  # HTTPS required
```
---
## Exceptions
`localhost` is treated as a secure context by browsers.
---
## Consequences Of Violation
WebAuthn API unavailable, passkey features non-functional.
---

## Set User Verification to Required for Production
---
## Category
Security
---
## Rule
Configure user verification (`uv`) to `required` in the RP settings, ensuring biometric or PIN verification for every passkey ceremony.
---
## Reason
`discouraged` user verification allows passkey authentication with device presence only (no biometric/PIN). This weakens security to "whoever holds the device." `required` ensures the user actively authenticates with fingerprint, face, or PIN.
---
## Bad Example
```php
'user_verification' => 'discouraged', // Presence-only — weaker security
```
---
## Good Example
```php
'user_verification' => 'required', // Biometric or PIN required
```
---
## Exceptions
Applications where low-friction authentication is prioritized over security (e.g., read-only content).
---
## Consequences Of Violation
Unauthenticated device possession grants access, weaker security.
---

## Enable User Verification Requiring Biometric/PIN
---
## Category
Security
---
## Rule
Configure passkey user verification to `required` for production. Biometric or PIN confirmation must be mandatory.
---
## Reason
`discouraged` verification allows passkey authentication with mere device presence, meaning anyone holding the unlocked device can authenticate. `required` forces the user to actively verify with fingerprint, face, or PIN, ensuring the legitimate user is present.
---
## Bad Example
```php
'user_verification' => 'discouraged'
```
---
## Good Example
```php
'user_verification' => 'required'
```
---
## Exceptions
Kiosk or demo applications where frictionless access is the priority.
---
## Consequences Of Violation
Device theft grants authentication access.
