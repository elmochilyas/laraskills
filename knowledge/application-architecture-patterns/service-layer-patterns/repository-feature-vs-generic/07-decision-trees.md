# Decision Trees: Feature-Oriented vs Generic Repositories

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Repository pattern: feature-oriented vs. generic
- **Knowledge Unit ID:** SLP-15
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Feature-oriented vs generic repository methods | Architecture | Repository method design |
| 2 | Business-query naming vs data-operation naming | Maintainability | Repository method naming |
| 3 | Type-specific return vs uniform model return | Architecture | Repository return type design |

---

## Decision 1: Feature-oriented vs generic repository methods

### Context
If you use repositories, every method must justify its existence by encapsulating meaningful business query logic. Generic methods (`find()`, `all()`, `create()`) mirror Eloquent one-to-one and add ceremony without value. Feature-oriented methods (`findOverdueInvoices()`, `getTopCustomersByRevenue()`) centralize WHERE clauses, joins, and aggregations behind a business concept.

### Decision Tree

```
Does the method encapsulate business query logic (WHERE clauses, joins, aggregations)?
├── YES → Feature-oriented — keep the method
│   Does the method name describe a business concept?
│   ├── YES → `findOverdueInvoices()` — clear business purpose
│   └── NO → Rename to business-query naming convention
└── NO (method passes through to Eloquent with no additional logic)
    → Generic pass-through — remove the method
    Does the method exist "just in case" someone needs it later?
    ├── YES → Remove — YAGNI applies to repository methods too
    └── NO → Replace with direct Eloquent call at the consumer
```

### Rationale
Generic repository methods are wrappers around Eloquent with zero added value. `UserRepository::find($id)` does `User::find($id)` — no logic, no abstraction, no test benefit. Feature-oriented methods justify their existence by centralizing query logic that would otherwise be duplicated across services. A repository should have fewer, more meaningful methods rather than many pass-through methods.

### Recommended Default
Only feature-oriented methods; no generic CRUD pass-throughs

### Risks
- Generic pass-through methods: ceremony without value, developer friction
- Repository becomes dumping ground: all queries go to one repository regardless of concern
- Feature-oriented method without tests: untested query logic is a data retrieval bug

### Related Rules
- Use Feature-Oriented Repositories Always If Using Repositories (SLP-15/05-rules.md)
- Do Not Use Generic Base Repository (SLP-15/05-rules.md)
- Avoid Repository With 50+ Methods (SLP-15/05-rules.md)

### Related Skills
- Create Feature-Oriented Repository Methods (SLP-15/06-skills.md)
- Decide When to Use Repository Pattern (SLP-14/06-skills.md)
- Design Query Objects (SLP-16/06-skills.md)

---

## Decision 2: Business-query naming vs data-operation naming

### Context
Repository method names that mirror data operations (`findAll()`, `getAll()`, `findWhere()`) hide the business purpose of the query. Business-query names (`findOverdueInvoices()`, `getTopCustomersByRevenue()`, `searchPendingOrders()`) communicate intent at a glance. The naming convention directly impacts code readability and maintainability.

### Decision Tree

```
Does the method name describe WHAT business question it answers?
├── YES → Business-query naming — correct
│   `findOverdueInvoices()` — "find me overdue invoices"
│   `getTopCustomersByRevenue()` — "get top customers by revenue"
└── NO (method name describes HOW it accesses data)
    → Data-operation naming — rename
    `findAll()` → what does "all" mean? All invoices? All unpaid?
    `getWhere()` → which conditions? What business question?
    Can you derive a business name from the method body?
    ├── YES → Rename to business-query name immediately
    └── NO → Method may not represent a coherent business query — reconsider its existence
```

### Rationale
Business-query naming is self-documenting code. A developer reading `$invoiceRepository->findOverdue(30)` immediately understands the query's purpose without reading the method body. Data-operation naming requires reading the implementation to understand what data is returned. Business names also naturally limit repository scope — if you can't name a method as a business query, it may not belong in the repository.

### Recommended Default
Business-query naming for all repository methods

### Risks
- Data-operation naming: unclear purpose, requires reading implementation
- Overly broad names (`getAll()`): ambiguous — all what? Under what conditions?
- Generic method proliferation: `findByStatusAndDate()` instead of `findOverdue()`

### Related Rules
- Name Methods After Business Queries, Not Data Operations (SLP-15/05-rules.md)
- Use Feature-Oriented Repositories Always If Using Repositories (SLP-15/05-rules.md)
- Return The Right Type Per Method (SLP-15/05-rules.md)

### Related Skills
- Create Feature-Oriented Repository Methods (SLP-15/06-skills.md)
- Apply Domain-Driven Design Boundaries (DBC-01/06-skills.md)
- Test Repository Methods With Integration Tests (SLP-14/06-skills.md)

---

## Decision 3: Type-specific return vs uniform model return

### Context
A common mistake is forcing all repository methods to return Eloquent models for consistency. Different queries have different natural return types: aggregation queries should return value objects (Money, Count), listing queries should return Collections, and single-entity queries should return models. The return type should match the query's business purpose.

### Decision Tree

```
What does the business query naturally produce?
├── A single value (revenue total, count, average)
│   → Return a value object or primitive
│   `getMonthlyRevenue(string $yearMonth): Money`
│   `getOverdueCount(): int`
├── A collection of entities
│   → Return a Collection of models
│   `findOverdue(int $days): Collection`
│   `findPendingForUser(int $userId): Collection`
├── A single entity
│   → Return a model (nullable for optional)
│   `findByInvoiceNumber(string $number): ?Invoice`
│   `findLatestForCustomer(int $customerId): ?Invoice`
└── Aggregated/report data (not tied to a single entity)
    → Return a DTO or array
    `getMonthlyReport(string $year): array`
```

### Rationale
Forcing all methods to return Eloquent models is a design smell. When `getMonthlyRevenue()` returns a Collection of Invoice models, the consumer must extract the revenue value manually — the method doesn't express its intent. Returning a `Money` value object communicates "this is a monetary value, not an entity collection." Different return types for different query purposes make the repository more expressive and easier to use correctly.

### Recommended Default
Return type matches the query output (value object, primitive, model, or DTO)

### Risks
- Uniform model return: all methods return models even for aggregation queries
- Returning Builder from repository: leaks query construction to consumers, defeats abstraction
- Wrong abstraction level: `getMonthlyRevenue()` returns `Collection<Invoice>` instead of `Money`

### Related Rules
- Return The Right Type Per Method (SLP-15/05-rules.md)
- Repository Should Not Leak Eloquent Types (SLP-14/05-rules.md)
- Repository Per Aggregate Root, Not Per Table (SLP-15/05-rules.md)

### Related Skills
- Create Feature-Oriented Repository Methods (SLP-15/06-skills.md)
- Design DTO Pattern (SLP-05/06-skills.md)
- Apply Domain-Driven Design Value Objects (DBC-01/06-skills.md)
