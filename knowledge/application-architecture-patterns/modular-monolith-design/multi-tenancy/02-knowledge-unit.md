# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Multi-tenancy considerations in modular monolith
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Multi-tenancy in a modular monolith combines two concerns: tenant isolation (keeping Tenant A's data separate from Tenant B's) and module isolation (keeping Module A's concerns separate from Module B's). The primary challenge is that different modules may require different tenancy strategies—some modules need strict database-per-tenant isolation, while others can share tables with tenant ID columns. A unified approach (applying the same tenancy strategy to all modules) is simpler but may not fit each module's requirements. The modular structure actually helps: each module can implement its own tenancy strategy independently.

---

# Core Concepts

**Tenant isolation strategies:**
- **Database-per-tenant:** Each tenant gets a separate database. Strongest isolation. Complex to manage (migrations across N databases).
- **Schema-per-tenant:** Each tenant gets a separate schema in a shared database. Strong isolation, shared connection pool.
- **Table-per-tenant (discriminator column):** All tenants share tables, identified by a `tenant_id` column. Weakest isolation, simplest to manage.

**Module-specific tenancy:** Some modules may need database-per-tenant (compliance/regulated data) while others are fine with shared tables (configuration, logging). The modular monolith supports this heterogeneity.

---

# Mental Models

**The "Tenant as Context" model:** Each tenant is a separate context within each module. Module A may isolate by database; Module B may isolate by column. The module decides.

**The "Nested Isolation" model:** Module boundaries are the first level of isolation. Tenant boundaries are the second. Module isolation + tenant isolation = two-dimensional isolation.

**The "Different Modules, Different Needs" model:** Billing may need database-per-tenant (financial data compliance). Analytics may share all tenant data (cross-tenant reporting is a feature). Enforcing the same tenancy model across all modules creates unnecessary constraints.

---

# Internal Mechanics

**Scoping module queries by tenant:**
```php
// Central tenant scoping (global scope)
class TenantScopedModel extends Model {
    protected static function booted(): void {
        static::addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id));
    }
}

// Module-specific tenancy
class BillingServiceProvider extends ServiceProvider {
    public function boot(): void {
        if (config('tenancy.billing.strategy') === 'database') {
            // Switch database connection per tenant
        }
    }
}
```

---

# Patterns

**Tenant context provider:** A service that resolves the current tenant and provides it to modules. Tenant context is part of the request, not stored on services (Octane compatibility requirement).

**Module tenancy configuration:** Each module declares its tenancy strategy in its config:
```php
// modules/Billing/config/billing.php
return [
    'tenancy' => [
        'strategy' => 'database',  // database, schema, column
        'column' => 'tenant_id',
        'connection' => 'tenant',
    ],
];
```

**Cross-tenant modules:** Some modules (logging, reporting, audit) may explicitly operate across tenants. These modules skip tenant scoping.

---

# Architectural Decisions

**Centralize tenancy infrastructure, decentralize strategy:** The mechanism for resolving the current tenant is shared. The per-module tenancy strategy is the module's decision.

**Module boundary as tenancy boundary:** A module that needs database-per-tenant should own its database connection configuration. Other modules are unaffected.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Each module uses the right isolation level | Multiple tenancy strategies increase complexity | Developers must understand per-module tenancy |
| Compliance modules can be strictly isolated | Simple modules with column-based tenancy need regular scoping | Forgetting a `where('tenant_id')` leaks data |
| Extraction path preserved | Tenant context must be maintained across module boundaries | Tenant resolution must be consistent everywhere |

---

# Performance Considerations

Database-per-tenant: Connection pooling overhead, migration time scales with tenant count. Schema-per-tenant: Shared connection pool, schema search path configuration cost. Column-based: Index `tenant_id` properly, partitions for large tables.

---

# Production Considerations

Tenant context leaks (one tenant seeing another's data) are the most critical bug class in multi-tenant applications. Architectural tests should verify that all queries include tenant scoping.

---

# Common Mistakes

**One tenancy strategy for all modules:** Forcing database-per-tenant on modules that don't need it adds unnecessary cost. Let each module choose.

**Missing tenant scope in cross-module data access:** Module A calls Module B's contract but forgets to pass tenant context. Module B can't scope its queries.

**Tenant context on singleton services:** Storing the current tenant on a singleton service class causes cross-tenant data leaks under Octane.

---

# Failure Modes

**Cross-tenant data leak:** A query without tenant scoping exposes one tenant's data to another. The most serious multi-tenancy failure. Comprehensive integration testing is essential.

**Migration per-tenant failure:** With database-per-tenant, a migration may succeed on 999 databases and fail on 1. Handling partial migration failure is operationally complex.

---

# Ecosystem Usage

The `tenancy/tenancy` package is the standard multi-tenancy solution for Laravel, supporting database-per-tenant and column-based strategies. The `stancl/tenancy` package is another major option.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-13 Database schema ownership | DBC-06 Schema per context | DBC-11 Multi-context transactions |
| MMD-01 Module vs microservice | CPC-02 Domain events | DBC-12 Eventual consistency |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
