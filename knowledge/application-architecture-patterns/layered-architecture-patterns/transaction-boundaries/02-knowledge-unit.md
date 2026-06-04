# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Transaction boundaries in layered architecture
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Database transaction boundaries in layered architecture answer the question: where does the `DB::transaction()` call belong? The emerging consensus places transactions in the Application layer (Use Case/Service level), not in Controllers (Presentation) and not in Repositories (Infrastructure). Controllers should not manage transactions because they are HTTP concerns. Repositories should not manage transactions because they should be composable. The Application layer coordinates the boundary: it opens a transaction, delegates to domain objects and repositories, and commits on success or rolls back on exception.

---

# Core Concepts

Transactions ensure atomicity: a group of database operations either all succeed or all fail. In layered architecture, the transaction boundary should encompass the full business operation, not individual data access calls.

**Wrong placement - Controller:**
```php
class InvoiceController {
    public function store(Request $request) {
        return DB::transaction(function () {
            // Transaction logic mixed with HTTP handling
        });
    }
}
```

**Wrong placement - Repository:**
```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function save(Invoice $invoice): void {
        DB::transaction(function () {
            // Transaction too granular, prevents composition
        });
    }
}
```

**Correct placement - Use Case:**
```php
class CreateInvoiceUseCase {
    public function execute(CreateInvoiceDto $dto): InvoiceCreatedDto {
        return DB::transaction(function () {
            // Full business operation
        });
    }
}
```

---

# Mental Models

**The "Unit of Work" model:** A transaction should cover one meaningful business operation. "Register user" is a unit of work (create user + send welcome email + create default workspace). "Create user" alone is too granular if it always has side effects.

**The "All or Nothing" model:** Transactions exist because the operation must be atomic. If it's acceptable for part of the operation to succeed when another part fails, either the transaction boundary is wrong or you need eventual consistency (see DBC-12).

**The "Service Layer Owns Transactions" model:** The orchestration layer (Service/Use Case) is the natural home for transactions because it understands which operations belong together.

---

# Internal Mechanics

Laravel's `DB::transaction()` uses database-level transactions. Nested transactions within Laravel use savepoints (if the database supports them). The outermost `transaction()` call is the actual database transaction.

If a Use Case calls another Use Case that also uses `DB::transaction()`, the inner call creates a savepoint rather than a new transaction. Rollback at the savepoint level doesn't roll back the outer transaction. This is why transaction boundaries should be explicit and not nested.

---

# Patterns

**Explicit transaction service:** A `TransactionService` that wraps operations:
```php
class DatabaseTransactionWrapper {
    public function execute(callable $operation): mixed {
        return DB::transaction($operation);
    }
}
```
Use Case receives `TransactionWrapper` injected and uses it explicitly.

**Transactional attribute/annotation:** Some frameworks use PHP 8 attributes to mark methods as transactional. Laravel doesn't have this built-in, but can be implemented with middleware in the service container.

**Repository save with flush:** Repositories save objects without managing transactions. The Use Case calls `flush()` or commits after all repositories have been called.

---

# Architectural Decisions

**Place transactions in Application layer when:** Operations span multiple repository calls, have side effects (events, external API calls), and must be atomic.

**Skip transactions when:** Read-only queries, single-table operations with no side effects, or operations where eventual consistency is acceptable.

**Repository-level transactions are acceptable when:** The repository operation is genuinely standalone (e.g., updating a single aggregate root with no cross-aggregate consistency requirements).

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear transaction ownership | Application layer manages DB concerns | Some argue transactions are infrastructure, not application |
| Composability preserved | Nested transaction pitfalls | Use Cases calling Use Cases create savepoint confusion |
| Business operations are atomic | Extended transaction duration | Long-running operations hold DB connections |

---

# Performance Considerations

Long-lived transactions hold database connections and locks. Use Cases that make external API calls within a transaction should move the API call outside the transaction boundary. User notifications, external API calls, and file uploads should happen after the transaction commits.

---

# Production Considerations

Set appropriate database transaction isolation levels. PostgreSQL's `READ COMMITTED` is the default and works for most scenarios. For high-contention operations, consider `REPEATABLE READ` or `SERIALIZABLE` with retry logic.

Monitor transaction duration in production. Laravel Telescope's "Queries" tab shows slow queries but not transaction boundaries. Custom middleware or event listeners can track transaction start/end.

---

# Common Mistakes

**Transactions in controllers:** Controllers managing transactions means every delivery mechanism (HTTP, CLI, queue) needs its own transaction management. Centralize in the Application layer.

**Transactions in repositories:** If repository methods wrap their own transactions, a Use Case calling three repository methods has three separate transactions instead of one.

**Transactions spanning disparate systems:** Using `DB::transaction()` to coordinate database writes AND external API calls. The API call can't be rolled back. Extract side effects to after-commit events or job chains.

---

# Failure Modes

**Deadlocks:** Two transactions waiting for each other's locks. Most common when transactions span multiple tables and are executed in different orders. Solution: consistent ordering of table access within transactions.

**Phantom reads:** Transaction reads data that another transaction modifies concurrently. `SERIALIZABLE` isolation prevents this at the cost of reduced concurrency.

---

# Ecosystem Usage

Laravel's `DB::transaction()` is the standard mechanism. Some packages (like `spatie/laravel-transaction`) provide wrappers for more explicit transaction management. Pest's architecture tests can verify that only Application-layer classes use `DB::transaction()`.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-06 Application layer | SLP-11 Transaction management | DBC-11 Multi-context transactions |
| LAP-04 Dependency Rule | MMD-10 Cross-module data access | DBC-12 Eventual consistency |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche—most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
