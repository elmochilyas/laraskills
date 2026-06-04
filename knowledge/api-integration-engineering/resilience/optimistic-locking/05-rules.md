## Use Integer Version Fields, Not Timestamps
---
## Category
Reliability
---
## Rule
Use an integer version column for optimistic locking; never rely solely on `updated_at` timestamps.
---
## Reason
Timestamps can collide under rapid concurrent updates (sub-second precision), causing false conflicts or missed conflicts. Integer versions are monotonic and conflict-free.
---
## Bad Example
```php
// Using updated_at as version — may collide under rapid updates
$affected = Model::where('id', $id)->where('updated_at', $oldUpdatedAt)->update($data);
```
---
## Good Example
```php
// Integer version column
Schema::table('orders', function ($table) {
    $table->unsignedInteger('version')->default(1);
});
$affected = Model::where('id', $id)->where('version', $oldVersion)->update(array_merge($data, [
    'version' => DB::raw('version + 1'),
]));
```
---
## Exceptions
Models with very low write contention where timestamp collision is virtually impossible.
---
## Consequences Of Violation
Stale reads not detected (timestamp collision), allowing conflicting writes to succeed and corrupting data.
## Always Check Version in UPDATE WHERE Clause
---
## Category
Reliability
---
## Rule
Always include the version check in the WHERE clause of UPDATE statements; never trust application-level version comparison.
---
## Reason
Race conditions between reading the version and updating can only be prevented by making the check atomic within the UPDATE statement.
---
## Bad Example
```php
if ($model->version !== $oldVersion) { return; } // TOT — still updates below
$model->update($data); // race: version changed between check and update
```
---
## Good Example
```php
$affected = Model::where('id', $id)
    ->where('version', $oldVersion)
    ->update(array_merge($data, ['version' => DB::raw('version + 1')]));
if ($affected === 0) {
    throw new StaleModelLockingException;
}
```
---
## Exceptions
None — always use atomic WHERE clause version check.
---
## Consequences Of Violation
Concurrent writes overwrite each other's changes silently (lost update problem), data corruption.
## Retry on Version Conflict with Backoff
---
## Category
Reliability
---
## Rule
When optimistic locking detects a conflict (0 rows updated), re-read fresh data and retry the operation with exponential backoff.
---
## Reason
Conflicts are expected under concurrent access; without retry, every conflict becomes a permanent failure.
---
## Bad Example
```php
$affected = Model::where('version', $oldVersion)->update($data);
if ($affected === 0) { throw new \Exception('Conflict'); } // no retry — permanent failure
```
---
## Good Example
```php
$retries = 3;
while ($retries--) {
    $model = Model::findOrFail($id);
    $oldVersion = $model->version;
    $affected = Model::where('id', $id)->where('version', $oldVersion)->update($data);
    if ($affected > 0) { break; }
    usleep(100000 * pow(2, 3 - $retries)); // backoff
}
```
---
## Exceptions
Operations where re-reading is impossible (event sourcing append-only).
---
## Consequences Of Violation
Permanent failures on conflict, reduced availability under concurrent load, data processing retries exhausted.
## Combine with Idempotency Keys
---
## Category
Architecture
---
## Rule
Use idempotency keys for duplicate prevention AND optimistic locking for concurrent write protection; they address different problems.
---
## Reason
Idempotency prevents duplicates across retries; optimistic locking prevents lost updates from concurrent modifications. Both are needed for robust write safety.
---
## Bad Example
```php
// Only idempotency — concurrent writes with different keys still conflict
// Only optimistic locking — duplicate idempotency keys not detected
```
---
## Good Example
```php
$lock = Cache::lock("order:{$id}", 10);
if ($lock->get()) {
    try {
        $affected = Model::where('id', $id)->where('version', $oldVersion)->update($data);
        if ($affected === 0) { /* retry */ }
    } finally {
        $lock->release();
    }
}
```
---
## Exceptions
Read-only operations where neither is needed.
---
## Consequences Of Violation
Lost updates from concurrent modifications despite idempotency; or duplicate operations despite optimistic locking.
## Use Event Sequence Numbers for Webhook Ordering
---
## Category
Reliability
---
## Rule
Track webhook event sequence numbers and reject out-of-order events to prevent stale data overwrites.
---
## Reason
Without sequence numbers, a delayed old event can overwrite newer data with stale values (lost update).
---
## Bad Example
```php
// Processes webhook events in any order — old event overwrites new data
```
---
## Good Example
```php
$sequence = $event->data['sequence'];
$currentSeq = WebhookMeta::where('resource_id', $resourceId)->value('last_sequence');
if ($sequence <= $currentSeq) {
    return; // stale event — discard
}
// Process event
WebhookMeta::where('resource_id', $resourceId)->update(['last_sequence' => $sequence]);
```
---
## Exceptions
Idempotent operations where order doesn't matter (set operations, additive changes).
---
## Consequences Of Violation
Stale webhook events overwrite newer data, data inconsistency, rollback of legitimate changes.
