# Rule Card: K046 — Silenced Jobs and Silenced Tags

---

## Rule 1

**Rule Name:** never-silence-without-alerting

**Category:** Never

**Rule:** Never silence a job without configuring external alerting for its failures.

**Reason:** Silencing hides dashboard entries — a silenced job that fails goes unnoticed.

**Bad Example:**
```php
use Laravel\Horizon\Contracts\Silenced;

class HealthCheckJob implements ShouldQueue
{
    use Silenced;
    // No failure alerting — failures invisible
}
```

**Good Example:**
```php
class HealthCheckJob implements ShouldQueue
{
    use Silenced;

    public function failed(\Throwable $e): void
    {
        Slack::send('Health check failed: ' . $e->getMessage()); // External alerting
    }
}
```

**Exceptions:** Development environments where failure visibility is not critical.

**Consequences Of ViolATION:** The health check job starts failing due to a database connection issue — it's silenced, so it doesn't appear in the dashboard. No one notices for 2 hours until users report the site is down.

---

## Rule 2

**Rule Name:** prefer-silenced-trait-over-interface

**Category:** Prefer

**Rule:** Prefer the `Silenced` trait over implementing `ShouldBeSilenced` manually.

**Reason:** The trait is simpler and makes silencing visible in the job class itself.

**Bad Example:**
```php
class HealthCheckJob implements ShouldQueue, ShouldBeSilenced
{
    // Empty interface — no implementation needed but less explicit
}
```

**Good Example:**
```php
class HealthCheckJob implements ShouldQueue
{
    use \Laravel\Horizon\Contracts\Silenced; // Clear intent
}
```

**Exceptions:** Jobs that need conditional silencing based on runtime state.

**Consequences Of ViolATION:** A developer unfamiliar with Horizon sees `ShouldBeSilenced` and doesn't understand the concept — the trait name `Silenced` is self-documenting and more discoverable.

---

## Rule 3

**Rule Name:** document-silenced-jobs-in-runbooks

**Category:** Always

**Rule:** Always document silenced jobs in team runbooks.

**Reason:** Operators must know which jobs are silenced and how to check them.

**Bad Example:**
```php
// Silence configured but not documented
// New operator doesn't know HealthCheckJob won't appear in dashboard
```

**Good Example:**
```php
// Runbook entry:
// "HealthCheckJob is silenced — check failures via:
//  php artisan horizon:failed-silenced
//  or enable 'Show silenced' toggle in dashboard"
```

**Exceptions:** None — undocumented silencing creates confusion during incidents.

**Consequences Of ViolATION:** During an incident, a new operator checks the dashboard for failures — they don't see the silenced health check failures. They spend 30 minutes looking at non-silenced jobs before learning about the silencing feature.

---

## Rule 4

**Rule Name:** use-tag-based-silencing-for-cross-cutting

**Category:** Prefer

**Rule:** Prefer tag-based silencing for cross-cutting categories across multiple job types.

**Reason:** Adding silenced config entries avoids modifying each job class individually.

**Bad Example:**
```php
// Silencing 5 monitoring job classes individually
class PingJob { use Silenced; }
class HeartbeatJob { use Silenced; }
class HealthCheckJob { use Silenced; }
```

**Good Example:**
```php
// All monitoring jobs tag themselves
public function tags(): array
{
    return ['type:monitoring'];
}

// config/horizon.php
'silenced' => ['type:monitoring'],
```

**Exceptions:** Individual job silencing is simpler for a single noisy job.

**Consequences Of ViolATION:** A new monitoring job is added without the `Silenced` trait — it appears in the default dashboard view, adding noise. With tag-based silencing, any job tagged `type:monitoring` is automatically silenced.
