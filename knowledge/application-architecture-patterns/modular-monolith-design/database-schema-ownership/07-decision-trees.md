# Decision Trees: Database Schema Ownership Per Module

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Database schema ownership per module
- **Knowledge Unit ID:** MMD-13
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Prefix naming vs schema-per-module vs database-per-module | Database | Schema design |
| 2 | Cross-module foreign keys vs application-level referential integrity | Database | Table design |
| 3 | Migration dependency ordering strategy | Database | Migration creation |

---

## Decision 1: Prefix naming vs schema-per-module vs database-per-module

### Context
Three strategies for schema ownership isolation: prefix naming (tables prefixed with module name in shared database), schema-per-module (PostgreSQL schemas), and database-per-module (separate connections). The choice depends on database engine, isolation needs, and extraction readiness requirements.

### Decision Tree

```
Is the application using PostgreSQL?
├── YES
│   Is strong schema-level isolation required for compliance?
│   ├── YES → Schema-per-module (PostgreSQL native schema isolation)
│   └── NO → Prefix naming (simpler, portable, no schema overhead)
└── NO (MySQL, MariaDB, SQLite)
    Is module extraction to microservice likely (within 12 months)?
    ├── YES → Database-per-module (extraction-ready, separate connection)
    └── NO → Prefix naming (simplest, no performance cost, enforcement via prefix)
```

### Rationale
Prefix naming is the simplest and most portable strategy — it works on any database engine and enables automated prefix-based enforcement via PHPStan. Schema-per-module provides true namespace isolation for PostgreSQL users. Database-per-module is the strongest isolation but adds connection overhead and is only justified when extraction is imminent.

### Recommended Default
Prefix naming convention (module-based table prefix)

### Risks
- Prefix naming: only convention-based — no database-level enforcement without permissions
- Schema-per-module: couples to PostgreSQL, adds search path overhead
- Database-per-module: multiple connections, cross-module queries require separate connection

### Related Rules
- Every Table Has an Owning Module (MMD-13/05-rules.md)
- Prefix Naming Convention (MMD-13/05-rules.md)
- No Cross-Module Foreign Keys (MMD-13/05-rules.md)

### Related Skills
- Implement Database Schema Ownership Per Module (MMD-13/06-skills.md)
- Handle Cross-Module Data Access Without JOINs (MMD-10/06-skills.md)

---

## Decision 2: Cross-module foreign keys vs application-level referential integrity

### Context
Foreign key constraints between tables owned by different modules are forbidden. They create schema-level coupling visible in the database — you cannot drop Module B's table without first removing Module A's foreign key. Store referenced IDs as plain values and enforce referential integrity in application code.

### Decision Tree

```
Does the foreign key reference a table in another module?
├── YES → Forbidden — use application-level referential integrity
│   Store the referenced ID as a plain integer without `constrained()`
│   Verify existence via service contract call when needed
└── NO (same module) → Foreign key constraints are acceptable
    Is the constraint between two tables owned by the same module?
    ├── YES → Use standard Laravel foreign keys (constrained, cascade)
    └── NO → Re-check module boundaries — tables may have wrong ownership
```

### Rationale
Cross-module foreign keys create the strongest form of schema coupling — the database enforces the relationship across module boundaries. Application-level referential integrity (checking existence via contract calls) gives each module independent schema evolution. The cost is slightly more application code.

### Recommended Default
No cross-module foreign keys; application-level referential integrity

### Risks
- Cross-module FK: schema changes require cross-module coordination
- Application-level integrity: possible orphan references if not consistently checked
- Missing foreign keys: database does not prevent invalid references

### Related Rules
- No Cross-Module Foreign Keys (MMD-13/05-rules.md)
- Every Table Has an Owning Module (MMD-13/05-rules.md)
- Run Migrations in Dependency Order (MMD-13/05-rules.md)

### Related Skills
- Implement Database Schema Ownership Per Module (MMD-13/06-skills.md)
- Handle Cross-Module Data Access Without JOINs (MMD-10/06-skills.md)

---

## Decision 3: Migration dependency ordering strategy

### Context
Module migrations must run in dependency order. Module B's migrations referencing Module A's tables need Module A's tables to exist first. The ordering strategy can be priority-based (priority field in module.json), alphabetical (module name sorting), or dependency-declared (explicit depends-on list).

### Decision Tree

```
Does Module B depend on Module A's tables existing?
├── YES
│   How is migration order controlled?
│   ├── Priority-based (module.json priority field)
│   │   → Most explicit, works with auto-discovery
│   ├── Alphabetical (module name convention)
│   │   → Simple but fragile — renaming a module changes order
│   └── Explicit dependency declaration (module.json depends_on)
│       → Most maintainable — order derived from dependency graph
└── NO (no cross-module table dependencies)
    → Any ordering strategy works; still document to prevent future issues
```

### Rationale
Migration ordering is a deployment concern that fails silently (migration runs fine locally, fails in CI because tables don't exist). Priority-based ordering in module.json is the most reliable strategy because it is explicit, version-controlled, and works with any discovery mechanism.

### Recommended Default
Priority-based ordering with explicit priority values in module.json

### Risks
- Alphabetical order: renaming a module silently changes migration order
- No documented strategy: developers don't know why migrations fail in CI
- Dependency cycle in migrations: Module A needs B's table and B needs A's table — signals shared schema boundary

### Related Rules
- Run Migrations in Dependency Order (MMD-13/05-rules.md)
- Document Table Registry (MMD-13/05-rules.md)
- Prefix Naming Convention (MMD-13/05-rules.md)

### Related Skills
- Implement Database Schema Ownership Per Module (MMD-13/06-skills.md)
- Configure Module Registration (MMD-04/06-skills.md)
- Establish Module Autonomy (MMD-05/06-skills.md)
