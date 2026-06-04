# Anti-Patterns: Pivot Table Conventions

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Pivot Table Conventions

## Anti-Patterns

### Auto-Increment ID as Only Primary Key
Using `$table->id()` as the primary key on a pivot table without a unique constraint on the two foreign key columns. This allows duplicate `(user_id, role_id)` pairs silently.

**Problem:** Duplicate relationship rows silently accumulate without detection or prevention.

**Solution:** Use a composite primary key on both FKs: `$table->primary(['role_id', 'user_id'])`.

### Missing Timestamp Sync
Adding `$table->timestamps()` to the pivot migration but forgetting `->withTimestamps()` on the relationship. Timestamp columns exist in the database but are never populated.

**Problem:** Pivot timestamp columns remain `NULL`; lost temporal tracking data.

**Solution:** Call `->withTimestamps()` on the relationship when the pivot migration has timestamp columns.

### Non-Alphabetical Naming
Using `user_role` when the convention expects `role_user` (alphabetical order of singular model names). Causes inconsistency and may break auto-resolution.

**Problem:** Pivot table name doesn't match convention; explicit table name required in every `belongsToMany()` call.

**Solution:** Name pivot tables using singular model names in alphabetical order separated by underscore.

### Plural Model Names in Pivot
Using plural model names (`users_roles`) instead of singular (`role_user`). Laravel's convention uses singular model names for pivot table naming.

**Problem:** Default pivot name resolution fails; must specify table name explicitly.

**Solution:** Always use singular model class names for pivot table naming.

### Pivot Table as Dumping Ground
Adding every conceivable column to the pivot table instead of creating a custom pivot model or separate table. Pivot tables should be lean — too many columns complicate management.

**Problem:** Bloated pivot table with unrelated columns; difficult to maintain and reason about.

**Solution:** Keep pivot tables lean: two FKs, composite PK, and only essential extra columns. Promote rich pivots to custom pivot models.

### Missing Cascade Delete on Pivot FKs
Creating pivot table foreign keys without `ON DELETE CASCADE`. Deleting a model leaves orphaned pivot rows.

**Problem:** Orphaned pivot rows accumulating; data bloat; incorrect query results.

**Solution:** Always chain `->cascadeOnDelete()` on both foreign keys in the pivot migration.
