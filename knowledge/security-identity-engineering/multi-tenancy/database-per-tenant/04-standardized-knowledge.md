# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Multi-Tenancy Security |
| Knowledge Unit | Database-Per-Tenant Isolation Pattern |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

The database-per-tenant pattern provides the strongest data isolation by giving each tenant their own database. Separating databases ensures that even a SQL injection vulnerability or query bug in tenant-scoped code cannot access another tenant's data. This pattern is used for strict compliance (HIPAA, PCI DSS) or when tenants operate at a scale where database-level partitioning is beneficial. The tradeoff: operational complexity increases — migrations must run N times (once per tenant), connection management becomes dynamic, and cross-tenant queries require federated queries or application-level aggregation.

---

## Core Concepts

- **Separate Database**: Each tenant gets their own database (`tenant_{id}`) with the same schema.
- **Dynamic Connection**: The application dynamically selects the correct database connection based on the current tenant.
- **Migration Fan-Out**: Schema changes must be applied to all tenant databases. Run via Artisan command that iterates tenants.
- **Backup N Times**: Each tenant database needs its own backup strategy. Restore is per-tenant.
- **Cross-Tenant Queries**: Queries spanning tenants (admin reports, aggregate analytics) must connect to each database separately.

---

## When To Use

- Regulatory compliance (HIPAA, PCI DSS) requiring database-level isolation
- Tenants with very large datasets that benefit from separate database management
- High-value enterprise customers requiring dedicated database resources
- When shared-database isolation is deemed insufficient for the threat model

## When NOT To Use

- Most SaaS applications — shared database with global scopes is simpler and sufficient
- Early-stage products (operational overhead of per-tenant migration fan-out)
- Applications needing cross-tenant analytics (aggregation is complex across separate databases)
- When database cost is a concern (N databases instead of 1)

---

## Best Practices

- **Start with Shared DB**: Migrate to database-per-tenant only when requirements demand it. Premature adoption adds significant operational complexity.
- **Automated Migration Fan-Out**: Write an Artisan command that runs migrations on all tenant databases. Include a `--tenant` flag for single-tenant migration.
- **Connection Pooling**: Use dynamic database connections — do not create a persistent connection per tenant.
- **Backup Automation**: Automate per-tenant backups. Restore drills should be per-tenant.
- **Monitoring Each Database**: Monitor query performance, disk usage, and replication lag per tenant database.

---

## Architecture Guidelines

- Dynamic connection: resolve tenant → get database name → create connection at runtime
- Migration strategy: central migration command iterates tenants, runs migrations on each
- Tenant creation: Artisan command creates database, runs migrations, seeds initial data
- Connection config: store tenant database credentials in tenant record (encrypted) or derive from tenant ID
- Admin tools: admin connects to each tenant DB individually for data investigation

---

## Performance Considerations

- No cross-tenant query interference — each tenant has dedicated database resources
- Connection overhead: dynamic connection resolution adds ~5-10ms per request
- Connection pooling: use persistent connections to avoid repeated connection setup
- Migration fan-out: 1,000 tenants = 1,000 migration runs — sequential for consistency, limit parallelism

---

## Security Considerations

- **Strong Isolation**: Database-level separation means a SQL injection in tenant A's context cannot affect tenant B's data.
- **Connection String Security**: Tenant database credentials must be encrypted at rest and decrypted in memory only when needed.
- **Backup Security**: Tenant database backups must be isolated per tenant — no cross-tenant backup access.
- **Audit Isolation**: Audit logs must be per-tenant or include `tenant_id` for cross-database tracing.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Starting with per-tenant DB prematurely | Assuming it's more secure | Unnecessary operational overhead | Start with shared DB; migrate when needed |
| Not automating migration fan-out | Manual tenant migration | Some tenants have outdated schema | Write fan-out command as part of deployment |
| Static database connections | Hardcoded connections | New tenants require config changes | Use dynamic connection resolution |
| No connection pooling | Creating new connection per request | Performance degradation | Use persistent connection pool |

---

## Anti-Patterns

- **Shared user table across databases**: User authentication must work across tenants — keep a central auth database or use tenant-scoped auth
- **Manual per-tenant migration**: Error-prone and unscalable — always automate
- **Same backup for all tenants**: Data is isolated — backups must be isolated too

---

## Examples

**Dynamic connection:**
```php
// config/tenancy.php or service provider
public function configureTenantConnection(Tenant $tenant): void
{
    config(['database.connections.tenant' => [
        'driver' => 'mysql',
        'host' => env('DB_HOST'),
        'port' => env('DB_PORT'),
        'database' => "tenant_{$tenant->id}",
        'username' => env('DB_USERNAME'),
        'password' => env('DB_PASSWORD'),
        'charset' => 'utf8mb4',
    ]]);
    
    DB::purge('tenant');
    DB::reconnect('tenant');
}
```

**Migration fan-out command:**
```php
// php artisan tenancy:migrate
public function handle(): void
{
    $tenants = Tenant::all();
    
    $this->info("Running migrations for {$tenants->count()} tenants...");
    
    $tenants->each(function (Tenant $tenant) {
        $this->configureTenantConnection($tenant);
        $this->call('migrate', ['--database' => 'tenant', '--force' => true]);
        $this->info("Tenant {$tenant->id} migrated.");
    });
}
```

---

## Related Topics

- Shared database + global scopes (alternative pattern)
- stancl/tenancy package architecture (scaffolding for this pattern)
- Tenant-aware queues and job context
- Multi-tenancy security testing

---

## AI Agent Notes

- Database-per-tenant is the gold standard for isolation but comes with significant operational cost. Reserve for compliance or scale-driven requirements.
- The most common operational issue is migration fan-out — ensure automation is robust and tested.
- Connection pooling is often overlooked — dynamic connections without pooling degrade performance significantly.

---

## Verification

- [ ] Operational need for per-tenant DB documented (compliance or scale)
- [ ] Dynamic connection resolution implemented
- [ ] Migration fan-out automated (Artisan command in deployment)
- [ ] Tenant database credentials encrypted at rest
- [ ] Connection pooling configured (not new connection per request)
- [ ] Backup automation per tenant
- [ ] Central authentication database or tenant-scoped auth configured
- [ ] Cross-tenant query strategy documented (or admin tools use per-tenant connections)
- [ ] Audit tracking across databases implemented (tenant_id in audit logs)
