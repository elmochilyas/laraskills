## Factory vs Seeder Direct Creation

Choosing between using model factories and directly creating records in seeders.

---

## Decision Context

When generating test/seed data, you must decide whether to use model factories or create records directly.

---

## Decision Criteria

* whether the data needs to vary across test runs
* whether the data is reference/static data
* need for relationships between generated records
* performance considerations for bulk creation

---

## Decision Tree

Generating model instances for testing/seeding?

↓

Is this reference/static data that should always exist unchanged?

YES → Use explicit `::create()` in seeders (static, predictable)

NO → Use Model Factory

    Do you need in-memory instances (no DB write)?

    YES → `factory()->make()` or `factory()->raw()`

    NO → `factory()->create()` (persisted)

---

## Rationale

Factories produce varied, realistic data using Faker. Direct creation is for reference data (countries, roles, settings) that must always exist with specific values. Factories model the "shape" of data; direct creation models the "specifics" of data.

---

## Recommended Default

**Default:** Use factories for test data; use direct creation for reference/static seed data
**Reason:** Factories provide variation and relationship handling; direct creation is explicit for static data

---

## Risks Of Wrong Choice

Using factories for reference data yields unpredictable values that break assertions; using direct creation for test data produces brittle tests that break on schema changes.

---

## Related Rules

- Factory definition conventions (from factory-definition standardized knowledge)

---

## Related Skills

- Factory creation and states (factories-and-seeders/06-skills.md)

---

## Factory Creation Method (make vs create vs raw)

Choosing between `make()`, `create()`, and `raw()` for generating factory-sourced data.

---

## Decision Context

When using a factory, you must decide whether to persist the model, keep it in memory, or get only the attribute array.

---

## Decision Criteria

* whether the model needs to exist in the database
* whether model events should fire
* whether only raw attributes are needed (for API testing)
* performance of skipping hydration

---

## Decision Tree

Using a factory to generate data?

↓

Does the model need to exist in the database?

YES → Use `create()`

    Do you need to avoid model events (bulk insert)?

    YES → Use `raw()` + `DB::table()->insert()` (skips events)

NO → Do you need an actual model instance?

    YES → Use `make()` (in-memory, no DB write)

    NO → Use `raw()` (plain array only)

---

## Rationale

`create()` persists the model and triggers events. `make()` creates an in-memory instance without persisting. `raw()` returns a plain array, useful for API tests or bulk inserts where you want to bypass Eloquent hydration overhead.

---

## Recommended Default

**Default:** `create()` when persistence is needed; `make()` for in-memory instances
**Reason:** `create()` is the standard factory workflow; `make()` avoids unnecessary DB writes

---

## Risks Of Wrong Choice

`create()` in loops causing N+1 insert queries; `make()` when the model needs to be referenced by other records.
