# Decision Trees — Resource Testing

---

## Decision: make() vs create() for Resource Unit Tests

---

## Decision Context

Should a resource unit test use `factory()->make()` (in-memory) or `factory()->create()` (persisted to database)?

---

## Decision Criteria

* **Persistence need:** Does the test require database-level operations (relationships, IDs, timestamps)?
* **Test speed:** How important is minimizing test execution time?

---

## Decision Tree

Need to create a model for a resource unit test?

↓

Does the test need relationship loading (eager loading, `load()`, `whenLoaded`)?

YES → Must use `create()` — relationships require persisted models with database IDs

NO → Does the test need auto-increment IDs or database-generated timestamps?

    YES → Must use `create()` — these values come from the database

    NO → Use `make()` — model attributes without database write, 10-100x faster

---

## Rationale

`make()` constructs the model in memory without writing to the database. This eliminates the write query, the transaction, and the cleanup. For resource unit tests that only test transformation logic (field presence, formatting, conditional inclusion), `make()` is sufficient and dramatically faster. `create()` is only needed when the test depends on database-generated values or relationship loading.

---

## Recommended Default

**Default:** Use `make()` for all resource unit tests; use `create()` only when persistence or relationships are required
**Reason:** `make()` is 10-100x faster and sufficient for the vast majority of resource contract tests

---

## Risks Of Wrong Choice

Using `create()` for every test makes the resource test suite 10-100x slower than necessary. A suite of 50 tests takes 50ms with `make()` vs 2-5 seconds with `create()`. This discourages developers from running the tests frequently.

---

## Related Rules

* Rule: Use make() Instead of create() for Unit Tests (resource-testing/05-rules.md)
* Rule: Test Both Inclusion and Omission for Every Conditional (resource-testing/05-rules.md)

---

## Related Skills

* Write Unit Tests for an API Resource (resource-testing/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

---

---

## Decision: Unit Test vs Integration Test for Resource Validation

---

## Decision Context

Should a resource's behavior be tested via a unit test (direct resource instantiation) or an integration test (full HTTP request)?

---

## Decision Criteria

* **Test scope:** Are you testing the resource's output logic or the full endpoint behavior?
* **Speed:** How fast does the test need to execute?
* **Precision:** Do you need a specific assertion on the resource output, or do you need to verify headers, status codes, and middleware?

---

## Decision Tree

Need to test a resource's output?

↓

Are you testing resource-specific logic (field presence, conditional inclusion, relationship state)?

YES → Use a unit test — `(new UserResource($user))->response()->getData(true)` — fast, precise, no routing

NO → Are you testing endpoint behavior (status codes, headers, pagination, authentication)?

    YES → Use an integration test — `$this->getJson('/api/users')` — full HTTP stack

    NO → Are you testing version compatibility (V1 vs V2 field sets)?

        YES → Use a unit test — instantiate version-specific resources directly

---

## Rationale

Unit tests for resources are 10-100x faster than integration tests and provide more precise failure information. When a resource's field is missing, a unit test tells you which field and under what condition. An integration test tells you the HTTP response status differs from what you expected, and you must trace backward.

---

## Recommended Default

**Default:** Use unit tests for resource output logic; use integration tests for endpoint behavior
**Reason:** Unit tests are faster, more precise, and test exactly the resource contract; integration tests add HTTP overhead and imprecision

---

## Risks Of Wrong Choice

Using integration tests for every resource condition creates a slow, brittle test suite where a field omission yields a generic "expected 200, got 422" error. Relying solely on unit tests misses endpoint-level concerns like status codes and headers.

---

## Related Rules

* Rule: Test Resource Contract, Not Internals (resource-testing/05-rules.md)
* Rule: Mirror Production Wrapping in Test Configuration (resource-testing/05-rules.md)

---

## Related Skills

* Write Unit Tests for an API Resource (resource-testing/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

---

---

## Decision: Individual Conditional Tests vs Data Provider for Coverage

---

## Decision Context

Should each conditional field be tested with a dedicated test method, or should all conditionals be covered by a data provider?

---

## Decision Criteria

* **Conditional count:** How many conditional fields does the resource have?
* **Interaction:** Do conditionals interact (field A only present when field B is also present)?
* **Test readability:** Will the data provider be clear and maintainable?

---

## Decision Tree

Need to test conditional fields?

↓

Does the resource have 3 or more conditional fields?

YES → Use a data provider — enumerates all relevant states in one place, avoids 2+n methods

NO → Do any conditionals interact (field A depends on field B's state)?

    YES → Test interactions separately — data provider for independent conditions, dedicated test for interactions

    NO → Use individual methods — 1 test per conditional path (inclusion + omission)

---

## Rationale

Data providers are best for testing independent conditional fields because they enumerate all states in a single visible table. Individual methods are better when conditionals interact because the interaction needs explicit documentation. The threshold is 3+ conditionals — below that, individual methods are simpler; above that, data providers prevent method explosion.

---

## Recommended Default

**Default:** Use data providers for resources with 3+ conditionals; individual methods for simpler resources
**Reason:** Data providers prevent the "one method per conditional path" explosion; individual methods are clearer for simple resources

---

## Risks Of Wrong Choice

Writing individual test methods for 8 conditionals produces 16+ methods (inclusion + omission each), making the test file hard to navigate and maintain. A single data provider covers all 8 conditionals in one method with 16 clear data rows.

---

## Related Rules

* Rule: Use Data Providers for Exhaustive Conditional Coverage (resource-testing/05-rules.md)
* Rule: Do Not Use Snapshots as Sole Contract Validation (resource-testing/05-rules.md)

---

## Related Skills

* Write Unit Tests for an API Resource (resource-testing/06-skills.md)
* Conditional Attributes (conditional-attributes/06-skills.md)
