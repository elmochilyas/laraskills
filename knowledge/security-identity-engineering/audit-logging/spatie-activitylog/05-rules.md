# Rules: Spatie Activitylog

## Use the Facade Over Direct Model Instantiation
---
## Category
Architecture
---
## Rule
Use the `activity()` facade function to create log entries. Avoid instantiating `Spatie\Activitylog\Models\Activity` directly.
---
## Reason
The `activity()` facade provides a fluent, readable builder API that sets up default values (causer, batch UUID) and returns a properly configured instance. Direct model instantiation bypasses this setup and may produce inconsistent log entries.
---
## Bad Example
```php
$log = new Activity();
$log->description = 'User created';
$log->save();
```
---
## Good Example
```php
activity()->log('User created');
```
---
## Exceptions
No common exceptions — use the facade for all activity logging.
---
## Consequences Of Violation
Inconsistent log entries, missing default values.
---

## Use performedOn() and causedBy() for Subject and Causer
---
## Category
Architecture
---
## Rule
Chain `->performedOn($model)` and `->causedBy($user)` when logging model-related activities. Never pass these as string properties.
---
## Reason
`performedOn()` establishes a polymorphic relationship to the subject model. `causedBy()` links the entry to the user. Using these methods enables querying by subject (`$post->activities()`) and causer (`$user->activities()`). String properties lose this relational capability.
---
## Bad Example
```php
activity()->withProperties(['subject' => 'Post #'.$post->id])->log('post_updated');
// Cannot query: $post->activities()
```
---
## Good Example
```php
activity()
    ->performedOn($post)
    ->causedBy($request->user())
    ->log('post_updated');
```
```php
// Now queryable:
$post->activities(); // All activities on this post
```
---
## Exceptions
System-level events with no specific subject or causer (queue worker, scheduled task).
---
## Consequences Of Violation
Cannot query activities by subject or causer, lost relational capabilities.
---

## Log Event Names in the description Field
---
## Category
Architecture
---
## Rule
Use a consistent event name format in `->log()` (e.g., `user_created`, `post_updated`). Avoid natural language sentences.
---
## Reason
The `description` field is the primary filter for activity queries. Consistent event names enable reliable searching, grouping, and reporting. Natural language descriptions with varying phrasing make queries unreliable.
---
## Bad Example
```php
activity()->log('The user was created by admin');
activity()->log('Admin created user');
activity()->log('user created');
```
---
## Good Example
```php
activity()->log('user_created');
```
---
## Exceptions
No common exceptions — consistent event names are essential for queryability.
---
## Consequences Of Violation
Inconsistent event names make activity querying unreliable.
---

## Store Serialized Models in properties Instead of Raw IDs
---
## Category
Architecture
---
## Rule
Use `->withProperties()` to store contextual data. For model references, store `['post_id' => $post->id, 'post_title' => $post->title]` instead of just the ID.
---
## Reason
Raw model IDs in properties require joining back to the model table to interpret the log entry. If the model is soft-deleted or the table schema changes, the ID alone provides no context. Including a human-readable identifier (title, name) makes the log self-describing.
---
## Bad Example
```php
activity()->withProperties(['post_id' => $post->id])->log('post_updated');
// Cannot tell which post without joining the posts table
```
---
## Good Example
```php
activity()->withProperties([
    'post_id' => $post->id,
    'post_title' => $post->title,
])->log('post_updated');
// Self-describing log entry
```
---
## Exceptions
No common exceptions — self-describing properties improve log readability.
---
## Consequences Of Violation
Audit logs that require joins to interpret.
---

## Log Batch Activities With the Same Batch UUID
---
## Category
Architecture
---
## Rule
Use `activity()->batch()` to start a batch and automatically assign the same batch UUID to subsequent log entries. Use `activity()->disableLogging()` during imports to suppress batch logs.
---
## Reason
A single user action may trigger multiple activity log entries (updating a post creates a post log and a revision log). Batching groups these entries under a single batch UUID, enabling correlation of related events. Disabling logging during mass imports prevents batch pollution.
---
## Bad Example
```php
$post->update([...]); // One log entry
$post->revisions()->create([...]); // Another log entry — no batch correlation
```
---
## Good Example
```php
activity()->batch(); // Start batch — same UUID for all subsequent logs
$post->update([...]);
$post->revisions()->create([...]);
// Both entries share the same batch UUID
```
---
## Exceptions
No common exceptions — batching groups related activities for correlation.
---
## Consequences Of Violation
Related log entries not correlated, harder to trace user actions.
---

## Use LogOptions to Control Which Attributes Are Logged
---
## Category
Architecture
---
## Rule
Override `getActivitylogOptions()` in models to configure which attributes are logged, which are ignored, and under what conditions logging occurs.
---
## Reason
The default `LogsActivity` trait logs all attribute changes on every update. This creates excessive noise (timestamps, internal flags). `LogOptions` allows precise control over which attributes trigger logging and which values are included in properties.
---
## Bad Example
```php
class Post extends Model {
    use LogsActivity;
    // All attributes logged — including updated_at, cache counters
}
```
---
## Good Example
```php
class Post extends Model {
    use LogsActivity;
    public function getActivitylogOptions(): LogOptions {
        return LogOptions::defaults()
            ->logOnly(['title', 'body', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
```
---
## Exceptions
No common exceptions — explicit `logOnly` prevents noisy logs.
---
## Consequences Of Violation
Log table filled with noise entries (updated_at, internal fields).
---

## Add Custom Log Levels or Tags for Filtering
---
## Category
Architecture
---
## Rule
Use `->withProperties(['level' => 'critical'])` or a dedicated package for log levels. Use the `properties` JSON column to tag entries for filtering.
---
## Reason
Not all activities are equally important. A failed payment is more critical than a profile update. Adding a level or tag in properties enables filtering, prioritization, and alerting based on severity.
---
## Bad Example
```php
activity()->log('payment_failed'); // No severity — cannot differentiate from minor events
```
---
## Good Example
```php
activity()
    ->withProperties(['level' => 'critical', 'amount' => 999.99])
    ->log('payment_failed');
```
```php
Activity::where('properties->level', 'critical')->get(); // Filter for critical events
```
---
## Exceptions
No common exceptions — log levels enable filtering and alerting.
---
## Consequences Of Violation
Cannot prioritize or filter important events from noise.
