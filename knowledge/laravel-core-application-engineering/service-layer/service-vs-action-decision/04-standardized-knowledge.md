# ECC Standardized Knowledge — Service vs Action Decision

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Service Layer Pattern |
| **Knowledge Unit** | Service vs Action Decision |
| **Difficulty** | Expert |
| **Category** | Application Architecture — Business Logic |
| **Last Updated** | 2026-06-02 |

---

## Overview

The service vs action decision is the most common architectural question in Laravel teams. Services group related operations around an entity (`UserService` with register, update, suspend). Actions encapsulate a single operation (`RegisterUserAction`). They are complementary, not competing — mature codebases use both.

The decision framework: use a service when related operations share dependencies, benefit from co-location, and need orchestration. Use an action when an operation is complex enough to warrant its own file, needs isolated testing, or is reused across multiple entry points.

---

## Core Concepts

### When Services Win
- Multiple related operations on the same entity
- Shared dependencies across operations
- Navigation by entity (find all User-related code in one file)
- Orchestration of sub-operations

### When Actions Win
- Single complex operation that stands alone
- Operation reused across HTTP, CLI, queue
- Need isolated test class per operation
- Team wants clear merge boundaries (one file per operation)

### When to Use Both
Services for orchestration and shared setup. Actions for individual operations within the service's orchestration.

---

## Decision Framework

```
Is the operation a single, isolated business operation?
  ├── Yes → Is it called from multiple entry points?
  │   ├── Yes → Use Action
  │   └── No → Does it share dependencies with other operations?
  │       ├── Yes → Use Service
  │       └── No → Use Action (or keep in controller if simple)
  └── No → Is it part of a related group of operations?
      ├── Yes → Use Service
      └── No → Consider extracting to Action when complexity grows
```

---

## Best Practices

### Don't Choose One Exclusively
Both patterns have valid use cases. Exclusive use of either is a red flag.

**Why:** Services-only leads to god services with 40 methods. Actions-only leads to file proliferation without organization. Both are production patterns.

### Start with Services, Extract Actions
Default to services. Extract to actions when an operation demonstrates need.

**Why:** Defaulting to actions creates excessive files. Services provide organization. Extract when: the operation is complex, reused, or needs isolated testing.

### Use Actions Inside Services
Services can call actions as part of orchestration.

**Why:** This is the mature pattern — services coordinate, actions execute. The service provides the transaction boundary, error handling, and result aggregation.

---

## Common Mistakes

### Actions for Everything
Desc: Every operation is an action, even simple CRUD pass-through.
Cause: Following a "pure" action pattern.
Consequence: Excessive files, no organization, hard to navigate.
Better: Use services for related operations; actions for complex or reused ones.

### Services for Everything
Desc: A single `UserService` with 40 methods.
Cause: Defaulting to services for all operations.
Consequence: God service, hard to test, merge conflicts.
Better: Extract complex operations to actions; split large services.

### Not Using Either
Desc: Business logic in controllers.
Cause: Not knowing about services or actions.
Consequence: Untestable, unreusable, violates separation of concerns.
Better: Use services or actions for all business logic.

---

## Examples

### Service + Action Together
```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): Order
    {
        return DB::transaction(function () use ($data) {
            $this->reserveInventory->handle($data->items);      // Action
            $payment = $this->chargePayment->handle($data->payment); // Action
            return $this->createOrder->handle($data, $payment);     // Action
        });
    }

    public function getOrderHistory(User $user): Collection
    {
        return $this->orders->findByUser($user); // Simple pass-through
    }
}
```

---

## Related Topics

### Prerequisites
- **Service Class Design** — Service pattern fundamentals
- **Action Class Design** — Action pattern fundamentals

### Closely Related
- **Action vs Service vs Use Case** — Three-way decision framework
- **Service Orchestration** — When services compose actions

### Advanced
- **Domain vs Application Services** — Architectural distinction

---

## AI Agent Notes

### Important Decisions
- Services and actions are complementary, not competing
- Default: services for organization, actions for complexity
- Services can call actions (orchestration)
- Actions should NOT call services (inverted dependency)

### Important Constraints
- Actions calling services creates circular dependency
- Services with 40+ methods need decomposition
- Actions creating excessive files need organizational structure
- The decision is contextual, not absolute

---

## Verification

This document has been validated against:
- Community consensus (Spatie, Tighten, Beyond Code, QadrLabs)
- Production codebase analysis of service/action patterns
- Expert recommendations from Laravel architects
