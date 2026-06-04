# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Database Testing
## Knowledge Unit: Database Assertion Methods

---

### Rule 1: Always add `assertDatabaseHas()` after create and update operations

| Field | Value |
|-------|-------|
| **Name** | Verify persistence after write operations |
| **Category** | Data Verification |
| **Rule** | After every create (`post`) or update (`put`/`patch`) HTTP test, include `assertDatabaseHas()` to verify the record was actually persisted with the expected values. |
| **Reason** | An HTTP 200/201 response does not guarantee the data was stored in the database. The controller may respond before storage completes, or the data may be stored with wrong values. Database assertions catch this gap. |
| **Bad Example** | `$this->post('/users', $data)->assertCreated()` — no database verification. |
| **Good Example** | `$this->post('/users', $data)->assertCreated(); $this->assertDatabaseHas('users', ['email' => 'test@test.com']);`. |
| **Exceptions** | Endpoints that process data without persistence (e.g., calculation endpoints). |
| **Consequences Of Violation** | Data may not be stored despite test passing. Silent data loss in production. |

---

### Rule 2: Use `assertSoftDeleted()` for soft-delete models, not `assertDatabaseMissing()`

| Field | Value |
|-------|-------|
| **Name** | Use correct assertion for soft deletes |
| **Category** | Delete Verification |
| **Rule** | For models using `SoftDeletes`, use `assertSoftDeleted()` to verify deletion. Do not use `assertDatabaseMissing()` — soft-deleted records still exist in the database. |
| **Reason** | `assertDatabaseMissing()` queries for a matching row. Soft-deleted rows still exist (with `deleted_at` set), so the assertion passes incorrectly — it thinks the record doesn't exist when it does. |
| **Bad Example** | `$this->delete("/users/{$user->id}"); $this->assertDatabaseMissing('users', ['id' => $user->id])` — passes even if record wasn't soft-deleted. |
| **Good Example** | `$this->delete("/users/{$user->id}"); $this->assertSoftDeleted('users', ['id' => $user->id])`. |
| **Exceptions** | Models with hard deletes (no `SoftDeletes` trait). |
| **Consequences Of Violation** | Soft-delete tests pass when the record was not actually deleted. False sense of security about delete functionality. |

---

### Rule 3: Assert key fields, not just record existence

| Field | Value |
|-------|-------|
| **Name** | Assert field values in database assertions |
| **Category** | Data Verification |
| **Rule** | Include the key fields that were set by the operation in `assertDatabaseHas()`. Do not assert only the ID — that only proves a record exists, not that it has the expected values. |
| **Reason** | Asserting only `['id' => $id]` verifies the record exists but not that it contains the expected data. A create operation that stores empty values still passes an ID-only assertion. |
| **Bad Example** | `assertDatabaseHas('users', ['id' => $user->id])` — doesn't verify field values. |
| **Good Example** | `assertDatabaseHas('users', ['id' => $user->id, 'name' => 'John Doe', 'email' => 'john@test.com'])`. |
| **Exceptions** | When the test only needs to verify record existence (e.g., a delete operation). |
| **Consequences Of Violation** | Tests pass despite incorrect data being stored. Data integrity issues go undetected. |

---

### Rule 4: Specify database connection in multi-database applications

| Field | Value |
|-------|-------|
| **Name** | Pass connection parameter for multi-DB assertions |
| **Category** | Multi-Database |
| **Rule** | When the application uses multiple database connections, always pass the connection name as the third parameter to `assertDatabaseHas()` and `assertDatabaseMissing()`. |
| **Reason** | Database assertions default to the connection configured in `DB_CONNECTION`. In multi-database apps, the default connection may not be the one the operation wrote to, causing test failures or false positives. |
| **Bad Example** | `assertDatabaseHas('orders', [...])` — checks default connection, not the tenant connection. |
| **Good Example** | `assertDatabaseHas('orders', [...], 'tenant')` — explicitly checks the tenant database. |
| **Exceptions** | Single-database applications. |
| **Consequences Of Violation** | Tests check the wrong database. False positives: data exists in tenant DB but assertion checks default DB and reports it missing. |

---

### Rule 5: Prefer model class references over string table names

| Field | Value |
|-------|-------|
| **Name** | Use model class for table reference |
| **Category** | Refactorability |
| **Rule** | Use `assertDatabaseHas(User::class, [...])` instead of `assertDatabaseHas('users', [...])`. |
| **Reason** | Model class references survive table renames. If the model's table changes (e.g., from `users` to `accounts`), string-based assertions break silently while class-based assertions continue working. |
| **Bad Example** | `assertDatabaseHas('users', ['email' => 'test@test.com'])`. |
| **Good Example** | `assertDatabaseHas(User::class, ['email' => 'test@test.com'])`. |
| **Exceptions** | Non-Eloquent tables (pivot tables, raw database tables without models). |
| **Consequences Of Violation** | Table renames break all string-based database assertions. Each rename requires updating every test file. |

---

### Rule 6: Use range-based comparison for timestamp assertions

| Field | Value |
|-------|-------|
| **Name** | Avoid exact timestamp equality |
| **Category** | Time Assertions |
| **Rule** | For timestamp fields (`created_at`, `updated_at`, `deleted_at`), use range-based comparison (e.g., `['created_at' => now()->subSecond()]`) instead of exact equality. |
| **Reason** | Database timestamps may differ from PHP timestamps due to timezone settings, fractional second precision, or processing delay. Exact equality fails on these differences. |
| **Bad Example** | `assertDatabaseHas('users', ['created_at' => now()])` — may fail due to microsecond differences. |
| **Good Example** | `assertDatabaseHas('users', ['created_at' => now()->subSecond()])` — allows 1-second tolerance. |
| **Exceptions** | When using `Carbon::setTestNow()` to freeze time — timestamps are deterministic in that context. |
| **Consequences Of Violation** | Tests fail intermittently due to timezone, precision, or timing differences. |

---

### Rule 7: Always assert database state after delete operations

| Field | Value |
|-------|-------|
| **Name** | Verify deletion with database assertions |
| **Category** | Delete Verification |
| **Rule** | After every delete HTTP test, add `assertDatabaseMissing()` (hard delete) or `assertSoftDeleted()` (soft delete) to verify the record was actually removed. |
| **Reason** | An HTTP 200/204 response does not guarantee the record was deleted. The controller may respond before deletion completes, or the deletion may silently fail. Database assertion catches this. |
| **Bad Example** | `$this->delete("/posts/{$post->id}")->assertOk()` — no database verification. |
| **Good Example** | `$this->delete("/posts/{$post->id}")->assertOk(); $this->assertDatabaseMissing('posts', ['id' => $post->id]);`. |
| **Exceptions** | Soft-cascade deletions where associated records should still exist. |
| **Consequences Of Violation** | Deletion may silently fail. Orphaned or undeleted records accumulate in production. |
