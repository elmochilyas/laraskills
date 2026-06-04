# Rules: Tenant-Aware Queues

## Tag or Prefix Queue Jobs With tenant_id
---
## Category
Architecture
---
## Rule
Attach the current `tenant_id` to every queued job, either as a job property, via a middleware, or using Stancl's queue tagging. Never dispatch jobs without tenant context.
---
## Reason
A queue worker processes jobs from a single queue. Without tenant context, the worker processes jobs for the wrong tenant, using wrong database connections, storage paths, or cache keys. Tagging enables tenant-specific queue workers and prevents cross-tenant job processing.
---
## Bad Example
```php
dispatch(new SendWelcomeEmail($user)); // No tenant context — wrong DB connection
```
---
## Good Example
```php
dispatch(new SendWelcomeEmail($user))->onQueue('tenant-' . tenant()->id); // Tenant-specific queue
```
---
## Exceptions
Global jobs (system maintenance, billing) that are not tenant-specific.
---
## Consequences Of Violation
Cross-tenant data corruption, wrong database connection for job.
---

## Set Tenant Context Before Job Execution
---
## Category
Architecture
---
## Rule
Use a queue middleware or job constructor to initialize the tenant context before job execution. The `handle()` method must have access to `tenant()`.
---
## Reason
Queue workers run in a separate process with no HTTP request context. The tenant is not automatically available. A middleware that initializes tenancy from the job's `tenant_id` property ensures the job runs in the correct tenant context.
---
## Bad Example
```php
class SendWelcomeEmail implements ShouldQueue {
    public function handle(): void {
        // tenant() is null — no context
        Mail::to($this->user)->send(new WelcomeMail());
    }
}
```
---
## Good Example
```php
class SendWelcomeEmail implements ShouldQueue {
    public function __construct(public User $user) {}
    public function handle(): void {
        tenancy()->initialize($this->user->tenant);
        Mail::to($this->user)->send(new WelcomeMail());
    }
}
```
---
## Exceptions
Global jobs with no tenant dependency — skip tenant initialization.
---
## Consequences Of Violation
Job executes in wrong or no tenant context, data corruption.
---

## Use Separate Queue Workers per Tenant for Isolation
---
## Category
Architecture
---
## Rule
Run separate queue worker processes per tenant, each listening on a tenant-specific queue. Use supervisor configuration with environment variables for the tenant ID.
---
## Reason
A single queue worker processing jobs for all tenants introduces risk: one tenant's slow job delays all tenants' jobs, and the worker must constantly switch database connections. Dedicated workers per tenant provide true isolation and fair resource allocation.
---
## Bad Example
```bash
# Single worker for all tenants — one slow job blocks all tenants
php artisan queue:work
```
---
## Good Example
```bash
# Supervisor config per tenant
[program:queue-tenant-abc]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/artisan queue:work --queue=tenant-abc --sleep=3 --tries=3
numprocs=2
```
---
## Exceptions
Small-scale deployments with few tenants and low queue volume — a single worker may suffice.
---
## Consequences Of Violation
One tenant's jobs block all other tenants' jobs.
---

## Use Unique Queue Names per Tenant With Stancl
---
## Category
Architecture
---
## Rule
Enable `queue.tag_based` and `queue.suffix` in Stancl's config. This automatically suffixes queue names with the tenant ID. Never manually compose queue names.
---
## Reason
Manual queue name composition (`'tenant-' . tenant()->id`) is error-prone and easy to forget. Stancl's automatic queue suffixing handles it consistently across all job dispatches in the tenant context.
---
## Bad Example
```php
// Manual queue name — must remember to set on every dispatch
dispatch(new Job())->onQueue('tenant-' . tenant()->id);
```
---
## Good Example
```php
// config/tenancy.php
'queue' => [
    'tag_based' => true,
    'suffix' => 'tenant_',
];
// Automatic queue suffixing — no manual work
dispatch(new Job());
```
---
## Exceptions
No common exceptions — automatic queue tagging is more reliable than manual.
---
## Consequences Of Violation
Cross-tenant queue processing, jobs dispatched to wrong queue.
---

## Handle Tenant-Specific Queue Failures Gracefully
---
## Category
Reliability
---
## Rule
Implement per-tenant job failure handling: log failures with tenant context, alert the tenant admin, and retry with tenant-scoped backoff. Prevent one tenant's failing job from exhausting global retry limits.
---
## Reason
A failing job for one tenant (e.g., email service down for tenant A) should not exhaust retry attempts for all tenants. Per-tenant failure handling isolates failures, notifies the correct admin, and prevents global queue congestion.
---
## Bad Example
```php
// Global failed job handler — no tenant context
public function failed(Throwable $e): void {
    Log::error('Job failed'); // No tenant context
}
```
---
## Good Example
```php
public function failed(Throwable $e): void {
    Log::error('Job failed', ['tenant_id' => $this->user->tenant_id, 'error' => $e->getMessage()]);
    // Notify tenant admin
    $this->user->tenant->notify(new JobFailedNotification($e));
}
```
---
## Exceptions
No common exceptions — per-tenant failure handling is essential for isolation.
---
## Consequences Of Violation
One tenant's job failures affect all tenants, wrong admin notified.
---

## Maintain Tenant Isolation in Batch Jobs and Chains
---
## Category
Architecture
---
## Rule
Ensure job batches and chains operate within a single tenant context. Never chain jobs across tenants. Use separate batches per tenant.
---
## Reason
A batch of jobs for one tenant should not include jobs for another tenant. Job chains pass data between sequential jobs — if the chain spans tenants, the second job runs in the wrong context. Each tenant's batch must be isolated.
---
## Bad Example
```php
// Batch mixing jobs from different tenants
Bus::batch([
    new ProcessData($tenantA->user),
    new ProcessData($tenantB->user), // Mixed tenants
])->dispatch();
```
---
## Good Example
```php
// Separate batches per tenant
Bus::batch($tenantA->users->map(fn ($u) => new ProcessData($u)))
    ->onQueue('tenant-' . $tenantA->id)
    ->dispatch();
Bus::batch($tenantB->users->map(fn ($u) => new ProcessData($u)))
    ->onQueue('tenant-' . $tenantB->id)
    ->dispatch();
```
---
## Exceptions
No common exceptions — job batches must be tenant-scoped.
---
## Consequences Of Violation
Batch jobs process in wrong tenant context, data corruption.
