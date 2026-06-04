# Decision Trees: Multi-Tenancy in Modular Monolith

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Multi-tenancy considerations in modular monolith
- **Knowledge Unit ID:** MMD-14
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Single tenancy strategy for all modules vs per-module strategy | Architecture | Tenancy design |
| 2 | Tenant context on singletons vs per-request parameter | Performance | Service design |
| 3 | Database-per-tenant vs schema-per-tenant vs column-based | Database | Module tenancy choice |

---

## Decision 1: Single tenancy strategy for all modules vs per-module strategy

### Context
Different modules may require different levels of tenant isolation. Billing (PCI compliance) may need database-per-tenant, while Catalog (public product data) may need no tenant isolation. The modular structure enables per-module strategy choice. Centralize tenant resolution infrastructure but decentralize the strategy decision.

### Decision Tree

```
Does the application have fewer than 10 tenants?
├── YES
│   Do any modules have compliance requirements (PCI, HIPAA, GDPR)?
│   ├── YES → Per-module tenancy strategy
│   │   Compliance modules: database-per-tenant
│   │   Non-compliance modules: column-based or none
│   └── NO → Single strategy may be acceptable for operational simplicity
│       Use column-based (simplest shared-tables approach)
└── NO (10+ tenants)
    → Per-module tenancy strategy required
    Module sensitivity differs across domains
    Each module chooses: database-per-tenant, schema-per-tenant, column-based, or none
```

### Rationale
A single tenancy strategy forces all modules into the same isolation level. Compliance modules may need database-per-tenant, while reporting modules may need no isolation. Forcing database-per-tenant on reporting modules adds unnecessary cost. Forcing column-based on compliance modules creates compliance risk. The modular structure is designed to accommodate these differences.

### Recommended Default
Centralized tenant resolution, per-module tenancy strategy

### Risks
- Single strategy for all: unnecessary cost or insufficient isolation
- Too many strategies: operational complexity from multiple tenant approaches
- No documented strategy per module: ambiguity about which modules are tenant-scoped

### Related Rules
- Centralized Resolution, Decentralized Strategy (MMD-14/05-rules.md)
- No Tenant Context on Singletons (MMD-14/05-rules.md)
- Declare Strategy Per Module (MMD-14/05-rules.md)

### Related Skills
- Implement Multi-Tenancy in a Modular Monolith (MMD-14/06-skills.md)
- Implement Database Schema Ownership (MMD-13/06-skills.md)

---

## Decision 2: Tenant context on singletons vs per-request parameter

### Context
Under Octane (or any long-running process model), singleton services persist across requests. Storing tenant context on a singleton causes cross-tenant data leaks — Tenant A's request sets the context, and Tenant B's next request reads it. Tenant context must be passed as method parameters, not stored on singletons.

### Decision Tree

```
Is the application running Octane (or similar long-running process model)?
├── YES
│   Is tenant context stored on any singleton or static property?
│   ├── YES → Cross-tenant data leak risk — refactor immediately
│   │   Pass tenant ID as method parameter instead
│   └── NO → Safe — tenant context is per-request only
│       Verify no static caching of tenant-scoped data
└── NO (traditional PHP-FPM)
    Is migration to Octane planned?
    ├── YES → Design for Octane from start — pass tenant context as parameters
    └── NO → Singleton storage may work, but pattern is fragile
        Document the assumption for future deployment model changes
```

### Rationale
Octane reuses container instances across requests. Any service that stores mutable request state (including tenant context) causes state leakage. The only safe pattern is to pass tenant context as method parameters, not store it on services. This also makes code more testable and explicit.

### Recommended Default
Pass tenant context as method parameters — never store on singletons

### Risks
- Singleton tenant context under Octane: cross-tenant data leaks
- Singleton tenant context under PHP-FPM: fragile — breaks silently if deployment model changes
- Not passing tenant context through contracts: downstream modules cannot scope queries

### Related Rules
- No Tenant Context on Singletons (MMD-14/05-rules.md)
- Pass Tenant Context Through Contracts (MMD-14/05-rules.md)
- Scope All Queries to Tenant (MMD-14/05-rules.md)

### Related Skills
- Implement Multi-Tenancy in a Modular Monolith (MMD-14/06-skills.md)
- Manage Sync Inter-Module Communication (MMD-06/06-skills.md)

---

## Decision 3: Database-per-tenant vs schema-per-tenant vs column-based

### Context
Each module must choose its tenancy isolation strategy. Database-per-tenant provides the strongest isolation (separate database per tenant) but highest operational cost. Column-based (`tenant_id` on shared tables) is simplest but weakest isolation. Schema-per-tenant is PostgreSQL-specific middle ground.

### Decision Tree

```
Does this module handle compliance-sensitive data (PCI, HIPAA, PII)?
├── YES → Database-per-tenant (strongest isolation, audit separation)
│   Can the tenant count support per-database operations?
│   ├── YES (under 1000 tenants) → Database-per-tenant is viable
│   └── NO (1000+ tenants) → Schema-per-tenant (PostgreSQL) or
│       review if database-per-tenant is truly required by compliance
└── NO
    Is the read workload dominated by cross-tenant queries (aggregated reports)?
    ├── YES → Column-based (simplest for cross-tenant queries)
│       Index tenant_id properly; partition large tables
    └── NO
        Does the module use PostgreSQL?
        ├── YES → Schema-per-tenant (good isolation, shared connection pool)
        └── NO → Column-based (simplest approach for MySQL/others)
```

### Rationale
Isolation level should match data sensitivity. Compliance data justifies the operational cost of database-per-tenant. Low-sensitivity data works well with column-based. Schema-per-tenant is the PostgreSQL middle ground. Each module chooses independently.

### Recommended Default
Column-based for non-sensitive modules; database-per-tenant for compliance modules

### Risks
- Database-per-tenant on 1000+ tenants: migration time, connection management overhead
- Column-based without tenant_id index: full table scans on every query
- Schema-per-tenant on MySQL: not supported — requires PostgreSQL

### Related Rules
- Declare Strategy Per Module (MMD-14/05-rules.md)
- Centralized Resolution, Decentralized Strategy (MMD-14/05-rules.md)
- Index Tenant Columns (MMD-14/05-rules.md)
- Test Tenant Isolation (MMD-14/05-rules.md)

### Related Skills
- Implement Multi-Tenancy in a Modular Monolith (MMD-14/06-skills.md)
- Implement Database Schema Ownership (MMD-13/06-skills.md)
- Design Schema Per Context (DBC-06/06-skills.md)
