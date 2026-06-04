# Anti-Patterns: Session Configuration (secure, http_only, same_site)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | Session Configuration |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-SC-01 | http_only = false | Critical | Medium | Low |
| AP-SC-02 | File Sessions in Multi-Server Production | High | High | Low |
| AP-SC-03 | same_site = none Without HTTPS | High | Medium | Low |
| AP-SC-04 | No Session Regeneration After Login | Critical | Medium | Low |
| AP-SC-05 | Storing Sensitive Data in Session | High | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **Excessively Long Session Lifetime**: Sessions lasting days or weeks
- **Default Cookie Name**: `laravel_session` conflicts with other apps on same domain
- **Same Session ID Across Applications**: Cookie collision on subdomains

---

## 1. http_only = false

### Category
Security · Critical

### Description
Setting `http_only = false` in session configuration, allowing JavaScript to read the session cookie via `document.cookie`.

### Why It Happens
Legacy applications may have set `http_only = false` for some JavaScript integration that reads the cookie. Inertia or custom JS may need to read the CSRF token from the cookie (though Sanctum's XSRF-TOKEN is separate).

### Warning Signs
- `'http_only' => false` in `config/session.php`
- JavaScript can access `document.cookie` and see the session ID
- `HttpOnly` flag missing on session cookie in browser dev tools
- Custom JS reads Laravel session cookie directly

### Why Harmful
If any XSS vulnerability exists in the application, the attacker can read `document.cookie` and steal the session cookie. The session cookie is the key to the user's authenticated session. With `http_only = true`, JavaScript cannot access it even if XSS is present.

### Real-World Consequences
- XSS vulnerability in comment section — session cookie stolen for every visitor
- Attacker uses stolen session to impersonate users
- Session hijacking: attacker gains full account access

### Preferred Alternative
Set `http_only = true`. Never allow JavaScript access to the session cookie.

### Refactoring Strategy
1. Set `'http_only' => true` in `config/session.php`
2. Remove any JavaScript code that reads the session cookie
3. Use Sanctum's `XSRF-TOKEN` cookie for CSRF (this cookie is intentionally readable)

### Detection Checklist
- [ ] Is `http_only` set to `true`?
- [ ] Can JavaScript read the session cookie?
- [ ] Is there JS code that accesses the session cookie?
- [ ] Is there a legitimate reason for `http_only = false`?
- [ ] Is the XSS attack surface mitigated elsewhere?

### Related Rules/Skills/Trees
- Enable Session HTTP-Only and Secure Flags (05-rules.md)
- Configure Secure Session Settings for Production (06-skills.md)

---

## 2. File Sessions in Multi-Server Production

### Category
Architecture · High

### Description
Using the `file` session driver in a multi-server production environment where session files are not shared across servers.

### Why It Happens
Laravel's default session driver is `file`. Developers may deploy to production without changing the configuration. Works fine on a single server.

### Warning Signs
- `SESSION_DRIVER=file` in production `.env`
- Load balancer distributes traffic across multiple servers
- Users intermittently logged out
- Login works on one request, next request returns 401
- Session data lost between requests when hitting different servers

### Why Harmful
Session data is stored on individual server filesystems. A user authenticated on server A has no session on server B. If the load balancer sends the next request to server B, the user appears unauthenticated.

### Real-World Consequences
- Users randomly logged out (when request hits different server)
- Support tickets: "I keep getting logged out after every other click"
- Cart contents lost between pages
- Authentication failures intermittent and hard to debug

### Preferred Alternative
Use Redis or database session driver in multi-server production.

### Refactoring Strategy
1. Install Redis (preferred) or configure database sessions
2. Set `SESSION_DRIVER=redis` in `.env`
3. Configure Redis connection in `config/database.php`
4. Remove file session driver

### Detection Checklist
- [ ] Is `SESSION_DRIVER=file` in production?
- [ ] Is the application deployed on multiple servers?
- [ ] Are users experiencing intermittent logouts?
- [ ] Is Redis or database session store configured?
- [ ] Are sessions persisting across requests?

### Related Rules/Skills/Trees
- Use Database or Redis Sessions in Production, Never File Sessions (05-rules.md)
- Configure Secure Session Settings for Production (06-skills.md)
- Session Driver Selection decision tree (07-decision-trees.md)

---

## 3. same_site = none Without HTTPS

### Category
Security · High

### Description
Setting `same_site = 'none'` for Sanctum SPA auth while `secure` is `false`, causing modern browsers to reject the cookie.

### Why It Happens
Sanctum SPA configuration examples show `same_site=none`. Developers copy this to their config without ensuring `secure=true`. Modern browsers require `secure=true` (HTTPS) when `same_site=none`.

### Warning Signs
- `'same_site' => 'none'` with `'secure' => false`
- SPA authentication fails silently
- Session cookie not set in the browser
- Browser console shows cookie rejection warnings
- Works in HTTP but not HTTPS

### Why Harmful
The session cookie is not set, so the SPA cannot authenticate. Every request is unauthenticated. The browser rejects the cookie due to the `none` + non-HTTPS combination.

### Real-World Consequences
- SPA cannot log in — all API requests return 401
- Hours debugging CORS and CSRF when the issue is cookie rejection
- Production with HTTPS works, but CI/staging without HTTPS doesn't

### Preferred Alternative
Set `secure=true` when using `same_site=none`. Or use `same_site=lax` for same-domain setups.

### Refactoring Strategy
1. Set `'secure' => env('SESSION_SECURE', true)` in production
2. For local HTTP dev, use `same_site=lax`
3. For Sanctum SPA, ensure both `secure=true` and `same_site=none`

### Detection Checklist
- [ ] Is `same_site=none` with `secure=false`?
- [ ] Is the application on HTTPS?
- [ ] Are session cookies being set in the browser?
- [ ] Does the browser console show cookie warnings?
- [ ] Is `SESSION_SECURE` properly set per environment?

### Related Rules/Skills/Trees
- Enable Session HTTP-Only and Secure Flags (05-rules.md)
- Configure Secure Session Settings for Production (06-skills.md)
- same_site Cookie Attribute decision tree (07-decision-trees.md)

---

## 4. No Session Regeneration After Login

### Category
Security · Critical

### Description
Failing to call `session()->regenerate()` after user login, leaving the application vulnerable to session fixation attacks.

### Why It Happens
Laravel's built-in auth scaffold handles regeneration. But custom login code may omit it. Developers may not be aware of session fixation.

### Warning Signs
- Session ID is the same before and after login
- Custom login controller without `regenerate()` call
- `Auth::attempt()` followed by redirect without regeneration
- No `AuthenticateSession` middleware

### Why Harmful
An attacker can set a known session ID before the user logs in. If the session ID is not regenerated, the attacker can use the same session ID after login to access the authenticated session.

### Real-World Consequences
- Attacker sends phishing link with known session ID
- User logs in — session ID remains the same
- Attacker uses the session ID to access the user's account

### Preferred Alternative
Always call `$request->session()->regenerate()` after login.

### Refactoring Strategy
1. Add `$request->session()->regenerate()` after `Auth::attempt()`
2. Ensure all login paths (including socialite/OAuth) regenerate

### Detection Checklist
- [ ] Is `session()->regenerate()` called after login?
- [ ] Does the session ID change after login?
- [ ] Are there custom login paths not covered?
- [ ] Does the application use Remember Me tokens?

### Related Rules/Skills/Trees
- Rotate Session ID on Login and Privilege Escalation (05-rules.md)
- Configure Secure Session Settings for Production (06-skills.md)

---

## 5. Storing Sensitive Data in Session

### Category
Security · High

### Description
Storing sensitive data (passwords, API keys, credit card numbers, PII) directly in the session data instead of storing identifiers.

### Why It Happens
Convenience — storing the API key in the session so it's available on subsequent requests. The session data is serialized and stored in files, database, or Redis. If any of these stores is compromised, the sensitive data is exposed.

### Warning Signs
- `session(['api_key' => $key])` or `session(['credit_card' => $cc])`
- Storing raw secrets in session arrays
- Session data contains PII or credentials
- Session database table has encrypted values? No — they're plaintext

### Why Harmful
Session data is not encrypted by default. A database compromise exposes all session data. A filesystem compromise on file sessions exposes all active sessions. The session driver's storage mechanism is not designed for sensitive data.

### Real-World Consequences
- Server compromised — all session files contain API keys
- Database backup contains plaintext credit card numbers from sessions
- Compliance violation (PCI DSS): cardholder data in session storage

### Preferred Alternative
Store only identifiers (user ID). Fetch sensitive data from secure storage when needed.

### Refactoring Strategy
1. Replace session-stored sensitive data with identifiers
2. Fetch sensitive data from encrypted storage or vault
3. If unavoidable, use encrypted session driver

### Detection Checklist
- [ ] Are API keys, passwords, or PII stored in sessions?
- [ ] Are only identifiers stored in session data?
- [ ] Is the session driver encrypted if storing sensitive data?
- [ ] Are session storage mechanisms audited?
- [ ] Is there a policy against storing sensitive data in sessions?

### Related Rules/Skills/Trees
- Never Store Sensitive Data Directly in Session (05-rules.md)
- Configure Secure Session Settings for Production (06-skills.md)
