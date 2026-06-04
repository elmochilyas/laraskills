# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Record Set pattern (Laravel Collection)
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Collection vs LazyCollection for data processing
* Decision 2: DB-side filtering vs Collection-side filtering
* Decision 3: Collection method chain style — fluent vs intermediate variables

---

# Architecture-Level Decision Trees

---

## Decision: Collection vs LazyCollection for Data Processing

---

## Decision Context

Choose whether to load data into an eager Collection (all in memory) or a LazyCollection (streamed, one at a time).

---

## Decision Criteria

* performance considerations: Collection loads everything into memory (O(n)); LazyCollection processes one item at a time (O(1) memory)
* architectural considerations: LazyCollection cannot sort or reorder; Collection can
* security considerations: LazyCollection avoids loading sensitive data entirely into memory
* maintainability considerations: Collection is more familiar; LazyCollection requires awareness of streaming limitations

---

## Decision Tree

How large is the dataset?
↓
SMALL (<1000 items, <10MB) → Collection (eager, full flexibility)
↓
Can the data fit comfortably in available memory (256MB+ available)?
    YES → Collection is fine for datasets up to ~100k items
    NO → LazyCollection (memory constraint forces streaming)
LARGE (1000-100000 items) → Evaluate: do you need to sort, reverse, or randomize?
    YES → Collection (these operations require all items in memory)
    ↓
    Can sorting be done at the database level?
    YES → Use DB-side sorting, then LazyCollection for processing
    NO → Collection is necessary (split data into chunks if memory is tight)
    NO → LazyCollection (streaming is sufficient for sequential processing)
VERY LARGE (100k+ items) → LazyCollection (streaming, or the dataset won't fit in memory)
    ↓
    Is the data coming from a source that supports lazy loading (Eloquent cursor, Generator)?
    YES → LazyCollection with `cursor()` or generator
    NO → Implement chunking: process in batches of 500-1000

---

## Rationale

Collection loads all data into memory, enabling full array operations (sort, reverse, random). LazyCollection streams data one item at a time, using minimal memory but cannot reorder. For datasets under 1000 items, Collection is the right choice. For large datasets, prefer LazyCollection or DB-side operations.

---

## Recommended Default

**Default:** Collection for small datasets (<1000 items). LazyCollection for large datasets. DB-side sorting/filtering regardless of Collection choice.

**Reason:** Collection is simpler and more familiar. LazyCollection saves memory for large datasets but limits operations. Most web requests work fine with Collection.

---

## Risks Of Wrong Choice

Collection for 500k items: memory exhaustion (50MB+ for simple records, 200MB+ for complex). LazyCollection when sorting needed: cannot sort — must load all to sort, defeating the purpose. LazyCollection without streamable source: forces full load anyway.

---

## Related Rules

- Rule 1: Use Collection for datasets that fit in memory; LazyCollection for streaming large datasets
- Rule 2: Prefer DB-side filtering (where) over Collection filtering for large datasets

---

## Related Skills

- Use LazyCollection for Large Datasets
- Optimize Collection Performance

---

## Decision: DB-Side Filtering vs Collection-Side Filtering

---

## Decision Context

Choose whether to filter data at the database level (SQL WHERE) or load everything and filter in the Collection.

---

## Decision Criteria

* performance considerations: DB filtering returns fewer rows (less network + memory); Collection filtering loads everything
* architectural considerations: DB filtering is faster but may be harder to read; Collection chains are expressive
* security considerations: DB filtering prevents loading sensitive data into application memory
* maintainability considerations: DB filtering is harder to debug (SQL); Collection chains are visible in code

---

## Decision Tree

How selective is the filter (what percentage of data is returned)?
↓
HIGH (>50% of data returned) → Either approach: DB filtering still preferred (network savings)
    ↓
    Is the query a simple WHERE that's easy to express in SQL?
    YES → DB filtering (use Eloquent scopes or `where()`)
    NO → Collection filtering acceptable (complex logic easier in PHP)
LOW (1-10% of data returned) → DB filtering (avoid loading 90%+ unnecessary data)
MEDIUM (10-50% returned) → DB filtering preferred (reduce memory and network)
    ↓
    Is the filtering logic complex (strategy pattern, callback-based)?
    YES → Collection filtering may be simpler to implement
    ↓
    Can the complex filter be expressed as a DB query?
    YES → DB filtering with raw SQL or compiled query builder
    NO → Collection filtering (accept the performance cost for clarity)

---

## Rationale

DB-side filtering should be the default — it reduces memory, network, and database processing time. Collection filtering should only be used when the filtering logic is too complex to express in SQL or when the filter criteria change at runtime in ways that can't be parameterized.

---

## Recommended Default

**Default:** DB-side filtering with Eloquent scopes. Collection filtering only for complex PHP logic that can't be expressed in SQL.

**Reason:** DB filtering reduces data transfer and memory by 10-100x. Collection filtering loads all data into application memory — only justified when SQL can't express the logic.

---

## Risks Of Wrong Choice

Collection filtering for low-selectivity queries: 90%+ of loaded data is discarded, memory waste, performance problems. DB filtering for complex logic: unreadable SQL, hard to debug, query complexity spirals.

---

## Related Rules

- Rule 3: Filter at the database level whenever possible
- Rule 4: Use Collection filtering only for logic that can't be expressed in SQL

---

## Related Skills

- Build Eloquent Scopes
- Optimize Collection Queries

---

## Decision: Collection Method Chain Style — Fluent vs Intermediate Variables

---

## Decision Context

Choose whether to write Collection operations as a fluent chain or with intermediate variables.

---

## Decision Criteria

* performance considerations: fluent chains create intermediate Collection objects (negligible)
* architectural considerations: both produce the same result; choice is readability
* security considerations: readable code is easier to audit for security issues
* maintainability considerations: short chains are readable; long chains are hard to debug

---

## Decision Tree

How many Collection methods are in the chain?
↓
1-4 METHODS → Fluent chain (concise, readable)
    ↓
    Is each method's purpose obvious from its name and order?
    YES → Fluent chain is clear
    NO → Consider adding a comment for non-obvious steps
5-8 METHODS → Evaluate: does the chain fit on screen (no horizontal scrolling)?
    YES → Fluent chain with one method per line (alignment)
    ↓
    Format: each method on its own line, indented
    NO → Split into intermediate variables (prevents horizontal scrolling, adds debuggability)
8+ METHODS → Intermediate variables (long chains are hard to debug in fluent style)
    ↓
    Can intermediate variables be named to describe the transformation step?
    YES → Named intermediate steps tell the story of the data transformation
    ↓
    `$activeUsers = $users->filter(...);`
    `$sortedUsers = $activeUsers->sortBy(...);`
    `$formattedUsers = $sortedUsers->map(...);`
    NO → The chain may be doing too much — consider extracting a service or macro

---

## Rationale

Short fluent chains (1-4 methods) are the most readable style. Long chains (5+ methods) benefit from intermediate variables that name each transformation step, making the pipeline easier to debug and understand. Name intermediate variables by the state of the data after the step.

---

## Recommended Default

**Default:** Fluent chains of 1-4 methods. Intermediate variables for 5+ methods. Each intermediate variable named after the data state.

**Reason:** Short chains are concise and readable. Long chains become opaque — debugging requires breaking the chain anyway. Intermediate variables document the transformation pipeline.

---

## Risks Of Wrong Choice

Long fluent chain: hard to debug (can't inspect intermediate state), hard to change (inserting a step requires reformatting). Intermediate variables for everything: verbose, hides the pipeline flow.

---

## Related Rules

- Rule 6: Prefer fluent chains for short operations; intermediate variables for long chains

---

## Related Skills

- Write Readable Collection Chains
- Debug Collection Pipelines
