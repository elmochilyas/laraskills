# When Repositories Help — Skills

---

## Skill 1: Create a Repository with Domain-Owned Interface

### Purpose
Define a repository interface in the domain layer and implement it with Eloquent in the infrastructure layer, abstracting persistence behind domain concepts.

### When To Use
- You have multiple data sources for the same aggregate
- Storage logic is complex (custom serialization, multiple backends)
- You expect to change storage backend within the project's lifetime

### When NOT To Use
- Only one data source exists with no plan for another
- The repository interface would mirror Eloquent's API exactly
- The only reason is "testing" — Laravel's SQLite testing already handles this

### Prerequisites
- Aggregate root identified
- Domain model class (plain PHP or Eloquent)

### Inputs
- Aggregate root name
- Storage operations needed (find, store, delete, custom queries)
- Domain language for method names

### Workflow

1. **Define the repository interface** in `App\Contracts\Repositories\` (or `Domain\Contracts\`)
   - Name methods with domain concepts: `findAllActiveContracts()`, `findOverdueSince()`
   - Return types are domain models or collections — never Eloquent types
   - Accept domain types and primitives — never raw arrays or request input
   - No `Builder`, `Model`, or `Collection` types in signatures
   - Include `$with` parameter for eager loading control

2. **Implement the interface** in `App\Repositories\`
   - Use Eloquent internally
   - Map Eloquent → domain at the boundary
   - Eager-load all required relations before returning
   - Do not manage transactions — let the caller manage them
   - Paginate before mapping, not after

3. **Implement in-memory fake** in `Tests\Fakes\`
   - Same interface, in-memory storage
   - Used in domain service unit tests

4. **Wire the binding** in a service provider

5. **Write contract tests** that run against both implementations

### Validation Checklist

- [ ] Interface methods named with domain concepts (not SQL terms)
- [ ] Interface uses zero Eloquent-specific types
- [ ] Interface includes `$with` parameter for eager loading
- [ ] Implementation eager-loads relations before returning
- [ ] Implementation does not manage transactions
- [ ] In-memory fake exists for testing
- [ ] Binding wired in service provider

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Interface mirrors Eloquent API | Leaky abstraction | Rename to domain concepts |
| Repository manages transactions | Copy-paste from other patterns | Remove; let caller manage |
| No eager loading | Overlooked | Add `with()` before mapping |
| No in-memory fake | Skipped | Create one for testing |

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Design interfaces around domain concepts | `05-rules.md` Rule 1 |
| Rule 3: Keep transactions out of repositories | `05-rules.md` Rule 3 |
| Rule 4: Abstract only when storage varies | `05-rules.md` Rule 4 |
| Rule 5: Accept `$with` parameters | `05-rules.md` Rule 5 |
| Rule 6: Never expose Eloquent types in interface | `05-rules.md` Rule 6 |
| Rule 7: Test with in-memory fakes | `05-rules.md` Rule 7 |
| Rule 8: Use Query Objects for read-only queries | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Implement an In-Memory Repository Fake | Testing companion |
| Audit Existing Repositories for Justification | Evaluating need |

### Success Criteria
- Repository interface uses domain language exclusively
- Two implementations exist: Eloquent + in-memory fake
- Contract tests pass for both implementations
- Repository does not manage transactions

---

## Skill 2: Implement an In-Memory Repository Fake

### Purpose
Create an in-memory implementation of a repository interface that stores data in arrays, enabling fast unit tests without a database.

### When To Use
- A repository has a domain-owned interface
- You want unit tests to run without database setup
- You need fast test feedback for domain logic

### When NOT To Use
- SQLite in-memory testing is already fast enough
- The repository wraps an external API (mock at HTTP level instead)
- The repository has no testable persistence logic

### Prerequisites
- Repository interface defined
- Domain model objects to store

### Inputs
- Repository interface
- Domain model classes

### Workflow

1. **Create the in-memory class** in `Tests\Fakes\InMemory{Name}Repository`

2. **Implement the interface** using an array or collection as storage:
   ```php
   class InMemoryInvoiceRepository implements InvoiceRepository
   {
       /** @var array<int, Invoice> */
       private array $invoices = [];

       public function store(Invoice $invoice): Invoice
       {
           $this->invoices[$invoice->id] = $invoice;
           return $invoice;
       }

       public function findById(int $id): ?Invoice
       {
           return $this->invoices[$id] ?? null;
       }
   }
   ```

3. **Simulate query methods** by filtering the in-memory array

4. **Include the fake in contract tests** — ensure it passes the same suite as the production adapter

5. **Reset state between tests** — use `setUp()` to create a fresh instance

6. **Document limitations** — what the fake cannot simulate (constraints, transactions, locking)

### Validation Checklist

- [ ] In-memory class implements the repository interface
- [ ] All interface methods are implemented (even if simplified)
- [ ] State is reset between tests (fresh instance in `setUp()`)
- [ ] Fake passes the contract test suite
- [ ] Limitations are documented (no constraint enforcement, no transactions)

### Related Rules

| Rule | Reference |
|---|---|
| Rule 7: Test with in-memory fakes | `05-rules.md` Rule 7 |

### Success Criteria
- Fake passes the same contract test suite as the production adapter
- Tests using the fake run without database
- Domain logic tests are fast and isolated

---

## Skill 3: Audit Existing Repositories for Justification

### Purpose
Review every repository in the codebase to determine whether its abstraction is justified, removing those that add cost without benefit.

### When To Use
- You are evaluating whether existing repositories provide value
- The codebase has many repositories and you suspect some are unnecessary
- Before adding a new repository to understand the existing patterns

### Prerequisites
- Access to the full codebase
- Understanding of when repositories help vs. hurt

### Inputs
- List of all repository interfaces and implementations
- Usage patterns across the codebase

### Workflow

1. **List every repository interface** and its implementations

2. **For each repository, answer these questions**:
   - Does the interface have more than one implementation? (production + test fake)
   - Does the interface use domain language or mirror Eloquent API?
   - Is there a realistic scenario where the storage backend would change?
   - Is the repository used from multiple callers or just one?
   - Does the repository do anything beyond thin CRUD wrapping?

3. **Categorize each repository**:
   - **Keep**: Multiple implementations, domain-named methods, or complex persistence logic
   - **Refactor**: Leaky abstraction — rename methods to domain concepts
   - **Remove**: Single implementation, mirrors Eloquent, no storage variation planned

4. **For each "Remove" repository**:
   - Replace interface injection with direct Eloquent usage
   - Remove the interface file
   - Remove the implementation file
   - Remove the service provider binding
   - Update tests to use real database

5. **For each "Refactor" repository**:
   - Rename methods to domain concepts
   - Remove Eloquent types from signatures
   - Add in-memory fake if missing

### Validation Checklist

- [ ] Every remaining repository has a justified abstraction
- [ ] Removed repositories have no remaining references in code
- [ ] Refactored repositories have domain-named methods
- [ ] Each kept repository has at least one alternate implementation planned
- [ ] Tests updated to reflect the changes

### Related Rules

| Rule | Reference |
|---|---|
| Rule 4: Abstract only when storage varies | `05-rules.md` Rule 4 |
| Rule 8: Use Query Objects for read-only queries | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create a Repository with Domain-Owned Interface | The pattern we audit against |
| Remove an Unnecessary Repository Abstraction | Also in "When Repositories Hurt" |

### Success Criteria
- All repository abstractions are justified (multiple backends or complex logic)
- Remaining repositories use domain-named methods
- No repository mirrors Eloquent's API exactly
- Repository count is proportional to actual architectural needs
