# Anti-Patterns — Receiving Endpoints

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit | Receiving Endpoints |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. CSRF Exception Neglect
2. Synchronous Processing Trap
3. Loose Route Method Allowing
4. Single Endpoint Hub
5. Route Cache Amnesia

---

## 1. CSRF Exception Neglect

### Category
Security

### Description
Defining webhook routes without adding them to the CSRF exception list, causing all incoming webhook requests to fail with 419 HTTP responses.

### Why It Happens
Developers add webhook routes to `routes/web.php` (which has CSRF middleware enabled by default) and forget that webhook providers cannot transmit CSRF tokens. The route works in local testing where CSRF is often disabled, masking the issue.

### Warning Signs
- Webhook provider dashboard shows repeated delivery attempts with 419 responses
- `VerifyCsrfToken` middleware logs show mismatched token errors for webhook URLs
- Provider retry queues grow without any events being processed

### Why Harmful
Every webhook delivery fails silently — no events are ever processed. The provider retries indefinitely based on its retry schedule, consuming network bandwidth and queue space on both sides. The integration appears configured but never actually functions.

### Consequences
- Zero webhook events processed
- Provider retry queues fill indefinitely
- Debugging is difficult because the error occurs in middleware before the controller
- Production incidents when discovered after deployment

### Alternative
Register webhook routes in `routes/api.php` (which uses the `api` middleware group without CSRF), or add exact webhook URL paths to `VerifyCsrfToken::$except` array when using `routes/web.php`.

### Refactoring Strategy
1. Identify all webhook routes in `routes/web.php`
2. Move them to `routes/api.php` or add each exact path to `VerifyCsrfToken::$except`
3. Prefer exact paths (`webhook/stripe`) over wildcards (`webhook/*`)
4. Clear route cache and verify webhook delivery succeeds

### Detection Checklist
- [ ] All webhook routes registered in CSRF-free middleware group or exception list
- [ ] No 419 responses in logs for webhook endpoints
- [ ] Webhook provider dashboard shows successful deliveries

### Related Rules
Always Add Webhook URLs to CSRF Exception

### Related Skills
Create Secure Incoming Webhook Receiving Endpoints

### Related Decision Trees
Route Placement Strategy (web.php vs api.php)

---

## 2. Synchronous Processing Trap

### Category
Reliability

### Description
Performing significant business logic processing synchronously within the webhook HTTP request lifecycle instead of dispatching to a queue, causing slow responses and provider timeouts.

### Why It Happens
Developers treat webhook endpoints like regular API endpoints where the response is sent after all work completes. The synchronous approach is simpler to implement and debug, and the performance impact isn't noticed during development with small payloads.

### Warning Signs
- Webhook response times consistently exceed 5 seconds
- Provider dashboard shows repeated delivery attempts for the same event
- Webhook controller contains database writes, API calls, or file operations
- Response time correlates with payload complexity

### Why Harmful
Most webhook providers timeout after 5-10 seconds and automatically retry. Each retry may restart the same slow processing, creating a thundering herd of duplicate work. The webhook endpoint becomes a scaling bottleneck as payload volume grows.

### Consequences
- Duplicate event processing from provider retries
- Resource exhaustion from concurrent long-running requests
- Poor user experience from delayed event processing
- Queue dispatch benefits (backpressure, retries, monitoring) are lost

### Alternative
Validate the signature and payload synchronously (fast path), dispatch a queued job for business logic processing, and return 200 immediately.

### Refactoring Strategy
1. Extract business logic from webhook controller into a queued job class
2. Replace inline processing with `ProcessWebhook::dispatch($validatedPayload)`
3. Add unique job identifiers for idempotent processing
4. Configure appropriate queue connection for webhook processing throughput

### Detection Checklist
- [ ] Webhook controller returns response within 1 second for validation-only path
- [ ] Business logic processing happens in queued jobs
- [ ] No heavy database writes or API calls in webhook controller
- [ ] Provider dashboard shows no timeout-related retries

### Related Rules
Respond 200 Within 5 Seconds

### Related Skills
Create Secure Incoming Webhook Receiving Endpoints

### Related Decision Trees
Response Strategy (200 Immediate vs Processed Response)

---

## 3. Loose Route Method Allowing

### Category
Security

### Description
Defining webhook endpoints with `Route::any()` or `Route::match()` instead of `Route::post()`, accepting HTTP methods other than POST.

### Why It Happens
Developers use `Route::any()` as a convenience to avoid method mismatches during development. The reasoning is that if the webhook works with any method, there's less to debug. The security implications of accepting GET, PUT, PATCH, and DELETE on a webhook endpoint are not immediately obvious.

### Warning Signs
- Route definition uses `Route::any()` or `Route::match(['get', 'post', 'put', ...])`
- Controller handles multiple HTTP methods for the same webhook logic
- Route listing shows webhook endpoints accepting GET requests

### Why Harmful
Accepting GET requests makes the endpoint vulnerable to CSRF attacks through image tags, link previews, or `<img>` tags. Accepting PUT/DELETE allows unintended state changes through cross-site request forgery. The looser method allowance expands the attack surface unnecessarily.

### Consequences
- CSRF vulnerabilities on GET-accessible webhook endpoints
- Unintended state changes from non-POST requests
- Higher risk of automated scanning tools triggering side effects
- Audit/compliance concerns for idempotency guarantees

### Alternative
Always use `Route::post()` for webhook endpoints. This matches the webhook provider's delivery mechanism and follows the principle of least privilege for HTTP methods.

### Refactoring Strategy
1. Change `Route::any()` or `Route::match()` to `Route::post()` for all webhook routes
2. Update controller method signatures if they accepted other methods
3. Add method checking middleware if fallback behavior for non-POST requests is needed
4. Verify provider delivers via POST and endpoint accepts only POST

### Detection Checklist
- [ ] All webhook routes use `Route::post()` exclusively
- [ ] Non-POST requests to webhook endpoints return 405 Method Not Allowed
- [ ] Route listing confirms no GET/PUT/DELETE on webhook paths

### Related Rules
Use Route::post() Only, Never Route::any()

### Related Skills
Create Secure Incoming Webhook Receiving Endpoints

### Related Decision Trees
Route Placement Strategy (web.php vs api.php)

---

## 4. Single Endpoint Hub

### Category
Architecture

### Description
Using a single webhook endpoint for all providers instead of creating separate routes per provider, routing logic entirely within the controller based on provider identification.

### Why It Happens
A single endpoint seems simpler during initial implementation — one route, one controller, one configuration. As providers are added, the pattern is extended rather than refactored. The convenience of a unified entry point masks the growing coupling.

### Warning Signs
- Single `/webhook` or `/webhook/payload` route handling all providers
- Controller contains a large switch/if-else chain routing by provider name or header
- Adding a new provider requires modifying the existing controller
- Per-provider middleware cannot be applied independently

### Why Harmful
A single endpoint creates a shared failure domain — rate limiting, middleware changes, or misconfiguration for one provider affects all others. The controller grows unbounded as providers are added. Per-provider security configuration (signature verification, IP whitelisting) becomes difficult to maintain independently.

### Consequences
- One provider's high volume can exhaust rate limits for all providers
- Signature verification logic becomes a complex conditional chain
- Adding or removing providers requires modifying shared code
- Testing webhook handling requires provider-specific routing in a monolithic controller

### Alternative
Create separate routes per provider (`/webhook/stripe`, `/webhook/github`, `/webhook/slack`) with per-provider controllers, middleware, and configuration.

### Refactoring Strategy
1. Identify each provider's webhook handling in the monolithic controller
2. Extract each provider's logic into a dedicated controller or invokable class
3. Create separate routes: `Route::post('webhook/{provider}', ...)`
4. Apply provider-specific middleware (rate limiting, IP whitelisting) per route group
5. Configure per-provider signature verification in separate config files

### Detection Checklist
- [ ] Separate route per provider or provider group
- [ ] No shared controller routing logic by provider name
- [ ] Per-provider middleware independently configurable
- [ ] Adding a new provider requires new route + new controller only

### Related Rules
Always Add Webhook URLs to CSRF Exception

### Related Skills
Create Secure Incoming Webhook Receiving Endpoints

### Related Decision Trees
Endpoint Organization Strategy (Single vs Per-Provider Routes)

---

## 5. Route Cache Amnesia

### Category
Maintainability

### Description
Adding or modifying webhook routes without clearing the route cache, resulting in 404 responses on the new endpoints.

### Why It Happens
Route caching is a deployment optimization that is transparent during development (where caching is typically disabled). Developers add webhook routes, deploy to production, and the route cache still contains the old route list. The mismatch isn't immediately obvious because the deployment appears successful.

### Warning Signs
- New webhook routes return 404 immediately after deployment
- `php artisan route:list` shows webhook routes but they don't respond
- Route cache file timestamp predates the deployment
- Deployment script doesn't include `php artisan route:cache`

### Why Harmful
Webhook providers receive 404 responses on endpoints that appear correctly configured. Providers may mark the webhook as disabled after repeated 404 responses, requiring manual re-enabling. The integration appears functional in code review but fails in production.

### Consequences
- Provider disables webhook after repeated 404 responses
- Manual intervention required to re-enable and replay missed events
- Production incidents during deployment windows
- Loss of events during the gap between deployment and cache clearing

### Alternative
Include `php artisan route:cache` in the deployment script after all routes are defined, and verify with `php artisan route:list | grep webhook`.

### Refactoring Strategy
1. Add `php artisan route:cache` to deployment script after code deployment step
2. Add post-deployment verification that webhook routes respond correctly
3. Document route cache clearing in runbook for emergency webhook route changes
4. Consider using `routes/api.php` with route caching disabled for frequently changing webhook routes

### Detection Checklist
- [ ] Deployment script includes `php artisan route:cache`
- [ ] Post-deployment verification tests webhook route responses
- [ ] New webhook routes respond correctly immediately after deployment
- [ ] Route cache cleared when webhook routes are modified

### Related Rules
Clear Route Cache After Adding Webhook Routes

### Related Skills
Create Secure Incoming Webhook Receiving Endpoints

### Related Decision Trees
Route Placement Strategy (web.php vs api.php)
