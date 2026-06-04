## Always Verify Webhook Signatures in All Environments
---
## Security
---
## Rule
Verify webhook signatures in production, staging, and development environments; never skip verification for any environment or "temporarily" disable it.
---
## Reason
Skipping signature verification in any environment creates testing blind spots; developers may deploy code that doesn't verify signatures because it was never tested with verification enabled.
---
## Bad Example
```php
if (app()->environment('local')) { return true; } // skips verification locally — untested
```
---
## Good Example
```php
// Verify in all environments — consistent behavior
public function isValid(Request $request, WebhookConfig $config): bool {
    try {
        \Stripe\Webhook::constructEvent($request->getContent(), $request->header('Stripe-Signature'), $config->signingSecret);
        return true;
    } catch (\Exception $e) { return false; }
}
```
---
## Exceptions
None — always verify signatures in all environments.
---
## Consequences Of Violation
Verification code untested in development, production deployment may silently skip verification, spoofed webhook injection vulnerability.
## Use Queue-First Processing for All Payment Webhooks
---
## Architecture
---
## Rule
Respond with HTTP 200 immediately on receiving payment webhooks; dispatch processing to a queue asynchronously.
---
## Reason
Payment webhooks trigger complex processing (ledger updates, notifications, reconciliation); synchronous processing holds the HTTP connection and risks timeout and provider retries.
---
## Bad Example
```php
public function handleWebhook(Request $request) {
    $this->processPayment($request->all()); // synchronous — risks timeout
    return response('OK', 200);
}
```
---
## Good Example
```php
public function handleWebhook(Request $request) {
    $entry = WebhookEntry::create(['payload' => $request->getContent()]);
    ProcessPaymentWebhook::dispatch($entry)->onQueue('payments'); // async
    return response('OK', 200); // fast response
}
```
---
## Exceptions
Simple webhooks requiring no processing beyond validation.
---
## Consequences Of Violation
HTTP timeout on complex processing, duplicate events on provider retry, slow response to provider, potential rate limiting.
## Implement Per-Provider Circuit Breakers in Aggregator
---
## Architecture
---
## Rule
Create separate circuit breaker instances per provider in multi-gateway integrations; never use a single global breaker.
---
## Reason
A global breaker treats all providers as one; one provider's failure blocks all payment processing even when other providers are healthy.
---
## Bad Example
```php
// Single global breaker — Stripe failure blocks PayPal too
```
---
## Good Example
```php
class PaymentRouter {
    private array $breakers = [];
    public function charge(PaymentRequest $request): PaymentResponse {
        foreach (config('payments.providers') as $name => $config) {
            if ($this->getBreaker($name)->isOpen()) { continue; } // per-provider
            try { return $this->providers[$name]->charge($request); }
            catch (ProviderException $e) { $this->getBreaker($name)->reportFailure(); }
        }
        throw new AllProvidersUnavailableException();
    }
}
```
---
## Exceptions
Single-provider systems.
---
## Consequences Of Violation
One provider's failure blocks all payment processing, defeating the purpose of multi-gateway redundancy.
## Encrypt All OAuth2 Tokens at Rest
---
## Security
---
## Rule
Encrypt OAuth2 tokens using Laravel's `encrypt()` before storing in the database; decrypt only for the current request's tenant.
---
## Reason
OAuth2 tokens grant API access; plaintext storage exposes them in database breaches, backups, and logs.
---
## Bad Example
```php
IntegrationToken::create(['token' => $plainToken]); // plaintext — exposed in DB breach
```
---
## Good Example
```php
IntegrationToken::create(['token' => encrypt($plainToken)]); // encrypted
// Decrypt only when needed:
$token = decrypt($integration->token);
```
---
## Exceptions
None — always encrypt OAuth2 tokens at rest.
---
## Consequences Of Violation
Credential exposure in database breach, compliance violations (GDPR, HIPAA), unauthorized API access.
## Store Original Webhook Payload for Replay
---
## Reliability
---
## Rule
Persist the raw webhook payload in the database on receipt for replay capability and reconciliation.
---
## Reason
Without stored payloads, failed webhooks cannot be replayed and reconciliation audit trail is incomplete.
---
## Bad Example
```php
// Processes webhook without storing — lost on failure
```
---
## Good Example
```php
$entry = WebhookEntry::create([
    'provider' => 'stripe',
    'event_id' => $eventId,
    'raw_payload' => $request->getContent(),
    'status' => 'pending',
]);
ProcessWebhook::dispatch($entry);
```
---
## Exceptions
Non-critical webhooks where loss is acceptable.
---
## Consequences Of Violation
Permanent data loss on processing failure, inability to replay events, incomplete audit trail.
## Use Per-Tenant Webhook URL Routing for SaaS
---
## Architecture
---
## Rule
Route incoming webhooks by tenant-specific URLs (subdomain or path prefix) for multi-tenant SaaS integrations.
---
## Reason
Per-tenant routing enables tenant-isolated secret management, rate limiting, and processing without tenant-scoping logic in the handler.
---
## Bad Example
```php
// Single webhook URL — must determine tenant from payload
```
---
## Good Example
```php
// Tenant-scoped URL: https://acme.app.com/webhooks/stripe/acme_tenant
// Middleware resolves tenant from URL before webhook reaches handler
Route::post('/webhooks/{provider}/{tenant}', [WebhookController::class, 'handle']);
```
---
## Exceptions
Single-tenant applications.
---
## Consequences Of Violation
Tenant determination logic duplicated across handlers, risk of cross-tenant data access, tenant-scoped rate limiting impossible.
## Configure Dead-Letter Queue for Failed Processing
---
## Reliability
---
## Rule
Move webhooks to a dead-letter state after exhausting processing retries for manual review.
---
## Reason
Some webhooks permanently fail (invalid payload, business logic errors); dead-letter prevents infinite retry and enables operator recovery.
---
## Bad Example
```php
// Infinite retry on all failures — queue clogs forever
```
---
## Good Example
```php
class ProcessWebhook implements ShouldQueue {
    public int $maxAttempts = 5;
    public function failed(\Throwable $e, WebhookEntry $entry): void {
        $entry->update(['status' => 'dead_letter', 'error' => $e->getMessage()]);
        Log::error('Webhook permanently failed', ['entry_id' => $entry->id]);
    }
}
```
---
## Exceptions
Non-critical webhooks where silent failure is acceptable.
---
## Consequences Of Violation
Infinite retry loops, queue clogged with failing jobs, no operator visibility into permanently failing events.
## Rate Limit All Webhook Receiving Endpoints
---
## Security
---
## Rule
Apply rate limiting to all incoming webhook endpoints per provider and per tenant.
---
## Reason
Without rate limiting, webhook replay attacks, accidental duplicate storms, or misconfigured providers can overwhelm the receiver.
---
## Bad Example
```php
Route::post('/webhooks/stripe', [WebhookController::class, 'stripe']); // no rate limit
```
---
## Good Example
```php
Route::post('/webhooks/stripe', [WebhookController::class, 'stripe'])
    ->middleware('throttle:60,1'); // 60 requests per minute per IP
```
---
## Exceptions
None — always rate limit webhook endpoints.
---
## Consequences Of Violation
Replay attack overwhelms receiver, duplicate storm causes data corruption, provider retry amplification.
