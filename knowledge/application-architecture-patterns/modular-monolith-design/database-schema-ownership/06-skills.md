# Skill: Implement Database Schema Ownership Per Module

## Purpose
Assign every database table to exactly one owning module with prefix naming, no cross-module foreign keys, and database-level permissions, ensuring modules can evolve their schemas independently.

## When To Use
- Always in a modular monolith — every table must have a clear owning module from day one

## When NOT To Use
- Single-module applications (no cross-module boundary exists)

## Prerequisites
- Module boundaries identified
- Table naming convention agreed upon
- Database user management capability

## Inputs
- Module list with owned table prefixes
- Current database schema
- Table registry format

## Workflow
1. **Assign every table to exactly one owning module.** No table may be shared between modules or exist without a designated owner. Cross-cutting infrastructure tables (migrations, cache, sessions) are owned by the application.

2. **Use prefix naming convention for module tables.** Prefix every module table with the module name (`billing_invoices`, `catalog_products`). This enables visual identification and automated enforcement.

3. **Never create cross-module foreign keys.** Store referenced IDs as plain integers/strings without `constrained()` foreign key constraints. Referential integrity is managed by application code.

4. **Document table ownership in a table registry.** Maintain a registry listing every table, its owning module, and contact information. Keep it versioned in the repository.

5. **Run migrations in dependency order.** Declare migration priority in `module.json`. Ensure Module A's migrations run before Module B's when B depends on A.

6. **Use database-level permissions to enforce schema ownership.** Create separate database users per module with access restricted to the module's table prefix. This provides defense-in-depth beyond code-level enforcement.

7. **Clean up orphan tables from disabled modules.** When a module is removed, drop its database tables as part of the cleanup. Retain only tables needed for legal/compliance reasons.

## Validation Checklist
- [ ] Every table has a clear owning module
- [ ] Table naming prefix convention is documented and enforced
- [ ] No cross-module foreign keys exist in the database
- [ ] Module migrations run in documented dependency order
- [ ] Database-level permissions (or equivalent) restrict per-module table access
- [ ] Table registry is maintained and versioned
- [ ] Orphan tables from removed modules are cleaned up

## Common Failures
- **Shared tables.** Tables without an owning module — anyone reads/writes, creating implicit coupling.
- **Cross-module foreign keys.** A column in Module A's table references Module B's table with a database constraint.
- **Migration ordering issues.** Module B's migrations fail because Module A's tables don't exist yet.

## Decision Points
- **Prefix naming vs schema-per-module vs database-per-module?** Prefix naming (default) for simplicity; schema-per-module for PostgreSQL; database-per-module for strongest isolation and extraction readiness.

## Performance Considerations
- Single-database prefix isolation: no performance cost.
- Schema-per-module: adds schema qualification overhead.
- Database-per-module: adds connection overhead for cross-module operations.

## Security Considerations
- Database-level permissions can enforce schema ownership — each module's DB user only accesses its tables.
- Cross-module foreign keys can be exploited for data access beyond intended boundaries.
- Orphan tables may contain sensitive data — ensure secure removal.

## Related Rules
- Rule: Every Table Has an Owning Module (MMD-13/05-rules.md)
- Rule: Prefix Naming Convention (MMD-13/05-rules.md)
- Rule: No Cross-Module Foreign Keys (MMD-13/05-rules.md)
- Rule: Run Migrations in Dependency Order (MMD-13/05-rules.md)
- Rule: Document Table Registry (MMD-13/05-rules.md)
- Rule: Database-Level Permissions (MMD-13/05-rules.md)
- Rule: Clean Up Orphan Tables (MMD-13/05-rules.md)

## Related Skills
- Handle Cross-Module Data Access Without JOINs (MMD-10/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)
- Implement Multi-Tenancy (MMD-14/06-skills.md)
- Design Schema Per Context (DBC-06/06-skills.md)

## Success Criteria
- Every database table has a documented owning module with prefix naming.
- No cross-module foreign keys exist.
- Database permissions restrict per-module table access.
- Migration ordering prevents deployment failures.
