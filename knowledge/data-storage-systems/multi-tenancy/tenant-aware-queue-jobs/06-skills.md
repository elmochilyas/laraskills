# Skill: Implement Tenant-Aware Queue Jobs

## Purpose

Ensure queued jobs execute in the correct tenant context by serializing the tenant ID into the job payload and rebinding context on execution.

## When To Use

- Any queue job that queries tenant-scoped data
- Jobs that perform tenant-specific operations (report generation, data export)
- Batch jobs processing per-tenant data

## When NOT To Use

- Jobs that operate on cross-tenant or system-level data
- Jobs that don't access tenant-scoped models

## Prerequisites

- CurrentTenant singleton
- Tenant-scoped models and database
- Queue driver configured (Redis, database, SQS)

## Inputs

- Tenant ID to execute the job for
- Job payload data

## Workflow (numbered steps)

1. Create a `TenantAware` base job class with `public $tenantId` property
2. In the constructor, store `$this->tenantId = tenant()->id`
3. In `handle()`, call `$this->rebindTenantContext()` before business logic
4. `rebindTenantContext()`: sets `app(CurrentTenant::class)`, configures DB connection, purges stale connection
5. Tag Horizon jobs: `$this->tags = ['tenant:'.$this->tenantId]` for per-tenant monitoring
6. For high isolation, run separate `queue:work` processes per tenant queue

## Validation Checklist

- [ ] Tenant ID is serialized in job payload
- [ ] Context is rebound before any logic executes in handle()
- [ ] Jobs are tagged with tenant ID for monitoring
- [ ] Failed jobs include tenant context for debugging

## Common Failures

- Tenant ID not serialized — job runs in wrong or no tenant context
- Context rebind uses stale tenant data (cache not refreshed)
- Job fails and retries without tenant context

## Decision Points

- Base job class vs trait for tenant awareness
- Shared queue vs per-tenant queue

## Performance Considerations

- Context rebind adds < 5ms overhead per job
- Per-tenant queues prevent noisy neighbors but increase worker count

## Security Considerations

- Tenant ID from serialized job must be validated — it could be tampered with
- Jobs should verify the tenant still exists before processing

## Related Rules

- 5-7-1: Always Serialize Tenant ID In Job Payload
- 5-7-2: Always Rebind Context Before Business Logic

## Related Skills

- Implement Tenant-Aware Commands
- Implement Tenant Queue Configuration
- Implement Tenant Job Isolation

## Success Criteria

- All tenant-scoped jobs execute with correct tenant context
- Zero jobs processed in wrong tenant context
- Horizon dashboard shows per-tenant job metrics

---

# Skill: Isolate Queue Workers Per Tenant

## Purpose

Dedicate separate queue workers per tenant or per tenant group to prevent noisy-neighbor interference and ensure predictable job processing.

## When To Use

- Enterprise tenants with dedicated SLA requirements
- Tenants with high job volume that could starve other tenants
- Compliance requiring workload isolation

## When NOT To Use

- Small number of tenants with low job volume (shared queue is simpler)
- Infrastructure cost of per-tenant workers is prohibitive

## Prerequisites

- Horizon or queue worker management
- Ability to configure per-tenant queue connections
- Tenant queue naming convention

## Inputs

- Tenant list with job volume metrics
- Queue configuration per tenant

## Workflow (numbered steps)

1. Define per-tenant queue names: `tenant-{id}-default`, `tenant-{id}-high`
2. Configure Horizon: per-tenant queue with dedicated worker processes
3. In job dispatch, route to correct tenant queue: `$this->onQueue('tenant-'.$tenantId.'-default')`
4. Set per-tenant queue limits (max jobs per minute, max attempts)
5. Monitor per-tenant queue length and worker utilization

## Validation Checklist

- [ ] Per-tenant queues are configured in Horizon
- [ ] Jobs route to correct tenant queue based on tenant ID
- [ ] A job-heavy tenant cannot starve other tenants' queues
- [ ] Tenant queue metrics visible in Horizon dashboard

## Common Failures

- Too many queues (one per tenant × 1000 tenants) overwhelms Horizon
- Queue configuration change requires Horizon restart

## Decision Points

- Per-tenant queue vs per-tenant-group queue vs shared queue with rate limiting
- Dedicated worker processes vs shared workers with weighted queues

## Performance Considerations

- Each queue worker consumes memory (20-50MB per worker)
- Monitor total worker count against server resources

## Security Considerations

- Ensure tenant cannot dispatch jobs to another tenant's queue
- Audit queue operations per tenant

## Related Rules

- 5-7-1: Always Serialize Tenant ID In Job Payload

## Related Skills

- Implement Tenant Queue Configuration
- Implement Tenant Job Isolation

## Success Criteria

- No tenant can starve another tenant's job processing
- Per-tenant queue metrics available and monitored
- Worker resource usage is predictable and within budget
