# Rules: Comprehensive Audit Logging

## Log All State-Changing Operations on Sensitive Resources
---
## Category
Audit Logging
---
## Rule
Log every create, update, and delete operation on sensitive resources (users, payments, documents, permissions). Include who performed the action, what changed, and when.
---
## Reason
Without comprehensive logging, investigating a security incident or data integrity issue requires examining database-level logs, which lack user context. Audit logs answer "who changed what and when" — essential for compliance (SOC2, HIPAA, PCI-DSS) and forensic investigation.
---
## Bad Example
```php
public function updateUser(Request $request, User $user) {
    $user->update($request->validated()); // No audit log
}
```
---
## Good Example
```php
public function updateUser(Request $request, User $user) {
    $original = $user->getOriginal();
    $user->update($request->validated());
    activity()
        ->performedOn($user)
        ->causedBy($request->user())
        ->withProperties(['old' => $original, 'new' => $user->getAttributes()])
        ->log('user_updated');
}
```
---
## Exceptions
High-frequency internal operations (incrementing view counts) — logging every increment produces noise, not value.
---
## Consequences Of Violation
No audit trail for sensitive operations, compliance violations.
---

## Include IP Address and User Agent in Audit Logs
---
## Category
Audit Logging
---
## Rule
Log the IP address, user agent, and request ID with every auditable action. This provides contextual information for incident investigation.
---
## Reason
Knowing which user performed an action is insufficient — an attacker may have stolen the user's session. The IP address and user agent help distinguish the legitimate user from an attacker, identify geographic anomalies, and correlate with other security events.
---
## Bad Example
```php
activity()->performedOn($document)->log('document_deleted'); // No contextual data
```
---
## Good Example
```php
activity()
    ->performedOn($document)
    ->causedBy($request->user())
    ->withProperties([
        'ip' => $request->ip(),
        'user_agent' => $request->userAgent(),
        'request_id' => request()->header('X-Request-ID'),
    ])
    ->log('document_deleted');
```
---
## Exceptions
No common exceptions — IP and user agent are essential audit context.
---
## Consequences Of Violation
Cannot distinguish legitimate user action from compromised session.
---

## Log Both the Old and New Values on Update Operations
---
## Category
Audit Logging
---
## Rule
When logging update operations, include both the previous value and the new value for each changed attribute. Never log only the new value.
---
## Reason
Logging only the new value shows the state after the change but does not show what was changed. Comparing old and new values reveals exactly what the user modified — critical for debugging unintended changes and detecting malicious modifications.
---
## Bad Example
```php
activity()->withProperties(['new' => $newData])->log('user_updated');
// Cannot detect what actually changed
```
---
## Good Example
```php
$changed = $user->getDirty();
$original = array_intersect_key($user->getOriginal(), $changed);
activity()
    ->withProperties(['old' => $original, 'new' => $changed])
    ->log('user_updated');
```
---
## Exceptions
No common exceptions — old and new values must both be logged.
---
## Consequences Of Violation
Cannot determine what was changed during an incident investigation.
---

## Use Descriptive and Consistent Log Event Names
---
## Category
Architecture
---
## Rule
Use a consistent naming convention for audit log events: `{resource}_{action}` (e.g., `user_created`, `payment_refunded`, `document_deleted`). Document the event vocabulary.
---
## Reason
Inconsistent event names (`user changed`, `user_update`, `modify user`) make querying audit logs difficult. A consistent vocabulary (`user_updated`) allows reliable searching, reporting, and alerting on specific event types.
---
## Bad Example
```php
activity()->log('User was updated');
activity()->log('modify user');
activity()->log('user_change');
```
---
## Good Example
```php
activity()->log('user_updated');
activity()->log('user_email_changed');
activity()->log('user_password_reset');
```
---
## Exceptions
No common exceptions — consistent event naming is essential for searchability.
---
## Consequences Of Violation
Audit logs are difficult to search and analyze.
---

## Audit Permission and Role Changes Specifically
---
## Category
Audit Logging
---
## Rule
Log all permission and role assignments, revocations, and changes separately from general user updates. Include who granted the permission and who received it.
---
## Reason
Permission changes are the most security-critical audit events. They must be clearly visible in audit logs, not buried among profile field changes. Separate logging and clear event naming (`role_granted`, `permission_revoked`) make privilege escalation detection easier.
---
## Bad Example
```php
// Permission change logged as a generic "user_updated" — hard to find
```
---
## Good Example
```php
activity()
    ->performedOn($user)
    ->causedBy(Auth::user())
    ->withProperties(['role' => 'admin', 'granted_by' => Auth::id()])
    ->log('role_granted');
```
---
## Exceptions
No common exceptions — permission changes require dedicated audit entries.
---
## Consequences Of Violation
Privilege escalation buried in general audit logs, hard to detect.
---

## Set Retention Policies and Archive Old Audit Logs
---
## Category
Architecture
---
## Rule
Define a retention policy for audit logs (minimum 1 year for compliance, longer for legal hold). Implement log rotation and archival to cold storage.
---
## Reason
Audit logs grow quickly and consume database storage. Without a retention policy, logs fill the database and impact performance. Archival to cold storage (S3, Glacier, log service) preserves logs for compliance requirements while keeping the primary database lean.
---
## Bad Example
```php
// No log cleanup — audit table grows indefinitely
```
---
## Good Example
```php
// Scheduled cleanup of logs older than 1 year
$schedule->call(function () {
    Activity::where('created_at', '<', now()->subYear())->delete();
})->daily();
```
---
## Exceptions
Legal holds that require longer retention — exclude specific logs from cleanup.
---
## Consequences Of Violation
Database bloat, performance degradation, compliance violation for insufficient retention.
---

## Test Audit Logging in Feature Tests
---
## Category
Testing
---
## Rule
Write feature tests that assert audit log entries are created for sensitive operations. Test both successful and failed authorization scenarios.
---
## Reason
Audit logging code is easy to forget or accidentally remove during refactoring. Automated tests that assert log entries exist for specific operations ensure audit coverage remains intact. Testing failure scenarios verifies that unauthorized access attempts are also logged.
---
## Bad Example
```php
// No audit log tests — logging may be removed during refactoring
```
---
## Good Example
```php
public function test_user_deletion_is_audited(): void {
    $admin = User::factory()->create(['is_admin' => true]);
    $user = User::factory()->create();
    $this->actingAs($admin)->delete("/users/{$user->id}");
    $this->assertDatabaseHas('activity_log', [
        'event' => 'user_deleted',
        'causer_id' => $admin->id,
        'subject_id' => $user->id,
    ]);
}
```
---
## Exceptions
No common exceptions — audit logging must be covered by tests.
---
## Consequences Of Violation
Audit logging removed or broken without detection.
