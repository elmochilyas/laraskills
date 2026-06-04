# Anti-Patterns: CSRF Token Exchange and Validation

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | CSRF Token Exchange and Validation |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-CS-01 | Missing @csrf in Forms | High | High | Low |
| AP-CS-02 | CSRF Middleware Removed from Web Group | Critical | Low | Low |
| AP-CS-03 | Excessive Route Exclusions | High | Medium | Medium |
| AP-CS-04 | Forgetting Sanctum /sanctum/csrf-cookie | High | Medium | Low |
| AP-CS-05 | No Session Regeneration After Login | Critical | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **CSRF Token in GET URLs**: Token exposed via referrer headers, server logs, and browser history
- **API Routes with CSRF**: Adding VerifyCsrfToken middleware to stateless API routes
- **No Alternative Protection for Excluded Routes**: Webhook exclusions without HMAC or IP allowlist

---

## 1. Missing @csrf in Forms

### Category
Security · High

### Description
Omitting the `@csrf` directive in Blade forms that submit POST, PUT, PATCH, or DELETE requests.

### Why It Happens
Copying form HTML from a previous project that didn't include `@csrf`. Forgetting to add it after creating a new form. The form submission fails with 419, but the error message is not always clear.

### Warning Signs
- Form POST requests return 419 status
- `Page Expired` error after form submission
- No `_token` hidden input in the form HTML
- `@csrf` directive missing from Blade template
- Form copied from non-Laravel or older project

### Why Harmful
Without the CSRF token, Laravel's `VerifyCsrfToken` middleware rejects the request (419). But if the middleware is disabled or removed, the form is vulnerable to CSRF attacks. An attacker can trick an authenticated user into submitting the form from an external site.

### Real-World Consequences
- All forms on a page return 419 — application unusable
- Hours debugging "why does my form submit fail"
- CSRF vulnerability if middleware is disabled

### Preferred Alternative
Always include `@csrf` inside every Blade form tag.

### Refactoring Strategy
1. Add `@csrf` immediately after the `<form>` opening tag
2. Check all Blade templates for missing `@csrf`

### Detection Checklist
- [ ] Does every `<form>` with method POST/PUT/PATCH/DELETE have `@csrf`?
- [ ] Are there forms returning 419?
- [ ] Is `_token` present in the form HTML?
- [ ] Are there forms without `@csrf` in the codebase?

### Related Rules/Skills/Trees
- Include @csrf in Every POST/PUT/PATCH/DELETE Blade Form (05-rules.md)
- Configure CSRF Token Validation for All State-Changing Routes (06-skills.md)
- CSRF Token Source Selection decision tree (07-decision-trees.md)

---

## 2. CSRF Middleware Removed from Web Group

### Category
Security · Critical

### Description
Removing `VerifyCsrfToken` middleware from the `web` middleware group, disabling CSRF protection for all web routes.

### Why It Happens
When faced with persistent 419 errors, the quick-fix approach is to disable CSRF entirely by removing the middleware. This "solves" the symptom while creating a massive security gap.

### Warning Signs
- `VerifyCsrfToken` not present in `$middlewareGroups['web']`
- No CSRF token validation on any web route
- All POST requests succeed without CSRF token
- `Kernel.php` web group has commented out or removed CSRF line
- Previous 419 issues were "fixed" by removing middleware

### Why Harmful
Every state-changing web route becomes vulnerable to CSRF. An attacker can trick any authenticated user into submitting any form in the application without the user's knowledge.

### Real-World Consequences
- Attacker crafts a form that submits a password change — user's account compromised
- Data deletion via forged POST request
- Financial transactions initiated through CSRF
- Compliance violation: critical security control disabled

### Preferred Alternative
Keep `VerifyCsrfToken` in the web group. Fix the underlying 419 issue (missing `@csrf`, wrong token source).

### Refactoring Strategy
1. Restore `VerifyCsrfToken::class` to the web middleware group
2. Fix the root cause of 419 errors

### Detection Checklist
- [ ] Is `VerifyCsrfToken` in the `web` middleware group?
- [ ] Were CSRF issues "solved" by removing middleware?
- [ ] Do POST requests succeed without a CSRF token?
- [ ] Is CSRF protection active on all web routes?

### Related Rules/Skills/Trees
- Verify CSRF Token Middleware Is Present in Kernel (05-rules.md)
- Configure CSRF Token Validation for All State-Changing Routes (06-skills.md)

---

## 3. Excessive Route Exclusions

### Category
Security · High

### Description
Adding too many routes to `VerifyCsrfToken::$except`, including internal application routes that can and should be CSRF-protected.

### Why It Happens
Developers add routes to `$except` as a quick workaround for 419 errors without investigating the root cause. Over time, the `$except` array grows as more routes are excluded for convenience.

### Warning Signs
- `$except` array has more than 3 entries
- Internal application routes (not webhooks) in `$except`
- No documentation explaining why routes are excluded
- Routes added to `$except` as 419 workaround
- Entire controller or namespace excluded

### Why Harmful
Each excluded route is a CSRF attack vector. An attacker who discovers an excluded route can forge requests without needing to steal a CSRF token.

### Real-World Consequences
- Internal route excluded for debugging — left in production
- Support route excluded — attacker uses it to modify user data
- Security audit: "Ten routes excluded from CSRF with no justification"

### Preferred Alternative
Only exclude external webhook routes that cannot provide CSRF tokens.

### Refactoring Strategy
1. Review every route in `$except`
2. Remove routes that can support CSRF
3. Add alternative protection (HMAC, IP allowlist) to remaining webhook exclusions
4. Document remaining exclusions

### Detection Checklist
- [ ] How many routes are in `$except`?
- [ ] Are any internal application routes excluded?
- [ ] Are exclusions documented?
- [ ] Do excluded routes have alternative protection?
- [ ] Can any excluded routes be removed?

### Related Rules/Skills/Trees
- Exclude External Webhooks Only, Not Internal Routes (05-rules.md)
- Configure CSRF Token Validation for All State-Changing Routes (06-skills.md)
- Route Exclusion Strategy decision tree (07-decision-trees.md)

---

## 4. Forgetting Sanctum /sanctum/csrf-cookie

### Category
Architecture · High

### Description
SPA login fails because the frontend doesn't call `/sanctum/csrf-cookie` before making the login request, resulting in a missing CSRF token.

### Why It Happens
Sanctum SPA auth requires this initial call, but it's an extra step. Developers forget to add it to the client-side login flow. The login POST request fails with 419, but the error is not obvious.

### Warning Signs
- SPA login returns 419
- `/sanctum/csrf-cookie` not called before login
- `XSRF-TOKEN` cookie not present in browser
- Login works in Postman (no CSRF) but not in browser
- Axios `withCredentials: true` configured but login fails

### Why Harmful
The SPA cannot authenticate. All state-changing requests fail. The application is unusable for users. The failure mode is a generic 419 or 401 that's hard to distinguish from other auth issues.

### Real-World Consequences
- SPA login broken — users cannot access the application
- Developers spend hours checking CORS config when the issue is the CSRF cookie
- Production incident: SPA users cannot log in after deployment

### Preferred Alternative
Call `/sanctum/csrf-cookie` before every state-changing request, or at least before the login request.

### Refactoring Strategy
1. Add `await axios.get('/sanctum/csrf-cookie');` before login
2. Configure Axios to send cookies: `axios.defaults.withCredentials = true`
3. Verify `XSRF-TOKEN` cookie is set after the call

### Detection Checklist
- [ ] Does the SPA call `/sanctum/csrf-cookie` before login?
- [ ] Is `XSRF-TOKEN` cookie present in the browser?
- [ ] Does login work consistently?
- [ ] Is `withCredentials: true` set on Axios?
- [ ] Do 419 errors occur in the SPA?

### Related Rules/Skills/Trees
- Send X-XSRF-TOKEN Header for All SPA Stateful Requests (05-rules.md)
- Configure CSRF Token Validation for All State-Changing Routes (06-skills.md)
- CSRF Token Source Selection decision tree (07-decision-trees.md)

---

## 5. No Session Regeneration After Login

### Category
Security · Critical

### Description
Failing to call `session()->regenerate()` after login, allowing session fixation attacks.

### Why It Happens
Laravel's built-in auth controllers and Fortify handle session regeneration automatically. But custom authentication logic may omit the `regenerate()` call. Developers may not know about session fixation.

### Warning Signs
- Custom login code without `$request->session()->regenerate()`
- Session ID remains the same before and after login
- Login code uses `Auth::login()` without session regeneration
- No `AuthenticateSession` middleware configured

### Why Harmful
An attacker can set the session ID of their own session, trick the user into authenticating with that session ID, and then use it to access the application as the authenticated user.

### Real-World Consequences
- Attacker sends user a link with a known session ID
- User logs in — the known session ID becomes authenticated
- Attacker uses the same session ID to impersonate the user

### Preferred Alternative
Always call `$request->session()->regenerate()` after successful login.

### Refactoring Strategy
1. Add `$request->session()->regenerate()` after `Auth::attempt()`
2. For custom auth, review all login paths

### Detection Checklist
- [ ] Is `session()->regenerate()` called after login?
- [ ] Does the session ID change after login?
- [ ] Is custom authentication used?
- [ ] Is `AuthenticateSession` middleware active?
- [ ] Are there multiple login entry points?

### Related Rules/Skills/Trees
- Verify CSRF Token Middleware Is Present in Kernel (05-rules.md)
- Configure CSRF Token Validation for All State-Changing Routes (06-skills.md)
