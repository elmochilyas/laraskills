# Skill: Organize Database Schema Per Bounded Context

## Purpose
Partition database schema so each context's tables are clearly identified. Use prefix naming as the default strategy. Store migrations in context-specific directories. Govern prefix uniqueness. Enforce with automated checks.

## When To Use
- Prefix naming: default for Laravel modular monoliths
- Schema-per-context: PostgreSQL users wanting stronger isolation
- Database-per-context: extraction to microservice planned

## When NOT To Use
- Inconsistent prefixing (some tables prefixed, others not)
- No prefix at all (ownership is invisible)

## Prerequisites
- Bounded contexts identified with clear ownership boundaries
- Table prefix naming convention documented

## Inputs
- Context prefix registry
- Context migration directories

## Workflow
1. **Prefix all table names with the owning context identifier.** Use `billing_invoices`, `identity_users`, `catalog_products`. This makes context ownership visible at the database level without external documentation.

2. **Store migrations in context-specific directories.** Place migrations in `app/Domains/{Context}/Database/Migrations/`. Context service providers auto-load their own migrations.

3. **Govern prefix uniqueness.** Maintain a prefix registry ensuring each context uses a unique, non-overlapping prefix. Two contexts cannot use the same prefix.

4. **Never create cross-context foreign keys.** Cross-context FKs create database-level coupling. Store cross-context references as plain integers without FK constraints.

5. **Enforce context prefix ownership with automated checks.** Use PHPStan rules or custom linters to verify each table prefix maps to its owning context and no cross-context FKs exist.

6. **Apply prefixes consistently to all tables.** Do not prefix some tables while leaving others unprefixed. Exception: Laravel system tables (migrations, failed_jobs).

7. **Use schema-per-context (PostgreSQL) when microservice extraction is planned.** Schemas provide independent namespaces with separate permission boundaries.

8. **Register context database connections in the context service provider.** Colocate connection configuration with the owning context rather than centralizing everything in `config/database.php`.

## Validation Checklist
- [ ] All tables have context prefix
- [ ] Prefix naming convention is documented and enforced
- [ ] No cross-context foreign keys
- [ ] Migrations in context-specific directories
- [ ] No shared tables between contexts
- [ ] Prefix registry governs unique prefixes
- [ ] Automated checks enforce prefix ownership
- [ ] Context service providers register their connections

## Common Failures
- **Inconsistent prefixing.** Some tables prefixed, others not — ownership unclear.
- **No prefix at all.** All tables in shared namespace — ownership invisible, cross-context queries undetectable.
- **Prefix conflicts.** Two contexts using same prefix — ambiguous ownership.

## Decision Points
- **Prefix naming vs Schema-per-context vs Database-per-context?** Prefix naming for most Laravel monoliths. Schema-per-context for PostgreSQL with extraction plans. Database-per-context for maximum isolation or different DB technologies.

## Performance Considerations
- Prefix naming: no performance cost.
- Schema-per-context: adds schema qualification overhead.
- Database-per-context: adds connection management overhead.

## Security Considerations
- Database-per-context provides strongest data isolation. Prefix naming provides naming-level isolation only.

## Related Rules
- Rule: Prefix all table names with the owning context identifier (DBC-06/05-rules.md)
- Rule: Store migrations in context-specific directories (DBC-06/05-rules.md)
- Rule: Govern prefix uniqueness across all contexts (DBC-06/05-rules.md)
- Rule: Never create cross-context foreign keys (DBC-06/05-rules.md)
- Rule: Enforce context prefix ownership with automated checks (DBC-06/05-rules.md)
- Rule: Apply prefixes consistently to all tables (DBC-06/05-rules.md)
- Rule: Use schema-per-context (PostgreSQL) when microservice extraction is planned (DBC-06/05-rules.md)
- Rule: Register context database connections in the context service provider (DBC-06/05-rules.md)

## Related Skills
- Enforce Model Ownership Per Context (DBC-05/06-skills.md)
- Handle Cross-Context Queries Without JOINs (DBC-07/06-skills.md)
- Design Database Schema Ownership (MMD-13/06-skills.md)
- Run Architecture Tests (AEG-01/06-skills.md)

## Success Criteria
- All application tables have consistent context prefixes (e.g., `billing_`, `identity_`, `catalog_`).
- A prefix registry documents and enforces unique prefix assignments.
- No cross-context foreign key constraints exist in the database.
- Migrations are stored in context-specific directories and auto-loaded by context service providers.
- Automated CI checks enforce prefix conventions and prevent cross-context FKs.
