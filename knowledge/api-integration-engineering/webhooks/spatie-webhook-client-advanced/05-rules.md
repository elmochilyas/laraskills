# Spatie laravel-webhook-client Configuration and Customization — Rules

---

## Define One WebhookConfig Entry Per Provider

## Category

Code Organization

## Rule

Create a separate `WebhookConfig` entry in `config/webhook-client.php` for every external webhook provider; never combine multiple providers into a single config.

## Reason

Each provider has unique signing secrets, header names, signature algorithms, and processing requirements. A single config forces all providers through the same pipeline, making it impossible to customize validation, profiles, or processing per provider. Isolation also limits blast radius of configuration errors.

## Bad Example

```php
// Single config trying to serve all providers
'configs' => [
    'webhooks' => [
        'signing_secret' => env('SHARED_SECRET'),
        'signature_header_name' => 'Signature',
        'process_webhook_job' => GenericWebhookJob::class,
    ],
];
```

## Good Example

```php
'configs' => [
    'stripe' => [
        'name' => 'stripe',
        'signing_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'signature_header_name' => 'Stripe-Signature',
        'signature_validator' => \App\Webhooks\StripeSignatureValidator::class,
        'webhook_profile' => \App\Webhooks\StripeWebhookProfile::class,
        'process_webhook_job' => \App\Jobs\ProcessStripeWebhook::class,
    ],
    'github' => [
        'name' => 'github',
        'signing_secret' => env('GITHUB_WEBHOOK_SECRET'),
        'signature_header_name' => 'X-Hub-Signature-256',
        'signature_validator' => \Spatie\WebhookClient\SignatureValidator\DefaultSignatureValidator::class,
        'webhook_profile' => \Spatie\WebhookClient\WebhookProfile\ProcessEverythingWebhookProfile::class,
        'process_webhook_job' => \App\Jobs\ProcessGitHubWebhook::class,
    ],
];
```

## Exceptions

Internal development testing with mock providers.

## Consequences Of Violation

Maintainability: Cannot customize per-provider behavior. Security: Shared signing secret across providers. Debugging: Configuration errors affect all providers.

---

## Create a Unique ProcessWebhookJob Per Provider

## Category

Code Organization

## Rule

Generate a dedicated `ProcessWebhookJob` class for each provider's webhook processing logic; never route all providers through a single generic job.

## Reason

Different providers emit different event structures, require different business logic, and need different retry/backoff settings. A single job class becomes a switch statement that violates Open/Closed principle, is hard to test, and risks cross-provider coupling.

## Bad Example

```php
class GenericProcessWebhook implements ShouldQueue
{
    public function handle(WebhookCall $call): void
    {
        match ($call->name) {
            'stripe' => $this->handleStripe($call),
            'github' => $this->handleGitHub($call),
            // Every new provider adds a case
        };
    }
}
```

## Good Example

```php
// Jobs/Integrations/Stripe/ProcessStripeWebhook.php
class ProcessStripeWebhook implements ShouldQueue
{
    public $tries = 5;
    public $backoff = [10, 30, 60, 120, 300];

    public function handle(WebhookCall $call): void
    {
        // Stripe-specific logic
    }
}

// Jobs/Integrations/GitHub/ProcessGitHubWebhook.php
class ProcessGitHubWebhook implements ShouldQueue
{
    public $tries = 3;
    public $backoff = [5, 30, 120];

    public function handle(WebhookCall $call): void
    {
        // GitHub-specific logic
    }
}
```

## Exceptions

Multiple providers with identical processing requirements may share a base class with provider-specific strategy injection.

## Consequences Of Violation

Maintainability: Switch statement grows with each provider. Testing: Cannot test provider logic in isolation. Scalability: Cannot tune retry/backoff per provider.

---

## Configure delete_after_days to Control Database Growth

## Category

Maintainability

## Rule

Set `delete_after_days` to a finite value (30 days recommended) in the webhook-client configuration; never leave it unset or set to null.

## Reason

Each incoming webhook stores raw payload, headers, and metadata. Without a retention limit, the table grows unabated, degrading query performance and increasing storage costs. 30 days is sufficient for most debugging and replay needs.

## Bad Example

```php
// No cleanup — indefinite retention
'delete_after_days' => null,
```

## Good Example

```php
'delete_after_days' => 30,
```

## Exceptions

Compliance requirements (e.g., PCI DSS) that mandate longer retention. Archive to cold storage before automated deletion.

## Consequences Of Violation

Performance: Slow queries on bloated `webhook_calls` table. Storage: Unbounded database growth. Maintainability: Backup times increase.

---

## Implement Provider-Specific SignatureValidator

## Category

Security

## Rule

Create a custom `SignatureValidator` class per provider when the provider uses a non-standard signing scheme; never force all providers through the default HMAC validator.

## Reason

Providers implement signing differently: header name variance, payload canonicalization (Stripe uses the full event JSON, GitHub uses the body bytes), signature versioning (Stripe uses `v1=...`, GitHub uses `sha256=...`). The default validator only handles simple HMAC and will silently accept or reject incorrectly.

## Bad Example

```php
// Using default validator for a provider with custom signing
'stripe' => [
    'signature_validator' => \Spatie\WebhookClient\SignatureValidator\DefaultSignatureValidator::class,
    'signature_header_name' => 'Stripe-Signature',
]
```

## Good Example

```php
'stripe' => [
    'signature_validator' => \App\Webhooks\StripeSignatureValidator::class,
    'signature_header_name' => 'Stripe-Signature',
]

// StripeSignatureValidator
class StripeSignatureValidator implements SignatureValidator
{
    public function isValid(Request $request, WebhookConfig $config): bool
    {
        $signature = $request->header($config->signatureHeaderName);
        // Stripe-specific parsing: timestamp, v1 signature, tolerance check
        // ...
        return hash_equals($expected, $computed);
    }
}
```

## Exceptions

Providers that use standard HMAC-SHA256 with the same header name and payload format as the default validator.

## Consequences Of Violation

Security: Invalid signatures accepted or valid signatures rejected. Reliability: Webhook processing fails silently.

---

## Use Timing-Safe Comparison in All Signature Validators

## Category

Security

## Rule

Use `hash_equals()` for all signature comparison operations in custom validators; never use `==`, `===`, or `strcmp()`.

## Reason

Non-constant-time comparisons are vulnerable to timing attacks. An attacker can determine the correct signature character-by-character by measuring response time differences. `hash_equals()` always takes the same amount of time regardless of how many characters match.

## Bad Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $signature = $request->header($config->signatureHeaderName);
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    return $signature === $expected; // Timing attack vulnerability
}
```

## Good Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $signature = $request->header($config->signatureHeaderName);
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    return hash_equals($expected, $signature);
}
```

## Exceptions

No common exceptions. Timing-safe comparison is mandatory for all cryptographic verification.

## Consequences Of Violation

Security: Timing attack reveals signing secret. Compliance: Cryptographic verification standard violated.

---

## Add Webhook Routes to CSRF Exception List

## Category

Security

## Rule

Add the full path pattern for each webhook route to the `VerifyCsrfToken` middleware `$except` array.

## Reason

External webhook providers cannot obtain or submit Laravel CSRF tokens. Without the exception, every incoming webhook returns a 419 HTTP error and the provider retries indefinitely or silently drops the event.

## Bad Example

```php
// No exception — all webhook routes return 419
protected $except = [];
```

## Good Example

```php
protected $except = [
    'webhook/*',
];
```

## Exceptions

Webhook routes defined in `routes/api.php` (the `api` middleware group does not include CSRF).

## Consequences Of Violation

Reliability: All webhook deliveries fail with 419. Debugging: Hard to distinguish 419 from application errors.
