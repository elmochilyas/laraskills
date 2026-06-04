# Eloquent as Adapter — Skills

---

## Skill 1: Create a Domain Model and Eloquent Adapter

### Purpose
Build a persistence-ignorant domain model (plain PHP) and an Eloquent-backed repository that maps between database records and domain objects.

### When To Use
- Complex business rules would be polluted by Active Record concerns
- The domain should be testable without a database
- The domain model and database schema differ significantly

### When NOT To Use
- Domain model and database structure are nearly identical
- Application is simple CRUD with minimal business rules

### Prerequisites
- Understanding of plain PHP classes
- Eloquent model defined for the database table
- Domain namespace structure (`Domain\*`, `Infrastructure\*`)

### Inputs
- Database schema (table name, columns, types)
- Domain concepts (aggregate root name, value objects, invariants)
- Repository interface contract

### Workflow

1. **Define the domain model as a plain PHP class** in `Domain\{Aggregate}\`
   - No `extends Model` — pure PHP
   - Constructor with promoted readonly properties
   - Use `DateTimeImmutable` not Carbon
   - Use value objects not primitives for typed fields
   - No `save()`, `::find()`, or `::query()` methods

2. **Define the repository interface** in `Domain\Contracts\`
   - Methods named by domain concepts: `findById()`, `store()`, `findOverdue()`
   - Return types are domain models or primitives — no Eloquent types
   - Accept typed parameters only — no raw arrays

3. **Create the Eloquent adapter** in `Infrastructure\Persistence\`
   - Implement the repository interface
   - Use Eloquent internally for all database access
   - Map Eloquent records to domain objects at the boundary
   - Eager-load all required relations inside the repository method

4. **Map Eloquent → Domain in `toDomain()` method**
   - Use the same ID as the database record
   - Convert Eloquent types (Carbon, cents) to domain types (`DateTimeImmutable`, `Money`)

5. **Map Domain → Eloquent in a `fromDomain()` or `sync()` method**
   - Write back only the changed fields
   - Preserve the same ID reference

6. **Wire the binding** in a service provider

7. **Write contract tests** — an abstract test suite run against both the Eloquent adapter and an in-memory fake

### Validation Checklist

- [ ] Domain model is a plain PHP class — no `extends Model`
- [ ] Domain model has no `save()`, `::find()`, or `::query()` methods
- [ ] Repository interface has zero Eloquent-specific types
- [ ] Adapter maps Eloquent → Domain at the boundary before returning
- [ ] Same ID used in both representations
- [ ] All required relations eager-loaded in repository method
- [ ] No lazy loading leaks into domain callers
- [ ] Adapter is wired in service provider
- [ ] Contract tests pass for both production and in-memory adapters

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Domain model has `save()` method | Incomplete decoupling | Repository handles all persistence |
| Lazy loading in domain layer | Repository returned Eloquent model | Map to domain before returning |
| Carbon appears in domain | Convenience during mapping | Convert to `DateTimeImmutable` in `toDomain()` |
| Identity drift | Domain model generates new ID | Use database ID in both representations |
| N+1 queries | Relation not eager-loaded in repository | Add `with()` calls before mapping |

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Never extend Model from domain classes | `05-rules.md` Rule 1 |
| Rule 2: Always map at the repository boundary | `05-rules.md` Rule 2 |
| Rule 3: Eager-load all required relations | `05-rules.md` Rule 3 |
| Rule 4: No `use Illuminate\*` in domain | `05-rules.md` Rule 4 |
| Rule 5: Same ID reference | `05-rules.md` Rule 5 |
| Rule 8: Use `DateTimeImmutable` not Carbon | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Implement a Repository with Eloquent Mapping | Direct application of this pattern |
| Enforce Domain Purity with PHPStan | Necessary for maintaining the boundary |

### Success Criteria
- Domain model unit tests run without `RefreshDatabase`
- `Domain\` namespace has zero `use Illuminate\*` or `use App\Models\*` imports
- Repository returns domain models, never Eloquent instances
- Same ID used across both representations
- PHPStan path rules enforce the boundary

---

## Skill 2: Implement a Repository with Eloquent Mapping

### Purpose
Build a repository adapter that uses Eloquent internally but returns domain models, with proper eager loading, pagination, and flexible relation control.

### When To Use
- You need a repository that implements a domain-owned interface
- The repository must eager-load relations before returning domain objects
- Callers need different relation sets per query

### When NOT To Use
- Repository interface mirrors Eloquent API exactly — skip the abstraction
- Only one data source exists and will ever exist

### Prerequisites
- Repository interface defined in domain layer
- Eloquent model for the database table
- Domain model class (plain PHP)

### Inputs
- Repository interface methods
- Eloquent model class name
- Mapping logic between Eloquent and domain models

### Workflow

1. **Create the adapter class** implementing the domain repository interface

2. **For each read method**:
   - Start with the Eloquent query builder
   - Accept optional `$with` array parameter for flexible eager loading
   - Eager-load all required relations (default set + caller-specified)
   - Apply filters, sorting, and pagination BEFORE mapping
   - Call `$this->toDomain()` on each result
   - Return domain models or collections of domain models

3. **For each write method**:
   - Accept domain model as parameter
   - Map domain model back to Eloquent attributes
   - Call `save()` on the Eloquent model
   - Return the domain model with fresh data (use `fresh()` or re-map)

4. **Handle pagination before mapping**:
   ```php
   public function findAllPaginated(int $perPage = 15, int $page = 1): LengthAwarePaginator
   {
       $paginator = EloquentInvoice::with('lines')
           ->paginate(perPage: $perPage, page: $page);
       return $paginator->setCollection(
           $paginator->getCollection()->map(fn ($e) => $this->toDomain($e))
       );
   }
   ```

5. **Provide an in-memory fake** for testing

### Validation Checklist

- [ ] All read methods eager-load required relations
- [ ] Pagination done before mapping — not after
- [ ] `$with` parameter available for caller-specified eager loading
- [ ] Mapping methods (`toDomain`, `fromDomain`) are private or protected
- [ ] Repository never returns Eloquent models or Collections
- [ ] In-memory fake exists and passes the same contract tests

### Related Rules

| Rule | Reference |
|---|---|
| Rule 2: Always map at the repository boundary | `05-rules.md` Rule 2 |
| Rule 3: Eager-load required relations | `05-rules.md` Rule 3 |
| Rule 5: Same ID reference | `05-rules.md` Rule 5 |
| Rule 6: Accept `$with` parameters | `05-rules.md` Rule 6 |
| Rule 7: Paginate before mapping | `05-rules.md` Rule 7 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create a Domain Model and Eloquent Adapter | Precedes this skill |
| Enforce Domain Purity with PHPStan | Maintains the domain boundary |

### Success Criteria
- All read methods return domain models (not Eloquent)
- Pagination applied before mapping
- Eager loading handles both default and caller-requested relations
- In-memory fake passes the same contract test suite

---

## Skill 3: Enforce Domain Purity with PHPStan

### Purpose
Configure PHPStan to reject `use Illuminate\*` and `use App\Models\*` imports in the `Domain\` namespace, and to reject Eloquent types in repository interfaces.

### When To Use
- You have a `Domain\` namespace that must stay framework-free
- You want to catch framework coupling at CI time, not code review
- Multiple developers work on the codebase and need automated enforcement

### Prerequisites
- PHPStan installed and configured
- `Domain\` namespace exists with at least one class
- Custom PHPStan rule capability or `excludePaths` understanding

### Inputs
- Path to Domain namespace
- Path to Infrastructure namespace
- List of allowed exceptions (Symfony Uuid, etc.)

### Workflow

1. **Install a custom PHPStan rule package** or write a custom rule

2. **Configure a disallowed namespace rule** for `Domain/`:
   ```neon
   parameters:
       disallowedNamespaces:
           -   path: 'src/Domain'
               disallowed: 'Illuminate\*'
               message: 'Domain layer must not import framework classes'
           -   path: 'src/Domain'
               disallowed: 'App\Models\*'
               message: 'Domain layer must not import Eloquent models'
   ```

3. **Add a rule for repository interfaces** — no Eloquent types in return signatures

4. **Add a baseline** for documented exceptions (Symfony components used by domain)

5. **Run PHPStan as part of CI** — fail the build on violations

6. **Add a pre-commit hook** to catch violations before pushing

### Validation Checklist

- [ ] PHPStan rule rejects `use Illuminate\*` in `Domain/`
- [ ] PHPStan rule rejects `use App\Models\*` in `Domain/`
- [ ] Baseline file documents allowed exceptions
- [ ] CI pipeline runs PHPStan and fails on violations
- [ ] Pre-commit hook (optional but recommended)
- [ ] Zero PHPStan violations in `Domain/` namespace

### Related Rules

| Rule | Reference |
|---|---|
| Rule 4: No `use Illuminate\*` in domain | `05-rules.md` Rule 4 |
| Rule 8: Use `DateTimeImmutable` not Carbon | `05-rules.md` Rule 8 |

### Success Criteria
- `Domain/` namespace has zero Illuminate imports
- CI fails on any violation
- Developers get immediate feedback on framework coupling
- Baseline documents each allowed exception with justification
