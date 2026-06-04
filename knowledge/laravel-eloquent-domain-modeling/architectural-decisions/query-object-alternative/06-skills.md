# Query Object Alternative — Skills

---

## Skill 1: Create a Query Object

### Purpose
Build a dedicated invocable class encapsulating a reusable, named database query with typed parameters, eager loading, and pagination.

### When To Use
- A complex query (3+ conditions) is reused in multiple places
- A repository would accumulate too many finder methods
- The operation is read-only and needs explicit parameter control

### When NOT To Use
- The query has 1-2 simple `where` clauses — use a model scope
- The query is used in only one place and is trivial
- The operation involves writes — use an action

### Prerequisites
- Eloquent model defined
- Understanding of model scopes vs. query objects

### Inputs
- What the query should return (domain name)
- Filter parameters and their types
- Relations to eager-load
- Sort and pagination requirements

### Workflow

1. **Name the query object by what it returns**: `OverdueInvoicesQuery`, `UsersByRoleQuery`

2. **Create the class** in `App\Queries\{Domain}\{Name}Query.php`

3. **Accept typed filter parameters** via constructor or `__invoke`:
   ```php
   class OverdueInvoicesQuery
   {
       public function __invoke(
           ?InvoiceStatus $status = null,
           ?\DateTimeImmutable $since = null,
           int $perPage = 15,
       ): LengthAwarePaginator {
           // ...
       }
   }
   ```

4. **Build the query using Eloquent**: apply filters, eager-load relations, sort

5. **Default to pagination**: return `LengthAwarePaginator` or apply `->limit()`

6. **Never call `save()`, `update()`, or `delete()`** — read-only by design

7. **Never apply business logic** — filter and sort only

### Validation Checklist

- [ ] Query object name describes what it returns (e.g., `OverdueInvoicesQuery`)
- [ ] Typed parameters — no raw request input or arrays
- [ ] Eager-loads all needed relations
- [ ] Defaults to pagination or limit
- [ ] No `save()`, `update()`, or `delete()` calls
- [ ] No business logic — filtering and sorting only
- [ ] Tested against a real database with known seed data

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Returns unbounded result set | No pagination/limit | Add defaults |
| N+1 queries downstream | Missing eager loads | Add `with()` calls |
| Business logic in query | Misunderstanding scope | Move to model method or service |
| Mutation in query object | Wrong pattern used | Extract to action class |

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Never write in query objects | `05-rules.md` Rule 1 |
| Rule 2: Typed filter parameters | `05-rules.md` Rule 2 |
| Rule 3: Prefer scopes first, query objects at 3+ conditions | `05-rules.md` Rule 3 |
| Rule 4: Always eager-load | `05-rules.md` Rule 4 |
| Rule 5: Default to pagination | `05-rules.md` Rule 5 |
| Rule 6: No business logic | `05-rules.md` Rule 6 |
| Rule 7: Name by result | `05-rules.md` Rule 7 |
| Rule 8: Cache expensive queries | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Add Caching to a Query Object | Optimization for expensive queries |
| Refactor a Repository Finder to a Query Object | Extracting from repositories |

### Success Criteria
- Query object returns typed, paginated results
- All parameters are typed — no raw input
- No side effects or business logic in the query object
- Tested with seed data against a real database

---

## Skill 2: Refactor a Repository Finder to a Query Object

### Purpose
Extract a finder method from a bloated repository into its own named, testable query object.

### When To Use
- A repository has 5+ finder methods
- A specific query is reused across multiple callers
- The query has grown complex and needs its own test

### When NOT To Use
- The finder is `findById()` — keep it on the repository
- The finder is trivial (1 condition, no joins)
- The finder is only used once and is simple

### Prerequisites
- Repository with finder methods to extract
- Understanding of query object structure (Skill 1)

### Inputs
- Repository interface/class with finder methods
- Which finder method to extract
- List of callers that use the finder method

### Workflow

1. **Identify the finder method** with the most conditions, joins, or reuse

2. **Create a query class named after the result** (e.g., `RecentOrdersByCustomerQuery`)

3. **Move the query logic** from the repository into the query object
   - Copy the query builder chain, filters, eager loads, and sort
   - Convert any raw parameters to typed parameters
   - Add pagination if not present

4. **Replace the repository method** with delegation to the query object (if keeping backward compatibility) or update all callers to inject the query object directly

5. **Remove the finder method** from the repository interface (if no longer needed)

6. **Write tests** for the query object with known seed data

### Validation Checklist

- [ ] Query object has its own file and test
- [ ] Parameters are typed — not raw arrays
- [ ] Eager loading is explicit
- [ ] Pagination is applied with a reasonable default
- [ ] Repository finder method is removed (or deprecated)
- [ ] All callers updated to inject the query object
- [ ] Tests pass with the new implementation

### Related Rules

| Rule | Reference |
|---|---|
| Rule 3: Prefer scopes first, query objects at 3+ conditions | `05-rules.md` Rule 3 |
| Rule 7: Name by result | `05-rules.md` Rule 7 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create a Query Object | Used as the target of refactoring |
| Add Caching to a Query Object | Optimization step after extraction |

### Success Criteria
- Repository has fewer finder methods
- Each extracted query has its own named class and test
- All callers use the query object directly
- No regression in existing functionality

---

## Skill 3: Add Caching to a Query Object

### Purpose
Wrap expensive query object results with caching to reduce database load, deriving cache keys from class name and parameters.

### When To Use
- The query involves 3+ joins, aggregations, or full-text searches
- The query runs on every request and data is stale-tolerant
- The query takes >100ms to execute

### When NOT To Use
- Data must be real-time (current inventory, user balance)
- The query runs infrequently (admin reports)
- The query is already fast (<20ms)

### Prerequisites
- Query object class (Skill 1)
- Laravel cache configured (Redis, file, database)

### Inputs
- Query object to cache
- Acceptable staleness (TTL in seconds or minutes)
- Cache store to use

### Workflow

1. **Derive a cache key** from the class name and serialized parameters:
   ```php
   $cacheKey = sprintf(
       '%s_%s',
       str_replace('\\', '_', static::class),
       md5(serialize(func_get_args()))
   );
   ```

2. **Wrap the query execution** with `Cache::remember()`:
   ```php
   public function __invoke(int $year, int $month): Collection
   {
       return Cache::remember(
           key: "monthly_report_{$year}_{$month}",
           ttl: 3600,
           callback: fn () => DB::table('orders')
               ->selectRaw('...')
               ->whereYear('created_at', $year)
               ->whereMonth('created_at', $month)
               ->get()
       );
   }
   ```

3. **Set an appropriate TTL** based on staleness tolerance:
   - Dashboard reports: 5-15 minutes
   - Lookup data: 1-24 hours
   - Real-time: do not cache

4. **Add cache invalidation** via a `forget()` companion method or event listener:
   ```php
   Event::listen(OrderCreated::class, fn () => Cache::forget('monthly_report_*'));
   ```

5. **Test** with both cache hit and cache miss scenarios

### Validation Checklist

- [ ] Cache key includes class name and all parameters
- [ ] TTL is set based on data staleness tolerance
- [ ] Cache invalidation strategy exists for stale data
- [ ] Cache miss path is tested
- [ ] Cache hit path returns correct data
- [ ] Caching does not apply to real-time queries

### Related Rules

| Rule | Reference |
|---|---|
| Rule 8: Cache expensive query objects | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create a Query Object | Precedes caching — the query must exist first |

### Success Criteria
- Expensive queries are cached with appropriate TTL
- Cache key uniquely identifies the query and its parameters
- Cache invalidation handles data changes
- Cache hit reduces database load measurably
