# Record Set — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Record Set pattern (Laravel Collection) |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Loading Entire Dataset When DB Could Filter | Critical |
| 2 | Method Chain Too Long with Side Effects | Medium |
| 3 | Using Collection Where LazyCollection Is Appropriate | High |
| 4 | Not Understanding Collection Immutability | Medium |
| 5 | Assuming Collection Operations Are as Optimized as DB | High |

---

## 1. Loading Entire Dataset When DB Could Filter

### Category
Performance

### Description
Loading thousands or millions of rows into a Collection and then filtering in PHP when the database could filter more efficiently.

### Why It Happens
Collection's fluent API is convenient. Developers chain `->get()->filter()` instead of `->where()->get()`.

### Warning Signs
- `->get()` followed by Collection `->filter()`
- Memory spikes on large datasets
- Slow page loads with small result sets filtered from large Dataset
- Collection methods where DB conditions would work

### Why Harmful
The database has indexes and query optimization. Loading all rows and filtering in PHP wastes memory, CPU, and network.

### Consequences
- Memory exhaustion
- Slow page loads
- Wasted database I/O
- Scalability issues

### Alternative
Push filtering to the database layer. Use query builder methods (`where()`, `orderBy()`) before `get()`. Only use Collection for post-processing.

### Refactoring Strategy
1. Identify Collection filter after `get()`
2. Move filter conditions to query builder
3. Verify query uses appropriate indexes
4. Compare memory and time before/after

### Detection Checklist
- [ ] Check for `get()` followed by Collection filter
- [ ] Evaluate filter-to-DB feasibility
- [ ] Compare memory usage benchmarks

### Related Rules/Skills/Trees
- Skills: Record Set, Query Builder, Performance Optimization

---

## 2. Method Chain Too Long with Side Effects

### Category
Maintainability

### Description
Collection method chains exceeding 5-7 methods with side effects (modifications, writes) that are hard to debug and maintain.

### Why It Happens
Collection API encourages chaining. Developers add methods as requirements evolve without considering readability.

### Warning Signs
- 8+ method chain on a single collection
- Chain mixing transformations and side effects
- Debugging requiring step-by-step comment out
- Chain includes `each()`, `tap()`, or `pipe()` for side effects

### Why Harmful
Long chains are hard to read, debug, and test. Side effects in chains create hidden dependencies between steps.

### Consequences
- Low readability
- Debugging difficulty
- Hidden side effects
- Hard to test individual transformations

### Alternative
Break long chains into named intermediate variables. Extract complex transformations to named functions or classes.

### Refactoring Strategy
1. Split chain into intermediate variables
2. Name each intermediate result
3. Extract reusable transformations
4. Test each transformation separately

### Detection Checklist
- [ ] Review chain length
- [ ] Identify side effects in chains
- [ ] Evaluate readability

### Related Rules/Skills/Trees
- Skills: Record Set, Readability
- Decision Trees: Chain vs Intermediate Variables

---

## 3. Using Collection Where LazyCollection Is Appropriate

### Category
Performance

### Description
Using eager Collection (loading all items into memory at once) for processing large datasets where LazyCollection could process items one at a time.

### Why It Happens
Developers default to `collect()` without considering dataset size. LazyCollection requires explicit opt-in.

### Warning Signs
- Processing large files (CSV, logs) with Collection
- Memory spikes on large datasets
- 10k+ items loaded into Collection
- `all()` called unnecessarily on large collections

### Why Harmful
Eager Collection loads all items into memory. For a 100k-row CSV, this is ~50MB. LazyCollection uses ~1MB.

### Consequences
- Memory exhaustion
- Unnecessary overhead
- Cannot process arbitrarily large datasets
- PHP memory limit errors

### Alternative
Use `LazyCollection` for large datasets, file processing, and streaming operations. Use Collection for small/medium in-memory operations.

### Refactoring Strategy
1. Identify large dataset Collection usage
2. Replace with LazyCollection
3. Use `make()` for generators, `times()` for ranges
4. Verify memory usage reduction

### Detection Checklist
- [ ] Identify Collection on large datasets
- [ ] Check dataset size vs Collection
- [ ] Evaluate LazyCollection suitability

### Related Rules/Skills/Trees
- Skills: Record Set, LazyCollection, Memory Optimization

---

## 4. Not Understanding Collection Immutability

### Category
Operations

### Description
Expecting Collection chain to modify the original collection, since Collection methods return new instances rather than modifying in place.

### Why It Happens
PHP arrays are mutable. Collection methods return new instances. Developers unfamiliar with functional programming expect mutation.

### Warning Signs
- Chained result lost when not assigned
- Original collection unchanged after chain
- `->forget()`, `->shift()`, `->pop()` returning removed items, not modifying original
- Confusion about Collection state after operations

### Why Harmful
Expected mutations don't happen. Original data is unaffected. Results are lost when not assigned to a variable.

### Consequences
- Logic errors from unassigned chains
- Debugging time wasted
- Confusion about Collection behavior
- Incorrect assumptions about side effects

### Alternative
Always assign Collection results to a new or same variable. Understand `Collection` methods return new instances. Use `tap()` for side effects.

### Refactoring Strategy
1. Educate team on Collection immutability
2. Audit code for unassigned chain results
3. Fix assignments
4. Add code review checks for immutability understanding

### Detection Checklist
- [ ] Check for unassigned Collection chains
- [ ] Verify chain result assignment
- [ ] Review team understanding of immutability

### Related Rules/Skills/Trees
- Skills: Record Set, Functional Programming

---

## 5. Assuming Collection Operations Are as Optimized as DB

### Category
Performance

### Description
Believing Collection operations (sorting, filtering, joining) are as fast or well-optimized as equivalent database operations.

### Why It Happens
Collection API mirrors SQL concepts (where, sort, join). Developers assume equivalent performance.

### Warning Signs
- Sorting large datasets in Collection instead of DB
- Joining collections instead of DB joins
- Filtering in Collection that DB could do with indexes
- Slow page loads on Collection-heavy code

### Why Harmful
Database engines are optimized for set operations with indexes, query optimizers, and parallel execution. Collection is single-threaded in-memory processing.

### Consequences
- Slow data processing
- Memory bloat
- Wasted optimization opportunities
- Scalability limits

### Alternative
Push heavy operations to the database. Use Collection for light post-processing, formatting, and transformation only.

### Refactoring Strategy
1. Identify Collection operations that should be DB operations
2. Move to query builder with appropriate indexes
3. Benchmark before/after performance
4. Establish guidelines for Collection vs DB operations

### Detection Checklist
- [ ] Review Collection operations vs DB alternatives
- [ ] Compare Collection sorting to DB sorting benchmarks
- [ ] Evaluate index utilization

### Related Rules/Skills/Trees
- Skills: Record Set, Query Builder, Performance Optimization
- Decision Trees: Collection vs DB Operation Choice
