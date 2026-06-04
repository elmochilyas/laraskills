# ku-09: Circular Dependency Resolution

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **KU:** ku-09-circular-dependency-resolution
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
A circular dependency occurs when two or more classes depend on each other directly or transitively — Class A injects B, B injects A. The container detects this via a `$buildStack` that tracks the current resolution chain. When a class appears twice in the stack, the container throws `CircularDependencyException`. Resolution involves breaking the cycle through refactoring, lazy resolution, or structural changes.

## Core Concepts
- **Build stack**: `Container::$buildStack` is an array of class names currently being resolved. New entries are pushed when resolution begins, popped when it completes.
- **Circular detection**: Before pushing to `$buildStack`, the container checks if the class is already in the stack. If so, it throws `CircularDependencyException`.
- **Direct cycle**: A → B → A (A depends on B which depends on A).
- **Transitive cycle**: A → B → C → A (three or more classes forming a loop).
- **Self-injection**: A class that injects itself into its own constructor.
- **Lazy break**: Using `Closure` injection — inject `Closure` that resolves the dependency lazily, rather than injecting it eagerly.
- **Structural break**: Extracting shared logic into a third class that both A and B depend on, breaking the cycle.

## When To Use
- When diagnosing and fixing a `CircularDependencyException`.
- When designing class dependencies to avoid cycles from the start.
- When using lazy resolution patterns (Closure, proxy) to break unavoidable cycles.
- When evaluating whether a cycle indicates a deeper architectural problem.

## When NOT To Use
- Do not use lazy resolution as a band-aid for clearly cyclic architecture — extract the shared concern instead.
- Do not attempt to override the container's cycle detection — the exception exists for good reason.
- Do not use `Container::make()` inside a constructor to break a cycle — this is a service locator pattern.

## Best Practices (WHY)
- **Design acyclic dependency graphs**: Dependencies should flow in one direction — from high-level policy to low-level detail.
- **Extract shared dependencies**: If A and B depend on each other, extract the shared logic into C. A and B both depend on C, with no cycle.
- **Use event-driven decoupling**: Instead of A calling B directly, A dispatches an event that B listens to.
- **Use lazy injection sparingly**: Inject a `Closure` or use the container only when structural refactoring is truly impossible.

## Architecture Guidelines
- Dependencies should form a Directed Acyclic Graph (DAG). Verify with `vendor/bin/deptrac` or similar.
- Common cycle patterns: Service → Repository → Model → Service (the model shouldn't call the service).
- Controllers should not create cycles — they orchestrate, they don't depend on each other.
- Events and listeners break cycles naturally — A dispatches an event, B responds, no direct dependency.

## Performance
- `$buildStack` tracking adds negligible overhead (array push/pop per resolution).
- `in_array()` check for cycle detection is O(n) on the build stack depth — typically 3-10 entries.
- Lazy resolution via Closure adds a small allocation cost for the Closure itself.
- The main performance cost of circular deps is debugging time — the exception message includes the full resolution chain.

## Security
- Circular dependency exceptions expose part of the dependency graph in the error message — in production, ensure debug mode is off.
- A remote attacker exploiting a resolution path could potentially trigger a cycle-based DoS (deep recursion) — the cycle detection prevents infinite loops.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Using lazy resolution as default fix | Wrapping everything in Closures | Avoiding architecture refactoring | Hidden cycles, harder to trace | Extract shared dependency |
| Ignoring the exception message | The resolution chain tells you exactly where the cycle is | Not reading the full error | Repeating same debugging steps | Read the full stack trace |
| Self-injection by accident | A class accidentally receives itself | Copy-paste or autocomplete error | Immediate cycle detection | Check constructor parameters |
| Model→Service→Repository→Model cycle | Model calls Service, Service calls Repository, Repository returns Model | Business logic leakage across layers | Hard to test; fragile | Move business logic out of models |
| Not using deptrac/static analysis | Cycles discovered at runtime | No tooling to detect early | Production errors | Use static analysis to detect cycles |

## Anti-Patterns
- **Service locator to break cycles**: Using `app(Service::class)` inside a method to "avoid" cycle detection — the dependency is still circular, just hidden.
- **Setter injection for cycles**: Using setter injection to break a constructor cycle — still a cycle, just deferred.
- **Interface abstraction without refactoring**: Creating an interface for one side of a cycle doesn't break the cycle — it just adds indirection.

## Examples
```php
// Problem: Circular dependency
class OrderService
{
    public function __construct(
        readonly InvoiceService $invoice, // InvoiceService depends on OrderService
    ) {}
}

class InvoiceService
{
    public function __construct(
        readonly OrderService $orders, // Creates cycle
    ) {}
}

// Solution 1: Extract shared dependency
class OrderInvoiceService
{
    // Both OrderService and InvoiceService depend on this, not each other
}

// Solution 2: Event-driven
class OrderService
{
    public function placeOrder(Order $order): void
    {
        // ... order logic ...
        Event::dispatch(new OrderPlaced($order)); // InvoiceService listens
    }
}
```

## Related Topics
- Automatic Injection (ku-04) — the resolution path where cycles are detected
- Constructor Injection (ku-02) — how injection creates the dependency graph
- DI Container Basics (ku-01) — the build stack mechanism

## AI Agent Notes
- `$buildStack` is tracked in `Container::$buildStack`.
- The cycle detection is in `Container::build()` — before pushing a class to `$buildStack`, it checks `in_array($concrete, $this->buildStack, true)`.
- The exception message includes the full resolution chain — read it to find the cycle.
- Fixing a cycle NEVER requires changing the container — always restructure the classes.
- Use `Container::make()` with `$parameters` to pre-resolve one side of a cycle only if absolutely necessary (rare).

## Verification
- [ ] No `CircularDependencyException` occurs during application bootstrap or normal operation
- [ ] Dependency graph is acyclic (verified with static analysis tools)
- [ ] No service locator (`app()`) used to "break" cycles
- [ ] Events/listeners are used instead of direct circular calls where appropriate
- [ ] Class dependencies flow in one direction (high-level → low-level)
