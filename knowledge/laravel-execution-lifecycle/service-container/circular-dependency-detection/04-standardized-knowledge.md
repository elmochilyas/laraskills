# Circular Dependency Detection

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Container |
| Knowledge Unit | Circular Dependency Detection |
| Difficulty | Advanced |
| Lifecycle Phase | Service Resolution |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Circular dependency detection is the container's mechanism for identifying and preventing infinite resolution loops caused by services that mutually depend on each other (A → B → A) or on proxy chains that lead back to themselves (A → B → C → A). Implemented through the `$buildStack` array and the `isCircularDependency()` check in `Container::resolve()`, the container tracks every abstract currently being resolved and throws `CircularDependencyException` when a duplicate is detected. The critical engineering decision is that it tracks *resolution in progress* rather than *historical resolution* — the build stack is a per-resolution call stack, not a dependency graph. This means cycles are discovered on first resolution, not at boot, and are never detected statically.

## Core Concepts
- **Build Stack** — Array of abstract names currently being resolved; pushed in `resolve()`, popped in `finally` block.
- **Circular Check** — `in_array($abstract, $this->buildStack)` before pushing onto stack.
- **`CircularDependencyException`** — Exception with formatted build stack trace showing the full resolution chain.
- **Depth Limit (Laravel 13+)** — Counter-based depth limit (default 200) prevents stack overflow in deep but non-circular chains.
- **Instance Cache Bypass** — If service is already cached as singleton, circular detection is skipped (no cycle possible).

## When To Use
- Debugging "who depends on who" in complex service graphs.
- Designing service architecture to avoid mutual constructor dependencies.
- Writing CI tests that resolve all registered bindings to catch cycles early.
- Refactoring legacy code with tangled dependencies.

## When NOT To Use
- Relying on runtime detection instead of design-time cycle prevention.
- Using singleton caching to "hide" circular dependencies (ticking time bomb).
- Assuming the container will detect all cycles (some may be masked by instance cache).

## Best Practices
- **Break cycles with factory pattern** — Introduce a factory that lazily resolves the circular dependency.
- **Use setter injection for one direction** — Move one of the circular dependencies to a setter method.
- **Use event-driven communication** — Replace a constructor dependency with an event the consumer listens for.
- **Test for circular dependencies in CI** — Write a test resolving every registered abstract and catching `CircularDependencyException`.
- **Avoid making one service singleton to "break" the cycle** — If both are unresolved when the cycle is hit, singleton doesn't help.
- WHY: Circular dependencies indicate a design flaw — two services should not mutually depend on each other through constructors. The container only detects the problem; developers must fix the architecture.

## Architecture Guidelines
- Build stack push/pop uses `try/finally` to ensure cleanup even on exception.
- Instances cache check happens before build stack push — cached singletons don't enter the stack.
- Contextual bindings have special handling (`needsContextualBuild`) to avoid false positives.
- Depth limit (Laravel 13+) prevents stack overflow in proxy-based scenarios where legitimate resolution depth is high.

## Performance Considerations
- Build stack push/pop + `in_array` check add ~0.5μs per resolution step.
- For a typical 3-level deep chain, total overhead is ~1.5μs — negligible.
- Laravel 13+ depth counter check (O(1)) replaces `in_array` (O(N)) when limit exceeded.
- `$buildStack` is transient — discarded after resolution completes.

## Security Considerations
- Circular dependency exceptions reveal internal service names and resolution paths — sanitize in production error responses.
- Build stack trace in exception messages can expose application architecture to API consumers if not caught.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Creating mutual constructor injection | Designing without thinking about dependency direction | Cycle detected at runtime | Determine which direction the dependency should flow; use factory for reverse direction |
| Assuming singleton breaks the cycle | Misunderstanding resolution timing | Cycle still occurs on first resolution | Break cycle structurally, not by changing binding type |
| Cycle works in dev but fails in production | Different resolution order | Build stack depends on who calls `make()` first — test both orders | Test all resolution orders explicitly in CI |

## Anti-Patterns
- **Singleton Hiding Cycles** — Using singleton to mask a cycle that appears after cache flush (ticking time bomb).
- **Deep Proxy Chains** — 100+ level resolution chains causing stack overflow before detection.
- **Setter Injection Without Documentation** — Creating implicit two-phase initialization contracts.

## Examples

### Factory break pattern
```php
class ReportService {
    public function __construct(
        protected DatabaseService $db,
        protected ReportFactory $reportFactory
    ) {}
}

class DatabaseService {
    public function __construct(protected ReportFactory $reportFactory) {}
}

class ReportFactory {
    public function __construct(protected Container $container) {}
    public function make(): ReportService {
        return $this->container->make(ReportService::class);
    }
}
```

### Event-driven break
```php
class ReportService {
    public function generate(): void {
        event(new ReportGenerated($this)); // Instead of calling $this->db->logQuery()
    }
}

class DatabaseService {
    public function __construct(protected EventDispatcher $events) {
        $this->events->listen(ReportGenerated::class, fn($e) => $this->logQuery($e));
    }
}
```

## Related Topics
- **Prerequisites:** Container Fundamentals, Binding Resolution, Auto-Resolution via Reflection
- **Closely Related:** Binding Types
- **Advanced:** Contextual Binding, Scoped Instance Management
- **Cross-Domain:** Testing (CI cycle detection tests)

## AI Agent Notes
- When debugging `CircularDependencyException`, read the build stack trace from bottom to top — the first repeated class is the cycle point.
- Cycle detection only works at runtime — add a CI test that resolves all bindings to catch cycles before deployment.
- The `finally` block that pops the build stack is critical — without it, partial resolution failures leave the stack in inconsistent state.

## Verification
- [ ] Can trace the build stack lifecycle (push in resolve, pop in finally)
- [ ] Understand why instances cache bypasses circular detection
- [ ] Can identify the 3 cycle patterns: direct, indirect, self-referential
- [ ] Can implement factory break, setter injection break, and event-driven break
- [ ] Can write a CI test that detects circular dependencies early
