# Circular Dependency Resolution

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
A circular dependency occurs when two or more classes depend on each other directly or transitively — Class A injects B, B injects A. The container detects this via a `$buildStack` that tracks the current resolution chain. When a class appears twice in the stack, the container throws `CircularDependencyException`. Resolution involves breaking the cycle through refactoring, lazy resolution, or structural changes.

## Core Concepts

### Build Stack
`Container::$buildStack` is an array of class names currently being resolved. New entries are pushed when resolution begins, popped when it completes.

### Circular Detection
Before pushing to `$buildStack`, the container checks if the class is already in the stack. If so, it throws `CircularDependencyException`.

### Direct Cycle
A → B → A (A depends on B which depends on A).

### Transitive Cycle
A → B → C → A (three or more classes forming a loop).

### Self-Injection
A class that injects itself into its own constructor.

### Lazy Break
Using Closure injection — inject `Closure` that resolves the dependency lazily, rather than injecting it eagerly.

### Structural Break
Extracting shared logic into a third class that both A and B depend on, breaking the cycle.

## Mental Models

### The Infinite Recursion
Imagine two mirrors facing each other. Each reflects the other's image infinitely — there's no end. Circular dependencies create this same infinite reflection: the container keeps trying to build A, which needs B, which needs A, which needs B... forever.

### The Deadlocked Elevators
Two elevators need each other's floor position to decide where to go. Elevator A says "I'll move when B tells me its floor." Elevator B says "I'll move when A tells me its floor." Both wait forever — a deadlock. The build stack is the elevator log showing "A waiting for B waiting for A."

### The Dog Chasing Its Tail
A dog chasing its tail runs in circles forever — there's no endpoint. Circular dependencies are the same: the resolution algorithm runs in a loop with no base case.

## Internal Mechanics

### Build Stack Implementation
```php
// Container::$buildStack — tracks current resolution
protected $buildStack = [];

// Container::build()
public function build($concrete)
{
    // Detect cycle BEFORE pushing
    if (in_array($concrete, $this->buildStack, true)) {
        throw new CircularDependencyException(
            "Circular dependency detected: {$concrete} " .
            "(" . implode(' -> ', $this->buildStack) . " -> {$concrete})"
        );
    }
    
    // Push to stack
    $this->buildStack[] = $concrete;
    
    try {
        // ... ReflectionClass, resolve dependencies, instantiate ...
        $object = $reflector->newInstanceArgs($instances);
    } finally {
        // Pop from stack (always — even on exception)
        array_pop($this->buildStack);
    }
    
    return $object;
}
```

### Detection Trace
```
build(App\Services\OrderService)
  → Push OrderService. Stack: [OrderService]
  → Need constructor param: InvoiceService
  → build(InvoiceService)
    → Push InvoiceService. Stack: [OrderService, InvoiceService]
    → Need constructor param: OrderService
    → build(OrderService)
      → OrderService already in stack! → CircularDependencyException
      → Message: "Circular dependency detected: OrderService
         (OrderService -> InvoiceService -> OrderService)"
```

### try/finally Guarantee
The `try/finally` block ensures `array_pop()` always executes — even if an exception is thrown during resolution. This prevents the build stack from getting corrupted.

## Patterns

### Shared Dependency Extraction Pattern
Extract the shared responsibility into a third class. Both A and B depend on C, breaking the A↔B cycle.

### Event-Driven Decoupling Pattern
Instead of A calling B directly, A dispatches an event that B listens to. No direct dependency between A and B.

### Lazy Injection Pattern (Rare)
Inject a Closure that resolves the dependency lazily. Use only when structural refactoring is temporarily impractical.

## Architectural Decisions

### Why detect cycles at build time, not registration time?
Cycles depend on the resolution path — they're a runtime concern. Two classes may be cyclic only in specific resolution contexts. Registration-time detection would miss context-dependent cycles.

### Why not automatically break cycles?
No general algorithm can automatically break cycles without understanding the domain. The container throws a clear exception because only the developer can decide which direction the dependency should flow.

### Why throw an exception vs returning null?
Silently returning null would hide the architectural problem. The exception forces the developer to address the cycle — it's a design issue, not a runtime contingency.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear exception with resolution trace | Exception thrown at build time, not load time | Cycle discovered at object creation, not app boot |
| try/finally ensures stack integrity | Build stack overhead per resolution | Negligible (array push/pop) |
| Lazy injection as escape hatch | Hides the cycle instead of fixing it | Technical debt if overused |
| Event-driven decoupling (clean) | More infrastructure (events + listeners) | Complex for simple bidirectional needs |

## Performance Considerations

- **$buildStack tracking:** Negligible overhead (array push/pop per resolution).
- **in_array() check:** O(n) on the build stack depth — typically 3-10 entries.
- **Lazy resolution via Closure:** Adds small allocation cost for the Closure itself.
- **Exception cost:** Throwing exceptions is expensive — but cycles should not happen in production.

## Production Considerations

- **Design acyclic dependency graphs:** Dependencies should flow in one direction — from high-level policy to low-level detail.
- **Extract shared dependencies:** If A and B depend on each other, extract the shared logic into C.
- **Use event-driven decoupling:** Instead of A calling B directly, A dispatches an event that B listens to.
- **Use static analysis:** `vendor/bin/deptrac` or PHPStan to detect cycles before runtime.
- **Never use lazy injection as default fix:** Structural refactoring is the correct solution.

## Common Mistakes

- **Using lazy resolution as default fix:** Wrapping everything in Closures — hidden cycles, harder to trace.
- **Ignoring the exception message:** The resolution chain tells you exactly where the cycle is — read it.
- **Self-injection by accident:** A class accidentally receives itself — copy-paste error.
- **Model→Service→Repository→Model cycle:** Model calls Service, Service calls Repository, Repository returns Model.
- **Not using deptrac/static analysis:** Cycles discovered at runtime — production errors.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Circular dependency exception | `CircularDependencyException` at object creation | A↔B cycle in constructor chain | Extract shared dependency |
| Deep recursion before detection | Memory exhaustion before exception | Complex cycle with many intermediate classes | Reduce resolution chain depth |
| Lazy injection accumulation | Multiple Closures in constructor | Band-aid cycles instead of fixing | Refactor to remove all cycles |
| Event listener cycle | Listener dispatch loops infinitely | Listener dispatches event that triggers itself | Add dispatch guard or restructure |

## Ecosystem Usage

- **Laravel Framework:** Core classes are designed to be acyclic. The framework uses events extensively to prevent circular service dependencies.
- **Laravel Horizon:** Uses event-driven patterns between queue monitoring services to avoid circular resolution chains.
- **Laravel Nova:** Resource classes use event dispatching instead of direct service calls to maintain acyclic dependencies.
- **Spatie packages:** Follow acyclic design principles. Package services depend on framework contracts, not on each other.

## Related Knowledge Units

### Prerequisites
- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md) — the build stack mechanism.
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md) — the resolution path where cycles are detected.

### Related Topics
- [Constructor Injection (ku-02)](../ku-02-constructor-injection/02-knowledge-unit.md) — how injection creates the dependency graph.
- [Service Locator Anti-Pattern](../../dependency-injection/service-locator-anti-pattern/02-knowledge-unit.md) — using `app()` to "break" cycles is a service locator anti-pattern.

## Research Notes
- `$buildStack` is tracked in `Container::$buildStack`.
- The cycle detection is in `Container::build()` — before pushing a class, checks `in_array($concrete, $this->buildStack, true)`.
- The exception message includes the full resolution chain — read it to find the cycle.
- Fixing a cycle NEVER requires changing the container — always restructure the classes.
- Use `Container::make()` with `$parameters` to pre-resolve one side of a cycle only if absolutely necessary (rare).
