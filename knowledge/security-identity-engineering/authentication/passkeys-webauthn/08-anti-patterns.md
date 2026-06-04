# Anti-Patterns: First-Party Passkeys/WebAuthn

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | First-Party Passkeys/WebAuthn |
| Audience | Architects, Developers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-PK-01 | Passkey-Only Authentication | Critical | Medium | High |
| AP-PK-02 | Unpinned Pre-1.0 Dependency | High | Medium | Low |
| AP-PK-03 | Manual WebAuthn Ceremony Implementation | Critical | Low | High |
| AP-PK-04 | Misconfigured Relying Party | High | Medium | Low |
| AP-PK-05 | HTTP Environment for WebAuthn | Critical | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Private Key Transmission**: Accidentally sending private key material to the server, defeating WebAuthn's security model
- **Missing Browser Compatibility Testing**: Only testing in Chrome while Firefox and Safari have different WebAuthn behaviors
- **No Credential Counter Monitoring**: Ignoring the assertion counter that detects cloned authenticators

---

## 1. Passkey-Only Authentication

### Category
Reliability · Accessibility

### Description
Offering passkeys as the sole authentication method without maintaining a password-based fallback, preventing users without WebAuthn-capable devices from logging in.

### Why It Happens
Enthusiasm for "passwordless future" and the desire to eliminate password management overhead. Teams forget that not all users have biometric-capable devices, modern browsers, or the ability to set up platform passkeys.

### Warning Signs
- Login page only shows passkey authentication option
- No email/password form present on login
- Registration requires passkey setup with no alternative
- Support tickets from users asking how to log in without a passkey

### Why Harmful
Passkeys require WebAuthn-capable devices (Face ID, Touch ID, Windows Hello), modern browsers, and HTTPS. Users on shared computers, older devices, or without biometric hardware cannot authenticate. This creates an accessibility barrier and potential permanent lockout for users who lose device access.

### Real-World Consequences
- User on a shared office computer cannot log in — no personal biometrics available
- Safari user on older macOS has WebAuthn issues — blocked from application
- Guest or kiosk mode users have no passkey to authenticate with
- Accessibility complaint — users with disabilities affecting biometric use cannot log in

### Preferred Alternative
Offer passkeys as an additive authentication method alongside password login. Users choose which method to use on each login.

### Refactoring Strategy
1. Add a password-based login form alongside the passkey option
2. Implement registration flow that works without passkey setup
3. Add a "use password instead" link on the passkey login screen
4. Maintain complete password authentication infrastructure
5. Communicate that passkeys are an optional upgrade, not a requirement

### Detection Checklist
- [ ] Login page offers a password option alongside passkeys
- [ ] Registration works without passkey setup
- [ ] Test login on a device without biometric capabilities
- [ ] Test login in incognito/private browsing mode

### Related Rules/Skills/Trees
- Maintain Password Fallback Alongside Passkeys (05-rules.md)
- Passkeys as Password Replacement vs Additive decision tree (07-decision-trees.md)

---

## 2. Unpinned Pre-1.0 Dependency

### Category
Maintainability · Reliability

### Description
Using a version constraint like `^0.2` for `laravel/passkeys` instead of pinning the exact version, risking breaking changes on `composer update`.

### Why It Happens
Standard Laravel practice is to use `^` constraints for dependencies. Developers apply the same pattern to pre-1.0 packages without realizing that semver allows breaking changes in minor versions before 1.0.

### Warning Signs
- `composer.json` has `"laravel/passkeys": "^0.2"` or `"~0.2"`
- After `composer update`, passkey registration or login starts failing
- No changelog review process before package updates
- CI passes but production passkey flow breaks after deployment

### Why Harmful
Pre-1.0 packages (v0.x) may introduce breaking API changes in any minor version. An automated `composer update` can silently deploy code that changes ceremony behavior, data structures, or configuration format. Passkey flows fail without obvious errors, and debugging is difficult because the root cause is a changed package API.

### Real-World Consequences
- `composer update` upgrades `laravel/passkeys` from 0.2.3 to 0.3.0 with breaking RP config — passkey registration broken
- CI composer installs a newer minor version that requires different ceremony payload format
- New team member runs `composer install` and gets different package version than the team uses
- Rollback required because `composer.lock` was not committed

### Preferred Alternative
Pin the exact version of the package in `composer.json`.

### Refactoring Strategy
1. Set exact version in `composer.json`: `"laravel/passkeys": "0.2.5"`
2. Run `composer update laravel/passkeys` only after reviewing the changelog
3. Add a CI check that warns if the pinned version does not match `composer.lock`
4. Subscribe to the package's release notifications

### Detection Checklist
- [ ] Check `composer.json` for `laravel/passkeys` version constraint
- [ ] Is the constraint exact (no `^`, `~`, or `*`)?
- [ ] Review `composer.lock` for the installed version
- [ ] Have passkey flows been tested after the last `composer update`?

### Related Rules/Skills/Trees
- Pin Exact Version of laravel/passkeys (05-rules.md)
- First-Party vs Spatie Passkeys Package decision tree (07-decision-trees.md)

---

## 3. Manual WebAuthn Ceremony Implementation

### Category
Security · Reliability

### Description
Implementing browser-side WebAuthn `navigator.credentials.create()` and `navigator.credentials.get()` manually instead of using the official `@laravel/passkeys` npm package.

### Why It Happens
Developers confident in browser APIs may implement WebAuthn directly to reduce dependencies. The ceremony API seems straightforward at first glance. Copy-paste of WebAuthn examples from MDN or blog posts.

### Warning Signs
- No `@laravel/passkeys` dependency in `package.json`
- JavaScript code calling `navigator.credentials.create()` or `navigator.credentials.get()` directly
- Custom challenge encoding/decoding logic in frontend code
- WebAuthn errors that differ from documented package behavior

### Why Harmful
WebAuthn ceremony logic involves complex binary encoding (CBOR/ArrayBuffer), platform-specific behavior, and edge cases for different authenticator types (platform vs cross-platform, discoverable vs non-discoverable). The official package abstracts browser differences, handles error cases, and stays current with spec changes. Manual implementation risks subtle protocol bugs that cause ceremony failures or, worse, security vulnerabilities.

### Real-World Consequences
- Registration fails on Safari because of different ArrayBuffer handling
- Login ceremony succeeds but server cannot verify assertion — binary encoding mismatch
- Cross-platform authenticator (USB key) not supported in manual implementation
- Error messages are cryptic browser-level exceptions instead of user-friendly messages

### Preferred Alternative
Use the `@laravel/passkeys` npm package for browser-side WebAuthn calls.

### Refactoring Strategy
1. Install `@laravel/passkeys` npm package
2. Replace manual `navigator.credentials.create/get` calls with package API
3. Remove custom challenge encoding/decoding code
4. Test registration and login in Chrome, Firefox, Safari, Edge
5. Test with different authenticator types (platform biometrics, cross-platform USB)

### Detection Checklist
- [ ] Check `package.json` for `@laravel/passkeys`
- [ ] Search for `navigator.credentials.create` in JavaScript files
- [ ] Verify registration and login in Firefox and Safari (most browser-specific issues)
- [ ] Test with a cross-platform authenticator (e.g., YubiKey)

### Related Rules/Skills/Trees
- Use the Official npm Client for Browser Ceremonies (05-rules.md)
- First-Party vs Spatie Passkeys Package decision tree (07-decision-trees.md)

---

## 4. Misconfigured Relying Party

### Category
Architecture · Reliability

### Description
Setting the Relying Party ID (`rp.id`) with a port number, path, or protocol, causing WebAuthn ceremonies to fail.

### Why It Happens
Developers copy the application URL (which includes protocol and maybe port) into the RP ID configuration. The difference between origin, RP ID, and effective domain is not immediately obvious from the WebAuthn specification.

### Warning Signs
- `rp.id` set to something like `example.com:3000`, `localhost:8000`, or `https://example.com`
- Passkey registration fails with `DOMException: The operation either timed out or was not allowed`
- Browser console shows `InvalidStateError` during registration
- Ceremony works locally but fails in production with different URL

### Why Harmful
The RP ID determines which origins the credential is valid for. The WebAuthn specification requires the RP ID to be an effective domain (no port, no path, no protocol). A misconfigured RP ID causes the browser to reject the ceremony entirely. Users cannot register or use passkeys, making the entire feature non-functional.

### Real-World Consequences
- Passkey registration fails silently — users cannot set up passwordless auth
- Login button does nothing when passkey is selected
- Developer spends hours debugging a ceremony that looks correct in code
- After domain change, all existing passkeys become invalid

### Preferred Alternative
Configure RP ID as the domain only — no port, no path, no protocol.

### Refactoring Strategy
1. Update `config/passkeys.php` to set `rp.id` to the bare domain
2. Ensure `rp.origin` is the full HTTPS origin including protocol and port if non-standard
3. Test registration and login across all environments
4. If RP ID was wrong, existing credentials are scoped to the wrong domain — users must re-register

### Detection Checklist
- [ ] Read `config/passkeys.php` — does `rp.id` contain a port, path, or protocol?
- [ ] Is `rp.origin` a full HTTPS URL?
- [ ] Test passkey registration — does it succeed without errors?
- [ ] Test passkey login after page refresh — does the credential work?

### Related Rules/Skills/Trees
- Configure RP ID as Domain Without Port or Path (05-rules.md)
- User Verification Requirement Level decision tree (07-decision-trees.md)

---

## 5. HTTP Environment for WebAuthn

### Category
Architecture · Critical

### Description
Running the application over HTTP in environments where WebAuthn is expected to work, causing the browser API to be unavailable.

### Why It Happens
Local development often uses HTTP. Teams don't configure HTTPS for development or staging environments. The WebAuthn API requirement for secure contexts is overlooked until the feature is tested in a non-HTTPS environment.

### Warning Signs
- `APP_URL` starts with `http://` in environments where passkeys are tested
- `navigator.credentials` is `undefined` in browser console
- Passkey buttons/links are hidden or show "not available" message
- Development environment cannot test passkey flows

### Why Harmful
WebAuthn requires a secure context (HTTPS or localhost). Browsers refuse to expose the `navigator.credentials` API on insecure origins. There is no workaround — the feature is completely non-functional on HTTP. This blocks development, testing, and debugging of passkey flows.

### Real-World Consequences
- Passkey feature developed in HTTP environment appears broken
- QA cannot test passkey flows in staging environment using HTTP
- Developer commits broken passkey code because it was never tested working
- Production HTTPS works but staging HTTP blocks pre-release testing

### Preferred Alternative
Serve HTTPS in all environments where WebAuthn is used, including development and staging.

### Refactoring Strategy
1. Configure HTTPS for local development (Laravel Herd, Valet, Sail with TLS)
2. Set up staging environment with valid SSL certificate
3. Ensure `APP_URL` uses `https://` in all environments
4. Add a CI check that validates secure context for WebAuthn tests
5. Remove any workarounds that check for HTTPS and hide passkey UI

### Detection Checklist
- [ ] Check `APP_URL` in `.env` files across environments
- [ ] Open browser devtools — is `window.isSecureContext` true?
- [ ] Test passkey in all environments — does `navigator.credentials` exist?
- [ ] Is HTTPS configured for the staging/QA environment?

### Related Rules/Skills/Trees
- Serve HTTPS in All Environments for WebAuthn (05-rules.md)
- Passkeys as Password Replacement vs Additive decision tree (07-decision-trees.md)
