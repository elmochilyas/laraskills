# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Multi-tenancy considerations in modular monolith
Knowledge Unit ID: MMD-14
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Multi-tenancy in a modular monolith combines two concerns: tenant isolation (keeping Tenant A's data separate from Tenant B's) and module isolation (keeping Module A's concerns separate from Module B's). The primary challenge is that different modules may require different tenancy strategies. The modular structure helps: each module can implement its own tenancy strategy independently. Centralize tenancy infrastructure (tenant resolution), decentralize strategy (per-module choice).

---

# Core Concepts

- **Tenant isolation strategies**: Database-per-tenant (strongest), schema-per-tenant (shared DB, separate schemas), column-based (shared tables with `tenant_id` — simplest).
- **Module-specific tenancy**: Some modules may need database-per-tenant (compliance), others fine with shared tables (logging, config).
- **Tenant context provider**: Service resolving the current tenant, provided to modules. Not stored on singletons (Octane compatibility).

---

# When To Use

- Application serving multiple tenants where data isolation matters. Modular structure enables per-module tenancy strategy choice.

---

# When NOT To Use

- Single-tenant application (no need for multi-tenancy).

---

# Best Practices

- **Centralize tenancy infrastructure, decentralize strategy.** WHY: The mechanism for resolving the current tenant is shared. The per-module tenancy strategy is the module's decision — let each module choose.
- **Never store tenant context on singleton services.** WHY: Under Octane, singletons persist across requests — storing tenant context causes cross-tenant data leaks.
- **Pass tenant context through contract calls.** WHY: Module A calling Module B's contract must pass tenant context so Module B can scope its queries.
- **Test tenant isolation comprehensively.** WHY: Cross-tenant data leaks are the most critical multi-tenancy bug class. Architectural tests should verify all queries include tenant scoping.

---

# Architecture Guidelines

- Each module declares its tenancy strategy in its config (`config(module.tenancy.strategy)`).
- Cross-tenant modules (logging, reporting, audit) explicitly skip tenant scoping.
- Module boundary as tenancy boundary: a module needing database-per-tenant owns its DB connection configuration. Other modules unaffected.
- Tenant context is part of the request, not stored on services.

---

# Performance Considerations

- Database-per-tenant: connection pooling overhead, migration time scales with tenant count.
- Schema-per-tenant: shared connection pool, schema search path configuration cost.
- Column-based: index `tenant_id` properly, partition large tables.

---

# Security Considerations

- Tenant context leaks (one tenant seeing another's data) are the most critical bug class.
- Architectural tests should verify all queries include tenant scoping.
- Comprehensive integration testing is essential for tenant isolation.

---

# Common Mistakes

1. **One tenancy strategy for all modules:** Forcing database-per-tenant on modules that don't need it. Cause: uniformity bias. Consequence: unnecessary cost for simple modules. Better: let each module choose.

2. **Missing tenant scope in cross-module data access:** Module A calls Module B without passing tenant context. Cause: oversight. Consequence: Module B can't scope queries. Better: require tenant context in all contract methods.

3. **Tenant context on singleton services:** Storing tenant on a singleton. Cause: convenience. Consequence: cross-tenant data leaks under Octane. Better: pass tenant context per request.

---

# Anti-Patterns

- **Hardcoded tenant strategy globally**: All modules forced into the same tenancy strategy regardless of need.
- **No tenant isolation tests**: Assuming tenant scoping works without verification.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-13 Database schema ownership | DBC-06 Schema per context | DBC-11 Multi-context transactions |
| MMD-01 Module vs microservice | CPC-02 Domain events | DBC-12 Eventual consistency |

---

# AI Agent Notes

- Generate per-module tenancy strategy configuration.
- Never store tenant context on singleton services.
- Require tenant context parameter in contract method signatures for multi-tenant modules.

---

# Verification

- [ ] Tenancy strategy per module is documented and configurable
- [ ] No tenant context stored on singleton services
- [ ] Tenant context is passed through contract calls
- [ ] All queries include tenant scoping
- [ ] Tenant isolation tests exist and pass
