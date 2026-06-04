# Spatie Laravel Webhook Client Package — Rules

---

## Define One Profile Class Per External Provider

## Category

Code Organization

## Rule

Create a dedicated webhook profile class for each external webhook provider to control event acceptance filtering.

## Reason

Different providers send different event types with different importance levels. A single profile class forces all providers through identical acceptance logic. Provider-specific profiles enable filtering (accept only `payment_intent.succeeded`, ignore `ping` events), custom validation, and per-provider logging.

## Bad Example

```php
// Single profile for all providers
class EverythingProfile implements WebhookProfile
{
    public function shouldProcess(Request $request, WebhookConfig $config): bool
    {
        return true; // Accepts everything from every provider
    }
}
```

## Good Example

```php
class StripeWebhookProfile implements WebhookProfile
{
    public function shouldProcess(Request $request, WebhookConfig $config): bool
    {
        $event = json_decode($request->getContent(), true);
        return in_array($event['type'] ?? '', [
            'payment_intent.succeeded',
            'charge.refunded',
        ]);
    }
}

class GitHubWebhookProfile implements WebhookProfile
{
    public function shouldProcess(Request $request, WebhookConfig $config): bool
    {
        $event = $request->header('X-GitHub-Event');
        return in_array($event, ['push', 'pull_request.opened']);
    }
}
```

## Exceptions

Providers where every event type must be processed identically.

## Consequences Of Violation

Maintainability: Cannot customize acceptance logic per provider. Performance: Processing unnecessary events wastes resources. Security: Cannot reject specific event types.

---

## Store Signing Secrets in Environment Configuration, Not Code

## Category

Security

## Rule

Load all webhook signing secrets from environment variables or a secrets vault; never hardcode them in configuration files or source code.

## Reason

Hardcoded secrets in config files are committed to version control, accessible to every developer with repository access, and cannot be rotated without a deployment. Environment variables keep secrets out of the codebase and enable per-environment secret values.

## Bad Example

```php
// config/webhook-client.php
'configs' => [
    'stripe' => [
        'signing_secret' => 'whsec_abc123def456', // Hardcoded in code
    ],
];
```

## Good Example

```php
// config/webhook-client.php
'configs' => [
    'stripe' => [
        'signing_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],
];
// .env
STRIPE_WEBHOOK_SECRET=whsec_abc123def456
```

## Exceptions

Ephemeral development environments with non-sensitive test secrets.

## Consequences Of Violation

Security: Secrets exposed in version control. Maintainability: Deployment required for secret rotation. Compliance: Secret management standards violated.

---

## Configure Queue Connection for Async Processing

## Category

Performance

## Rule

Set the `queue_connection` option in each webhook config to ensure webhook processing jobs are dispatched to a queue; never rely on synchronous processing.

## Reason

Without a configured `queue_connection`, `ProcessWebhookJob` runs synchronously in the HTTP request lifecycle. This risks provider timeouts, ties up PHP workers, and prevents job retry on failure. Configuring queue dispatch returns the HTTP response in milliseconds.

## Bad Example

```php
'configs' => [
    'stripe' => [
        // No queue_connection — job runs synchronously
        'process_webhook_job' => ProcessStripeWebhook::class,
    ],
];
```

## Good Example

```php
'configs' => [
    'stripe' => [
        'process_webhook_job' => ProcessStripeWebhook::class,
        'queue_connection' => 'redis', // Or database
    ],
];
```

## Exceptions

Non-production environments where synchronous debugging is desirable. Health check endpoints.

## Consequences Of Violation

Performance: HTTP response waits for processing. Reliability: Processing failure on timeout cannot retry. Scalability: Workers exhaust on slow processing.

---

## Leverage Webhook Model for Audit and Replay

## Category

Maintainability

## Rule

Use the stored `WebhookCall` model as the audit trail for incoming webhooks and as the data source for manual or automated replay.

## Reason

The `WebhookCall` model stores the raw payload, headers, and processing status. This enables post-mortem debugging, retry of failed webhooks without re-fetching from the provider, and compliance audit trails for regulated integrations (PCI, SOC 2).

## Bad Example

```php
// WebhookCall discarded after processing — no audit trail
public function handle(WebhookCall $call): void
{
    $this->process($call->payload);
    $call->delete(); // Loses audit data
}
```

## Good Example

```php
public function handle(WebhookCall $call): void
{
    try {
        $this->process($call->payload);
        $call->update(['status' => 'processed']);
    } catch (\Exception $e) {
        $call->update(['status' => 'failed', 'error' => $e->getMessage()]);
        throw $e;
    }
}
```

## Exceptions

High-volume webhooks (>100K/day) where retaining all payloads creates storage cost pressure. In that case, retain only failed webhooks.

## Consequences Of Violation

Debugging: No payload history for troubleshooting. Reliability: Cannot replay failed webhooks. Compliance: Audit trail missing.

---

## Monitor Failed Webhook Processing

## Category

Observability

## Rule

Track and alert on webhook processing failure rates per provider and overall.

## Reason

Processing failures indicate bugs, downstream API issues, or data format changes. Without monitoring, failures accumulate silently and are only discovered during customer escalation. Per-provider monitoring detects provider-specific issues (e.g., Stripe changed event format) vs systemic issues.

## Bad Example

```php
// No failure tracking
class ProcessStripeWebhook implements ShouldQueue
{
    public function handle(WebhookCall $call): void
    {
        $this->service->handle($call->payload);
        // Exceptions caught by queue, but no alert
    }
}
```

## Good Example

```php
class ProcessStripeWebhook implements ShouldQueue
{
    public function failed(Throwable $e): void
    {
        Metrics::increment('webhook.processing_failed', ['provider' => 'stripe']);
        Notification::route('mail', config('services.webhooks.admin_email'))
            ->notify(new WebhookProcessingFailed($e));
    }
}
```

## Exceptions

No common exceptions.

## Consequences Of Violation

Reliability: Silent processing failures. Debugging: No failure data for incident response. Business: Undetected integration bugs.

---

## Keep Package Updated for Security Patches

## Category

Maintainability

## Rule

Monitor and apply updates to `spatie/laravel-webhook-client` and its dependencies, especially security patches and breaking changes.

## Reason

Webhook handling packages deal with cryptographic verification, request parsing, and sensitive data. Security vulnerabilities in the package or its dependencies (Guzzle, Symfony HTTP client) directly expose webhook endpoints to attack. Stale packages accumulate known CVEs.

## Bad Example

```php
// composer.json — unknown version, never updated
"require": {
    "spatie/laravel-webhook-client": "^2.0"
}
// Running 2.0.0 from 2020 with known issues
```

## Good Example

```php
// Regular dependency review and update
"require": {
    "spatie/laravel-webhook-client": "^3.0"
}
// composer update spatie/laravel-webhook-client — weekly
```

## Exceptions

Legacy applications on unsupported PHP versions where package cannot be updated.

## Consequences Of Violation

Security: Unpatched vulnerabilities exploitable. Reliability: Bugs fixed in later versions persist. Compatibility: Future Laravel upgrades blocked by outdated package.
