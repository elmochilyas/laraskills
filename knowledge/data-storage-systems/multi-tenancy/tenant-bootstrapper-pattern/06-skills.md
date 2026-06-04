# Skill: Implement Tenant Bootstrapper Pattern

## Purpose

Separate central (tenant registry) and tenant (per-tenant data) database connections, initializing the tenant connection after resolving the current tenant.

## When To Use

- Schema-per-tenant or DB-per-tenant isolation models
- Any architecture needing both central and per-tenant connections
- Dynamic tenant connection configuration per request

## When NOT To Use

- Shared-table architecture (single connection, no bootstrapping needed)
- Single-tenant application with hardcoded connection

## Prerequisites

- Central database connection for tenant metadata
- Tenant connection configuration template
- Tenant resolution strategy

## Inputs

- Central database configuration
- Tenant database connection details (from tenant registry)
- Current tenant ID from middleware

## Workflow (numbered steps)

1. Define two database connections in `config/database.php`:
   - `central`: reads tenant registry, always available
   - `tenant`: dynamically configured per request
2. Create `TenantBootstrapper` class:
   - Receives resolved tenant from middleware
   - Sets `config(['database.connections.tenant.database' => $tenant->database_name])`
   - Sets `config(['database.connections.tenant.host' => $tenant->database_host])`
   - Calls `DB::purge('tenant')` to force reconnection
   - Sets session variables (RLS, application_name)
3. Register bootstrapper in service provider or call from middleware
4. Use `DB::connection('tenant')` and `DB::connection('central')` explicitly throughout the application

## Validation Checklist

- [ ] Central connection works without tenant context
- [ ] Tenant connection switches per request
- [ ] `DB::purge('tenant')` called after config change
- [ ] Session variables set on tenant connection
- [ ] Explicit connection usage throughout application

## Common Failures

- Eloquent models default to wrong connection (not using 'tenant')
- `DB::purge` not called — stale PDO with old database
- Central database used for tenant data — no isolation
- Bootstrapper runs before tenant resolved — exception

## Decision Points

- Default connection ('central' or 'tenant') for Eloquent models
- Bootstrapper as middleware vs service provider boot
- Caching resolved connections vs per-request reconnection

## Performance Considerations

- Connection config + purge + reconnect: 1-50ms per request
- Cache resolved connection factory for same tenant within same worker
- Central connection is always available (no dynamic config needed)

## Security Considerations

- Central connection credentials must be separate from tenant credentials
- Tenant connection details in central DB must be encrypted
- Bootstrapper must not expose connection details in logs

## Related Rules

- 5-25-1: Always Purge Tenant Connection After Config Change
- 5-25-2: Never Use Tenant Connection For Central Data

## Related Skills

- Implement Tenant-Aware Middleware
- Implement Dynamic Connection Configuration
- Implement Tenant Connection Caching and Pooling

## Success Criteria

- Central and tenant connections correctly separated
- Tenant connection switches correctly per request
- Zero data cross-contamination between central and tenant connections

---

# Skill: Configure Central and Tenant Model Connections

## Purpose

Ensure Eloquent models use the correct database connection (central vs tenant) for their data, with support for dynamic connection resolution.

## When To Use

- Multi-tenant bootstrapper pattern with separate central and tenant connections
- Neo models need to explicitly declare their connection
- Some models reference central data (tenants table, plans, global config)

## When NOT To Use

- Shared-table architecture with single connection
- Models always use the same connection

## Prerequisites

- Tenant bootstrapper configured
- Central and tenant connections defined

## Inputs

- List of central models (tenant registry, plans, global config)
- List of tenant-scoped models (all per-tenant data)

## Workflow (numbered steps)

1. Set default connection to 'tenant' in `config/database.php`: `'default' => env('DB_CONNECTION', 'tenant')`
2. For central models (Tenant, Plan, GlobalSetting), override: `protected $connection = 'central'`
3. For tenant-scoped models, let them use the default 'tenant' connection
4. For dynamic connection resolution, override `getConnectionName()` on models that may use different connections based on instance data
5. In service provider, resolve 'tenant' connection lazily (only when first used)

## Validation Checklist

- [ ] Central models use 'central' connection
- [ ] Tenant models use 'tenant' connection
- [ ] Dynamic connection resolution works for edge cases
- [ ] No model uses wrong connection in production

## Common Failures

- Model inherits wrong default connection
- Central model tried to query tenant connection (table doesn't exist)
- Dynamic connection resolved incorrectly for cached model instances

## Decision Points

- Default connection: central vs tenant
- Explicit connection declaration vs dynamic resolution

## Performance Considerations

- Connection resolution is cached by Laravel — zero overhead after first access
- Dynamic resolution per model instance adds negligible overhead

## Security Considerations

- Central model data (tenant registry) must not be accessible to tenant-scoped queries
- Ensure tenant models cannot accidentally query central tables

## Related Rules

- 5-25-1: Always Purge Tenant Connection After Config Change

## Related Skills

- Implement Tenant Bootstrapper Pattern
- Implement Dynamic Connection Configuration

## Success Criteria

- All models use correct connection automatically
- Zero accidental central-to-tenant or tenant-to-central queries
- Dynamic resolution handles all edge cases
