# Skill: Implement Multi-Tenancy in a Modular Monolith

## Purpose
Provide tenant isolation in a modular monolith where each module can choose its own tenancy strategy (database-per-tenant, schema-per-tenant, or column-based) while centralizing tenant resolution infrastructure.

## When To Use
- Application serving multiple tenants where data isolation matters
- Modules have different data sensitivity levels requiring different isolation strategies

## When NOT To Use
- Single-tenant application (no need for multi-tenancy)

## Prerequisites
- Module boundaries established with schema ownership (MMD-13)
- Tenant resolution mechanism (domain, header, or path-based)
- Octane compatibility considerations

## Inputs
- Tenant isolation requirements per module
- Compliance requirements (PCI, HIPAA, GDPR)
- Tenant count and growth expectations

## Workflow
1. **Centralize tenant resolution infrastructure, decentralize tenancy strategy per module.** Create a shared `TenantResolver` service that resolves the current tenant. Each module declares its tenancy strategy independently in its config.

2. **Never store tenant context on singleton services.** Under Octane, singletons persist across requests — storing tenant context causes cross-tenant data leaks. Pass tenant context as method parameters instead.

3. **Pass tenant context through all cross-module contract calls.** Require tenant ID as a parameter in every contract method operating on tenant-scoped data. The callee uses this context to scope its queries.

4. **Include tenant scoping in all query paths.** Use global scopes, repository patterns, or explicit scoping. Architectural tests should verify all queries include tenant scoping.

5. **Declare tenancy strategy per module explicitly.** Each module must declare its strategy in its configuration: `database_per_tenant`, `schema_per_tenant`, `column_based`, or `none`. Document the rationale.

6. **Index tenant columns properly for performance.** Always index `tenant_id` in column-based tenancy. For large tables, consider partitioning by tenant ID.

7. **Test tenant isolation comprehensively.** Write automated tests verifying Tenant A cannot access Tenant B's data. Test at contract, repository, and API levels.

## Validation Checklist
- [ ] Tenancy strategy per module is documented and configurable
- [ ] Tenant context is never stored on singleton services
- [ ] Tenant context is passed through all contract method calls
- [ ] All queries include tenant scoping (global scope, repository, or explicit)
- [ ] `tenant_id` column is indexed in column-based tenancy
- [ ] Tenant isolation tests exist and pass for all modules
- [ ] Cross-tenant modules (logging, reporting) explicitly skip tenant scoping

## Common Failures
- **One tenancy strategy for all modules.** Forcing database-per-tenant on modules that don't need it — unnecessary cost.
- **Missing tenant scope in cross-module data access.** Module A calls Module B without passing tenant context.
- **Tenant context on singleton services.** Storing tenant on a singleton causes cross-tenant data leaks under Octane.

## Decision Points
- **Database-per-tenant vs schema-per-tenant vs column-based?** Database-per-tenant for PCI/compliance; schema-per-tenant for PostgreSQL; column-based for low sensitivity and operational simplicity.

## Performance Considerations
- Database-per-tenant: connection pooling overhead, migration time scales with tenant count.
- Schema-per-tenant: shared connection pool, schema search path configuration cost.
- Column-based: index `tenant_id` properly, partition large tables.

## Security Considerations
- Cross-tenant data leaks are the most critical bug class in multi-tenant systems.
- Architectural tests should verify all queries include tenant scoping.
- Comprehensive integration testing for tenant isolation is essential.

## Related Rules
- Rule: Centralized Resolution, Decentralized Strategy (MMD-14/05-rules.md)
- Rule: No Tenant Context on Singletons (MMD-14/05-rules.md)
- Rule: Pass Tenant Context Through Contracts (MMD-14/05-rules.md)
- Rule: Test Tenant Isolation (MMD-14/05-rules.md)
- Rule: Declare Strategy Per Module (MMD-14/05-rules.md)
- Rule: Scope All Queries to Tenant (MMD-14/05-rules.md)
- Rule: Index Tenant Columns (MMD-14/05-rules.md)

## Related Skills
- Implement Database Schema Ownership (MMD-13/06-skills.md)
- Design Schema Per Context (DBC-06/06-skills.md)
- Handle Cross-Context Queries (DBC-07/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)

## Success Criteria
- Each module declares its tenancy strategy and implements it consistently.
- Tenant context is passed through all contract calls — never stored on singletons.
- All tenant-scoped queries include tenant filtering.
- Tenant isolation tests prevent cross-tenant data leaks.
