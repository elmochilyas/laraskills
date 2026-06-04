# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Database Testing |
| Knowledge Unit | Database Assertion Methods |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Database testing lifecycle, Model factory patterns, Eloquent ORM basics |
| Related KUs | Query count expectations, Migration testing, Seed data management |
| Source | domain-analysis.md K007 |

# Overview

Database assertion methods verify database state after test actions: record existence, field values, soft deletes, counts, and absence. Laravel provides `assertDatabaseHas()`, `assertDatabaseMissing()`, `assertSoftDeleted()`, `assertModelExists()`, `assertDatabaseCount()`, and `assertDatabaseEmpty()`. These assertions serve as the primary mechanism for verifying side effects of write operations (create, update, delete) in feature tests.

# Core Concepts

- **`assertDatabaseHas($table, $data)`**: Asserts a row exists matching the data array (partial match).
- **`assertDatabaseMissing($table, $data)`**: Asserts no row matches the criteria.
- **`assertSoftDeleted($table, $data)`**: Asserts a row exists with non-null `deleted_at`.
- **`assertModelExists($model)`**: Asserts the given Eloquent model instance exists in the database.
- **`assertDatabaseCount($table, $count)`**: Asserts the table has exactly N rows.
- **`assertDatabaseEmpty($table)`**: Asserts the table has zero rows.

# When To Use

- After create operations to verify records were inserted correctly
- After update operations to verify field changes
- After delete operations to verify absence or soft delete
- After any operation that should produce database side effects
- For verifying aggregate state (record counts, empty tables)

# When NOT To Use

- For verifying complex conditions (OR logic, nested subqueries) — use Eloquent queries instead
- For verifying computed or derived fields — assert on the model after loading it
- As a substitute for response assertions when the API returns the created data
- With exact timestamp equality — database timezone and precision differences cause failures

# Best Practices (WHY)

- **Assert key fields, not just existence**: `assertDatabaseHas('users', ['id' => $id, 'name' => 'John', 'email' => 'john@test.com'])` verifies the record exists with correct values, not just that a record with that ID exists.
- **Use soft-delete assertions for soft-deletable models**: `assertSoftDeleted()` is explicit about intent. `assertDatabaseMissing()` passes incorrectly for soft-deleted records because they still exist in the database.
- **Specify database connection in multi-database apps**: Always pass the connection parameter in multi-tenant or multi-database setups. Default connection assertions may check the wrong database.
- **Prefer model class references over string table names**: `assertDatabaseHas(User::class, [...])` survives refactoring (table renames). String table names are brittle.
- **Use ranges for timestamp assertions**: `assertDatabaseHas('users', ['created_at' => now()->subSecond()])` avoids timezone and precision mismatches.

# Architecture Guidelines

- **Simple vs complex assertions**: Use `assertDatabaseHas()` for simple existence checks. Use Eloquent `find()` + custom assertions for complex data verification.
- **Table name vs model class**: Use model classes (`User::class`) for refactoring safety. Use string table names for raw pivot tables or non-Eloquent tables.
- **Connection parameter**: Always specify in multi-database setups. Health endpoint pattern: `assertDatabaseHas('users', $data, 'tenant')`.
- **Count assertions**: `assertDatabaseCount()` is useful for aggregate verification but doesn't verify record content. Combine with `assertDatabaseHas` for specific records.

# Performance Considerations

- `assertDatabaseHas()`: Executes one `SELECT EXISTS` query. <5ms with indexed columns.
- `assertDatabaseCount()`: `SELECT COUNT(*)` — fast on InnoDB with good statistics.
- Multiple assertions in one test: Each is a separate query. 5 assertions = 5 queries. Acceptable.
- Index impact: Assertions on non-indexed columns are slower on large tables.

# Security Considerations

- Database assertions in tests don't expose security risks directly.
- Ensure test database doesn't contain sensitive production data.
- Assertion failure messages may reveal database schema. In CI, restrict access to test output.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not specifying enough columns | Only checking ID existence | Record exists but with wrong values; test passes with incorrect data | Assert key fields: id, name, email, status |
| Using assertDatabaseMissing when record should exist | Confusing soft delete vs hard delete | Soft-deleted records still exist; assertion passes incorrectly | Use assertSoftDeleted for soft delete scenarios |
| Ignoring database connection in multi-DB apps | assertDatabaseHas without connection parameter | Checks default database instead of tenant DB | Always pass connection parameter |
| Asserting timestamps with exact equality | Using hardcoded timestamp strings | Database timezone/precision differences cause failures | Use now()->subSecond() range or Carbon comparison |
| Not asserting after delete operations | Only checking response status | Record may not actually be deleted | Add assertDatabaseMissing or assertSoftDeleted after delete |

# Anti-Patterns

- **Asserting only HTTP status without database verification**: Testing that a POST returns 201 but not verifying the record was created. Instead, always add database assertions for write operations.
- **Over-asserting (checking every column)**: Asserting all 20+ columns when only 3 are relevant. Instead, assert only the fields affected by the operation.
- **Hardcoded IDs in assertions**: Using `assertDatabaseHas('users', ['id' => 1])`. Instead, capture the created model's ID from the response or factory.
- **Missing assertions after delete**: Not verifying the record was actually removed. Instead, add absence or soft-delete assertions.

# Examples

```php
// Create and verify
$response = $this->post('/users', [
    'name' => 'John Doe',
    'email' => 'john@example.com',
]);

$response->assertStatus(201);
$this->assertDatabaseHas('users', [
    'name' => 'John Doe',
    'email' => 'john@example.com',
]);
$this->assertDatabaseCount('users', 1);

// Update and verify
$this->put("/users/{$user->id}", ['name' => 'Jane Doe']);
$this->assertDatabaseHas('users', [
    'id' => $user->id,
    'name' => 'Jane Doe',
]);

// Soft delete verification
$this->delete("/users/{$user->id}");
$this->assertSoftDeleted('users', ['id' => $user->id]);

// Hard delete verification
$this->delete("/posts/{$post->id}");
$this->assertDatabaseMissing('posts', ['id' => $post->id]);

// Multi-database assertion
$this->assertDatabaseHas('users', ['email' => 'test@test.com'], 'tenant');
```

# Related Topics

- **Prerequisites**: Database testing lifecycle, Model factory patterns, Eloquent ORM basics
- **Related**: Query count expectations, Migration testing, Seed data management
- **Advanced**: Raw SQL assertion patterns, Multi-tenant database assertions, Complex query verification

# AI Agent Notes

- When writing a feature test that creates, updates, or deletes data, always add database assertions. HTTP response assertions verify the API works; database assertions verify the data was actually changed.
- For new projects, set up a convention: every `post`/`put` test ends with `assertDatabaseHas`, every `delete` test ends with `assertDatabaseMissing` or `assertSoftDeleted`.
- In multi-database applications, the most common assertion mistake is forgetting the connection parameter. Always check which connection the test should use.

# Verification

- [ ] Create operation tests include assertDatabaseHas to verify data was persisted
- [ ] Update operation tests include assertDatabaseHas with changed values
- [ ] Delete operation tests include assertDatabaseMissing (hard delete) or assertSoftDeleted (soft delete)
- [ ] Model class references are preferred over string table names
- [ ] Multi-database tests specify connection parameter
- [ ] Timestamp assertions use range-based comparison, not exact equality
- [ ] assertDatabaseCount verifies expected record counts after CRUD operations
