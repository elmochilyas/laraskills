# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service vs. Action vs. Use Case: decision criteria
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Service, Action, and Use Case classes are not competing alternatives—they solve different organizational problems at different scales. The decision depends on operation complexity, team size, and architecture maturity. The emerging community consensus: Services orchestrate, Actions execute single operations, Use Cases encapsulate business intent with framework independence. Most teams start with services, add actions when services grow too large, and consider use cases when adopting layered/Clean Architecture.

---

# Core Concepts

| Criterion | Service | Action | Use Case |
|---|---|---|---|
| Scope | Multiple related operations | One operation | One business intent |
| Granularity | Coarse (10+ methods) | Fine (1 method) | Medium (1-3 methods) |
| Dependencies | Multiple (5-8) | Few (2-4) | Several (3-6) |
| Role | Orchestrates | Executes | Coordinates intent |
| Framework coupling | Coupled (Eloquent) | Coupled (Eloquent) | Independent (via ports) |
| Complexity | Med-High | Low-Med | Med-High |
| Testing | Integration | Unit | Unit |

---

# Mental Models

**The "Size and Scope" model:** Service = book, Action = chapter, Use Case = a specific story within a chapter. Each has different granularity. You start with a service (the book), split actions (chapters) as it grows, and refactor to use cases (stories) for framework independence.

**The "Where does this belong?" framework:**
- If it orchestrates multiple operations → Service
- If it's a single operation that calls a repository → Action
- If it expresses a user's goal with typed contracts → Use Case

---

# Internal Mechanics

**Decision tree:**
```
Is the operation complex (multiple sub-steps)?
├── Yes → Does it need framework independence?
│   ├── Yes → Use Case with DTOs
│   └── No → Service (orchestrates actions)
└── No → Is it a single data access operation?
    ├── Yes → Repository method (skip action)
    └── No → Action class
```

**When to choose each:**

Choose **Service** when:
- You need to coordinate multiple operations
- Transaction boundaries span multiple steps
- Operations share helper logic
- The team is small and values simplicity

Choose **Action** when:
- A service class is growing too large
- You want independently testable operations
- Operations are distinct (not sharing logic)
- You use the command bus pattern

Choose **Use Case** when:
- You're using Clean/Hexagonal Architecture
- Multiple delivery mechanisms use the same logic
- Framework independence matters
- You need typed input/output contracts

---

# Patterns

**Service + Action combination (recommended for most teams):** Services orchestrate, actions are leaf nodes. This is the "sweet spot" pattern:
```php
class OrderService {
    public function placeOrder(CheckoutData $data): Order {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrder->execute($data);
            $this->processPayment->execute($order, $data->payment);
            $this->updateInventory->execute($order);
            return $order;
        });
    }
}
```

**Service → Use Case migration:** As an application grows, services are refactored into use cases. The service remains as a thin facade for backward compatibility.

---

# Architectural Decisions

**Default to Service + Action** for most Laravel applications. This provides structure without Clean Architecture overhead. Services coordinate, actions execute.

**Adopt Use Cases** when the pain of framework-coupled business logic exceeds the cost of adding use case abstractions. This typically happens at team sizes >10 or business complexity justifying Clean Architecture.

---

# Tradeoffs

| Path | Benefit | Cost | Best For |
|---|---|---|---|
| Service only | Simple, minimal files | God services at scale | Small teams, simple apps |
| Service + Action | Prevents god services | Action class proliferation | Most teams (sweet spot) |
| Service + Use Case | Framework independence | More classes, DTO overhead | Clean Architecture teams |
| Use Case only (no service) | Pure Clean Architecture | No orchestration layer | CQRS, event-sourced apps |

---

# Common Mistakes

**Using actions when a service method would suffice:** Creating an action for every single operation, even when services aren't needed. Leads to class explosion without benefit.

**Using services when use cases are needed:** Services with conditional `if` statements for different delivery mechanisms (checking `request()->is(...)`). Use cases solve this better.

**Mixing patterns:** Some code uses services, some uses actions, some uses use cases—all in the same codebase without clear rules. Be consistent.

---

# Ecosystem Usage

Gun Gun Priatna's 2026 guide (QadrLabs) provides a detailed comparison with real code. Ilyas Kazi's "Actions vs Services" series shows how both can coexist. The community consensus favors Service + Action as the default pattern.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-01 Service classes | SLP-02 Action classes | LAP-06 Application layer |
| SLP-06 Use Case classes | SLP-04 Pyramid architecture | LAP-14 Clean Architecture tradeoffs |

---

## Performance Considerations

The performance impact of each pattern is negligible at PHP scale. Service class resolution adds approximately 50 microseconds per request. Action class resolution adds similar overhead. Use cases with DTO mapping add serialization/deserialization cost if data must be converted between array and typed object formats. The difference between any of these patterns is functionally irrelevant compared to database query time.

---

## Production Considerations

Document the team's chosen pattern(s) explicitly in a project README. The worst state is a codebase where some features use services, some use actions, and some use use cases without clear rules. Choose the Service + Action combination as the default for most Laravel teams.

---

## Failure Modes

**Architecture paralysis:** Team spends weeks debating service vs action vs use case instead of shipping code. Pick one, ship, refactor later.

**Pattern soup:** Different features use different patterns based on who wrote them. Inconsistent architecture is worse than any single pattern choice.

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
