# When Repositories Hurt — Skills

---

## Skill 1: Remove an Unnecessary Repository Abstraction

### Purpose
Delete a repository interface that has only one implementation and adds no abstraction value, replacing it with direct Eloquent usage.

### When To Use
- A repository has one implementation and no realistic plan for a second
- The repository interface mirrors Eloquent's API exactly
- The only justification was "testing" — Laravel already solves this

### When NOT To Use
- The repository has multiple implementations (production + in-memory fake)
- The repository enables swapping storage backends that are actually used
- The repository is a compliance requirement (audit logging of all data access)

### Prerequisites
- Repository interface with exactly one implementation
- List of all places where the repository interface is injected

### Inputs
- Repository interface and implementation files
- All classes that inject the repository interface

### Workflow

1. **Identify the repository** — interface with one implementation, no storage variation need

2. **Find all injection points** — search for `use` statements and constructor injections of the interface

3. **Replace each injection** of the interface with the concrete Eloquent model or a service class:
   ```php
   // Before
   class BillCustomersAction
   {
       public function __construct(
           private InvoiceRepository $invoices,
       ) {}
   }

   // After
   class BillCustomersAction
   {
       public function __construct() {}

       public function __invoke(): void
       {
           $invoices = Invoice::with('customer')
               ->where('status', 'sent')
               ->where('due_at', '<=', now())
               ->get();
       }
   }
   ```

4. **Remove the interface file**

5. **Remove the implementation file** (if no other interface uses it)

6. **Remove the service provider binding**

7. **Update tests** — replace mock repository with real database or factory

### Validation Checklist

- [ ] All interface injection points replaced with direct Eloquent
- [ ] Interface file deleted
- [ ] Implementation file deleted
- [ ] Service provider binding removed
- [ ] No remaining references to the interface
- [ ] Tests use real database or factories

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Forgot one injection point | Missed during search | Search recursively for the interface name |
| Test needs mocking | Old test pattern | Use `RefreshDatabase` + factories |
| Query hidden in action | Inlined without structure | Extract to Query Object if complex |

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: No repository when only one backend | `05-rules.md` Rule 1 |
| Rule 2: Delete if mirrors Eloquent API | `05-rules.md` Rule 2 |
| Rule 4: Delete unused single-implementation interfaces | `05-rules.md` Rule 4 |
| Rule 6: If only for testing, remove | `05-rules.md` Rule 6 |

### Related Skills

| Skill | Relationship |
|---|---|
| Migrate Repository Finder Methods to Query Objects | What to do with complex queries |
| Refactor a Repository Test to Use Real Database | Updating tests after removal |

### Success Criteria
- Repository interface and implementation files deleted
- All callers use direct Eloquent or Query Objects
- Tests pass with real database
- Fewer files to maintain with no loss of capability

---

## Skill 2: Refactor a Repository Test to Use Real Database

### Purpose
Replace mocked repository tests with real database tests using `RefreshDatabase` and model factories, eliminating false positives from mocks.

### When To Use
- Tests mock a repository and assert call patterns instead of actual behavior
- SQL errors in the repository implementation pass tests because mocks hide them
- You want real confidence that data access code works

### When NOT To Use
- Testing external API integrations (mock at HTTP client level)
- Testing code that has no data access at all

### Prerequisites
- Test that mocks a repository
- Model factory for the relevant model(s)
- `RefreshDatabase` trait available

### Inputs
- Test file that mocks a repository
- Model factory definitions

### Workflow

1. **Identify test methods** that create mock repositories

2. **Remove the mock setup** and the `createMock()` / `getMock()` call

3. **Add `use RefreshDatabase`** to the test class

4. **Replace mock expectations** with real model creation:
   ```php
   // Before
   $repo = $this->createMock(InvoiceRepository::class);
   $repo->method('findById')->willReturn($invoice);

   // After
   $invoice = Invoice::factory()->create();
   $retrieved = Invoice::find($invoice->id);
   ```

5. **Assert actual database state** — use `assertDatabaseHas()`, `$model->fresh()`, or query the database:
   ```php
   $this->assertDatabaseHas('invoices', [
       'id' => $invoice->id,
       'status' => 'paid',
   ]);
   $this->assertEquals('paid', $invoice->fresh()->status);
   ```

6. **Remove mock assertions** like `$this->assertTrue($result)`

7. **Run the test** against SQLite in-memory to verify the real query behavior

### Validation Checklist

- [ ] `RefreshDatabase` added to test class
- [ ] Mock repository setup removed
- [ ] Real models created with factories
- [ ] Assertions check actual database state
- [ ] Mock assertion calls removed
- [ ] Test passes against real database (SQLite in-memory)

### Related Rules

| Rule | Reference |
|---|---|
| Rule 3: Test with real databases, not mocks | `05-rules.md` Rule 3 |
| Rule 6: Remove if only for testing | `05-rules.md` Rule 6 |

### Success Criteria
- No mock repositories in the test
- Test creates real models and asserts real database state
- SQL errors in the implementation would be caught by the test
- Test runs against SQLite in-memory (or test database)

---

## Skill 3: Migrate Repository Finder Methods to Query Objects

### Purpose
Extract finder methods from a write-focused repository into separate named Query Objects, keeping the repository focused on aggregate persistence.

### When To Use
- A repository has 5+ finder methods mixed with write methods
- Specific queries are reused across multiple callers
- The repository has become a dumping ground for unrelated queries

### When NOT To Use
- The finder is `findById()` — a fundamental repository operation
- The finder is trivial and only used once
- The query is so tightly coupled to the aggregate that separation adds complexity

### Prerequisites
- Repository with identifiable finder methods
- Query Object pattern (see "Query Object Alternative" skills)

### Inputs
- Repository file with finder methods
- List of which methods are read-only queries
- Callers of each finder method

### Workflow

1. **List every finder method** on the repository

2. **For each finder at 3+ conditions or reused in multiple callers**:
   - Create a Query Object named after the result (Skill 1 of Query Object Alternative)
   - Move the query logic into the query object

3. **Remove the finder method** from the repository interface

4. **Update callers** to inject the Query Object instead of the repository

5. **Keep the repository interface** focused on:
   - `findById()` — fundamental aggregate retrieval
   - `store()` / `save()` — persistence
   - `delete()` — removal

6. **Remove any remaining finder methods** that are only used once and are trivial — inline them in the caller

### Validation Checklist

- [ ] Repository interface now has only persistence methods (`findById`, `store`, `delete`)
- [ ] Each extracted query has its own Query Object class
- [ ] Query Objects have typed parameters and eager loading
- [ ] Callers inject Query Objects for reads and the repository for writes
- [ ] No finder methods remain on the repository
- [ ] Tests pass for both the repository and the new Query Objects

### Related Rules

| Rule | Reference |
|---|---|
| Rule 7: Extract to Query Object for complex queries | `05-rules.md` Rule 7 |
| Rule 8: Never nest transactions | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create a Query Object | The target pattern for extraction |
| Add Caching to a Query Object | Optimization after extraction |

### Success Criteria
- Repository has only persistence methods (findById, store, delete)
- Each distinct query has its own Query Object
- Clear separation: repository for writes, Query Objects for reads
- No query logic mixed with persistence logic
