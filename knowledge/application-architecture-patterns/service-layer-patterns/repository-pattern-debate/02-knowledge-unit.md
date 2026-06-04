# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Repository pattern debate: when it adds value vs. overhead
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The Repository pattern in Laravel is the most debated architectural topic in the community. The pattern adds a data access abstraction layer between business logic and Eloquent. Proponents cite testability, centralized query logic, and swappable data sources. Critics argue it's unnecessary ceremony that wraps Eloquent methods one-to-one, adding files without adding value. The pragmatic position: repositories add value when they solve a real problem—multi-source data, complex query logic, or genuine need for abstraction. They add overhead when they simply wrap `User::find()` with `UserRepository::find()`.

---

# Core Concepts

Repository pattern in Laravel:
```php
// Interface (contract)
interface UserRepository {
    public function find(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function save(User $user): void;
}

// Eloquent implementation
class EloquentUserRepository implements UserRepository {
    public function find(int $id): ?User {
        return User::find($id);
    }
    // ...
}
```

---

# Mental Models

**The "Wrapper" debate:** Is the repository a useful abstraction or a wrapper that adds complexity without benefit? Answer: it depends on whether it solves a real problem.

**The "Portability Myth":** The argument "repositories let you switch databases" is rarely realized. Eloquent semantics permeate the application. A repository interface doesn't make a MongoDB switch trivial.

**The "Centralized Query Logic" value:** When repositories contain meaningful query logic (scopes, filtering, sorting, complex conditions), they provide value beyond wrapping. A repository with `findActiveSubscribersWithExpiringInvoices()` has more value than one with `find()`, `all()`, `create()`.

---

# Patterns

**Repository adds value when:**
- Query logic is centralized and reused across services
- Data comes from multiple sources (Eloquent + external API)
- You need to swap implementations (test in-memory, production Eloquent)
- You're following Clean Architecture and need port-adapter boundaries

**Repository adds overhead when:**
- It wraps every Eloquent model one-to-one
- Methods mirror Eloquent exactly (`find`, `all`, `create`, `update`)
- Only one implementation exists and will ever exist
- The "swap the database" argument is the primary justification

---

# Architectural Decisions

**Add repository when:** You have complex, duplicated query logic, or you genuinely need to support multiple data sources, or you're in a Clean Architecture context where ports are required.

**Skip repository when:** Simple CRUD, single data source, small team. Use Eloquent directly and extract query logic to local scopes or query objects only when duplication emerges.

**Feature-oriented repositories:** Instead of `UserRepository` with generic methods, create `InvoiceRepository` with `findOverdueInvoices()`, `findByCustomerWithItems()`. These encapsulate meaningful queries.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Centralized query logic | Extra files per model | 2 files (interface + impl) per model |
| Swappable data source | Rarely swapped in practice | Ceremony paid daily for benefit that may never come |
| Easy mocking in tests | Learning curve for new developers | Must understand repository pattern |
| Decouples from Eloquent | Eloquent features are harder to use | Lazy loading, scopes, relationships require explicit handling |

---

# Performance Considerations

Repository indirection adds a method call per data access. Negligible.

---

# Production Considerations

If using repositories, use feature-oriented methods (meaningful business queries) rather than generic CRUD. A repository full of `get()`, `find()`, `create()` is a red flag.

---

# Common Mistakes

**Generic repository:** `BaseRepository` with `find($id)`, `all()`, `create()`, `update()`, `delete()`. Extended by every entity repository. This adds ceremony but no value.

**Repository leaking Eloquent:** Methods returning `Collection` or `LengthAwarePaginator` from Eloquent. The repository should return arrays or domain types.

**Repository without tests:** The repository wraps Eloquent methods but has no tests. If a repository isn't tested, it's dead code.

---

# Failure Modes

**Repository drift:** The repository interface grows to 20+ methods covering every possible query variation. It becomes a data access god object.

**Abandoned repository:** A repository that was created but no longer used. Services call Eloquent directly, bypassing the abstraction.

---

# Ecosystem Usage

Taylor Otwell has publicly stated he doesn't use the repository pattern in his projects. Laravel News articles argue against it. The community is divided. Hafiq Iqmal's "The Repository Pattern in Laravel Is Almost Always Wrong" captures the critical position.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-01 Service classes | SLP-15 Repository feature vs generic | SLP-16 Query objects |
| SLP-13 Interface contracts | SLP-04 Pyramid architecture | LAP-14 Clean Architecture tradeoffs |

---

## Internal Mechanics

Repository pattern implementation in Laravel follows a standard contract-architecture:

`php
interface InvoiceRepository {
    public function find(string SLP-13-interface-contracts): ?Invoice;
    public function save(Invoice ): void;
    public function delete(Invoice ): void;
}

class EloquentInvoiceRepository implements InvoiceRepository {
    public function __construct(private Invoice ) {}
    public function find(string SLP-13-interface-contracts): ?Invoice {
        return ->model->find(SLP-13-interface-contracts);
    }
    public function save(Invoice ): void {
        ->save();
    }
    public function delete(Invoice ): void {
        ->delete();
    }
}
`

The interface is defined in the Domain layer; the implementation lives in Infrastructure. The service container binds the interface to the implementation in a service provider.

---

## Research Notes

The repository pattern debate in Laravel is uniquely polarizing. Taylor Otwell has stated he does not use repositories personally. Alex Vanderbist (Spatie) advocates against generic repositories. Mathew Setter makes the case for feature-oriented repositories. The community consensus in 2025-2026 is: skip generic repositories, use feature-oriented repositories only when query logic is complex enough to warrant centralization, and prefer Eloquent scopes and query objects for simpler needs.
