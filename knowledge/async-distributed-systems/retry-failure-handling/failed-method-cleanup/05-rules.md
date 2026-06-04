# Rule Card: K021 — `failed()` Method on Jobs

---

## Rule 1

**Rule Name:** keep-failed-lightweight

**Category:** Always

**Rule:** Always keep `failed()` lightweight — avoid complex I/O or external calls.

**Reason:** If `failed()` throws, the exception is silently caught — your cleanup may not run without any alert.

**Bad Example:**
```php
public function failed(Throwable $e): void
{
    Http::post('https://api.example.com/rollback', [...]); // If this fails, cleanup is lost
}
```

**Good Example:**
```php
public function failed(Throwable $e): void
{
    Log::error('Job failed', ['order' => $this->orderId, 'error' => $e->getMessage()]);
}
```

**Exceptions:** Trivial, reliable I/O (local file deletion) may be acceptable in `failed()`.

**Consequences Of Violation:** The cleanup API call fails — the exception is logged and silently caught. The job remains in `failed_jobs`, but the cleanup was never completed and no one is alerted.

---

## Rule 2

**Rule Name:** make-failed-idempotent

**Category:** Always

**Rule:** Always make `failed()` idempotent — it may be called multiple times.

**Reason:** The framework does not guarantee single execution — a retried job that fails again calls `failed()` again.

**Bad Example:**
```php
public function failed(Throwable $e): void
{
    unlink('/tmp/'.$this->fileId); // Second call: file already deleted — throws
}
```

**Good Example:**
```php
public function failed(Throwable $e): void
{
    if (file_exists('/tmp/'.$this->fileId)) {
        unlink('/tmp/'.$this->fileId);
    }
}
```

**Exceptions:** Operations that are naturally idempotent (logging, setting status flags) don't need special handling.

**Consequences Of Violation:** The second call to `failed()` throws an exception — the exception is silently caught, but the cleanup error adds log noise and may mask the real failure reason.

---

## Rule 3

**Rule Name:** use-event-for-global-failed

**Category:** Prefer

**Rule:** Prefer `Queue::failing` event for global concerns; `failed()` for job-specific concerns.

**Reason:** `Queue::failing` fires for ALL job failures with no job-specific context — `failed()` has access to constructor properties for targeted cleanup.

**Bad Example:**
```php
public function failed(Throwable $e): void
{
    Log::warning('A job failed'); // Same across all job classes — code duplication
}
```

**Good Example:**
```php
// In AppServiceProvider
Queue::failing(function (JobFailed $event) {
    Log::warning('Job failed: '.$event->job->resolveName());
});

// Per-job cleanup in failed()
public function failed(Throwable $e): void
{
    TempFile::cleanup($this->fileId); // Job-specific
}
```

**Exceptions:** Small applications with few job classes may use `failed()` for both concerns.

**Consequences Of Violation:** Identical logging logic is duplicated across every job class — one class forgets it, and failure monitoring misses that job type.

---

## Rule 4

**Rule Name:** call-parent-failed-in-subclasses

**Category:** Always

**Rule:** Always call `parent::failed($e)` when overriding `failed()` in subclass jobs.

**Reason:** The parent class may define essential cleanup logic — skipping it leaves that cleanup undone.

**Bad Example:**
```php
class BaseJob implements ShouldQueue
{
    public function failed(Throwable $e): void { cleanup(); }
}

class SpecificJob extends BaseJob
{
    public function failed(Throwable $e): void
    {
        // parent::failed($e) not called — base cleanup skipped
        Log::error('Specific job failed');
    }
}
```

**Good Example:**
```php
class SpecificJob extends BaseJob
{
    public function failed(Throwable $e): void
    {
        parent::failed($e); // Base cleanup runs
        Log::error('Specific job failed');
    }
}
```

**Exceptions:** When the override intentionally replaces (rather than extends) the parent's failure handling.

**Consequences Of Violation:** Base job cleanup (releasing locks, deleting temp files) never runs — resources leak until manual intervention.
