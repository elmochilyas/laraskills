## Implement State TTL for Checkpoints
---
## Category
Maintainability | Performance
---
## Rule
Set a Time-To-Live (TTL) on all workflow checkpoints; delete checkpoints for completed or abandoned workflows older than the configured duration.
---
## Reason
Checkpoint storage grows with each workflow step. Without TTL, checkpoint data accumulates indefinitely, consuming disk space, increasing backup size, and potentially exposing stale sensitive data. A reasonable TTL (e.g., 30 days for completed workflows) controls storage growth.
---
## Bad Example
```php
// Checkpoints retained forever — unbounded storage growth
Checkpoint::create(['workflow_id' => $id, 'state' => $state]);
```
---
## Good Example
```php
Checkpoint::create([
    'workflow_id' => $id,
    'state' => $state,
    'expires_at' => now()->addDays(30),
]);
// Scheduled job:
Checkpoint::where('expires_at', '<', now())->delete();
```
---
## Exceptions
Compliance-mandated audit workflows (financial, healthcare) may require longer retention with documented data-retention policy.
---
## Consequences Of Violation
Storage exhaustion, increased backup costs, potential data-retention compliance violations.

## Sanitize Sensitive Data Before Checkpointing
---
## Category
Security
---
## Rule
Strip or encrypt sensitive data (PII, API keys, authentication tokens) from workflow state before it is serialized and written to a checkpoint.
---
## Reason
Checkpoints persist full agent state, which may include sensitive information collected during execution. If the checkpoint store is compromised or retained longer than necessary, sensitive data is exposed. Sanitization ensures checkpoints contain only non-sensitive operational state.
---
## Bad Example
```php
public function toCheckpoint(): array {
    return [
        'user_email' => $this->user->email, // PII stored in checkpoint
        'api_key' => $this->apiKey,         // Secret stored in checkpoint
        'conversation' => $this->messages,  // May contain PII
    ];
}
```
---
## Good Example
```php
public function toCheckpoint(): array {
    return [
        'user_id' => $this->user->id,                     // Identifier only
        'api_key_hash' => hash('sha256', $this->apiKey),  // Hash, not raw key
        'conversation' => $this->anonymizeMessages($this->messages),
    ];
}
```
---
## Exceptions
Checkpoints within a dedicated encrypted database with row-level access control may store sensitive data if absolutely required for recovery.
---
## Consequences Of Violation
PII exposure in backups, credential leakage, compliance violations (GDPR, HIPAA), audit findings.

## Test Crash Recovery with Simulated Worker Kills
---
## Category
Testing | Reliability
---
## Rule
Write tests that simulate worker process crashes at various execution points and verify that the workflow resumes correctly from the last checkpoint.
---
## Reason
Crash recovery is the core value of durable execution. If recovery doesn't work correctly, the entire durability investment is wasted. Deliberate crash testing validates that checkpoint serialization, loading, and resumption logic are correct.
---
## Bad Example
```php
// No crash recovery tests — assumed to work
```
---
## Good Example
```php
public function test_workflow_resumes_after_crash(): void {
    $workflow = new MyWorkflow();
    $workflow->start($input);
    
    // Simulate crash
    $savedState = $workflow->getLastCheckpoint();
    $newWorkflow = new MyWorkflow();
    $newWorkflow->restoreFrom($savedState);
    
    $result = $newWorkflow->resume();
    $this->assertNotNull($result);
}
```
---
## Exceptions
Prototype workflows that are always executed synchronously may delay crash-recovery testing until durability is needed.
---
## Consequences Of Violation
Discovered during production outage: checkpoint fails to deserialize, state is corrupted, workflow cannot resume.
