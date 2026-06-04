# Skill: Verify Database State with Assertions

## Purpose
Write database assertions after CRUD operations to verify records were persisted, updated, or deleted correctly using `assertDatabaseHas`, `assertDatabaseMissing`, `assertSoftDeleted`, and related methods.

## When To Use
- After create operations to verify records were inserted with correct values
- After update operations to verify field changes
- After delete operations to verify absence or soft delete
- After any operation that should produce database side effects

## When NOT To Use
- For verifying complex conditions (OR logic, nested subqueries) — use Eloquent queries
- For verifying derived/computed fields — assert on loaded model
- As a substitute for response assertions when the API returns the created data

## Prerequisites
- Database connection configured
- `RefreshDatabase` or equivalent trait applied
- Understanding of soft delete vs hard delete

## Inputs
- Expected table data after CRUD operations (field names and values)
- Knowledge of which models use `SoftDeletes`
- Database connection names (for multi-database apps)

## Workflow
1. After every `post`/`store` HTTP test, add `assertDatabaseHas()` with key fields that were set — not just ID
2. After every `put`/`patch`/`update` HTTP test, add `assertDatabaseHas()` with the changed field values
3. After every `delete`/`destroy` HTTP test, add `assertDatabaseMissing()` (hard delete) or `assertSoftDeleted()` (soft delete) — an HTTP 200 does not guarantee deletion
4. Use model class references (`User::class`) instead of string table names (`'users'`) for refactoring safety
5. In multi-database applications, always pass the connection name as the third parameter
6. For timestamp assertions, use range-based comparison (`'created_at' => now()->subSecond()`) — never exact timestamp equality
7. Use `assertDatabaseCount()` for aggregate verification and `assertDatabaseEmpty()` for zero-row assertions
8. Assert key fields, not just existence — `['id' => $id]` alone doesn't verify data correctness

## Validation Checklist
- [ ] Create tests include `assertDatabaseHas` with key field values
- [ ] Update tests include `assertDatabaseHas` with changed values
- [ ] Delete tests include `assertDatabaseMissing` or `assertSoftDeleted`
- [ ] Model class references preferred over string table names
- [ ] Multi-database tests specify connection parameter
- [ ] Timestamp assertions use range-based comparison
- [ ] `assertDatabaseCount` verifies expected record counts
- [ ] Not asserting timestamp exact equality

## Common Failures
- Asserting only HTTP status without database verification — data may not be stored
- Using `assertDatabaseMissing` for soft-delete models — soft-deleted records still exist
- Not specifying enough columns — record exists but with wrong values
- Hardcoded IDs in assertions — break when seeding order changes
- Forgetting connection parameter in multi-database apps — checks wrong database

## Decision Points
- `assertDatabaseHas()` with key fields vs mere existence check — always assert key fields
- `assertSoftDeleted()` for soft-delete models vs `assertDatabaseMissing()` for hard delete
- Model class references for refactoring safety vs string table names for non-Eloquent tables

## Performance Considerations
- Each `assertDatabaseHas()` executes one `SELECT EXISTS` query — <5ms with indexed columns
- `assertDatabaseCount()` executes `SELECT COUNT(*)` — fast on InnoDB
- Multiple assertions in one test = multiple queries; acceptable overhead
- Assertions on non-indexed columns are slower on large tables

## Security Considerations
- Assertion failure messages may reveal database schema — restrict CI test output access
- Ensure test database doesn't contain sensitive production data
- Verify sensitive fields (passwords, tokens) are not exposed in assertions

## Related Rules (from 05-rules.md)
- Rule 1: Always add `assertDatabaseHas()` after create and update operations
- Rule 2: Use `assertSoftDeleted()` for soft-delete models, not `assertDatabaseMissing()`
- Rule 3: Assert key fields, not just record existence
- Rule 4: Specify database connection in multi-database applications
- Rule 5: Prefer model class references over string table names
- Rule 6: Use range-based comparison for timestamp assertions
- Rule 7: Always assert database state after delete operations

## Success Criteria
- Every write operation has database assertions verifying actual persistence
- Soft-delete tests use correct assertion method (assertSoftDeleted)
- Tests survive table renames (model class references used)
- Timestamp assertions don't fail on timezone/precision differences
