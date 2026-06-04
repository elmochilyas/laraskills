# ECC Anti-Patterns — CSRF Token Handling for Webhook Routes

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 03-webhooks |
| **Knowledge Unit** | CSRF Token Handling for Webhook Routes |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. 419 Silent Failure — Webhook Routes Not Excluded from CSRF
2. Global CSRF Disable — All Routes Vulnerable
3. Individual Path Exclusion Without Route Prefix
4. CSRF Exemption Without Compensating Auth
5. Webhook Routes on `Route::any()` — Expanded Attack Surface

## Repository-Wide Anti-Patterns

- Hidden Configuration
- Premature Optimization

---

## Anti-Pattern 1: 419 Silent Failure — Webhook Routes Not Excluded from CSRF

### Category
Reliability | Security

### Description
Webhook POST routes are not added to the CSRF `$except` array. External providers cannot provide a CSRF token, so every webhook delivery receives a 419 HTTP error. The provider silently drops or retries the event.

### Why It Happens
Developers forget Laravel applies CSRF middleware to all `web.php` routes by default. Webhook testing with tools that bypass CSRF (e.g., Postman with token) doesn't catch the issue.

### Warning Signs
- Webhook providers report 419 errors
- Delivery logs show "419 unknown status"

### Why It Is Harmful
The provider's webhook is silently dropped or retried indefinitely. No error is logged in the application. The business impact is discovered when users complain about missing data.

### Real-World Consequences
A Stripe webhook for `invoice.payment_succeeded` returns 419. Stripe retries 3 times over 3 days, then drops the event. The application never updates the subscription status. Customer is charged but sees "payment failed" in the app. Support tickets escalate.

### Preferred Alternative
Add webhook route paths to `$except` array in `VerifyCsrfToken` middleware.

### Refactoring Strategy
1. Identify all webhook POST routes in `routes/web.php`
2. Add each path or wildcard to `VerifyCsrfToken::$except`
3. Verify with a curl POST without CSRF token

### Related Rules
Always Add Webhook Routes to CSRF Exception List (05-rules.md)

### Related Skills
Exclude Webhook Routes from CSRF Protection (06-skills.md)

---

## Anti-Pattern 2: Global CSRF Disable — All Routes Vulnerable

### Category
Security

### Description
Removing or commenting out `VerifyCsrfToken::class` from the `web` middleware group to fix webhook 419 errors, instead of using targeted exceptions.

### Why It Happens
A developer encounters 419 errors on a webhook route. Debugging leads them to the middleware group. Removing CSRF from the entire group is the fastest fix and appears to work.

### Warning Signs
- `VerifyCsrfToken::class` removed or commented from `web` middleware group
- All `web.php` routes accept POST without token

### Why It Is Harmful
Every form submission, login, and settings change becomes vulnerable to cross-site request forgery. Any third-party site can trick authenticated users into performing actions on your application.

### Real-World Consequences
Global CSRF is disabled. An attacker creates a forum post with an auto-submitting form targeting `POST /admin/users/1/delete`. Any admin viewing the post accidentally deletes the user. All user accounts are at risk.

### Preferred Alternative
Use targeted `$except` entries for webhook routes only.

### Refactoring Strategy
1. Re-enable `VerifyCsrfToken::class` in `web` middleware group
2. Add webhook paths to `$except` array
3. Audit all web routes for CSRF coverage

### Related Rules
Never Disable CSRF Globally (05-rules.md)

---

## Anti-Pattern 3: Individual Path Exclusion Without Route Prefix

### Category
Maintainability | Code Organization

### Description
Adding each webhook route individually to the CSRF `$except` array instead of grouping them under a common prefix and excluding by wildcard.

### Why It Happens
Developers add routes one at a time as new integrations are built. No one refactors to add a prefix.

### Warning Signs
- `$except` array has 5+ individual path entries
- Adding a new webhook route requires updating the CSRF exclusion
- Mixed route naming: `stripe/webhook`, `github-events`, `slack/callback`

### Why It Is Harmful
Every new webhook route requires a CSRF exception update. Forgetting one causes 419 errors in production. The `$except` array becomes a maintenance burden with no pattern.

### Real-World Consequences
A developer adds a new Slack event webhook at `/slack-events` but forgets to add it to `$except`. The integration appears to work in dev (CSRF disabled locally). In production, all Slack events return 419. The team spends 2 hours debugging before finding the missing exception.

### Preferred Alternative
Group all webhook routes under `/webhook/` prefix and exclude with `webhook/*`.

### Refactoring Strategy
1. Move all webhook routes under `Route::prefix('webhook')`
2. Replace individual `$except` entries with `'webhook/*'`
3. Update any external references to webhook URLs

### Related Rules
Use Route Prefix to Group Webhook Endpoints for Targeted Exclusion (05-rules.md)

---

## Anti-Pattern 4: CSRF Exemption Without Compensating Auth

### Category
Security

### Description
Bypassing CSRF protection on webhook routes without adding signature verification or any alternative authentication mechanism.

### Why It Happens
Developers focus on fixing the 419 error and don't realize they've created an unauthenticated endpoint.

### Warning Signs
- Webhook routes in `$except` with no middleware
- No signature verification on webhook controller
- Endpoint accepts POST from any source

### Why It Is Harmful
The webhook endpoint is publicly accessible. Anyone who discovers the URL can POST fake webhook events. Fake payment confirmations, account changes, or data updates are processed as legitimate.

### Preferred Alternative
Add signature verification middleware to all CSRF-exempted webhook routes.

### Refactoring Strategy
1. For each CSRF-exempted route, add signature verification middleware
2. Implement HMAC validation with `hash_equals()`
3. Test that unsigned POSTs return 401

### Related Rules
Implement Compensating Security (Signature Verification) (05-rules.md)

---

## Anti-Pattern 5: Webhook Routes on `Route::any()` — Expanded Attack Surface

### Category
Security

### Description
Defining webhook endpoints with `Route::any()` or `Route::match()` instead of `Route::post()`. The endpoint accepts HTTP methods beyond POST.

### Why It Happens
`Route::any()` is convenient during development. The developer doesn't tighten it before production.

### Warning Signs
- Webhook routes defined with `Route::any()` or `Route::match()`
- Non-POST requests to webhook URLs return 200 instead of 405

### Why It Is Harmful
GET requests to webhook URLs can be triggered via `<img>` tags or link clicks, enabling CSRF-style attacks. PUT and DELETE expand the attack surface further.

### Preferred Alternative
Use `Route::post()` for all webhook endpoints.

### Refactoring Strategy
1. Replace `Route::any()` with `Route::post()`
2. Add separate GET route if provider requires challenge verification
3. Verify non-POST requests return `405 Method Not Allowed`

### Related Rules
Register Webhook Routes as Route::post() Only (05-rules.md)
