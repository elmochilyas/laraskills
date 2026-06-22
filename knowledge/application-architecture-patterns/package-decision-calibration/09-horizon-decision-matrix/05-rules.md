# Rules for Laravel Horizon Decision Matrix

## Separate Supervisors for Different Workload Types
---
## Category
Architecture | Reliability
---
## Rule
Create separate Horizon supervisors for different workload types (webhooks, notifications, default jobs, long-running imports). Each supervisor should have its own queue, timeout, retry count, and worker pool size tailored to the workload characteristics.
---
## Reason
Different job types have fundamentally different requirements. A webhook processing job must be fast (30s timeout, high concurrency). A CSV import job is long-running (600s timeout, low concurrency). Mixing them in one supervisor forces all jobs to share the same timeout and worker count, causing fast jobs to be starved by slow jobs and slow jobs to be killed by fast-job timeouts.
---
## Bad Example
```php
// One supervisor for all queues
'environments' => [
    'production' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default', 'webhooks', 'notifications', 'imports'],
            'balance' => 'auto',
            'maxProcesses' => 10,
            'tries' => 3,
            'timeout' => 600, // Must be set to the slowest job — webhooks blocked for 10 min
        ],
    ],
],
```
---
## Good Example
```php
'environments' => [
    'production' => [
        'supervisor-webhooks' => [
            'connection' => 'redis',
            'queue' => ['webhooks'],
            'balance' => 'auto',
            'minProcesses' => 1,
            'maxProcesses' => 10,
            'tries' => 3,
            'timeout' => 30, // Webhooks must be fast
        ],
        'supervisor-notifications' => [
            'connection' => 'redis',
            'queue' => ['notifications', 'emails'],
            'balance' => 'simple',
            'minProcesses' => 2,
            'maxProcesses' => 5,
            'tries' => 2,
            'timeout' => 120, // Notifications can be slower
        ],
        'supervisor-imports' => [
            'connection' => 'redis',
            'queue' => ['imports', 'exports'],
            'balance' => 'simple',
            'minProcesses' => 1,
            'maxProcesses' => 3,
            'tries' => 1,
            'timeout' => 600, // Long-running imports
        ],
    ],
],
```
---
## Exceptions
Single-queue, low-throughput applications with homogeneous job types (e.g., all jobs are lightweight email notifications) may use a single supervisor. The rule activates when you have 3+ distinct workload types.
---
## Consequences Of Violation
Slow imports consume all workers, starving webhooks. Webhook timeouts kill legitimate long-running jobs. Monitoring shows "queue is backed up" but the dashboard can't distinguish which queue is the problem because they're all in one supervisor.

## Authenticate the Horizon Dashboard in Production
---
## Category
Security
---
## Rule
The Horizon dashboard must be gated behind authentication in production. The dashboard exposes queue contents, failed job payloads (which may contain PII or secrets), job metrics, and supervisor configuration. Use `Horizon::auth()` to gate the dashboard behind a Gate or role check.
---
## Reason
The Horizon dashboard at `/horizon` exposes: all queued job payloads, all failed job payloads (including PII like email addresses and user IDs), queue throughput and configuration, and supervisor provisioning settings. Without authentication, anyone with the URL can view this operational intelligence. In the wrong hands, failed job payloads can leak sensitive customer data.
---
## Bad Example
```php
// Horizon dashboard accessible to anyone
class HorizonServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Horizon::auth(fn () => true); // Anyone can access /horizon
    }
}
```
---
## Good Example
```php
// Horizon dashboard gated behind admin role
class HorizonServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Horizon::auth(function (Request $request) {
            return $request->user()?->hasRole('admin')
                || $request->user()?->can('viewHorizon');
        });
    }
}

// Additionally: restrict to internal IP range
Horizon::auth(function (Request $request) {
    return in_array($request->ip(), ['10.0.0.0/8', '172.16.0.0/12']);
});
```
---
## Exceptions
Horizon can run without authentication in local and staging environments where the dashboard is only accessible via `localhost` or a VPN. In any environment accessible from the public internet, authentication is mandatory.
---
## Consequences Of Violation
Publicly accessible queue dashboard. Failed job payloads exposed — including PII, API tokens in test payloads, and internal system configuration. A security incident waiting to happen.

## Use Tags on Jobs for Dashboard Filtering
---
## Category
Observability | Maintainability
---
## Rule
All dispatched jobs should include meaningful tags for filtering in the Horizon dashboard. Tags enable filtering jobs by domain, feature, or user. Without tags, finding a specific job among thousands requires scrolling through paginated lists.
---
## Reason
In production, the Horizon dashboard shows hundreds or thousands of jobs. Tags are the only way to filter to "all podcast processing jobs for user 42." A job tagged `['podcast', 'import', "user:{$userId}"]` can be found instantly. An untagged job is indistinguishable from every other job in the queue.
---
## Bad Example
```php
class ProcessPodcast implements ShouldQueue
{
    public function __construct(
        public Podcast $podcast,
    ) {}
    // No tags — impossible to find this job in the Horizon dashboard
}
```
---
## Good Example
```php
class ProcessPodcast implements ShouldQueue
{
    public function __construct(
        public Podcast $podcast,
    ) {}

    public function tags(): array
    {
        return [
            'podcast',
            'processing',
            "user:{$this->podcast->user_id}",
            "podcast:{$this->podcast->id}",
        ];
    }
}
```
---
## Exceptions
Trivial, high-throughput jobs where individual job inspection is never needed (e.g., a "record page view" job processing 10K/minute) may skip tags. Tags add Redis storage overhead — weigh the debugging benefit against storage cost.
---
## Consequences Of Violation
Debugging production issues requires scrolling through thousands of untagged jobs. When a specific user reports "my podcast didn't process," engineering cannot find the job without querying the database separately. Incident response time increases.

## Set Retries in One Place — Job Attribute or Horizon Config, Not Both
---
## Category
Architecture | Reliability
---
## Rule
Configure job retries in ONE place: either the job class attribute (`#[Tries(3)]`) or the Horizon supervisor config. Setting `tries` in both creates ambiguity about which value controls actual retry behavior. Prefer the job attribute for per-job configurability; use Horizon config as a default fallback for jobs without attributes.
---
## Reason
When `tries` is set to 3 in Horizon config and `#[Tries(5)]` on the job class, the actual retry behavior depends on which layer processes the retry. In some Laravel configurations, the Horizon config overrides the attribute; in others, the attribute overrides the config. This ambiguity leads to unexpected retry counts in production — a job you thought would retry 3 times retries 5 times, delaying failure detection.
---
## Bad Example
```php
// Horizon config
'supervisor-1' => [
    'tries' => 3,
],

// Job class
#[Tries(5)]
class ProcessPodcast implements ShouldQueue { /* ... */ }
// How many retries? 3 or 5? Depends on Laravel version and queue configuration.
```
---
## Good Example
```php
// Option A: Job attribute (preferred for per-job configurability)
#[Tries(3)]
class ProcessPodcast implements ShouldQueue { /* ... */ }

// Horizon config — no tries set (inherits from job attribute)
'supervisor-1' => [
    'connection' => 'redis',
    'queue' => ['default'],
    // 'tries' not set — each job defines its own
],

// Option B: Horizon config as default for homogeneous job types
'supervisor-1' => [
    'tries' => 3, // All jobs in this queue retry 3 times
],
// Job classes have no #[Tries] attribute
```
---
## Exceptions
When a specific job class needs different retry behavior than the supervisor default, the job attribute takes precedence — this is intentional. Document which mechanism is authoritative for each supervisor to avoid confusion.
---
## Consequences Of Violation
Unpredictable retry counts in production. Jobs retry more times than expected, delaying failure alerts. Jobs retry fewer times than expected, causing premature failure. Debugging retry behavior requires reading both Horizon config AND job class attributes.

## Call horizon:terminate During Deployment
---
## Category
Reliability | DevOps
---
## Rule
Always run `php artisan horizon:terminate` during the deployment process before restarting Horizon. Without this, running jobs are killed mid-execution, which can leave data in an inconsistent state.
---
## Reason
Horizon workers are long-lived processes. When you deploy new code, the running workers are still executing the old codebase. `horizon:terminate` sends a graceful shutdown signal — workers finish their current job, then exit. The supervisor (systemd/supervisord) restarts them with the new code. Without `horizon:terminate`, workers are killed by the deployment process, potentially corrupting job state.
---
## Bad Example
```bash
# Deploy script without horizon:terminate
git pull
composer install --no-dev
php artisan migrate --force
# Missing: php artisan horizon:terminate
sudo supervisorctl restart horizon-worker  # Kills running jobs
```
---
## Good Example
```bash
# Deploy script with graceful Horizon shutdown
git pull
composer install --no-dev
php artisan migrate --force
php artisan horizon:terminate  # Graceful shutdown — finish current jobs, then restart
# Supervisor automatically restarts Horizon workers with new code
```
---
## Exceptions
If the deployment involves database migrations that are incompatible with the old code, you may need to pause the queue entirely before deploying. In this case, use `php artisan horizon:pause` before deploy, then `php artisan horizon:continue` after.
---
## Consequences Of Violation
Jobs killed mid-execution during deployment. Database transactions partially committed. Failed jobs that should have succeeded. Data inconsistency that requires manual cleanup.
