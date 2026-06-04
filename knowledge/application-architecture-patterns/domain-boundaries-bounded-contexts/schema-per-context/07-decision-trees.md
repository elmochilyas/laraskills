# Decision Trees: Database Schema Per Bounded Context

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Database schema organization per bounded context
- **Knowledge Unit ID:** DBC-06
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Prefix naming vs schema-per-context vs database-per-context | Architecture | Schema organization strategy |
| 2 | Context-specific migrations vs global migrations directory | Architecture | Migration organization |
| 3 | Cross-context FK vs plain integer reference | Architecture | Cross-context table design |

---

## Decision 1: Prefix naming vs schema-per-context vs database-per-context

### Context
Three strategies for partitioning database schema per bounded context: table prefix naming (`billing_invoices`), schema-per-context (PostgreSQL schemas), and database-per-context (separate connections). Each trades off simplicity vs isolation. Prefix naming is the default for Laravel monoliths because it works with any database, requires no configuration changes, and makes ownership visible.

### Decision Tree

```
Is there a plan to extract a context to a separate microservice?
├── YES → Consider stronger isolation
│   Is the team using PostgreSQL?
│   ├── YES → Schema-per-context (prepare for extraction)
│   │   `CREATE SCHEMA billing; CREATE TABLE billing.invoices (...)`
│   │   Easier to extract — just point new service at its schema
│   └── NO → Database-per-context
│       Separate database connection per context
│       Maximum isolation, easiest extraction path
└── NO (staying as monolith for foreseeable future)
    → Use prefix naming (default for Laravel)
    Simplest approach: `billing_invoices`, `identity_users`
    Any database engine, no config changes, no connection management
    Is schema-level isolation needed for compliance?
    ├── YES → Schema-per-context or database-per-context
    │   Compliance (HIPAA, PCI) may require separate databases
    └── NO → Prefix naming is sufficient
```

### Rationale
Prefix naming is the pragmatic default for most Laravel modular monoliths. It works with MySQL, MariaDB, SQLite, and PostgreSQL without any configuration changes. Any developer seeing `billing_invoices` knows the owning context. Schema-per-context and database-per-context offer stronger isolation but add complexity — separate connections, configuration management, and cross-database query restrictions. Start with prefix naming; escalate to stronger isolation only when extraction or compliance demands it.

### Recommended Default
Prefix naming for Laravel modular monoliths; schema-per-context for PostgreSQL monoliths with extraction plans

### Risks
- No prefix: ownership invisible, cross-context queries undetectable
- Inconsistent prefixing: some tables prefixed, others not — confusion
- Database-per-context overhead: connection management, cross-database queries impossible

### Related Rules
- Prefix all table names with the owning context identifier (DBC-06/05-rules.md)
- Apply prefixes consistently to all tables (DBC-06/05-rules.md)
- Govern prefix uniqueness across all contexts (DBC-06/05-rules.md)

### Related Skills
- Organize Database Schema Per Bounded Context (DBC-06/06-skills.md)
- Enforce Model Ownership Per Context (DBC-05/06-skills.md)
- Design Database Schema Ownership (MMD-13/06-skills.md)

---

## Decision 2: Context-specific migrations vs global migrations directory

### Decision Tree

```
Where should database migrations live?
├── In each context's own directory (recommended)
│   `app/Domains/Billing/Database/Migrations/`
│   Context service provider auto-loads them:
│   `$this->loadMigrationsFrom(__DIR__ . '/Database/Migrations');`
│   Pros: colocated with context code, easy to find all context changes
│   Cons: each context needs a service provider
│   Is the context fully modular (with its own service provider)?
│   ├── YES → Context-specific migrations are the right choice
│   └── NO (context doesn't have its own service provider)
│       → Add a service provider first, then move migrations
└── In global `database/migrations/` directory
    → Only for single-context applications
    For multi-context apps, global directory creates problems:
    Migrations from all contexts intermixed
    No clear ownership -> developers add to global directory by habit
```

### Rationale
Colocated migrations keep schema changes with the code that owns them. A developer working on the Billing context finds all Billing migrations in one directory. The context's service provider auto-loads them, so no registration step is needed. Global migrations directory works for single-context apps but becomes a dumping ground in multi-context architectures — migrations from all contexts intermix with no clear ownership. Context-specific directories also enable per-context migration rollbacks and testing.

### Recommended Default
Migrations in context-specific directories, auto-loaded by context service provider

### Risks
- Global migrations for multi-context: intermixed, no ownership, hard to track changes
- Missing service provider: context-specific migrations not auto-loaded
- Migration ordering issues: cross-context migration dependencies between directories

### Related Rules
- Store migrations in context-specific directories (DBC-06/05-rules.md)
- Prefix all table names with the owning context identifier (DBC-06/05-rules.md)
- Register context database connections in the context service provider (DBC-06/05-rules.md)

### Related Skills
- Organize Database Schema Per Bounded Context (DBC-06/06-skills.md)
- Enforce Model Ownership Per Context (DBC-05/06-skills.md)
- Design Modular Monolith Module Registration (MMD-04/06-skills.md)

---

## Decision 3: Cross-context FK vs plain integer reference

### Decision Tree

```
Does the foreign key reference a table owned by a different context?
├── YES → Do NOT create a FK constraint
│   Cross-context foreign keys create database-level coupling
│   Instead, store the reference as a plain integer
│   `$table->unsignedBigInteger('identity_user_id');` — no FK
│   Does the schema need referential integrity?
│   ├── YES → Enforce at application level, not database
│   │   Validate the ID exists in the owning context before saving
│   └── NO → Plain integer is sufficient
└── NO (FK references a table within the same context)
    → FK constraint is fine
    Within-context FKs provide referential integrity
    `$table->foreignId('order_id')->constrained();`
```

### Rationale
Foreign key constraints create database-level coupling between contexts. If Identity context wants to archive old users, a FK from Billing's invoices prevents it. Plain integer references (without FK constraints) allow each context to evolve its schema independently. The tradeoff is losing database-enforced referential integrity, but this is acceptable in exchange for independent evolution. Application-level validation can verify that referenced IDs exist.

### Recommended Default
No FK constraints across context boundaries; plain integer IDs with application-level validation

### Risks
- Cross-context FK: prevents owning context from evolving schema independently
- Plain integer without validation: referencing IDs that don't exist (orphan references)
- Within-context FK missing: losing referential integrity where it's safe and useful

### Related Rules
- Never create cross-context foreign keys (DBC-06/05-rules.md)
- Use foreign keys only within a context (DBC-05/05-rules.md)
- Enforce context prefix ownership with automated checks (DBC-06/05-rules.md)

### Related Skills
- Organize Database Schema Per Bounded Context (DBC-06/06-skills.md)
- Handle Cross-Context Queries Without JOINs (DBC-07/06-skills.md)
- Run Architecture Tests (AEG-01/06-skills.md)
