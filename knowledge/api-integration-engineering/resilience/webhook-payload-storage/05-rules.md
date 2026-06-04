## Store Payload Before Validation or Processing
---
## Category
Reliability
---
## Rule
Persist the raw incoming webhook payload to the database before any validation, processing, or business logic execution.
---
## Reason
Storing payload first preserves evidence of what was received, enabling reprocessing if validation rules change or initial processing fails due to bugs.
---
## Bad Example
```php
public function handle(Request $request) {
    $data = $request->validate([...]); // payload not stored — loss if validation fails
    $this->process($data);
}
```
---
## Good Example
```php
public function handle(Request $request) {
    $entry = WebhookEntry::create([
        'provider' => 'stripe',
        'headers' => $request->header(),
        'body' => $request->getContent(),
        'status' => 'pending',
    ]);
    // Now validate and process...
}
```
---
## Exceptions
Non-critical webhooks where reprocessing is never needed.
---
## Consequences Of Violation
Payload loss on processing failure, inability to reprocess after bug fix, no audit trail for compliance.
## Persist Full Headers and Signature with Payload
---
## Category
Security
---
## Rule
Store incoming request headers (including signature) and body as received, not parsed or transformed.
---
## Reason
Signature verification requires the original raw payload; transformed payloads produce incorrect signatures, breaking verification on reprocessing.
---
## Bad Example
```php
WebhookEntry::create(['body' => json_encode($parsedData)]); // re-encoded — may differ from original
```
---
## Good Example
```php
WebhookEntry::create([
    'headers' => json_encode($request->headers->all()),
    'signature' => $request->header('Stripe-Signature'),
    'raw_body' => $request->getContent(), // original JSON string, not parsed
]);
```
---
## Exceptions
None — always store raw payload and headers.
---
## Consequences Of Violation
Signature verification fails on reprocessing, payload integrity cannot be verified, reprocessing rejects legitimate webhooks.
## Implement Idempotency via Unique Constraint on event_id
---
## Category
Reliability
---
## Rule
Add a unique constraint on the webhook event_id column; use DB exception handling for duplicate detection.
---
## Reason
Unique constraints provide atomic duplicate prevention without race conditions; application-level checks have TOT vulnerabilities.
---
## Bad Example
```php
if (WebhookEntry::where('event_id', $eventId)->exists()) { return; } // race condition
```
---
## Good Example
```php
try {
    WebhookEntry::create(['event_id' => $eventId, ...]);
} catch (UniqueConstraintViolationException $e) {
    return response('Duplicate', 200); // already processed
}
```
---
## Exceptions
None — always use DB-level unique constraints for idempotency.
---
## Consequences Of Violation
Duplicate processing under concurrent webhook delivery, double side effects despite idempotency checks.
## Track Processing Status with Enum
---
## Category
Maintainability
---
## Rule
Track each webhook entry's processing status using a defined enum (pending, processing, completed, failed).
---
## Reason
Status tracking enables triage, reprocessing, and monitoring; without it, failed webhooks are invisible and cannot be selectively replayed.
---
## Bad Example
```php
// No status — cannot distinguish completed from failed
```
---
## Good Example
```php
class WebhookEntry extends Model {
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
}
// $entry->status = WebhookEntry::STATUS_FAILED;
```
---
## Exceptions
Non-critical webhooks where retry/failure tracking is unnecessary.
---
## Consequences Of Violation
Failed webhooks invisible to operators, no reprocessing capability, manual audit effort to find and replay failures.
## Implement Scheduled Retention Cleanup
---
## Category
Maintainability
---
## Rule
Run a scheduled job to delete completed webhook entries older than 90 days; never allow unbounded table growth.
---
## Reason
Without retention policy, the webhook payload table grows unbounded, degrading query performance and increasing storage costs.
---
## Bad Example
```php
// No cleanup — table grows forever
```
---
## Good Example
```php
// In console/kernel.php or schedule
$schedule->call(function () {
    WebhookEntry::where('status', 'completed')
        ->where('created_at', '<', now()->subDays(90))
        ->delete();
})->daily();
```
---
## Exceptions
Compliance requirements mandating longer retention periods.
---
## Consequences Of Violation
Table bloat, slow queries on webhook entries, increased storage costs, performance degradation.
## Provide Admin UI or Command for Reprocessing
---
## Category
Maintainability
---
## Rule
Expose an Artisan command and/or admin UI for one-click reprocessing of failed webhook entries.
---
## Reason
Manual database manipulation to replay webhooks is error-prone and slow; a command ensures consistent reprocessing with idempotency checks.
---
## Bad Example
```php
// No reprocessing command — operator must manually re-send via PHP artisan tinker
```
---
## Good Example
```php
Artisan::command('webhooks:reprocess {provider} {--limit=100}', function () {
    WebhookEntry::where('status', 'failed')
        ->where('provider', $this->argument('provider'))
        ->limit($this->option('limit'))
        ->each(fn ($entry) => ProcessWebhook::dispatch($entry));
});
```
---
## Exceptions
Very low-volume integrations where manual reprocessing is acceptable.
---
## Consequences Of Violation
Slow incident recovery, manual errors during reprocessing, no audit trail of replay operations.
