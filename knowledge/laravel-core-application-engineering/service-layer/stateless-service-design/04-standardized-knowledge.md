# ECC Standardized Knowledge — Stateless Service Design

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Service Layer Pattern |
| **Knowledge Unit** | Stateless Service Design |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Business Logic |
| **Last Updated** | 2026-06-02 |

---

## Overview

Stateless service design ensures that service instances capture no per-request or per-call state on `$this`. All state is either passed in as parameters or returned as results. Stateless services are safe in any runtime (PHP-FPM, Octane, RoadRunner), compose without side effects, and are trivially testable.

Stateful services set properties during method execution, expecting to retrieve them later. This pattern fails in long-lived processes (Octane/RoadRunner) where the same instance serves multiple requests, and state from one request leaks to the next.

---

## Core Concepts

### Stateless Definition
Service methods receive all data as parameters and return all results. No mutable properties set during execution.

### Stateful Definition
Service methods set `$this->property` during execution, with getter methods for retrieving state after the operation.

### Octane/RoadRunner Risk
In long-lived processes, the same service instance handles multiple requests. State set during request N is visible to request N+1.

---

## When To Use

- EVERY service class in the application
- Services used in Octane/RoadRunner (mandatory)
- Services that will be used in any production deployment

---

## When NOT To Use

- Trivially, statelessness is always preferred
- The only exception is genuinely request-scoped services that are never reused

---

## Best Practices

### Return Results, Don't Store Them
Return a result object, DTO, or value instead of setting properties.

**Why:** Return values are explicit contracts. Stored state is invisible to the caller and leaks across requests in long-lived processes.

### Use readonly Class for Enforcement
Use `final readonly class` to prevent property mutation at the compiler level.

**Why:** Compiler-enforced immutability prevents accidental state capture. Every property must be set at construction time.

### Never Use Properties as Scratch Space
Don't use class properties for temporary values during method execution.

**Why:** Properties persist beyond the method call. In Octane, the next request sees stale scratch values.

### Accept Dependencies, Not Data, in Constructor
Constructor = infrastructure dependencies (resolved by container). Method parameters = operational data.

**Why:** Constructor dependencies are stable across calls. Operational data varies per call and must be passed as parameters.

---

## Architecture Guidelines

### Stateless Pattern
```php
final readonly class UserService
{
    public function __construct(
        private UserRepository $users,  // stable dependency
    ) {}

    public function register(string $name, string $email): User  // returns result
    {
        return $this->users->create(['name' => $name, 'email' => $email]);
    }
}
```

### Stateful Pattern (Avoid)
```php
class UserService
{
    private ?User $lastCreated = null;  // mutable state

    public function register(string $name, string $email): void
    {
        $this->lastCreated = $this->users->create(['name' => $name, 'email' => $email]);
    }

    public function getLastCreated(): ?User  // state retrieval
    {
        return $this->lastCreated;
    }
}
```

---

## Common Mistakes

### Stateful Services in Octane
Desc: Service that stores intermediate results on `$this`.
Cause: Developed in PHP-FPM where state is per-request (lost between requests).
Consequence: In Octane, state from request N leaks to request N+1.
Better: Always return results; never store per-request state.

### Properties as Scratch Space
Desc: Using `$this->total` or `$this->count` as temporary accumulators.
Cause: Familiarity with mutable object patterns.
Consequence: Concurrency bugs in long-lived processes.
Better: Use local variables in the method scope.

### Getter Methods for Results
Desc: Service with `doSomething()` and `getResult()` methods.
Cause: Two-step operation — execute then retrieve.
Consequence: Forces callers to know about internal implementation; not thread-safe.
Better: Return the result from `doSomething()`.

---

## Anti-Patterns

### Mutable Service
A service that tracks internal state across method calls. This is the most common Octane failure pattern. Services must be stateless.

### Configuration-Carrying Service
A service that loads configuration in the constructor and mutates it per call. Configuration should be read-only after construction.

---

## Examples

### Correct: Stateless
```php
final readonly class InvoiceService
{
    public function __construct(
        private InvoiceRepository $invoices,
    ) {}

    public function generate(Order $order): Invoice
    {
        $total = $order->items->sum(fn($item) => $item->price * $item->quantity);
        return $this->invoices->create(['order_id' => $order->id, 'total' => $total]);
    }
}
```

---

## Related Topics

### Prerequisites
- **Service Class Design** — Foundation for stateless patterns
- **Service Container Basics** — Singleton resolution and state sharing

### Closely Related
- **Transaction Management** — Stateless transaction handling
- **Service Orchestration** — Orchestration without state

### Cross-Domain
- **Async & Distributed Systems** — Octane/RoadRunner compatibility

---

## AI Agent Notes

### Important Decisions
- Statelessness is NOT optional for Octane/RoadRunner
- `readonly class` enforces immutability at the compiler level
- All operational data must be method parameters
- All results must be return values

### Important Constraints
- Services should not expose mutable state across method calls. Internal caching or short-lived state within a single method is acceptable.
- Getters for execution results are an anti-pattern
- Constructor injection is for stable dependencies only
- Per-request state must be passed as method parameters

---

## Verification

This document has been validated against:
- Octane/RoadRunner service requirements
- `readonly class` PHP 8.2 enforcement
- Production stateless service patterns
