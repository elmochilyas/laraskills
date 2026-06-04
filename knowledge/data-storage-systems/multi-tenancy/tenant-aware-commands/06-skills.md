# Skill: Implement Tenant-Aware Artisan Commands

## Purpose

Create Artisan commands that can operate on a single tenant or iterate across all tenants, rebinding tenant context per iteration.

## When To Use

- Maintenance commands that operate per tenant (data cleanup, reindexing)
- Reporting commands that aggregate or export per-tenant data
- Batch operations that must run across all tenants

## When NOT To Use

- System-level commands that don't need tenant context (cache clear, config cache)
- Commands that operate on central/global data only

## Prerequisites

- Tenant resolution and context binding
- Artisan command registration

## Inputs

- Tenant list from central registry
- Command signature with `--tenant` option

## Workflow (numbered steps)

1. Create base `TenantCommand` class extending `Command`
2. Add `--tenant` option: `{--tenant= : The tenant ID to run for}`
3. In `handle()`, if `--tenant` is provided, run for that single tenant
4. If no `--tenant`, iterate all tenants, bind context per iteration
5. Provide progress feedback: `$this->output->progressStart(count($tenants))`
6. Wrap each tenant iteration in try/catch for error isolation
7. Implement `handleTenant(Tenant $tenant)` abstract method for tenant-specific logic

## Validation Checklist

- [ ] `--tenant` option works for single-tenant execution
- [ ] Batch mode iterates all tenants without failing on individual errors
- [ ] Progress feedback visible during batch execution
- [ ] Context rebound correctly per tenant iteration

## Common Failures

- Shared state between tenant iterations (static variables, cached data)
- One tenant failure stops the entire batch
- Command runs on wrong database (stale connection from previous iteration)

## Decision Points

- Base command class vs trait approach
- Synchronous iteration vs dispatching queue jobs per tenant

## Performance Considerations

- Batch mode holds the CLI process for the duration of all tenants
- For long-running operations, dispatch per-tenant jobs instead

## Security Considerations

- `--tenant` option should require admin authorization
- Log which tenants were processed and any failures

## Related Rules

- 5-8-1: Always Isolate Tenant Iteration Errors
- 5-8-2: Never Share State Between Tenant Iterations

## Related Skills

- Implement Tenant-Aware Queue Jobs
- Implement Migration Orchestration Across Tenants

## Success Criteria

- Commands run correctly for single or all tenants
- One tenant failure doesn't block others
- Progress visible and actionable in CLI output

---

# Skill: Build a Tenant Loop Iterator

## Purpose

Create a reusable iterator that loops through tenants, binds context, and executes a callback per tenant with error isolation.

## When To Use

- Multiple commands need per-tenant iteration
- Queued batch processing across tenants
- Any cross-tenant operation that needs context binding

## When NOT To Use

- Single-tenant operations only
- Very few tenants (< 10) where manual iteration is simpler

## Prerequisites

- Tenant repository with active tenant list
- Context binding logic

## Inputs

- Tenant query (all active tenants, filtered set, or single tenant)
- Callback to execute per tenant

## Workflow (numbered steps)

1. Create `TenantRunner` class with `run(callable $callback, ?array $tenantIds = null)` method
2. Inside `run()`, fetch tenants, loop, bind context, execute callback
3. Wrap callback in try/catch, log errors, continue to next tenant
4. Add progress reporting callback for CLI progress bar integration
5. Support filtering (tenant IDs, plan type, active status)
6. Return summary (processed, succeeded, failed count)

## Validation Checklist

- [ ] Iterator works for all tenant isolation models
- [ ] Errors isolated per tenant without affecting others
- [ ] Progress reporting works with CLI and queue contexts
- [ ] Context reset after each iteration

## Common Failures

- Memory leak from accumulating tenant data across iterations
- Connection pool exhaustion from opening connections for each tenant

## Decision Points

- Chunked iteration (process 100 tenants at a time) vs sequential
- In-process vs dispatched queue job per tenant

## Performance Considerations

- Memory usage grows with tenant data loaded per iteration
- For 1000+ tenants, chunk or dispatch to queue

## Security Considerations

- Iterator must not expose tenant data between iterations
- Logging must not include tenant credentials

## Related Rules

- 5-8-1: Always Isolate Tenant Iteration Errors

## Related Skills

- Implement Tenant-Aware Commands
- Implement Tenant-Aware Queue Jobs

## Success Criteria

- Iterator handles 1000+ tenants without memory issues
- Error isolation prevents single tenant failure from stopping batch
- Progress reporting works in both CLI and queue contexts
