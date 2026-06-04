# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Database Testing
Knowledge Unit: Database Assertion Methods
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Database assertion methods verify database state after test actions: record existence, field values, soft deletes, counts, and absence. Laravel provides `assertDatabaseHas()`, `assertDatabaseMissing()`, `assertSoftDeleted()`, `assertModelExists()`, `assertDatabaseCount()`, and `assertDatabaseEmpty()`. These assertions serve as the primary mechanism for verifying side effects of write operations (create, update, delete) in feature tests.

# Core Concepts
- **`assertDatabaseHas($table, $data)`**: Asserts a row exists in the given table matching the data array. Partial match (only checks specified columns).
- **`assertDatabaseMissing($table, $data)`**: Asserts no row matches the criteria.
- **`assertSoftDeleted($table, $data)`**: Asserts a row exists with non-null `deleted_at`.
- **`assertModelExists($model)`**: Asserts the given Eloquent model instance exists in the database (checks primary key).
- **`assertDatabaseCount($table, $count)`**: Asserts the table has exactly N rows.
- **`assertDatabaseEmpty($table)`**: Asserts the table has zero rows.
- **Table name resolution**: Methods accept both string table names and Eloquent model class names.
- **Connection specification**: Methods accept optional database connection name: `assertDatabaseHas('users', [...], 'pgsql')`.

# Mental Models
- **Database assertion as side-effect verification**: The database is the source of truth. Assertions verify that write operations had the intended effect.
- **Partial match by default**: `assertDatabaseHas('users', ['email' => 'a@b.com'])` checks only the email column. Other columns are ignored.
- **Read after write pattern**: Write operation ? retrieve from DB ? assert. Database assertions replace the "retrieve" step.
- **Count as structural assertion**: `assertDatabaseCount('users', 1)` verifies the total state. Use for create/delete operations.

# Internal Mechanics
- **`assertDatabaseHas()`**: Runs `DB::table($table)->where($data)->exists()`. `$data` is an associative array of column ? value. All conditions must match (AND).
- **`assertDatabaseMissing()`**: Same query but asserts `!exists()`.
- **`assertSoftDeleted()`**: Builds query with `whereNotNull('deleted_at')` in addition to `$data`.
- **`assertModelExists()`**: Uses `$model->exists` check after loading from database (calls `Model::find($model->getKey())`).
- **`assertDatabaseCount()`**: `DB::table($table)->count()`.
- **Connection support**: All methods pass `$connection` parameter to `DB::connection()` for multi-database setups.
- **Table name resolution**: If a model class is passed, uses `(new $model)->getTable()`. If a string, uses it directly.

# Patterns
- **Pattern: Create and verify**
  - Purpose: Assert a record was created correctly
  - Benefits: Validates database write behavior
  - Tradeoffs: Only checks explicitly specified columns
  - Implementation: `$this->post('/users', $data); $this->assertDatabaseHas('users', ['email' => $data['email']])`

- **Pattern: Update and verify**
  - Purpose: Assert a record was updated correctly
  - Benefits: Validates edit operations
  - Tradeoffs: Must know the record ID
  - Implementation: `$this->put("/users/{$user->id}", ['name' => 'New']); $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'New'])`

- **Pattern: Soft delete verification**
  - Purpose: Assert soft delete timestamp was set
  - Benefits: Validates deletion behavior
  - Tradeoffs: `assertSoftDeleted` only checks `deleted_at` timestamp
  - Implementation: `$this->delete("/users/{$user->id}"); $this->assertSoftDeleted('users', ['id' => $user->id])`

- **Pattern: Record absence after delete**
  - Purpose: Assert hard delete removed the record
  - Benefits: Validates permanent deletion
  - Tradeoffs: `assertDatabaseMissing` only shows absence, not the delete mechanism
  - Implementation: `$this->delete("/users/{$user->id}"); $this->assertDatabaseMissing('users', ['id' => $user->id])`

# Architectural Decisions
- **`assertDatabaseHas()` vs Eloquent `find()`**: `assertDatabaseHas()` is simpler for existence checks. Use Eloquent `find()` + `assertNotNull()` when you need to inspect the model.
- **Table name vs model class reference**: Use model class (e.g., `User::class`) for refactoring safety. Use string table names for raw pivot tables or non-Eloquent tables.
- **Connection parameter**: Always specify the connection in multi-database setups. `assertDatabaseHas('users', $data, 'tenant')` for tenant-specific databases.
- **Date/time comparisons**: Database stores timestamps in UTC. Use `Carbon` for date comparisons in assertions: `assertDatabaseHas('users', ['created_at' => now()])`.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Simple existence checks are fast and readable | Cannot verify complex conditions (OR, nested) | Use Eloquent queries for complex assertions |
| Table name resolution is flexible | String table names bypass refactoring tools | Prefer model class references |
| Soft delete assertion is convenient | Only checks `deleted_at`, not `deleted_by` or reason | Add manual `assertDatabaseHas` for additional fields |
| Count assertions verify aggregate state | Cannot verify specific records within the count | Combine with `assertDatabaseHas` for record-specific checks |

# Performance Considerations
- `assertDatabaseHas()`: Executes one `SELECT EXISTS` query. <5ms with indexed columns, potentially 10-50ms without index.
- `assertDatabaseCount()`: `SELECT COUNT(*)` — fast on InnoDB with good stats. Slow on large tables without approximate count.
- `assertSoftDeleted()`: Same as `assertDatabaseHas` with an additional `whereNotNull`.
- Multiple assertions in one test: Each assertion is a separate query. 5 assertions = 5 queries. Acceptable for most tests.
- Index impact: Assertions on non-indexed columns are slower on large tables. Ensure test database tables have appropriate indexes.

# Production Considerations
- **CI debugging**: Database assertions produce clear failure messages showing what was expected vs what was found in the database.
- **Large test databases**: `assertDatabaseCount` on tables with thousands of test records can be slow. Truncate between test suites.
- **Soft delete assumption**: `assertSoftDeleted` assumes the timestamp column is `deleted_at`. Override with `SOFT_DELETE_COLUMN` constant on the model if different.
- **Multiple database connections**: Tests using multiple connections must specify the connection in each assertion.

# Common Mistakes
- **Mistake: Not specifying enough columns in assertDatabaseHas**
  - Why: Only checking ID existence
  - Why harmful: Record exists but with wrong values; test passes with incorrect data
  - Better: Assert key fields: `assertDatabaseHas('users', ['id' => $id, 'name' => 'John', 'email' => 'john@test.com'])`

- **Mistake: Using assertDatabaseMissing when record should exist**
  - Why: Misunderstanding of operation effect (soft delete vs hard delete)
  - Why harmful: Soft-deleted records still exist; assertion passes incorrectly
  - Better: Use `assertSoftDeleted` for soft delete scenarios

- **Mistake: Ignoring database connection in multi-DB apps**
  - Why: `assertDatabaseHas('users', [...])` without connection
  - Why harmful: Checks default database instead of tenant-specific database
  - Better: Always pass connection: `assertDatabaseHas('users', [...], 'tenant')`

- **Mistake: Asserting timestamps with exact equality**
  - Why: `assertDatabaseHas('users', ['created_at' => '2026-01-01 00:00:00'])`
  - Why harmful: Database timezone, precision differences cause failures
  - Better: Use `now()->subSecond()` range or Carbon comparison after loading model

# Failure Modes
- **Table not found**: `assertDatabaseHas` on non-existent table throws `QueryException`. Test that migration ran.
- **Ambiguous column reference**: Joins or complex queries in custom assertions may cause ambiguous column errors.
- **Soft deleted column doesn't exist**: Non-soft-delete model passed to `assertSoftDeleted`. Throws `BadMethodCallException`.
- **Database connection not configured**: Multi-database test with undefined connection name. Throws `InvalidArgumentException`.

# Ecosystem Usage
- **Laravel core**: Laravel's test suite uses database assertions extensively for CRUD operation testing.
- **Laravel Spark**: Subscription state changes (active, trialing, canceled) verified with `assertDatabaseHas` on subscriptions table.
- **Spatie packages**: Permission assignments and model role associations use `assertDatabaseHas` on pivot tables.
- **Laravel Nova**: Resource CRUD tests use database assertions to verify creation, updates, and deletion.

# Related Knowledge Units
- **Prerequisites**: Database testing lifecycle, Model factory patterns, Eloquent ORM basics
- **Related Topics**: Query count expectations, Migration testing, Seed data management
- **Advanced Follow-up**: Raw SQL assertion patterns, Multi-tenant database assertions, Complex query verification

# Research Notes
- Laravel's RefreshDatabase trait uses database transactions for test isolation, rolling back changes after each test — this is the fastest approach for MySQL/PostgreSQL
- SQLite in-memory database is a common testing strategy but has limitations: lacks full-text search, JSON functions differ, and some MySQL-specific features are unavailable
- Model factories with relationships require careful fterCreating() callback management to avoid N+1 factory creation during test setup
- ssertDatabaseHas() and ssertDatabaseMissing() are the primary assertion helpers; they query the database directly — ensure test database is properly configured
- Database testing performance: RefreshDatabase with SQLite in-memory runs ~50-100 tests/second; PostgreSQL via transactions runs ~30-60 tests/second
