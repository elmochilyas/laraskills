# Anti-Patterns — CSRF Bypass and Route Configuration for Webhook Endpoints

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit | CSRF Bypass and Route Configuration for Webhook Endpoints |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Global CSRF Disable
2. Promiscuous Wildcard Bypass
3. CSRF Exception Without Route Definition
4. Open Method Webhook Route
5. Web Route Placement

---

## 1. Global CSRF Disable

### Category
Security

### Description
Disabling CSRF protection globally for the entire application by removing or commenting out the `VerifyCsrfToken` middleware from the HTTP kernel, instead of using targeted exceptions for webhook endpoints only.

### Why It Happens
A developer adds a webhook endpoint, encounters a 419 error, and searches for a quick fix. The fastest solution is removing CSRF protection entirely. The webhook works, the fix is deployed, and the global CSRF disable persists. Future developers assume CSRF was intentionally disabled for architectural reasons.

### Warning Signs
- `VerifyCsrfToken::class` commented out or removed from `App\Http\Kernel`
- All POST endpoints work without CSRF tokens
- No CSRF token generation or validation in any form
- Security audit flags complete absence of CSRF protection

### Why Harmful
Global CSRF disable removes protection from every form submission, API endpoint, and state-changing request in the application. An attacker can forge requests on behalf of authenticated users for any action: changing passwords, transferring funds, modifying settings. The webhook convenience fix creates a systemic vulnerability.

### Consequences
- Complete CSRF vulnerability across all routes
- OWASP Top 10 violation (A1: Broken Access Control)
- Compliance failures (PCI DSS, SOC 2, HIPAA)
- Single XSS vulnerability anywhere in the application enables full account takeover

### Alternative
Add only the specific webhook URL paths to the `$except` array in `VerifyCsrfToken`, or place webhook routes in `routes/api.php` which doesn't use CSRF middleware.

### Refactoring Strategy
1. Re-enable `VerifyCsrfToken` middleware in `App\Http\Kernel`
2. Add webhook URL paths to `$except` array in `VerifyCsrfToken`
3. Test that webhook endpoints work without CSRF tokens
4. Test that all other POST endpoints require CSRF tokens
5. Verify CSRF token generation and validation in all forms

### Detection Checklist
- [ ] `VerifyCsrfToken` middleware active in kernel
- [ ] Only webhook URLs in CSRF exception list
- [ ] Non-webhook POST endpoints require CSRF tokens
- [ ] CSRF token generation functional for all state-changing forms

### Related Rules
Never Disable CSRF Globally

### Related Skills
Exclude Incoming Webhook Routes from CSRF Protection

### Related Decision Trees
CSRF Protection Strategy (Route Group vs Middleware Exception)

---

## 2. Promiscuous Wildcard Bypass

### Category
Security

### Description
Using overly broad wildcard patterns in the CSRF exception list (e.g., `webhook*` or `/*`) that match unintended routes and expose them without CSRF protection.

### Why It Happens
Developers use wildcards for convenience when adding multiple webhook routes. The wildcard pattern is written quickly without considering which routes match it. `webhook/*` seems safe until a non-webhook admin route is added under `/webhook/admin/purge-cache`.

### Warning Signs
- CSRF exception list contains `webhook/*`, `/webhook*`, or `/*`
- Non-webhook routes exist under wildcard-matched prefixes
- Security review identifies broad CSRF bypass patterns
- New routes added under matched prefix automatically bypass CSRF

### Why Harmful
A broad wildcard silently exempts any route, existing or future, from CSRF protection. An administrator adding a data-deletion endpoint under `/webhook/admin/purge` doesn't realize it's CSRF-unprotected. The exemption surface grows without review, creating a long-tail security debt.

### Consequences
- Non-webhook routes accidentally exposed
- Future routes automatically bypass CSRF without explicit decision
- Security review scope expanded to all routes under wildcard prefix
- Audit cannot determine which routes were intentionally exempted

### Alternative
Use exact URL paths in the CSRF exception list for all known webhook providers. Reserve wildcards only for genuinely dynamic route sets (multi-tenant) and document the justification.

### Refactoring Strategy
1. Identify all routes currently matching broad wildcard patterns
2. Replace broad wildcard with individual exact paths for known providers
3. Reserve wildcard only for dynamic provider sets with explicit documentation
4. Verify non-webhook routes under the prefix now require CSRF tokens
5. Add monitoring for new routes added under webhook prefix

### Detection Checklist
- [ ] No broad wildcard patterns in CSRF exception list
- [ ] Exact paths used for all known webhook providers
- [ ] Non-webhook routes under webhook prefix require CSRF
- [ ] Wildcard usage, if any, has documented justification

### Related Rules
Prefer Exact URL Exemption Over Wildcards

### Related Skills
Exclude Incoming Webhook Routes from CSRF Protection

### Related Decision Trees
Exception Specificity (Exact Path vs Wildcard)

---

## 3. CSRF Exception Without Route Definition

### Category
Maintainability

### Description
Adding a webhook URL to the CSRF exception list in `VerifyCsrfToken` without actually defining the corresponding route, resulting in a 404 response that wastes debugging time.

### Why It Happens
Deployments often involve multiple steps — configuration changes, route additions, cache clearing. When these steps are performed by different team members or automated scripts, the CSRF exception may be deployed before the route definition. The exception entry exists, but the route doesn't, causing 404 responses that are confusing because CSRF isn't the issue.

### Warning Signs
- Webhook URL added to `VerifyCsrfToken::$except` but route returns 404
- Debugging focuses on CSRF (since it's listed in except) but CSRF is not the issue
- Route cache cleared but route still not found
- Deployment steps executed out of order between CSRF config and route file

### Why Harmful
The symptom (404) points away from the root cause (missing route definition) because the CSRF exception suggests the route is expected. Developers spend time checking middleware, CSRF configuration, and cache rather than verifying the route file. The mismatch between exception list and route file is a sign of deployment process fragility.

### Consequences
- Extended debugging time due to misleading symptom
- Production incidents during staged deployments
- Route definition and CSRF config drift over time
- Trust in deployment process erodes

### Alternative
Keep the route definition and CSRF exception list synchronized. Use a single source of truth for webhook configurations, or organize webhooks in a dedicated route file that is loaded alongside CSRF configuration.

### Refactoring Strategy
1. Verify every URL in `VerifyCsrfToken::$except` has a corresponding route definition
2. Remove orphaned CSRF exceptions without matching routes
3. Consider using `routes/api.php` to avoid CSRF exceptions entirely
4. Add automated check in CI/CD that CSRF exceptions match existing routes
5. Document the dual-configuration requirement in deployment runbook

### Detection Checklist
- [ ] Every CSRF exception URL has a matching route
- [ ] No orphaned CSRF exceptions in `VerifyCsrfToken::$except`
- [ ] CI/CD validates CSRF exceptions against route list
- [ ] Deployment process ensures route definition before CSRF exception

### Related Rules
Always Add Webhook Routes to CSRF Exception List

### Related Skills
Exclude Incoming Webhook Routes from CSRF Protection

### Related Decision Trees
CSRF Protection Strategy (Route Group vs Middleware Exception)

---

## 4. Open Method Webhook Route

### Category
Security

### Description
Defining webhook routes with `Route::any()` instead of `Route::post()`, accepting HTTP methods beyond POST and expanding the attack surface.

### Why It Happens
Developers use `Route::any()` as a convenience to avoid method-related issues during development. The rationale is that if the webhook works with any HTTP method, fewer things can go wrong. The security implications of exposing state-changing logic via GET or other methods are not immediately obvious.

### Warning Signs
- Webhook route defined with `Route::any()`
- Route listing shows webhook endpoints accepting GET, PUT, DELETE
- Webhook controller does not check request method
- GET requests to webhook endpoint trigger business logic

### Why Harmful
GET-accessible webhook endpoints enable CSRF attacks through third-party vectors: an `<img>` tag loading a GET request, a link preview fetching a URL, or a script injection triggering a GET call. PUT and DELETE access enable direct state manipulation through forged requests. The webhook endpoint, designed for external provider POST deliveries, becomes a general-purpose attack surface.

### Consequences
- GET-based CSRF attacks on webhook functionality
- Unintended state changes from non-POST requests
- Automated scanners triggering side effects via various methods
- Audit flags method-permissive routes as security findings

### Alternative
Define all webhook routes with `Route::post()` exclusively. Add a separate GET route only if the provider requires challenge verification.

### Refactoring Strategy
1. Replace `Route::any()` with `Route::post()` for all webhook routes
2. Update controller to handle only POST requests
3. Add middleware to return 405 for non-POST requests as defense in depth
4. Verify provider delivers via POST and endpoint rejects other methods

### Detection Checklist
- [ ] All webhook routes use `Route::post()`
- [ ] Non-POST requests return 405 Method Not Allowed
- [ ] Controller does not handle non-POST methods
- [ ] Route listing confirms POST-only for webhook endpoints

### Related Rules
Define Webhook Routes as Route::post() Only

### Related Skills
Exclude Incoming Webhook Routes from CSRF Protection

### Related Decision Trees
Route Method Restriction (POST-only vs Open Methods)

---

## 5. Web Route Placement

### Category
Architecture

### Description
Placing webhook routes in `routes/web.php` (with CSRF and session middleware) instead of `routes/api.php`, creating unnecessary complexity in CSRF management and session overhead.

### Why It Happens
`routes/web.php` is the default route file in Laravel and the most familiar location for defining routes. Developers naturally add all new routes there without considering middleware implications. The web middleware group's amenities (sessions, CSRF) are seen as harmless extras rather than burdens.

### Warning Signs
- Webhook routes defined in `routes/web.php`
- `VerifyCsrfToken::$except` growing with each webhook provider addition
- Session files accumulating from webhook requests
- Webhook route group has explicit CSRF exception management

### Why Harmful
Each webhook request creates a session file on disk (file-based sessions) or a Redis entry (Redis sessions) even though webhooks have no use for sessions. The CSRF exception list must be maintained separately from route definitions, creating a synchronization burden. The web middleware group's features (CSRF, sessions, cookies) are irrelevant to stateless webhook processing.

### Consequences
- Unnecessary session storage from every webhook request
- CSRF exception list must be manually synchronized with route list
- Session middleware adds ~5-10ms overhead per webhook request
- Cookie handling for webhook responses (unnecessary)

### Alternative
Place webhook routes in `routes/api.php` where the API middleware group excludes CSRF and sessions by default.

### Refactoring Strategy
1. Move all webhook route definitions from `routes/web.php` to `routes/api.php`
2. Remove corresponding entries from `VerifyCsrfToken::$except`
3. Verify webhook endpoints work without CSRF exceptions
4. Verify session store no longer grows from webhook requests
5. Clean up any orphaned CSRF exception entries

### Detection Checklist
- [ ] Webhook routes in `routes/api.php`
- [ ] No CSRF exceptions needed for webhook routes
- [ ] No session files/entries created from webhook requests
- [ ] No session or cookie middleware on webhook responses

### Related Rules
Use API Routes for Webhook Endpoints When Possible

### Related Skills
Exclude Incoming Webhook Routes from CSRF Protection

### Related Decision Trees
CSRF Protection Strategy (Route Group vs Middleware Exception)
