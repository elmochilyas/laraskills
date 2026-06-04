# Unit of Work — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Unit of Work pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Relying on Eloquent UoW for Cross-Model Atomicity | Critical |
| 2 | Not Wrapping Multi-Model Changes in DB::transaction() | Critical |
| 3 | Long-Lived Model Instances with Stale Originals | High |
| 4 | Modifying Model After save() Expecting Re-track | Medium |
| 5 | UoW Bypass: Raw Queries with Eloquent Models | High |

---

## 1. Relying on Eloquent UoW for Cross-Model Atomicity

### Category
Data Integrity

### Description
Assuming Eloquent's Unit of Work (`save()`) provides atomicity across multiple model saves, when it issues separate statements without transaction wrapping.

### Why It Happens
Developers believe `save()` is atomic because it's "one call." They don't understand Eloquent issues separate INSERT/UPDATE per model.

### Warning Signs
- Multiple `->save()` calls without transaction
- Partial save when exception occurs mid-way
- Some models saved, others not, after error
- No `DB::beginTransaction()` before multi-model saves

### Why Harmful
Without explicit transactions, a failure after the first save leaves partial data. The database is in an inconsistent state.

### Consequences
- Partial persistence
- Data inconsistency
- Failed operations with side effects
- Hard-to-debug transaction issues

### Alternative
Wrap multi-model operations in `DB::transaction()`. All saves either complete or roll back together.

### Refactoring Strategy
1. Identify multi-model save blocks
2. Wrap in `DB::transaction()`
3. Handle rollback on exceptions
4. Verify atomicity in integration tests

### Detection Checklist
- [ ] Check for transaction wrapping on multi-model saves
- [ ] Verify rollback behavior on failure
- [ ] Test partial failure scenarios

### Related Rules/Skills/Trees
- Skills: Unit of Work, Database Transactions

---

## 2. Not Wrapping Multi-Model Changes in DB::transaction()

### Category
Data Integrity

### Description
Making multiple model modifications (save, delete, create) without wrapping them in a database transaction, risking partial persistence.

### Why It Happens
Each individual operation succeeds. Developers don't consider failure scenarios between operations.

### Warning Signs
- Related model changes not in transaction
- Updates across multiple tables without transaction
- No transaction in service methods
- Assumption that all saves will succeed

### Why Harmful
Failure mid-way through multi-model operations leaves inconsistent state. Recovery requires manual cleanup.

### Consequences
- Partial persistence
- Data inconsistency
- Lost operations
- Manual recovery

### Alternative
Wrap all related model changes in `DB::transaction()`. Use `DB::transaction()` closure for auto-commit/rollback.

### Refactoring Strategy
1. Identify multi-model operations
2. Wrap in `DB::transaction()`
3. Handle exceptions appropriately
4. Add integration tests for failure scenarios

### Detection Checklist
- [ ] Scan for related model changes without transaction
- [ ] Verify transaction scoping
- [ ] Test rollback scenarios

### Related Rules/Skills/Trees
- Skills: Unit of Work, Database Transactions

---

## 3. Long-Lived Model Instances with Stale Originals

### Category
Data Integrity

### Description
Holding Eloquent model instances for extended periods (in Octane, long-running processes, across user actions) where the original attribute tracking becomes stale.

### Why It Happens
Eloquent tracks original attribute values for dirty detection. Long-lived instances maintain stale originals, causing incorrect diff computation.

### Warning Signs
- Stale original values causing incorrect updates
- Octane workers with long-held model instances
- Models persisted in session across requests
- Unexpected attribute changes in updates

### Why Harmful
Stale originals may cause: (a) fields that weren't changed being included in UPDATE, (b) fields that were changed externally not being detected, (c) incorrect diff computation.

### Consequences
- Incorrect/broken UPDATE statements
- Silent data corruption
- Wasted write operations
- Off-by-one or missed updates

### Alternative
Refresh models from database before modification: `$model->refresh()`. Use `fresh()` for read-only copies. Avoid holding models across long periods.

### Refactoring Strategy
1. Identify long-lived model patterns
2. Add `refresh()` before modification for long-held instances
3. Use `fresh()` for display purposes
4. Avoid storing models in session or cache

### Detection Checklist
- [ ] Check for long-held model instances
- [ ] Verify refresh before modification
- [ ] Monitor Octane/UoW interaction

### Related Rules/Skills/Trees
- Skills: Unit of Work, Eloquent Dirty Detection

---

## 4. Modifying Model After save() Expecting Re-track

### Category
Data Integrity

### Description
Modifying a model property immediately after `save()` and expecting the Unit of Work to track the new change, but the originals were reset to post-save state.

### Why It Happens
After `save()`, Eloquent resets the originals to the current database state (post-save). Subsequent changes are tracked against this new baseline, not the pre-save state.

### Warning Signs
- `$model->save()` followed by property change then `$model->save()`
- Second `save()` not detecting expected changes
- Confusion about dirty detection timing
- Manual `syncOriginal()` calls in code

### Why Harmful
The second save may not detect the change (if the value was already the same as post-save) or may detect a different diff than expected.

### Consequences
- Missing updates
- Confusing behavior
- Debugging confusion
- Subtle bugs

### Alternative
Set all changes before the first `save()`. If post-save changes are needed, understand the new baseline or call `setAttribute()` then `syncOriginal()`.

### Refactoring Strategy
1. Move all changes before first save
2. If post-save changes needed, explicitly handle
3. Review code for post-save modification patterns
4. Add documentation for save-then-modify behavior

### Detection Checklist
- [ ] Scan for save-then-modify patterns
- [ ] Verify understanding of dirty detection
- [ ] Test second save behavior

### Related Rules/Skills/Trees
- Skills: Unit of Work, Eloquent Dirty Detection

---

## 5. UoW Bypass: Raw Queries with Eloquent Models

### Category
Data Integrity

### Description
Using raw database queries (DB facade, raw SQL) to modify data while Eloquent models hold references, bypassing the Unit of Work change tracking.

### Why It Happens
Performance optimization or complex queries that are easier in raw SQL.

### Warning Signs
- `DB::update()` or raw SQL alongside Eloquent model usage
- Model instances with stale data after raw queries
- In-memory state different from database state
- Unexpected model behavior after raw queries

### Why Harmful
Eloquent's Unit of Work doesn't track raw queries. Models hold stale data. In-memory state diverges from database. Subsequent `save()` may overwrite raw query changes.

### Consequences
- Stale in-memory state
- Lost updates (models overwrite raw query changes)
- Data inconsistency
- Hard-to-debug state issues

### Alternative
Within the same transaction, use only Eloquent OR raw SQL, not both. If mixing is necessary, `refresh()` models after raw queries.

### Refactoring Strategy
1. Identify mixed raw + Eloquent patterns
2. Consolidate within same transaction
3. Or add `refresh()` after raw queries
4. Add tests for data consistency
5. Consider using query builder instead of raw SQL

### Detection Checklist
- [ ] Scan for raw SQL alongside Eloquent models
- [ ] Check for model refresh after raw queries
- [ ] Test data consistency between raw and ORM

### Related Rules/Skills/Trees
- Skills: Unit of Work, Raw vs ORM Operations
- Decision Trees: ORM vs Raw Query Choice
