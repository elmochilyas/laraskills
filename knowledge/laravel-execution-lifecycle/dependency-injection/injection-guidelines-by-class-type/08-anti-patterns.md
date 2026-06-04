# Anti-Patterns â€” Injection Guidelines By Class Type
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle |
| Subdomain | Dependency Injection |
| Knowledge Unit | Injection Guidelines By Class Type |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Same Injection Strategy for All Class Types | High | Medium | Using constructor injection everywhere without considering class type |
| Controller with Service Container Calls | High | Medium | Controllers resolving services via app() instead of injection |
| Service Using Method Injection Excessively | Medium | Medium | Services using method injection for dependencies used in all methods |
| Command Using Service Container Instead of Injection | High | Medium | Artisan commands resolving services inside handle() instead of constructor injection |
| Event Listener with Too Many Constructor Dependencies | Medium | Medium | Event listeners with multiple dependencies used only in handle() |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Class-Specific Injection Guidelines | No documented rules for injection strategy per class type | Inconsistent injection, hard to understand patterns |
| Mixing Injection Strategies | Different developers use different strategies for same class type | Unpredictable, inconsistent codebase |

## Anti-Pattern Details

### AP-IGC-01: Same Injection Strategy for All Class Types
**Description**: Using the same injection approach (e.g., constructor injection) for all class types regardless of their lifecycle.
**Root Cause**: Developer learns one injection pattern and applies it uniformly.
**Impact**: Some class types get suboptimal injection strategy. Singleton services injected into request-scoped classes cause state issues.
**Detection**: Constructor injection used for dependencies in commands, job classes, event listeners without considering scoping.
**Solution**: Match injection strategy to class type: constructor for shared services, method injection for request-specific data.

### AP-IGC-02: Controller with Service Container Calls
**Description**: Controllers use pp()->make() or esolve() inside methods instead of proper injection.
**Root Cause**: Quick solution without adding constructor parameter.
**Impact**: Hidden dependencies. Harder to test. Bypasses DI container benefits.
**Detection**: Controller methods contain app()->make() or resolve() calls.
**Solution**: Always use constructor or method injection for controller dependencies.

### AP-IGC-03: Command Using Service Container Instead of Injection
**Description**: Artisan commands resolve services inside handle() via app() instead of constructor injection.
**Root Cause**: Convenience â€” resolving services only when needed.
**Impact**: Hidden coupling. Harder to test. Constructor doesn't reveal dependencies.
**Detection**: Command handle() method contains app()->make() calls.
**Solution**: Use constructor injection for command dependencies. Laravel's command supports DI.

### AP-IGC-04: Event Listener with Too Many Constructor Dependencies
**Description**: Event listener constructor has multiple dependencies, many only used in handle().
**Root Cause**: All dependencies injected in constructor regardless of actual usage pattern.
**Impact**: Unnecessary instantiation when listener is resolved but not called.
**Detection**: Listener constructor has 4+ dependencies, some used only conditionally.
**Solution**: Use method injection for services only used in handle(). Reserve constructor for core dependencies.
