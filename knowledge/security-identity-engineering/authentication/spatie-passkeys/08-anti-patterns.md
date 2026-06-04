# Anti-Patterns: Spatie Passkeys/WebAuthn

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Spatie Passkeys/WebAuthn |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SP-01 | Wrong Frontend Stack for Spatie Passkeys | High | Medium | High |
| AP-SP-02 | Passkey-Only Auth Without Fallback | Critical | Medium | Medium |
| AP-SP-03 | HTTP Context for WebAuthn | Critical | Medium | Low |
| AP-SP-04 | Discouraged User Verification in Production | High | Medium | Low |
| AP-SP-05 | Default Components Without Customization | Medium | High | Low |

---

## Repository-Wide Anti-Patterns

- **Manual WebAuthn Ceremony Implementation**: Writing raw WebAuthn browser API calls when Spatie handles them
- **Passkey Registration Without User Education**: Adding passkey support without explaining to users what passkeys are
- **Overriding Spatie Backend Logic**: Reimplementing passkey storage and verification instead of using Spatie's provided backend

---

## 1. Wrong Frontend Stack for Spatie Passkeys

### Category
Architecture · Framework Usage

### Description
Installing `spatie/laravel-passkeys` for a project using React, Vue, Svelte, or another non-Livewire frontend stack, where the pre-built Livewire components are unusable and the package's primary benefit is lost.

### Why It Happens
Developers hear "Spatie Passkeys is the most mature Laravel passkey package" without checking that its value proposition is Livewire components. The Composer install is straightforward, and the problem only surfaces when trying to integrate the Livewire components into a non-Livewire frontend.

### Warning Signs
- `spatie/laravel-passkeys` installed but Livewire is not used elsewhere in the project
- Passkey UI hand-built with React/Vue components that duplicate Spatie's backend logic
- `@laravel/passkeys` npm package not present alongside Spatie's Composer package
- Custom JavaScript written to interface with Spatie's backend instead of using provided components

### Why Harmful
The primary advantage of Spatie's package — pre-built, production-tested Livewire components — is wasted. The team must build custom UI that integrates with Spatie's backend, duplicating effort. Meanwhile, the first-party `laravel/passkeys` package provides a proper npm client (`@laravel/passkeys`) designed for non-Livewire stacks. The wrong package choice increases development time and maintenance burden.

### Real-World Consequences
- React team spends 3 days building a passkey UI that Spatie already provides for Livewire
- Livewire must be installed as a dependency just for Spatie passkeys, adding bundle weight
- First-party `laravel/passkeys` with native npm client would have been simpler
- Developer confusion: "Why is this Livewire package in our React project?"

### Preferred Alternative
Use first-party `laravel/passkeys` with `@laravel/passkeys` npm package for React, Vue, or Svelte projects. Use `spatie/laravel-passkeys` only for Livewire-based applications.

### Refactoring Strategy
1. Remove `spatie/laravel-passkeys`: `composer remove spatie/laravel-passkeys`
2. Install first-party passkeys: `composer require laravel/passkeys && npm install @laravel/passkeys`
3. Rebuild passkey registration and authentication UI using the npm client
4. Remove any Livewire dependencies added solely for Spatie passkeys
5. Remove Livewire components from auth views
6. Test passkey flow in the non-Livewire frontend

### Detection Checklist
- [ ] Is the frontend built with Livewire or a different framework?
- [ ] Is `spatie/laravel-passkeys` installed in a non-Livewire project?
- [ ] Is `@laravel/passkeys` npm package present for non-Livewire projects?
- [ ] Are passkey UI components custom-built for a non-Livewire frontend?
- [ ] Is Livewire installed only for the passkey package?

### Related Rules/Skills/Trees
- Use Spatie Passkeys for Livewire Projects, Laravel/Passkeys for Other Stacks (05-rules.md)
- Configure Spatie Passkeys/WebAuthn for Livewire-Based Passwordless Auth (06-skills.md)
- Spatie vs First-Party Passkeys Package decision tree (07-decision-trees.md)
- Livewire Stack Compatibility decision tree (07-decision-trees.md)

---

## 2. Passkey-Only Auth Without Fallback

### Category
Reliability · Critical

### Description
Making passkey authentication the only login method, removing password-based authentication, and locking out users whose devices or browsers do not support WebAuthn.

### Why It Happens
Passkeys are marketed as the future of authentication — phishing-resistant, passwordless, seamless. Enthusiastic developers remove passwords entirely to "modernize" authentication without considering the diversity of user devices, browsers, and accessibility needs.

### Warning Signs
- Login page has only a passkey button — no email/password form
- No password reset flow exists
- User model no longer has a `password` column
- Helpdesk tickets: "I can't log in on my work computer"
- No alternative auth method for users without biometric hardware

### Why Harmful
WebAuthn requires a secure context (HTTPS), a compatible browser, and often biometric hardware. Users on shared workstations, older devices, public computers, or browsers without WebAuthn support cannot authenticate. This creates an accessibility and inclusion failure — a segment of users is permanently locked out.

### Real-World Consequences
- User with an older Android phone cannot log in — no passkey support
- Shared family computer cannot store user-specific passkeys
- User loses access to their passkey-managed device — cannot authenticate on any other device
- Accessibility audit flags passkey-only auth as a barrier for users with biometric disabilities
- Enterprise deployment fails because IT-managed devices have WebAuthn restrictions

### Preferred Alternative
Always offer password-based authentication as a fallback alongside passkeys. Passkeys should be additive, not exclusive.

### Refactoring Strategy
1. Add email/password login form to the login page alongside passkey authentication
2. Add a `password` column to users table (nullable for passkey-only users who later set a password)
3. Implement password reset flow if not present
4. Prompt existing passkey-only users to set a password on next login
5. Ensure all authentication features work with both methods
6. Document device compatibility requirements for passkeys

### Detection Checklist
- [ ] Does the login page offer a password-based alternative?
- [ ] Is there a password reset flow?
- [ ] Can a user without WebAuthn support authenticate?
- [ ] Are there users in the database without a password hash?
- [ ] What happens when a user loses access to their passkey device?

### Related Rules/Skills/Trees
- Maintain Password Fallback Alongside Passkeys (05-rules.md)
- Configure Spatie Passkeys/WebAuthn for Livewire-Based Passwordless Auth (06-skills.md)

---

## 3. HTTP Context for WebAuthn

### Category
Architecture · Critical

### Description
Running the application on HTTP in any environment where passkeys are used, causing browsers to refuse WebAuthn ceremonies and breaking passkey registration and authentication entirely.

### Why It Happens
HTTPS is standard in production but often skipped in staging, development, or internal environments. Developers assume WebAuthn works like any other API call and don't realize that the WebAuthn specification requires a secure context. The error surfaces as a browser console error with no clear Laravel-side exception.

### Warning Signs
- Passkey registration button does nothing when clicked — no browser prompt
- Browser console: "The operation is only supported in a secure context"
- Passkey authentication works in production but not in staging
- `APP_URL` starts with `http://` in staging or development `.env`
- Passkey features are silently non-functional with no server-side error

### Why Harmful
WebAuthn is completely unavailable on HTTP. All passkey features — registration, authentication, management — are non-functional. Users cannot register or use passkeys, and the application silently falls back to password-only auth without the user understanding why. In development and staging, this prevents testing and validation of the passkey flow.

### Real-World Consequences
- QA cannot test passkey authentication in staging — staging is HTTP
- Developer spends hours debugging JavaScript console errors before discovering the HTTPS requirement
- Passkey registration fails silently — users think passkeys are broken
- Staging deployment for passkey feature launch fails QA validation
- Emergency certificate installation required to enable passkey testing

### Preferred Alternative
Configure HTTPS with valid certificates in every environment where passkeys are used. Use `localhost` for local development (treated as secure by browsers).

### Refactoring Strategy
1. Obtain TLS certificates for all environments (LetsEncrypt for staging, self-signed for local if not using localhost)
2. Update `APP_URL` to `https://` in each environment's `.env`
3. Configure the web server to redirect HTTP to HTTPS
4. Update `PASSKEYS_ORIGIN` to match the HTTPS URL
5. Clear config cache after changes
6. Verify WebAuthn ceremonies work in each environment

### Detection Checklist
- [ ] Is `APP_URL` using `https://` in all environments?
- [ ] Is `PASSKEYS_ORIGIN` configured with HTTPS?
- [ ] Does the browser console show secure context errors?
- [ ] Are TLS certificates installed and valid?
- [ ] Does passkey registration trigger a browser native prompt?

### Related Rules/Skills/Trees
- Configure HTTPS in All Environments for WebAuthn (05-rules.md)
- Configure Spatie Passkeys/WebAuthn for Livewire-Based Passwordless Auth (06-skills.md)

---

## 4. Discouraged User Verification in Production

### Category
Security

### Description
Setting `user_verification` to `discouraged` in production, allowing passkey authentication with device presence only — no biometric or PIN confirmation — weakening authentication to "whoever holds the device."

### Why It Happens
`discouraged` verification provides the smoothest user experience — just tap the security key or touch the device. For development and internal tools, this feels adequate. Developers forget to change it to `required` for production, or they prioritize UX over security.

### Warning Signs
- `config/passkeys.php` has `'user_verification' => 'discouraged'` in production
- Passkey authentication works without fingerprint, face scan, or PIN
- A lost or unattended device can authenticate to the application
- No biometric/PIN prompt appears during passkey authentication

### Why Harmful
With `discouraged` verification, the passkey authenticates based on device possession alone. Anyone holding the user's unlocked device — a colleague, family member, or thief — can authenticate as that user. This reduces the security model from "something you have (device) + something you are (biometric)" to "something you have (device)" only.

### Real-World Consequences
- Stolen unlocked phone grants the thief access to the application
- Shared office computer: coworker touches the key and is authenticated as the registered user
- Security audit flags "user verification discouraged" as a finding
- User's device is temporarily borrowed — the borrower can access the application
- Compliance violation for applications requiring two-factor authentication

### Preferred Alternative
Set `user_verification` to `required` in production, ensuring biometric or PIN confirmation for every passkey ceremony.

### Refactoring Strategy
1. Update `config/passkeys.php`: change `'user_verification' => 'discouraged'` to `'user_verification' => 'required'`
2. Clear config cache: `php artisan config:clear`
3. Test that biometric/PIN prompt appears during passkey authentication
4. Verify that authentication fails without biometric/PIN confirmation
5. Document the decision for any future environment-specific overrides

### Detection Checklist
- [ ] What is the `user_verification` setting in production configuration?
- [ ] Does passkey authentication require biometric/PIN or just device presence?
- [ ] Can a stolen/unattended device authenticate?
- [ ] Is there a configuration override for different environments?
- [ ] Does the security audit or compliance requirement specify user verification?

### Related Rules/Skills/Trees
- Enable User Verification Requiring Biometric/PIN (05-rules.md)
- Set User Verification to Required for Production (05-rules.md)
- Configure Spatie Passkeys/WebAuthn for Livewire-Based Passwordless Auth (06-skills.md)

---

## 5. Default Components Without Customization

### Category
Maintainability · User Experience

### Description
Using Spatie Passkeys' default Livewire components directly in production without publishing and customizing them, resulting in a generic UI that does not match the application's design system.

### Why It Happens
The default components work out of the box — they handle registration, authentication, and management. For developers focused on functionality, the generic styling seems acceptable. The customization step (`vendor:publish --tag=passkeys-views`) is an extra command that can be deferred indefinitely.

### Warning Signs
- Passkey registration UI looks noticeably different from the rest of the application
- `<livewire:passkeys::register />` is used directly without publishing views
- No files exist in `resources/views/vendor/passkeys/`
- Passkey management page uses different button styles, fonts, or layout than the rest of the app
- UI feels "off-the-shelf" rather than integrated

### Why Harmful
The passkey UI feels foreign to users — different button styles, different typography, different layout. This erodes trust and makes the feature feel unfinished. For applications with custom design systems, the generic Spatie components look unprofessional and reduce perceived quality.

### Real-World Consequences
- Users notice the passkey management page looks like a different application
- Design team flags the passkey components as not matching the design system
- UX audit shows inconsistency in authentication UI
- Developer must retrofit custom styling later (more work than publishing initially)
- User trust reduced: "If this feature looks unfinished, is it secure?"

### Preferred Alternative
Publish and customize Spatie's Livewire components during initial setup to match the application's design system.

### Refactoring Strategy
1. Publish Spatie's Livewire views: `php artisan vendor:publish --tag=passkeys-views`
2. Customize the published templates in `resources/views/vendor/passkeys/`
3. Update component templates to use the application's CSS classes, layout, and design tokens
4. Add any needed translations to the component text
5. Test the customized components in all supported browsers
6. Update component customization documentation for future developers

### Detection Checklist
- [ ] Are passkey Livewire components published to `resources/views/vendor/passkeys/`?
- [ ] Do the passkey components use the application's CSS framework and design tokens?
- [ ] Does the passkey UI match the rest of the application's visual style?
- [ ] Are there customizations or overrides applied to the default components?
- [ ] Do the components use the application's typography, spacing, and color scheme?

### Related Rules/Skills/Trees
- Publish and Customize Livewire Components to Match Design (05-rules.md)
- Configure Spatie Passkeys/WebAuthn for Livewire-Based Passwordless Auth (06-skills.md)
- Component Customization Depth decision tree (07-decision-trees.md)
