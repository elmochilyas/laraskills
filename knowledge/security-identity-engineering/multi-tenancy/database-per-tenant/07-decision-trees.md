# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Multi-Tenancy Security
**Knowledge Unit:** Database-Per-Tenant Isolation Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Database-Per-Tenant vs Shared Database | Isolation level choice | security, operational |
| 2 | Tenant Database Provisioning | Automated tenant database creation | operational, scalability |

---

# Architecture-Level Decision Trees

---

## Database-Per-Tenant vs Shared Database

---

## Decision Context

Choosing between database-per-tenant (physical isolation) and shared database (logical isolation via tenant_id).

---

## Decision Criteria

* security
* operational

---

## Decision Tree

Is regulatory compliance required (HIPAA, PCI DSS, financial data)?
↓
YES → Database-per-tenant (physical isolation required for these regulations)
NO → Is the app an early-stage SaaS?
    YES → Shared database (simpler, faster to build)
    NO → Is tenant data volume very large?
        YES → Database-per-tenant (each tenant's data may need dedicated DB resources)
        NO → Shared database (default for 90%+ of apps)

How many tenants does the application serve?
↓
Few (< 100) → Database-per-tenant feasible (manageable migration fan-out)
Many (1000+) → Shared database (migration fan-out is impractical at scale)

Are cross-tenant admin queries needed (aggregate analytics)?
↓
YES → Shared database (cross-tenant queries are simple SQL joins)
NO → Database-per-tenant acceptable (admin tools connect to each tenant DB)

What is the operational complexity budget?
↓
Low → Shared database (single database, single migration, single backup)
High → Database-per-tenant (N databases, N migrations, N backups)

---

## Rationale

Shared database provides 90% of the isolation with 10% of the operational complexity. Database-per-tenant is only justified when regulatory requirements mandate physical isolation or when tenant data volume requires dedicated database resources. Starting with shared database and migrating to database-per-tenant later is a common and valid evolution path.

---

## Recommended Default

**Default:** Shared database with global scopes for 90%+ of applications; database-per-tenant only for compliance (HIPAA, PCI DSS) or extremely large datasets
**Reason:** Shared database is operationally simpler — single migrations, single backups, easy cross-tenant analytics. Database-per-tenant adds N× operational overhead (migrations, backups, connection management) that is only justified by regulatory or performance requirements.

---

## Risks Of Wrong Choice

- Database-per-tenant for 1000+ tenants: migration fan-out takes hours, connection management is complex
- Shared database for HIPAA: regulatory violation (physical isolation required)
- Database-per-tenant without automated provisioning: manual DB creation errors
- Shared database without tenant_id index: slow queries on large tables

---

## Related Rules

- Use a Central Database for Tenant Metadata (05-rules.md)
- Create and Migrate Tenant Databases Programmatically (05-rules.md)
- Route the Tenant Request to the Correct Database Dynamically (05-rules.md)

---

## Related Skills

- Implement Database-Per-Tenant Isolation Strategy (06-skills.md)

---

## Tenant Database Provisioning

---

## Decision Context

How to automate tenant database creation, migration, and connection management.

---

## Decision Criteria

* operational
* scalability

---

## Decision Tree

Is there a central database for tenant metadata?
↓
YES → Store tenant connection details (encrypted) in central DB
NO → Implement central tenant registry first (required for dynamic routing)

Are new tenants created programmatically (self-service signup)?
↓
YES → Automated provisioning: create DB, migrate, seed in an Artisan command
NO → Can create tenant DBs manually (rare, not recommended)

Is the migration fan-out automated?
↓
YES → `tenants:migrate` command or custom fan-out command
NO → Implement fan-out immediately (manual migration doesn't scale beyond a few tenants)

Are tenant database credentials encrypted at rest?
↓
YES → Use Laravel's `encrypted` cast on the credentials column
NO → Encrypt immediately (central DB breach exposes all tenant DBs)

Is connection pooling configured?
↓
YES → Dynamic connections with persistent pool
NO → Implement pooling (per-request connection creation is slow)

---

## Rationale

Automated provisioning is essential for database-per-tenant — creating a tenant database should be a single Artisan command. The central database stores tenant connection details (encrypted at rest). Dynamic connection resolution in middleware ensures each request connects to the correct tenant database. Migration fan-out must be automated to scale beyond a handful of tenants.

---

## Recommended Default

**Default:** Artisan command for tenant creation (create DB + migrate + seed); central DB with encrypted tenant credentials; dynamic connection middleware; automated fan-out migration command
**Reason:** Automation is the only way to make database-per-tenant viable. Every step of the tenant lifecycle (creation, migration, connection, backup) must be scripted and repeatable. Manual steps do not scale beyond 2-3 tenants.

---

## Risks Of Wrong Choice

- Manual database creation: errors, inconsistencies, no audit trail
- Plaintext credentials in central DB: all tenant databases exposed on central DB breach
- No connection pooling: slow connection setup on every request
- No fan-out automation: tenant databases fall behind on schema changes

---

## Related Rules

- Encrypt Tenant Database Credentials at Rest (05-rules.md)
- Run Tenant Migrations Independently From Central Migrations (05-rules.md)
- Monitor Tenant Database Connections and Resource Usage (05-rules.md)

---

## Related Skills

- Implement Database-Per-Tenant Isolation Strategy (06-skills.md)
