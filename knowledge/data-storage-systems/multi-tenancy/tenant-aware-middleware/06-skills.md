# Skill: Implement Tenant-Aware Middleware

## Purpose

Resolve the current tenant and initialize tenant context early in the request lifecycle, before controllers, services, or models execute.

## When To Use

- Every multi-tenant Laravel application
- Before any tenant-scoped database query or connection switching
- As the central orchestration point for tenant initialization

## When NOT To Use

- Single-tenant applications
- Routes that don't require tenant context (login, registration, webhooks)

## Prerequisites

- Tenant resolution strategy (subdomain, domain, header, auth)
- CurrentTenant singleton class
- Database connection configuration for tenant switching

## Inputs

- HTTP request (for resolution)
- Tenant registry (database or cache)
- Middleware registration order

## Workflow (numbered steps)

1. Create `IdentifyTenant` middleware: extracts tenant identifier, looks up tenant, sets `app(CurrentTenant::class)`
2. Create `SetTenantConnection` middleware (for schema/DB-per-tenant): updates `config(['database.connections.tenant.database' => ...])`, calls `DB::purge('tenant')`
3. Register middleware in `$middlewarePriority` so `IdentifyTenant` runs before `SetTenantConnection`
4. Add middleware to route groups: `->middleware(['tenant']);`
5. Exclude public routes (login, register, password reset) from tenant middleware
6. For Octane, ensure middleware handles connection state per request

## Validation Checklist

- [ ] Tenant resolved before any scoped query runs
- [ ] Connection switching works for all isolation models
- [ ] Public routes work without tenant context
- [ ] Middleware order is correct (IdentifyTenant → SetTenantConnection → StartSession → Authenticate)

## Common Failures

- Middleware runs after Session/StartSession — session depends on tenant DB
- Tenant context leaks between requests in Octane (reset in middleware)
- Connection config not purged — stale PDO reused with wrong credentials

## Decision Points

- Single middleware vs split (IdentifyTenant + SetTenantConnection)
- Global middleware vs route-group middleware

## Performance Considerations

- Middleware adds minimal overhead (tenant key lookup, potentially cached)
- Connection purge + reconnect adds 1-50ms for DB-per-tenant

## Security Considerations

- Public routes must never have tenant context accidentally injected
- Middleware must not leak tenant context between requests in persistent workers

## Related Rules

- 5-6-1: Always Set Tenant Context Before Session
- 5-6-2: Never Apply Tenant Middleware To Public Routes

## Related Skills

- Implement Tenant Resolution Strategies
- Implement Tenant Bootstrapper Pattern
- Implement Dynamic Connection Configuration

## Success Criteria

- Tenant context available in all guarded routes
- Public routes operate without tenant context
- Zero middleware-related data leaks in persistent workers

---

# Skill: Create a CurrentTenant Singleton

## Purpose

Provide a type-safe, globally accessible current tenant object throughout the request lifecycle.

## When To Use

- Any multi-tenant application needing tenant context in services, controllers, and views
- Multiple components reference the current tenant per request

## When NOT To Use

- Simple applications where tenant ID is passed as a parameter everywhere

## Prerequisites

- Tenant model or data object
- Service container configuration

## Inputs

- Tenant ID, name, connection details, plan, features

## Workflow (numbered steps)

1. Create `App\Support\CurrentTenant` class with typed properties: `id`, `name`, `database`, `plan`, `features`
2. Register in service container as singleton: `$this->app->singleton(CurrentTenant::class)`
3. In middleware, resolve tenant and set: `app(CurrentTenant::class)->setFromTenant($tenant)`
4. Create helper function `tenant(): CurrentTenant` for easy access
5. Ensure singleton state is reset between requests in Octane

## Validation Checklist

- [ ] CurrentTenant accessible via `app(CurrentTenant::class)` anywhere
- [ ] Properties are type-hinted (int $id, string $name, etc.)
- [ ] State is reset per request

## Common Failures

- Singleton persists tenant data across requests in Octane
- Null tenant accessed before middleware sets it

## Decision Points

- Simple DTO vs Eloquent model for CurrentTenant
- Helper function vs facade vs app() access

## Performance Considerations

- Singleton access is near-zero overhead
- Avoid serializing/deserializing the full Tenant model

## Security Considerations

- Never store credentials in CurrentTenant if it could be serialized
- Reset all properties between requests

## Related Rules

- 5-6-1: Always Set Tenant Context Before Session

## Related Skills

- Implement Tenant-Aware Middleware
- Implement Tenant Resolution Strategies

## Success Criteria

- CurrentTenant accessible in any service, controller, or view
- Zero cross-request data leaks in persistent workers
- Type safety ensures tenant properties are always accessible
