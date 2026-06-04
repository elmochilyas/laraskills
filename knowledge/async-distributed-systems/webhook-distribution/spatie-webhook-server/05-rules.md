# Rule Card: K066 — Spatie Webhook Server

---

## Rule 1

**Rule Name:** validate-webhook-secret-on-receive

**Category:** Always

**Rule:** Always validate the webhook signature on every incoming request.

**Reason:** Without signature validation, any client can send fake webhooks.

**Bad Example:**
```php
// No signature validation — any POST to /webhooks is accepted
```

**Good Example:**
```php
// In the webhook handler:
$signature = $request->header('Signature');
$computed = hash_hmac('sha256', $request->getContent(), $webhook->secret);
if (!hash_equals($computed, $signature)) {
    abort(401, 'Invalid signature');
}
```

**Exceptions:** Webhooks from trusted networks (VPC-internal) can skip validation.

**Consequences Of ViolATION:** An attacker sends a POST to `/webhooks/orders` with a fake "order.paid" payload — the application marks order 123 as paid, and the customer gets the product without paying.

---

## Rule 2

**Rule Name:** store-webhook-secrets-securely

**Category:** Always

**Rule:** Always store webhook secrets in encrypted env vars or a secret manager.

**Reason:** Webhook secrets in source code or plaintext config are a security exposure.

**Bad Example:**
```php
// config/services.php
'webhooks' => [
    'secret' => 'my-super-secret-key', // Hardcoded in source control
],
```

**Good Example:**
```env
WEBHOOK_SECRET_ORDERS="{{ vault(encrypted) }}"
```
```php
'secret' => env('WEBHOOK_SECRET_ORDERS'),
```

**Exceptions:** Development environments where secrets are shared for convenience.

**Consequences Of ViolATION:** The repo is leaked (employee laptop theft) — the webhook secret is in plaintext in the git history. The attacker can now send forged webhooks indefinitely.

---

## Rule 3

**Rule Name:** process-webhooks-asynchronously

**Category:** Always

**Rule:** Always queue webhook processing — never process in the request handler.

**Reason:** Webhook providers have timeouts (typically 5-30s) — long processing causes retries and duplicate deliveries.

**Bad Example:**
```php
// routes/webhooks.php
Route::post('webhooks/orders', function (Request $request) {
    $this->processOrderPaid($request->all()); // 20-second operation
    // Provider times out at 10s → retries with same webhook
});
```

**Good Example:**
```php
Route::post('webhooks/orders', function (Request $request) {
    ProcessWebhook::dispatch($request->all()); // Returns immediately
    return response()->json(['status' => 'ok'], 200);
});
```

**Exceptions:** Webhook health checks (ping/verification requests) must respond quickly.

**Consequences Of ViolATION:** The webhook provider has a 10-second timeout — the handler takes 20 seconds. The provider retries after 10 seconds, creating a second job for the same event. Both jobs process, causing duplicate side effects.

---

## Rule 4

**Rule Name:** return-200-before-processing

**Category:** Always

**Rule:** Always return HTTP 200 immediately before dispatching the queued job.

**Reason:** The provider must receive 200 before the job completes — slow responses trigger retries.

**Bad Example:**
```php
Route::post('webhooks/orders', function (Request $request) {
    $processed = (new ProcessOrderWebhook())->handle($request->all()); // Wait for result
    return response()->json(['status' => 'ok'], 200); // 200 after processing
});
```

**Good Example:**
```php
Route::post('webhooks/orders', function (Request $request) {
    ProcessWebhook::dispatch($request->all());
    return response()->json(['status' => 'ok'], 200); // Immediate 200
});
```

**Exceptions:** Webhooks that need to return a result to the caller (sync mode).

**Consequences Of ViolATION:** The handler takes 30 seconds — the provider's client times out and retries. The job processes successfully, but the retry processes the same job again, causing duplicate order processing.
