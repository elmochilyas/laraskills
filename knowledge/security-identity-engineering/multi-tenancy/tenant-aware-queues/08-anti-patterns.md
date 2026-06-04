# Anti-Patterns: Tenant-Aware Queues and Job Context

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Multi-Tenancy Security |
| Knowledge Unit | Tenant-Aware Queues and Job Context |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-TAQ-01 | Static/Global Tenant Context in Queue Workers | Critical | Medium | High |
| AP-TAQ-02 | Jobs Without tenant_id Property | Critical | High | Low |
| AP-TAQ-03 | Silently Skipping Missing Tenant Context | High | High | Low |
| AP-TAQ-04 | Not Restoring Context at Start of handle() | High | Medium | Low |
| AP-TAQ-05 | Using Global State for Tenant Context Across Jobs | Critical | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **Batch jobs without individual tenant context**: Each job in a batch must carry its own tenant ID
- **Admin-distpached jobs not documented**: System-level jobs should be explicitly marked as tenant-agnostic
- **No tests for queue tenant context isolation**: Writing tests is essential to verify correct propagation

---

## 1. Static/Global Tenant Context in Queue Workers

### Category
Security · Architecture

### Description
Using a static property or global variable to store the current tenant context in queue workers, causing tenant context to leak between jobs executed by the same worker process.

### Why It Happens
Static properties are simple to implement — set once, access everywhere. Developers use `TenantContext::set($id)` and `TenantContext::get()` as a convenience. In single-request processing, this works. In queue workers processing multiple jobs sequentially, the static value from the first job persists when the second job starts, before it sets its own value.

### Warning Signs
- A static class or global variable stores the current tenant ID
- Queue worker processes Job A (Tenant 1), then immediately processes Job B (Tenant 2)
- Job B's first query uses Tenant 1's context because static value wasn't reset
- Race conditions depend on which job runs first in the worker
- Intermittent cross-tenant data contamination in queue processing

### Why Harmful
Static tenant context creates a shared state between sequential jobs in the same worker process. If Job B crashes before setting its own tenant context, Job B runs entirely in Job A's tenant scope. This is unpredictable, non-reproducible, and can corrupt data across tenants.

### Real-World Consequences
- Intermittent data corruption: Tenant B's data is processed under Tenant A's identity
- Debugging impossible because the bug depends on job execution order
- Data breach: Tenant B's export sent to Tenant A's email
- Emergency fix: increase queue workers to reduce job interleaving (band-aid)
- Static context leak persists despite restart — worker process memory is shared

### Preferred Alternative
Never use static or global state for tenant context. Always pass tenant ID as a serialized job property and restore it from the property at execution time.

### Refactoring Strategy
1. Identify all static/global tenant context storage
2. Replace with job property: `public ?string $tenantId` on each job class
3. Dispatch jobs with tenant ID: `Job::dispatch($data, tenancy()->tenantId())`
4. In `handle()`, initialize from `$this->tenantId`: `tenancy()->initialize($this->tenantId)`
5. Remove all static/global tenant context getters/setters
6. Run queue worker tests under concurrent load to verify isolation

### Detection Checklist
- [ ] Is there any static or global tenant context storage?
- [ ] Are tenant context getters/setters using static state?
- [ ] Do queue worker processes share tenant context between jobs?
- [ ] Are there intermittent cross-tenant data issues?
- [ ] Is tenant context restored from job payload or from global state?

### Related Rules/Skills/Trees
- Avoid Static Tenant Context in Queue Workers (05-rules.md)
- Configure Tenant-Aware Queues (06-skills.md)
- Queue Worker Tenant Context Isolation (06-skills.md)

---

## 2. Jobs Without tenant_id Property

### Category
Security · Architecture

### Description
Queue job classes that don't include a `$tenantId` property, making tenant context restoration impossible because the serialized payload lacks the necessary information.

### Why It Happens
Developers write job classes without thinking about tenant context. The job processes data that "seems" tenant-agnostic (sending an email, generating a report). But the email template might include tenant-specific data, or the report queries tenant-scoped models. Without a tenant ID, the job runs in whatever context the queue worker happens to have.

### Warning Signs
- Job class has no `$tenantId` or `$tenant` property
- Job constructor receives data but not tenant context
- Job `handle()` method does not call `tenancy()->initialize()`
- Job serialized payload in the queue driver shows no tenant reference
- Jobs process data that could be tenant-scoped (emails, reports, exports)

### Why Harmful
Without tenant context, a job runs with whatever tenant context the queue worker has — possibly the previous job's context (see AP-TAQ-01). This means the job may write data to the wrong tenant, send wrong-scoped emails, or query all tenants' data. The job's behavior depends on queue execution order, making it unpredictable and untestable.

### Real-World Consequences
- Email notification sent to Tenant B's user contains Tenant A's data
- Report generated with all tenants' data instead of one tenant — data leak
- Data processed under wrong tenant scope — corruption
- Job that works in development (single tenant) fails in production (multi-tenant)
- Security incident: cross-tenant data contamination traced to queue job

### Preferred Alternative
Every queue job that could touch tenant-scoped data must include a `$tenantId` property. Jobs that are intentionally tenant-agnostic should be explicitly documented as such and use a null-safety pattern.

### Refactoring Strategy
1. Add `public ?string $tenantId = null` to every job class
2. Pass tenant ID at dispatch: `Job::dispatch($data, tenancy()->tenantId())`
3. Add a `ShouldBeTenantAware` interface or marker trait for documentation
4. Create an Artisan command to scan job classes and flag those without tenant ID
5. Add a CI check requiring tenant ID in all job constructors
6. For intentionally tenant-agnostic jobs, add a comment explaining why

### Detection Checklist
- [ ] Do all job classes have a `$tenantId` property?
- [ ] Is tenant ID passed at job dispatch?
- [ ] Are tenant-agnostic jobs explicitly documented?
- [ ] Is there a CI check for tenant context in job classes?
- [ ] Can a job process tenant-scoped data without tenant context?

### Related Rules/Skills/Trees
- Include tenant_id in Every Queue Job Payload (05-rules.md)
- Configure Tenant-Aware Queues (06-skills.md)
- Multi-Tenant Queue Job Design (06-skills.md)

---

## 3. Silently Skipping Missing Tenant Context

### Category
Security · Operations

### Description
Writing queue jobs that silently continue processing when tenant context is missing, instead of failing, causing data to be processed without tenant scoping and potentially corrupting or leaking data.

### Why It Happens
Defensive programming suggests handling missing values gracefully. An if-statement like `if ($this->tenantId) { tenancy()->initialize(...) }` seems safer than throwing an exception. Developers want to avoid job failures and retries. Silently skipping context restoration hides the bug but processes data in the wrong (or no) scope.

### Warning Signs
- Job's `handle()` method checks `if ($this->tenantId)` but does not fail when null
- Jobs process data with missing tenant context without errors
- No default tenant context is set when `$this->tenantId` is null
- Queue worker logs don't show warnings for missing tenant context
- Data processing continues without tenant scoping

### Why Harmful
Processing data without tenant context means queries run without `WHERE tenant_id = ?` filter. This returns all tenants' data for read operations, and writes without tenant attribution. The job produces wrong output, possibly sending another tenant's data to the wrong user, or updating records without proper tenant ownership.

### Real-World Consequences
- Export job runs without tenant context — exports ALL tenants' data to one user — data breach
- Email job processes without tenant — sends wrong tenant's email content
- Data update job runs without tenant — modifies records across all tenants
- Silent failure: no error, wrong data — bug may go undetected for weeks
- Compliance report shows data processed without tenant attribution

### Preferred Alternative
Fail the job if tenant context cannot be restored. Throw an exception: `throw new \RuntimeException('Tenant context required but not provided')`. Let the queue worker retry the job (if transient) or send to failed queue (if permanent).

### Refactoring Strategy
1. Replace silent context-skipping with explicit failure: `throw_if(!$this->tenantId, ...)`
2. Configure queue retry policy: retry 3 times, then send to failed queue
3. Add monitoring alerts for "missing tenant context" failures
4. Implement a queue middleware that validates tenant context before processing
5. For tenant-agnostic jobs, set tenantId to a sentinel value (e.g., `system`)
6. Add an Artisan command to reprocess failed jobs with context fixes

### Detection Checklist
- [ ] Do jobs fail or silently skip when tenant context is missing?
- [ ] Is there a `throw` or `fail()` when `$this->tenantId` is null?
- [ ] Is there monitoring for missing-tenant-context failures?
- [ ] Are tenant-agnostic jobs explicitly separated from tenant-scoped jobs?
- [ ] Is there a queue middleware validating tenant context?

### Related Rules/Skills/Trees
- Fail Queue Jobs on Missing Tenant Context (05-rules.md)
- Configure Tenant-Aware Queues (06-skills.md)
- Queue Job Failure Handling in Multi-Tenant Apps (06-skills.md)

---

## 4. Not Restoring Context at Start of handle()

### Category
Reliability · Operations

### Description
Performing database queries, cache operations, or other tenant-scoped work before restoring tenant context in a job's `handle()` method, causing those initial operations to execute in the wrong tenant scope.

### Why It Happens
Developers add `tenancy()->initialize()` later in the `handle()` method, after some preparatory work. Or they assume the queue worker retains the correct tenant context from job dispatch. The preparatory work — logging, checking job state, loading configuration — runs outside any tenant context.

### Warning Signs
- `tenancy()->initialize()` is not the first statement in `handle()`
- Initial log statements in `handle()` don't have tenant context
- Preparatory queries run before tenant initialization
- Cache or config reads happen before context restoration
- Job metadata (logging, DB writes) at the beginning has null tenant_id

### Why Harmful
Any operation before tenant context restoration operates in the previous job's context or no context at all. This means the first few queries in the job may query the wrong tenant's data, log to the wrong tenant's audit trail, or cache data with the wrong tenant's prefix.

### Real-World Consequences
- Initial logging in job has null or wrong tenant_id — audit trail contaminated
- Preparatory configuration query retrieves wrong tenant's settings
- Cache miss from wrong tenant prefix causes unnecessary computation
- First database query in job operates on wrong tenant data
- Reproducing the bug requires specific job execution order

### Preferred Alternative
Restore tenant context as the absolute first operation in `handle()`. No operations — not even logging — before `tenancy()->initialize()`.

### Refactoring Strategy
1. Move `tenancy()->initialize($this->tenantId)` to the first line of `handle()` in every job
2. Remove any logging, queries, or cache access placed before tenant initialization
3. Add a `FailedJobProvider` middleware that wraps the handle method with context restoration
4. Use a base job class or trait that auto-restores tenant context in `handle()`
5. Write a test that verifies context is restored before any other operation

### Detection Checklist
- [ ] Is `tenancy()->initialize()` the first statement in `handle()`?
- [ ] Are there operations before tenant context restoration?
- [ ] Do initial log entries in jobs have correct tenant_id?
- [ ] Is there a base job class that handles context restoration?
- [ ] Do tests verify operation ordering in `handle()`?

### Related Rules/Skills/Trees
- Restore Tenant Context as First Step in handle() (05-rules.md)
- Configure Tenant-Aware Queues (06-skills.md)
- Queue Job Design for Multi-Tenant Apps (06-skills.md)

---

## 5. Using Global State for Tenant Context Across Jobs

### Category
Security · Architecture

### Description
Using a global helper, facade, or singleton to store and retrieve tenant context that persists across different job executions in the same worker process, causing context leaks between unrelated jobs.

### Why It Happens
Convenience drives this: a `tenant()` helper or `Tenancy::current()` singleton makes tenant context accessible anywhere without passing it through constructors. It works in web requests (one request per process) but breaks in queue workers (multiple jobs per process).

### Warning Signs
- A singleton or global helper stores tenant context: `app()->instance('tenant', $tenant)`
- Queue worker stores tenant context in a service container singleton
- Job A sets tenant context but Job B can read it without setting its own
- No teardown or cleanup of tenant context after job completion
- Intermittent cross-tenant issues that depend on job execution order

### Why Harmful
Global state in a shared worker process means every job shares the same tenant context slot. Job A sets context to Tenant 1, processes, finishes. Job B starts, doesn't set tenant context, reads the context — gets Tenant 1. Job B now operates under Tenant 1's scope, potentially modifying or reading Tenant 1's data instead of its own.

### Real-World Consequences
- Sequential queue jobs leak tenant context — unpredictable behavior
- Job B (Tenant 2) processes under Tenant 1's scope — data corruption
- No way to reproduce without controlling job execution order
- Queue worker must be restarted to clear leaked context — operational burden
- Production incident: "wrong tenant data" with no clear cause

### Preferred Alternative
Pass tenant context as serialized job data. Restore from the serialized property in `handle()`. Clear context at the end of `handle()` using `tenancy()->end()`. Never use singletons or globals for tenant context in queue workers.

### Refactoring Strategy
1. Remove all singleton/global tenant context storage
2. Add `$tenantId` property to all job classes
3. Implement a queue middleware that clears tenant context after each job
4. Add `tenancy()->end()` at the end of `handle()` or in `failed()` method
5. If using stancl/tenancy, use its built-in queue context propagation
6. Add tests that verify context isolation: create two jobs for different tenants and assert they don't interfere when processed in sequence

### Detection Checklist
- [ ] Is tenant context stored in a singleton or global service?
- [ ] Is there a teardown/cleanup of tenant context after job execution?
- [ ] Does a queue worker maintain tenant context between jobs?
- [ ] Are there cross-tenant issues that depend on job execution order?
- [ ] Is there a queue middleware that clears context after each job?

### Related Rules/Skills/Trees
- Avoid Global Tenant State in Queue Workers (05-rules.md)
- Configure Tenant-Aware Queues (06-skills.md)
- Queue Worker Tenant Context Lifecycle (06-skills.md)
