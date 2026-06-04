# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Multi-Tenancy Security |
| Knowledge Unit | stancl/tenancy Package Architecture |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

`stancl/tenancy` is the gold-standard multi-tenancy package for Laravel. It supports both shared-database (tenant_id column) and database-per-tenant isolation patterns. Key features: automatic tenant resolution via domain/subdomain, tenant-scoped caches and filesystems, queue job tenant context serialization, Artisan command routing to tenant databases, and tenancy-specific config overrides. The package operates through middleware (initializes tenant context), a Tenancy facade (access current tenant, initialize/switching), and bootstrappers (apply tenant-scoped config).

---

## Core Concepts

- **Tenant Model**: The `Tenant` Eloquent model stores tenant data (domain, database name, custom attributes).
- **Tenancy Facade**: `tenancy()->initialize($tenant)`, `tenancy()->tenantId()`, `tenancy()->end()`.
- **Middleware**: `InitializeTenancyByDomain` or `InitializeTenancyBySubdomain` — detects tenant from request and initializes context.
- **Bootstrappers**: Classes that configure tenant-scoped services (database connection, cache prefix, filesystem root, Redis prefix, config overrides).
- **Queue Tenant Context**: Jobs dispatched during a tenant request automatically include the tenant ID. The queue worker resolves the tenant before running the job.
- **Data Stores**: How tenant data (domain, database) is stored — Redis (fast, volatile) or database (durable).

---

## When To Use

- Multi-tenant SaaS applications needing reliable tenant isolation
- Projects wanting both shared-database and database-per-tenant support
- Applications requiring domain/subdomain-based tenant resolution
- Enterprise applications needing tenant-scoped cache, storage, and queue isolation

## When NOT To Use

- Simple single-tenant applications (unnecessary complexity)
- Applications with only one tenant (use single-database setup)
- When a lightweight package like `spatie/laravel-multitenancy` suffices

---

## Best Practices

- **Use Domain-Based Resolution**: `InitializeTenancyByDomain` is the most robust tenant resolution strategy.
- **Configure Bootstrappers**: Enable only needed bootstrappers (database, cache, filesystem, redis, queue). Each adds overhead.
- **UUIDs for Tenant IDs**: Use UUIDs — prevents ID guessing and sequential tenant enumeration.
- **Queue Tenant Context Testing**: Verify queue jobs restore tenant context correctly. This is the most common failure mode.
- **Cache Isolation**: Use `Cache::tags()` or prefix-based cache isolation to prevent cross-tenant cache leaks.

---

## Architecture Guidelines

- Install: `composer require stancl/tenancy`
- Publish config: `php artisan tenancy:install`
- Configure middleware: add `InitializeTenancyByDomain` to global HTTP middleware
- Configure bootstrappers in `config/tenancy.php` — `bootstrappers` array
- Tenant model: `php artisan make:tenant` creates the App\Models\Tenant class
- Queue: jobs dispatched in tenant context automatically carry tenant ID

---

## Performance Considerations

- Tenant initialization: domain lookup + bootstrapper execution — ~5-20ms per request
- Cache bootstrapper: adds prefix to cache keys — negligible overhead
- Database bootstrapper: switches database connection — ~1ms
- Queue context serialization: tenant ID stored in job payload — no per-job overhead
- Use Redis data store for faster tenant resolution vs database store

---

## Security Considerations

- **Queue Context** : Jobs without tenant context may operate in the wrong tenant scope. Always verify.
- **Bootstrapper Security**: The `db` bootstrapper switch database connections. Misconfiguration can connect to the wrong database.
- **Overwriting Tenant Data**: Tenant migration commands run on tenant databases — ensure they only affect the intended tenant.
- **Cache Leak Prevention**: Without isolation, cached items from one tenant may be served to another. Use prefix or tags.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not configuring queue tenant context | Assuming auto-initialization | Queue jobs operate in wrong tenant context | Verify `tenancy()` is initialized in queue workers |
| Overloading bootstrappers | Enabling all by default | Performance overhead + potential side effects | Enable only needed bootstrappers |
| Missing cache isolation | Not configuring cache prefix | Cross-tenant cache data leakage | Enable `cache` bootstrapper or use tags |
| Using auto-increment tenant IDs | Default model config | Sequential tenant IDs can be enumerated | Use UUIDs for tenant IDs |

---

## Anti-Patterns

- **Storing tenant data in session**: stancl/tenancy manages tenant context — don't duplicate
- **Manual tenant resolution in controllers**: Use middleware — resolves tenant before controller execution
- **Not testing queue tenant context**: Cross-tenant queue operations are the most common leak source

---

## Examples

**Tenant middleware registration:**
```php
// bootstrap/app.php or Http/Kernel
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class);
})
```

**Bootstrapper configuration:**
```php
// config/tenancy.php
'bootstrappers' => [
    \Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper::class,
    \Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class,
    \Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper::class,
    \Stancl\Tenancy\Bootstrappers\RedisTenancyBootstrapper::class,
],
```

**Accessing current tenant:**
```php
$tenant = tenancy()->tenant;      // Current Tenant model
$tenantId = tenancy()->tenantId(); // Current tenant ID
$domain = tenancy()->tenant->domain;
```

---

## Related Topics

- Shared database + global scopes
- Database-per-tenant isolation
- Tenant-aware queues and job context
- Multi-tenancy security testing

---

## AI Agent Notes

- stancl/tenancy is the most comprehensive multi-tenancy package. If the project uses it, check bootstrapper configuration and queue context handling.
- The domain-based resolution middleware is the most common setup — verify it's in the middleware stack.
- Queue tenant context is the most frequently misconfigured area — always test cross-tenant queue isolation.

---

## Verification

- [ ] stancl/tenancy installed and configured
- [ ] Tenant resolution middleware registered (InitializeTenancyByDomain/Subdomain)
- [ ] Bootstrappers configured appropriately (not all by default)
- [ ] Queue tenant context serialization verified
- [ ] Cache isolation configured (prefix or tags)
- [ ] UUIDs used for tenant IDs
- [ ] Tenant migration commands automated
- [ ] Cross-tenant CI tests exist
- [ ] Filesystem isolation configured (if tenants need separate storage)
