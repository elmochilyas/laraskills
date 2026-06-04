# Rule Card: K087 — Ignoring Missing Models

---

## Rule 1

**Rule Name:** use-shoulddeletemissing-for-expected-deletions

**Category:** Always

**Rule:** Always use `ShouldDeleteMissing` or `deleteWhenMissingModels` for jobs where model deletion is expected before processing.

**Reason:** A job that references a deleted model will always fail with "call to a member function on null" — retrying is futile.

**Bad Example:**
```php
class ProcessPost implements ShouldQueue
{
    public function __construct(public Post $post) {}
    // When post is deleted: crashes with "call to member function on null" — retries wasted
}
```

**Good Example:**
```php
class ProcessPost implements ShouldQueue
{
    use ShouldDeleteMissing;

    public function __construct(public Post $post) {}
    // When post is deleted: job auto-deletes — no wasted retries
}
```

**Exceptions:** When missing model is always a bug and should alert immediately — let the job fail and alert.

**Consequences Of Violation:** Each missing-model job retries 3-10 times, burning worker capacity and creating noise in logs before finally landing in `failed_jobs`.

---

## Rule 2

**Rule Name:** log-when-shoulddeletemissing-activates

**Category:** Always

**Rule:** Always log when `ShouldDeleteMissing` deletes a job.

**Reason:** The trait silently deletes the job — without logging, a spike in missing-model jobs goes undetected.

**Bad Example:**
```php
use ShouldDeleteMissing;
// Silent deletion — no trace when a model is missing
```

**Good Example:**
```php
class ProcessPost implements ShouldQueue
{
    use ShouldDeleteMissing;

    public function __construct(public Post $post) {}

    public function failed(Throwable $e): void
    {
        Log::warning('Job deleted — model missing', [
            'job' => static::class,
            'model' => Post::class,
        ]);
    }
}
```

**Exceptions:** None — logging is minimal overhead and essential for detecting race conditions.

**Consequences Of Violation:** A race condition between job dispatch and model deletion causes 1000 jobs to be silently deleted — no alert, no trace in logs, the data processing simply never completes.

---

## Rule 3

**Rule Name:** add-null-guards-with-shoulddeletemissing

**Category:** Always

**Rule:** Always add null guards in `handle()` even when using `ShouldDeleteMissing`.

**Reason:** `ShouldDeleteMissing` only protects deserialization — if the job re-fetches data in `handle()`, it's not covered.

**Bad Example:**
```php
class ProcessPost implements ShouldQueue
{
    use ShouldDeleteMissing;

    public function handle(): void
    {
        $post = Post::findOrFail($this->postId); // Not covered — can still crash
    }
}
```

**Good Example:**
```php
class ProcessPost implements ShouldQueue
{
    use ShouldDeleteMissing;

    public function handle(): void
    {
        $post = Post::find($this->postId);
        if (! $post) { return; } // Guard against deletion between deserialization and handle()
    }
}
```

**Exceptions:** When the job only uses constructor-injected models and never re-fetches, the trait is sufficient.

**Consequences Of Violation:** The model exists at deserialization (trait doesn't activate) but is deleted moments later — `findOrFail()` in `handle()` throws `ModelNotFoundException`, causing a normal failure with retries.
