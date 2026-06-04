# Anti-Patterns: stancl/tenancy Package Architecture

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Multi-Tenancy Security |
| Knowledge Unit | stancl/tenancy Package Architecture |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-STN-01 | Not Configuring Queue Tenant Context | Critical | Medium | Medium |
| AP-STN-02 | Overloading Bootstrappers | Medium | High | Low |
| AP-STN-03 | Missing Cache Isolation | High | High | Low |
| AP-STN-04 | Auto-Increment Tenant ID | Medium | Medium | Low |
| AP-STN-05 | Manual Tenant Resolution in Controllers | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **Storing tenant data in session**: stancl/tenancy manages tenant context — duplicating in session creates sync issues
- **Not testing cross-tenant queue isolation**: Queue tenant context is the most common failure mode — must be tested
- **Not configuring filesystem isolation**: Tenant A's uploaded files visible to Tenant B without separate storage roots

---

## 1. Not Configuring Queue Tenant Context

### Category
Security · Operations

### Description
Relying on stancl/tenancy's default queue configuration without verifying that tenant context is propagated to queue jobs, causing jobs to operate in the wrong tenant scope or without tenant context entirely.

### Why It Happens
stancl/tenancy includes queue tenant context propagation, but it requires specific configuration: the `queue` bootstrapper must be enabled and the queue worker must be configured to restore context. Developers assume automatic propagation works without verification and skip testing.

### Warning Signs
- No queue tenant context tests exist
- Queue jobs don't explicitly reference tenant context
- `config/tenancy.php` does not have the `queue` bootstrapper configured
- Queue workers are not configured to initialize tenant context
- Cross-tenant data leaks originate from queue job processing

### Why Harmful
Without tenant context, queue jobs may operate on the wrong tenant's data, process all tenants' data (missing `tenant_id` filter), or leave audit trails without tenant attribution. This is the most common cross-tenant data leak in multi-tenant Laravel applications.

### Real-World Consequences
- Queue job exports Tenant B's data to Tenant A's admin — data breach
- Email notification sent to Tenant B's user from Tenant A's context — cross-tenant communication
- Scheduled task processes all tenants' data as one batch — data mixing
- Emergency stop of all queue workers after discovering context leak

### Preferred Alternative
Verify that the queue bootstrapper is enabled in `config/tenancy.php`. Write tests that confirm jobs dispatch and execute in the correct tenant context. Add monitoring for tenant context presence at job execution.

### Refactoring Strategy
1. Enable the `queue` bootstrapper in `config/tenancy.php`
2. Verify that the queue worker middleware initializes tenant context from job payload
3. Write a test that dispatches a job in Tenant A context and asserts it operates in Tenant A scope
4. Add a failing test: dispatch a job without tenant context and assert it fails or logs a warning
5. For jobs dispatched from admin context (no tenant), explicitly pass null tenant ID
6. Add monitoring: alert if any job processes with null tenant context

### Detection Checklist
- [ ] Is the `queue` bootstrapper enabled in `config/tenancy.php`?
- [ ] Do queue workers restore tenant context from job payloads?
- [ ] Are there tests verifying queue tenant propagation?
- [ ] Do cross-tenant leaks originate from queue operations?
- [ ] Are admin-dispatched jobs handled separately from tenant jobs?

### Related Rules/Skills/Trees
- Configure stancl/tenancy Queue Tenant Context (05-rules.md)
- Configure stancl/tenancy Package (06-skills.md)
- Tenant-Aware Queues and Job Context (06-skills.md)

---

## 2. Overloading Bootstrappers

### Category
Performance · Architecture

### Description
Enabling all available bootstrappers in `config/tenancy.php` without evaluating which ones are actually needed, adding unnecessary initialization overhead and potential side effects per request.

### Why It Happens
The default configuration or setup guides often show all available bootstrappers. Developers enable them all "just in case" without understanding the overhead of each. Each bootstrapper executes on every tenant-initialized request — even if the application doesn't use cache tenancy, filesystem tenancy, or Redis tenancy.

### Warning Signs
- `config/tenancy.php` has every bootstrapper enabled
- The application doesn't use Redis, but the `RedisTenancyBootstrapper` is enabled
- The application doesn't use per-tenant filesystems, but the `FilesystemTenancyBootstrapper` is enabled
- Tenant initialization time is 15-20ms for a simple application
- Unused bootstrappers log errors or warnings on every request

### Why Harmful
Each bootstrapper adds 1-5ms to tenant initialization. Enabling 5 unused bootstrappers adds 5-25ms to every request for no benefit. Unused bootstrappers may also introduce side effects: the `RedisTenancyBootstrapper` might try to configure Redis connections that don't exist, causing errors or warnings.

### Real-World Consequences
- Tenant initialization takes 25ms instead of 5ms — 20ms overhead per request
- Unused bootstrapper fails silently — unpredictable behavior
- Developer spends hours debugging "Redis connection" errors for an app that doesn't use Redis
- Cache bootstrapper interferes with application-level cache configuration
- Performance optimization identifies unused bootstrappers as a quick win

### Preferred Alternative
Enable only the bootstrappers the application actually needs: typically `DatabaseTenancyBootstrapper` (always) and optionally `CacheTenancyBootstrapper` (if caching tenant-scoped data).

### Refactoring Strategy
1. Review each bootstrapper's purpose and determine if the application uses that feature:
   - `DatabaseTenancyBootstrapper`: always needed
   - `CacheTenancyBootstrapper`: if caching tenant-scoped data
   - `FilesystemTenancyBootstrapper`: if tenants need separate storage
   - `RedisTenancyBootstrapper`: if using Redis per-tenant
   - `QueueTenancyBootstrapper`: always needed for queue context
2. Remove unused bootstrappers from the `bootstrappers` array
3. Measure tenant initialization time before and after
4. Test each remaining bootstrapper in isolation
5. Document which bootstrappers are enabled and why

### Detection Checklist
- [ ] How many bootstrappers are enabled in `config/tenancy.php`?
- [ ] Does the application use Redis tenancy?
- [ ] Does the application use per-tenant filesystems?
- [ ] Does the application use per-tenant cache?
- [ ] What is the tenant initialization time per request?

### Related Rules/Skills/Trees
- Enable Only Needed Bootstrappers in stancl/tenancy (05-rules.md)
- Configure stancl/tenancy Package (06-skills.md)
- Performance Optimization for Multi-Tenant Applications (06-skills.md)

---

## 3. Missing Cache Isolation

### Category
Security · Performance

### Description
Not configuring cache isolation (prefix or tags) in a multi-tenant application, allowing cached data from one tenant to be served to another tenant.

### Why It Happens
Caching works perfectly in development and single-tenant deployments. The cache key collision only appears when multiple tenants generate the same cache key — e.g., `settings` for Tenant A and `settings` for Tenant B both resolve to the same cache entry. The cache bootstrapper that adds prefixes is not enabled by default.

### Warning Signs
- `CacheTenancyBootstrapper` is not enabled in `config/tenancy.php`
- Cache keys are simple strings without tenant prefix: `Cache::get('settings')`
- Tenant A sees Tenant B's cached data (wrong settings, wrong prices)
- Cache invalidation for one tenant invalidates data for all tenants
- Cross-tenant cache interaction reported by users

### Why Harmful
Cache data leakage means Tenant A may see Tenant B's cached data: prices, user lists, configuration, search results. This is a data breach. Additionally, Tenant A's cache operations may invalidate Tenant B's cached data, causing performance degradation for all tenants.

### Real-World Consequences
- Tenant A sees Tenant B's product prices in the storefront — data exposure
- Tenant A's settings load Tenant B's configuration — incorrect behavior
- Cache invalidation for one tenant flushes all tenants' cache — performance penalty
- Search results show Tenant B's data to Tenant A — direct data leak
- Emergency cache key migration requires stopping all cache operations

### Preferred Alternative
Enable the `CacheTenancyBootstrapper` which adds a tenant-specific prefix to all cache keys. Alternatively, use `Cache::tags()` with tenant-scoped tag names.

### Refactoring Strategy
1. Enable `CacheTenancyBootstrapper` in `config/tenancy.php`
2. If using `Cache::tags()`, ensure tag names include tenant ID
3. Clear existing cache after enabling — old keys don't have prefixes
4. Test: verify cache keys are different per tenant for the same logical key
5. For Redis, verify that cache keys appear with tenant prefix in Redis CLI
6. Add a test that asserts cache isolation: Tenant A's cache set does not affect Tenant B's cache get

### Detection Checklist
- [ ] Is `CacheTenancyBootstrapper` enabled?
- [ ] Do cache keys include tenant prefixes?
- [ ] Have there been reports of cross-tenant cache data leakage?
- [ ] Is cache invalidation scoped per tenant?
- [ ] Are cache tags used with tenant identifiers?

### Related Rules/Skills/Trees
- Enable Cache Isolation for Multi-Tenant Applications (05-rules.md)
- Configure stancl/tenancy Package (06-skills.md)
- Multi-Tenant Caching Strategy (06-skills.md)

---

## 4. Auto-Increment Tenant ID

### Category
Security · Architecture

### Description
Using auto-increment integers for tenant IDs in the `Tenant` model, allowing sequential tenant enumeration and exposing business intelligence about the number and rate of tenant signups.

### Why It Happens
Auto-increment is the default primary key type in Laravel. stancl/tenancy works with any primary key type, and the quick start guide doesn't mandate UUIDs. Developers use the default `$table->id()` without considering the security implications.

### Warning Signs
- The `tenants` table uses `$table->id()` (auto-increment integer)
- Tenant IDs appear sequentially in URLs: `/tenant/1`, `/tenant/2`
- The number of registered tenants can be estimated from current ID value
- Tenant signup rate can be calculated from ID progression over time
- No UUID column exists on the Tenant model

### Why Harmful
Sequential tenant IDs expose business intelligence to competitors using the same service — they can estimate total customer count and growth rate. Sequential IDs also enable enumeration attacks: an attacker can iterate `tenant_id` values to discover other tenants' existence and potentially access their resources through other vulnerabilities.

### Real-World Consequences
- Competitor signs up as a tenant, estimates customer count from their tenant ID
- Security researcher enumerates all tenant IDs, maps tenant domains
- Attacker uses tenant ID enumeration to target specific tenants
- Business growth metrics exposed through API response headers
- Compliance requirement for non-guessable identifiers is violated

### Preferred Alternative
Use UUIDs for tenant IDs. Add `HasUuids` trait to the Tenant model or use `$table->uuid('id')->primary()` in the migration.

### Refactoring Strategy
1. If using auto-increment Tenant IDs, stop. For existing systems:
2. Add a UUID column to the tenants table: `$table->string('uuid')->unique()->after('id')`
3. Generate UUIDs for existing tenants
4. Switch API routing from `id` to `uuid` for tenant-related routes
5. Keep auto-increment internal ID but expose only UUID externally
6. For new tenants, generate UUID at creation time
7. Add `findByUuid()` scope for route model binding with UUID

### Detection Checklist
- [ ] Does the tenants table use auto-increment or UUID primary key?
- [ ] Are tenant IDs exposed in URLs, API responses, or HTML?
- [ ] Is the total tenant count easily estimable from sequential IDs?
- [ ] Is there a UUID identifier for tenant lookups?
- [ ] Are new tenant IDs sequential?

### Related Rules/Skills/Trees
- Use UUIDs for Tenant IDs (05-rules.md)
- Configure stancl/tenancy Package (06-skills.md)
- UUID vs Auto-Increment for Tenant Primary Keys (07-decision-trees.md)

---

## 5. Manual Tenant Resolution in Controllers

### Category
Architecture · Operation

### Description
Resolving the current tenant inside controller methods instead of using stancl/tenancy's middleware-based resolution, leading to inconsistent tenant state across actions and missing initialization in some code paths.

### Why It Happens
The `InitializeTenancyByDomain` middleware needs to be registered in the kernel. If registration is missed or done incorrectly, developers resort to manual tenant resolution: checking the domain, looking up the tenant, and calling `tenancy()->initialize()` in the controller or a base controller.

### Warning Signs
- Multiple controllers have `Tenant::findByDomain(request()->getHost())` calls
- Tenant initialization code appears in individual controller methods
- Some routes resolve tenant, others don't — inconsistent tenant state
- `InitializeTenancyByDomain` is not in the global middleware stack
- New routes need manual tenant resolution — easy to forget

### Why Harmful
Manual resolution guarantees inconsistency. Some routes initialize tenant context, others don't. New developers may not know they need to resolve tenants manually. The pattern violates the "don't repeat yourself" principle and creates security gaps where tenant context is missing.

### Real-World Consequences
- Some API endpoints return cross-tenant data because tenant wasn't initialized
- New route added without tenant resolution — data leak for 2 weeks until discovered
- Code review must check every route for tenant initialization — slows development
- Base controller resolves tenant but middleware stack doesn't — confusing architecture
- Tenant context varies between actions in the same request lifecycle

### Preferred Alternative
Register `InitializeTenancyByDomain` (or subdomain) as global middleware. All requests automatically resolve and initialize the correct tenant before any controller code executes.

### Refactoring Strategy
1. Register `InitializeTenancyByDomain` in the global middleware stack
2. Remove all manual `tenancy()->initialize()` calls from controllers
3. Verify the middleware resolves tenant for all routes, including API routes
4. For routes that don't need tenant context (landing pages, docs), add them to the exception list
5. Add a test that verifies tenant is initialized for every authenticated route
6. Document the middleware configuration in the project's multi-tenancy guide

### Detection Checklist
- [ ] Is `InitializeTenancyByDomain` registered as global middleware?
- [ ] Are there manual tenant resolution calls in controllers?
- [ ] Do all routes have tenant context initialized?
- [ ] Are non-tenant routes explicitly excluded from the middleware?
- [ ] Is tenant initialization consistent across the request lifecycle?

### Related Rules/Skills/Trees
- Use Middleware for Tenant Resolution, Not Controllers (05-rules.md)
- Configure stancl/tenancy Package (06-skills.md)
- stancl/tenancy Middleware Configuration (06-skills.md)
