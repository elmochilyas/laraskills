# Circular Dependency Detection

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Circular Dependency Detection
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Circular dependency detection is the container's mechanism for identifying and preventing infinite resolution loops caused by services that depend on each other (A → B → A) or on proxies that lead back to themselves (A → B → C → A). Implemented through the `$buildStack` array and the `isCircularDependency()` check in `Container::resolve()`, the container tracks every abstract currently being resolved and throws `CircularDependencyException` when a duplicate is detected, preserving the full resolution chain in the error message for debugging.

The critical engineering decision in circular detection is that it tracks *resolution in progress* rather than *historical resolution*. The build stack is a per-resolution call stack, not a dependency graph. This means the container can detect cycles at runtime but cannot detect them statically at binding registration time. The consequence is that circular dependencies are discovered on first resolution, not at boot — meaning a circular dependency in a rarely-used code path may remain undetected until triggered in production, causing a 500 error during a low-traffic operation.

For production applications, circular dependencies indicate a design flaw: two services should not mutually depend on each other through constructors. The typical fix is to break the cycle with one of: setter injection, a factory/lazy proxy, or event-driven communication (one service fires an event that the other listens for). The container's detection mechanism only reports the problem — it does not provide lazy resolution, proxy generation, or other automated cycle-breaking strategies that more advanced DI containers (like Symfony's) offer.

---

## Core Concepts

### Build Stack
The `$buildStack` property is an array of abstract names currently in the process of being resolved:

```php
// During resolution of A → B → C:
$this->buildStack = [
    'A',
    'B',  // Currently resolving — C hasn't been pushed yet
];
```

### Circular Detection Check
Before pushing an abstract onto the build stack, the container checks if it's already there:

```php
if (in_array($abstract, $this->buildStack)) {
    throw new CircularDependencyException(
        "Circular dependency detected: " .
        implode(' -> ', $this->buildStack) . " -> $abstract"
    );
}
```

### Exception Message
The exception includes the full resolution chain:

```
CircularDependencyException: Circular dependency detected:
App\Services\ReportService -> App\Services\DatabaseService -> App\Services\ReportService
```

### Detection Depth Limit (Laravel 13+)
Laravel 13 introduced a depth counter limit instead of string matching:

```php
// Prevents false positives in deeply nested legitimate dependencies
if ($this->circularDepthLimit > 0 &&
    count($this->buildStack) > $this->circularDepthLimit) {
    throw new CircularDependencyException(
        "Circular dependency suspected: resolution depth exceeded {$this->circularDepthLimit}"
    );
}
```

---

## Mental Models

### The Snake Eating Its Tail
A snake that tries to eat itself — the head (Service A) consumes the tail (Service B) which is connected back to the head. The snake would consume itself infinitely if not stopped. The build stack is the snake's body: when the head tries to swallow a part already inside the digestive tract, the system detects the cycle.

### The Recursive Phone Tree
A phone tree where each person calls another. If Alice calls Bob, Bob calls Charlie, and Charlie calls Alice, the phone system is in an infinite loop. The build stack is the "already called" list that prevents re-calling someone who's already on the phone.

### The Stack Overflow Analogy
Like a program's call stack in a debugger: when function A calls B, and B calls A, the call stack grows unbounded: A → B → A → B → A → B → ... The container's build stack is the call stack tracer that detects when a frame repeats (A appears twice) and throws the exception before the stack overflows.

---

## Internal Mechanics

### Build Stack Lifecycle

Within `Container::resolve()`:

```php
protected function resolve($abstract, $parameters = [], $raiseEvents = true)
{
    $abstract = $this->getAlias($abstract);

    // Check instances cache (bypasses build stack for cached services)
    if (isset($this->instances[$abstract]) && ! $needsContextualBuild) {
        return $this->instances[$abstract];
    }

    // Push onto build stack with circular check
    $this->buildStack[] = $abstract;

    try {
        // ... get concrete, build, extend, callback ...
    } finally {
        array_pop($this->buildStack);
    }

    return $object;
}
```

### isCircularDependency() Implementation (Laravel 10-12)

```php
protected function isCircularDependency($abstract)
{
    // Check if abstract is already in the build stack
    return in_array($abstract, $this->buildStack);
}
```

### Laravel 13+ Depth-Based Detection

```php
protected function isCircularDependency($abstract)
{
    if ($this->circularDepthLimit > 0 &&
        count($this->buildStack) >= $this->circularDepthLimit) {
        return true;
    }

    return in_array($abstract, $this->buildStack);
}
```

### How Circular Dependencies are Introduced

Three common patterns create circular dependencies:

1. **Direct cycle:** A → B → A (both constructors require each other)
2. **Indirect cycle:** A → B → C → A (three or more services form a ring)
3. **Self-referential:** A → A (a class that requires itself in its constructor)

```php
// Direct cycle example
class ReportService {
    public function __construct(DatabaseService $db) { }
}

class DatabaseService {
    public function __construct(ReportService $report) { }
    // This constructor creates A → B → A → B → ...
}
```

---

## Patterns

### Factory Break
Introduce a factory that lazily resolves the circular dependency:

```php
class ReportService {
    public function __construct(
        protected DatabaseService $db,
        protected ReportFactory $reportFactory // Inject factory instead of ReportService
    ) {}
}

class DatabaseService {
    public function __construct(
        protected ReportFactory $reportFactory
    ) {}
}

class ReportFactory {
    public function __construct(
        protected Container $container
    ) {}

    public function make(): ReportService
    {
        return $this->container->make(ReportService::class);
    }
}
```

### Setter Injection Break
Move one of the circular dependencies to a setter method:

```php
class ReportService {
    protected ?DatabaseService $db = null;

    public function __construct() {} // No DB dependency in constructor

    public function setDatabaseService(DatabaseService $db): void
    {
        $this->db = $db;
    }
}

class DatabaseService {
    public function __construct(ReportService $report) { }
}

// Provider: set up after resolution
$this->app->resolving(DatabaseService::class, function ($db, $app) {
    $report = $app->make(ReportService::class);
    $report->setDatabaseService($db);
});
```

### Event-Driven Break
Replace one constructor dependency with an event listener:

```php
class ReportService {
    public function generate(): void
    {
        // Instead of calling $this->db->logQuery(), fire event
        event(new ReportGenerated($this));
    }
}

class DatabaseService {
    public function __construct(
        protected EventDispatcher $events
    ) {
        $this->events->listen(ReportGenerated::class, fn($e) => $this->logQuery($e));
    }
}
```

---

## Architectural Decisions

### Why the container uses a stack instead of a dependency graph
Tracking the current resolution stack is lightweight (array push/pop) and requires no pre-computation. A dependency graph would require analyzing all registered bindings and their constructors, which would force eager reflection on every binding at registration time — violating the deferred-resolution principle. The stack approach adds O(1) overhead per resolution step.

### Why instances cache bypasses circular detection
If a service has already been resolved (cached as singleton), circular detection is irrelevant — the same instance is returned regardless of resolution path. Checking the build stack before the instances cache would cause false-positive cycle detections when a singleton happens to appear in the stack from a previous resolution chain. Since singleton resolution is guaranteed idempotent, the cached instance can be returned safely without stack checking.

### Why the container does not provide lazy proxies
Symfony's DI container generates lazy-loading proxies that break circular dependencies automatically. Laravel chose not to implement this, keeping the container simpler and avoiding the complexity of proxy generation (which requires either eval-based code generation or a compiled proxy class). The tradeoff is that Laravel developers must manually break cycles using factories or event patterns — a design choice that favors explicitness over automation.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Stack detection is O(1) per resolution step | Cannot detect cycles at registration time | Cycle discovered on first resolution, not at boot |
| Clear exception with full resolution path | Exception message can be very long for deep stacks | Large dependency graphs produce multi-line error messages |
| Instances cache bypass avoids false positives | Cached singletons may mask circular dependencies | A cycle that happens to resolve first in singleton order won't be detected |
| No proxy generation keeps container simple | Developers must manually break cycles | More boilerplate code for cycle resolution vs Symfony's auto-proxying |

---

## Performance Considerations

The build stack push/pop and in_array check add ~0.5μs per resolution step. For a typical 3-level deep resolution chain, this adds ~1.5μs total — negligible.

In Laravel 13+, the depth counter check (`count($buildStack) >= $limit`) is O(1), replacing the O(N) `in_array` call when the limit is exceeded. For normal resolutions (depth < limit), the `in_array` check still runs.

The `$buildStack` array size is bounded by resolution depth. In well-designed applications, depth rarely exceeds 5-7 levels. The array is discarded after resolution completes (popped in `finally` block), so memory is transient.

---

## Production Considerations

- **Test for circular dependencies in CI.** Write a test that resolves every registered abstract and catches `CircularDependencyException`. This catches cycles at test time rather than production.
- **Monitor build stack depth.** In Octane, add logging when build stack depth exceeds a threshold (e.g., 10 levels). Unexpected depth increases may indicate a developing cycle.
- **Prefer factory breaks for cycles.** Factory pattern is the most maintainable cycle resolution approach — it preserves constructor injection for non-cyclic dependencies and isolates the lazy resolution to a single factory class.
- **Avoid setter injection for critical cycles.** Setter injection makes the service's dependency graph incomplete at construction time. A service with unset setters can be resolved but not safely used, creating an implicit two-phase initialization contract.

---

## Common Mistakes

**Why it happens:** Creating a cycle by having Service A and Service B both inject each other. **Why it's harmful:** The resolution enters an infinite loop, caught by the build stack check. The exception traces the cycle. **Better approach:** Determine which direction the dependency should flow and remove the other. Use factory, event, or setter injection for the second direction.

**Why it happens:** Believing that making one of the services a singleton breaks the cycle. **Why it's harmful:** If both services are unresolved when the cycle is hit, the singleton doesn't help — neither is cached yet. The cycle occurs on first resolution regardless of singleton status. **Better approach:** Break the cycle structurally, not by changing binding type.

**Why it happens:** A cycle that works in development but fails in production due to different resolution order. **Why it's harmful:** The build stack depends on who calls `make()` first. A test that resolves A first may succeed (if A's dependencies are all cached before reaching the cycle), while production resolving B first hits the cycle. **Better approach:** Test both resolution orders explicitly.

---

## Failure Modes

### False Positive Circular Detection
The container detects a cycle where none exists due to contextual binding re-entering the same abstract. **Common causes:** A contextual binding rule causes the same abstract to appear in the build stack twice during legitimate resolution. **Detection:** Exception is thrown with a build stack that shows the same class appearing twice but not in a true dependency loop. **Mitigation:** Use `needsContextualBuild()` which has special handling to allow certain re-entries.

### Undetected Cycle Due to Instance Cache
A cycle is hidden because one of the circular dependencies was already resolved as a singleton and cached. **Common causes:** A singleton that was resolved during boot creates a path through the cycle that avoids the build stack conflict on the first resolution. On cache flush (e.g., `forgetInstance()`), the cycle appears. **Detection:** Intermittent circular exceptions after cache operations. **Mitigation:** Break all cycles explicitly regardless of singleton caching — cached cycles are ticking time bombs.

### Stack Overflow Before Detection
In very deep resolution chains (100+ levels), PHP's call stack overflows before the container's build stack check fires because the in_array check happens too late. **Common causes:** Proxy-based resolution where multiple proxies forward to each other. **Detection:** Native PHP "Maximum function nesting level" error, not a container exception. **Mitigation:** The Laravel 13+ depth limit prevents this by setting a maximum resolution depth (default 200).

---

## Ecosystem Usage

**Laravel Framework Core:** The `TranslationServiceProvider` and `ValidationServiceProvider` historically had a circular dependency that was discovered during Laravel 10 development. The framework team broke this cycle by introducing the `TranslationServiceProvider` as a deferred provider that no longer depends on validation services during `register()`.

**Monica CRM:** The open-source Monica CRM resolved a circular dependency between `ContactService` and `ActivityService` by introducing a `ContactActivityService` factory that lazily resolved both services, breaking the constructor-level cycle.

**Laravel Spark:** Spark's team management features had a cycle between `TeamService` and `SubscriptionService`. The resolution was to extract the shared billing logic into a `BillingService` that both services depend on, creating a tree instead of a cycle.

---

## Related Knowledge Units

### Prerequisites
- Container Fundamentals
- Binding Resolution
- Auto-Resolution via Reflection

### Related Topics
- Binding Types

### Advanced Follow-up Topics
- Contextual Binding
- Scoped Instance Management

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::$buildStack` (property, line 140): Array tracking current resolution chain.
- `Illuminate\Container\Container::isCircularDependency()` (lines 700-720): Core detection logic — in_array check on build stack.
- `Illuminate\Container\Container::resolve()` (lines 600-700): Build stack push at start, pop in `finally` block.
- `Illuminate\Container\CircularDependencyException`: Exception class with formatted build stack message.

### Key Insight
The `finally` block that pops the build stack is critical for correctness. If an exception occurs during resolution (even a non-circular one), the build stack must still be cleaned up. Before PHP 7.0's `finally`, the container had to manually cleanup in catch blocks — a fragile approach that could leave the build stack in an inconsistent state after partial resolution failures.

### Version-Specific Notes
- **Laravel 10.x:** Simple `in_array` check on build stack. No depth limit. Stack overflow possible in proxy-based scenarios.
- **Laravel 11.x:** `isCircularDependency()` added as a dedicated method (previously inline). Exception message format improved to show full chain.
- **Laravel 12.x:** Contextual binding special-cased to avoid false positives when contextual rules create legitimate re-entry.
- **Laravel 13.x:** Depth limit introduced (`circularDepthLimit` property, default 200). Count-based check fires before `in_array` when limit exceeded.
