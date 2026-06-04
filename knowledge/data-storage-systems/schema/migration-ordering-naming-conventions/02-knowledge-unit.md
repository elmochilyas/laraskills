# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.6 Migration ordering and naming conventions (YYYY_MM_DD_HHmmss)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Migration execution order is determined by filename sorting. The `YYYY_MM_DD_HHmmss` timestamp prefix ensures deterministic ordering. Naming conventions encode intent (create, alter, add, drop) and help teams understand migration purpose from filenames. Incorrect ordering causes FK constraint failures when referenced tables don't exist yet.

---

# Core Concepts

- **Timestamp prefix**: `2026_06_02_000000_create_users_table.php`. Laravel generates this via `date('Y_m_d_His')`.
- **Name components**: Timestamp + action + target (e.g., `create_`, `alter_`, `add_`, `drop_`, `change_`) + descriptive name.
- **Collision handling**: If two developers create migrations in the same second, the sort order is then alphabetical by the rest of the name. Anonymous classes (Laravel 9+) prevent class name collisions but not ordering collisions.
- **Ordering fixes**: If a migration needs to run before another, manually prepend a slightly earlier timestamp. Use `migrate:status` to verify order.

---

# Mental Models

Migration ordering is like a commit history for the database schema. The timestamp is the commit date. You can't apply a commit that references a table that doesn't exist yet. The naming convention is the commit message.

---

# Internal Mechanics

`php artisan migrate` reads files from `database/migrations/` sorted by full filename string ascending. This means `2026_01_01_000000_create_a.php` runs before `2026_01_01_000001_create_b.php`. The `migrations` table tracks which filenames have been executed. Once a filename is recorded, it will never be executed again (even if the file content changes). This is why editing a deployed migration is ineffective.

---

# Patterns

**Reference tables before referencing tables**: The table referenced by a FK must exist before the table with the FK. Name migrations so `create_authors` (timestamp: 000000) comes before `create_books` (timestamp: 000001) if `books` has a FK to `authors`.

**Verb prefix convention**: `create_table` for new tables, `add_column_to_table` for new columns, `drop_column_from_table` for removals, `change_column_on_table` for modifications, `add_index_to_table` for indexes.

**Aggressive timestamps**: Laravel uses `HHiiss` down to the second. If ordering is critical, manually set the seconds to ensure correct order.

---

# Architectural Decisions

| Practice | When | When Not |
|----------|------|----------|
| Verb prefix naming | Always — improves readability | Tiny projects with < 10 migrations |
| Manual timestamp adjustment | FK ordering requires it | Most migrations (default timestamps suffice) |
| Group related migrations in same batch | Deploy atomic schema changes | Independent changes |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Deterministic ordering | Timestamp management for FK dependencies | Rare manual timestamp adjustment
Self-documenting names | Longer filenames | Readability benefit outweighs length
No re-ordering after deploy | Cannot fix ordering mistakes without new migration | Must create a new migration

---

# Performance Considerations

Not applicable directly — naming and ordering don't affect query performance. However, incorrect ordering that causes FK failures in CI wastes development time.

---

# Production Considerations

**Never rename migration files** after they've been deployed to any environment. The `migrations` table records the filename — renaming creates a new filename that won't match the recorded entry, preventing rollback.

**Batch ordering**: All migrations run in the same `migrate` command share the same batch number. Use `--step` to give each migration its own batch number for granular rollback.

---

# Common Mistakes

**Duplicate timestamp**: Two migrations with the same timestamp cause unpredictable ordering. Always run `migrate:status` after creating migrations in a team setting.

**Poor naming**: `2026_06_02_000000_some_changes.php` — the name doesn't communicate what changes are made. This becomes unmanageable at scale.

---

# Failure Modes

- **FK dependency failure**: Migration references a table that doesn't exist yet. Error: `General error: 1215 Cannot add foreign key constraint`. Fix by adjusting the timestamp so the referenced table's migration runs first.
- **Renamed migration file**: File renamed after deployment. Rollback fails because `down()` is called on the original class name, which no longer exists at the new path.

---

# Ecosystem Usage

Laravel Nova and Forge both respect migration ordering conventions. Stancl/tenancy's migration fan-out preserves the original ordering from `database/migrations/`.

---

# Related Knowledge Units

1.1 Migration file structure | 1.7 Migration batch tracking | 1.4 Foreign key definition

---

# Research Notes

The timestamp ordering requirement is a frequent source of CI failures in team environments. The most robust solution is to always `php artisan make:migration` and never manually create migration files — this guarantees unique timestamps. Reserve manual timestamp adjustment for cross-developer FK ordering dependencies.
