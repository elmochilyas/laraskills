# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Repository pattern: feature-oriented vs. generic
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The debate within the repository pattern is between generic repositories (CRUD methods for every entity) and feature-oriented repositories (business-specific queries targeted to use cases). Feature-oriented repositories encapsulate meaningful business queries: `findOverdueInvoices()`, `getTopCustomersByRevenue()`, `searchProductsByCategory()`—each a targeted data access method specific to a business need. Generic repositories (find, all, create, update, delete) add ceremony without business value. Feature-oriented repositories justify their existence by centralizing complex query logic.

---

# Core Concepts

**Generic repository:**
```php
class UserRepository {
    public function find($id): ?User;
    public function findAll(): Collection;
    public function create(array $data): User;
    public function update($id, array $data): User;
    public function delete($id): bool;
}
```

**Feature-oriented repository:**
```php
class InvoiceRepository {
    public function findOverdue(int $days = 30): Collection;
    public function findByCustomerWithItems(Customer $customer): Collection;
    public function getMonthlyRevenue(string $yearMonth): Money;
    public function findPendingWithFailedPayments(): Collection;
}
```

---

# Mental Models

**The "Catalog vs. Toolbox" model:** A generic repository is a catalog of everything you could do with data. A feature-oriented repository is a toolbox with specific tools for specific jobs.

**The "Use Case Data Requirements" model:** Each repository method maps to a specific business need. You don't build generic find-all—you build what the use case needs.

**The "YAGNI at Repository Level" model:** Feature-oriented repositories naturally apply YAGNI. You write `findOverdueInvoices()` when the business needs to find overdue invoices. You don't write `InvoiceRepository::all()` "just in case."

---

# Internal Mechanics

Feature-oriented repositories are typically injected into the specific service or action that needs them:
```php
class InvoiceService {
    public function __construct(
        private InvoiceRepository $invoices,  // Feature-oriented
    ) {}

    public function processOverdueInvoices(): void {
        $overdue = $this->invoices->findOverdue(45);
        foreach ($overdue as $invoice) {
            $this->charge($invoice);
        }
    }
}
```

---

# Patterns

**Single-use-case repository methods:** Methods exist because a specific use case needs them. When a new use case needs new data access, add a new method.

**Read-model repositories:** Feature-oriented repositories that return DTOs or arrays (not Eloquent models) optimized for specific read use cases.

**Repository per aggregate root:** Not per database table. Group data access methods by the bounded context they serve.

---

# Architectural Decisions

**Use feature-oriented repositories:** Always, if you use repositories at all. They justify their existence by encapsulating meaningful queries.

**Skip generic repositories:** Avoid `BaseRepository`, `AbstractRepository`, or CRUD-only repository classes. They add ceremony without value.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Methods map to business needs | More targeted methods | Repository grows as business grows |
| Centralizes complex query logic | Less reusable across use cases | Each method may be used by 1-2 consumers |
| Natural YAGNI compliance | Repository structure exposed query complexity | Method names reveal implementation details |

---

# Performance Considerations

Feature-oriented methods can be optimized per query without affecting other methods. Each method uses the most efficient query for that business need.

---

# Production Considerations

Repository methods should be tested with integration tests that verify query correctness. A feature-oriented method with a wrong WHERE clause is a data retrieval bug.

---

# Common Mistakes

**Generic base repository:** A `BaseRepository` with shared CRUD. All entity repositories extend it. This recreates the generic problem at the inheritance level.

**Repository returning models for all methods:** `findOverdueInvoices()` returns a Collection of `Invoice` models—fine. But `getMonthlyRevenue()` should return a `Money` value object, not a model collection.

**Repository with 50+ methods:** The repository has become a data access god object. Split into multiple repositories by concern.

---

# Failure Modes

**Repository becomes query dumping ground:** All query logic goes into one repository per entity. Methods proliferate without organization.

**Repository + Eloquent duplicate logic:** Where scopes and repository methods both define the same queries (e.g., scopes in model, methods in repository). Choose one pattern.

---

# Ecosystem

Feature-oriented repositories are the recommended approach if you use repositories at all. Community experts (including repository skeptics) agree: if you must use repositories, make them feature-oriented.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-14 Repository pattern debate | SLP-16 Query objects | SLP-04 Pyramid architecture |
| SLP-01 Service classes | LAP-07 Infrastructure layer | AEG-01 Architecture testing |

---

## Ecosystem Usage



---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
