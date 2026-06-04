# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Query objects as alternative to repositories
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Query objects are dedicated classes that encapsulate a specific database query or group of related queries. Unlike repositories (which group all data access for an entity), query objects focus on querying—not creating, updating, or deleting. They are a lighter alternative to the repository pattern, providing centralized query logic without the CRUD wrapper overhead. Each query object typically handles one query concern (filtering, searching, reporting) rather than all data access for an entity.

---

# Core Concepts

```php
class OverdueInvoicesQuery {
    public function __construct(
        private Invoice $model,
    ) {}

    public function get(int $daysOverdue = 30): Collection {
        return $this->model
            ->where('due_date', '<', now()->subDays($daysOverdue))
            ->where('status', InvoiceStatus::PENDING)
            ->with('customer')
            ->get();
    }

    public function count(int $daysOverdue = 30): int {
        return $this->model
            ->where('due_date', '<', now()->subDays($daysOverdue))
            ->where('status', InvoiceStatus::PENDING)
            ->count();
    }
}
```

---

# Mental Models

**The "Named Query" model:** Each query object is a named, encapsulated query. Instead of scattering `Invoice::where(...)->where(...)->get()` across services, you centralize it in a `PendingInvoicesQuery`.

**The "Read Model" model:** Query objects often return DTOs or arrays, not Eloquent models. They optimize for reading, not writing.

**The "Repository-Lite" model:** Query objects provide the query-centralization benefit of repositories without the full CRUD ceremony. Read-only focus keeps them simple.

---

# Internal Mechanics

Query objects are injected into services/controllers:
```php
class ReportController {
    public function __construct(
        private OverdueInvoicesQuery $overdueInvoices,
        private MonthlyRevenueQuery $monthlyRevenue,
    ) {}

    public function index(): array {
        return [
            'overdue' => $this->overdueInvoices->get(45),
            'revenue' => $this->monthlyRevenue->forMonth(now()),
        ];
    }
}
```

---

# Patterns

**Single-responsibility query:** One query class per distinct query concern: `SearchProductsQuery`, `ActiveSubscribersQuery`, `TopSellersQuery`.

**Query chain building:** Methods for building query conditions incrementally:
```php
class ProductSearchQuery {
    public function withCategory(string $category): self { ... }
    public function withPriceRange(float $min, float $max): self { ... }
    public function withActiveOnly(): self { ... }
    public function get(): Collection { ... }
}
```

**Query returning DTOs:** The query returns hydrated DTOs or arrays instead of Eloquent models:
```php
class ProductListQuery {
    public function get(): array {
        return Product::query()
            ->select(['id', 'name', 'price'])
            ->get()
            ->map(fn($p) => new ProductListItemDto(...))
            ->toArray();
    }
}
```

---

# Architectural Decisions

**Use query objects when:** Complex queries are repeated across services, Eloquent queries are becoming unwieldy in controllers/services, or you want to decouple read logic from write logic.

**Use query objects instead of repositories when:** You only need read optimization. Repositories combine read + write; query objects are read-only.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Centralized query logic | More classes | Each query concern = 1 class |
| Read-focused, no CRUD ceremony | Queries are not grouped by entity | Finding all queries about Invoice requires search |
| Composable query building | Can over-abstract simple queries | Single `where` clause doesn't need a query object |
| Easy to test in isolation | Query objects may duplicate model scope logic | Must choose: scopes vs. query objects |

---

# Performance Considerations

No overhead. Query objects use Eloquent directly. They can be optimized per query (adding indexes, select optimization) without affecting other queries.

---

# Production Considerations

Query objects are ideal candidates for query optimization and caching. A slow query is fixed in one place (the query object), benefiting all consumers.

---

# Common Mistakes

**Query object with writes:** Adding `create()`, `update()`, `delete()` methods to a query object. This blurs the line between query and repository. Keep query objects read-only.

**Query object for every query:** Creating a query object for a simple `User::find($id)`. Query objects are for complex or repeated queries, not one-liners.

**Returning Eloquent models from query objects:** This couples consumers to Eloquent. Return arrays or DTOs for better decoupling.

---

# Failure Modes

**Query object explosion:** 50 query objects with overlapping logic. Consolidate: `InvoiceQuery` with multiple methods may be better than 10 separate query classes.

**Query object duplication with model scopes:** Both `Invoice::scopeOverdue()` and `OverdueInvoicesQuery` define the same query. Choose one pattern.

---

# Ecosystem

Query objects are less formalized in Laravel than repositories but are a recognized pattern in the DDD community. The `spatie/laravel-query-builder` package implements a related concept (dynamic query building from request parameters).

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-14 Repository debate | SLP-15 Repository feature vs generic | CPC-08 CQRS pattern |
| SLP-01 Service classes | SLP-04 Pyramid architecture | LAP-07 Infrastructure layer |

---

## Ecosystem Usage



---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
