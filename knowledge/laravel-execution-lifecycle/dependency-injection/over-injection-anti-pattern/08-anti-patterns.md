# Anti-Patterns â€” Over-Injection Anti-Pattern
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle |
| Subdomain | Dependency Injection |
| Knowledge Unit | Over-Injection Anti-Pattern |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Constructor With Too Many Dependencies | High | High | Class constructor has 5+ injected dependencies |
| Injecting Services Used Only in One Method | Medium | High | Dependencies injected in constructor but used only in a single method |
| Service Locator Pattern Instead of Injection | High | Medium | Using app()->make() to bypass constructor injection |
| Injecting Data Instead of Services | Medium | Medium | Injecting configuration values or primitive data through constructor |
| Cascading Over-Injection | Medium | Medium | A depends on B depends on C, all with too many dependencies |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Dependency Limit Standards | No maximum dependency count per class | Classes accumulate dependencies without check |
| No Over-Injection Detection Tooling | No automated detection of high dependency count | Over-injection discovered only during code review |

## Anti-Pattern Details

### AP-OI-01: Constructor With Too Many Dependencies
**Description**: Class constructor has 5+ type-hinted parameters.
**Root Cause**: Class handles too many responsibilities or orchestrates too many collaborators.
**Impact**: Hard to instantiate. Constructor changes frequently. Indicates SRP violation.
**Detection**: Constructor parameter count >= 5.
**Solution**: Split class by responsibility. Use facade or delegating services to reduce visible dependencies.

### AP-OI-02: Injecting Services Used Only in One Method
**Description**: Dependencies injected in constructor but used in only one method.
**Root Cause**: Developer defaults to constructor injection for all dependencies.
**Impact**: Class always resolves all dependencies even when not needed. Extra state in constructor.
**Detection**: Property declared in constructor but only referenced in a single method.
**Solution**: Use method injection for services used in a single method. Reserve constructor for shared dependencies.

### AP-OI-03: Service Locator Pattern Instead of Injection
**Description**: Using pp()->make('SomeService') inside methods instead of proper constructor or method injection.
**Root Cause**: Developer avoids adding constructor parameters or finds it more convenient.
**Impact**: Hidden dependencies not visible in class signature. Harder to test and mock.
**Detection**: Class methods contain app()->make(), resolve(), or App::make() calls.
**Solution**: Refactor to use proper injection. Extract needed services to constructor or method parameters.

### AP-OI-04: Injecting Data Instead of Services
**Description**: Primitive values or configuration injected through constructor instead of using configuration providers.
**Root Cause**: Need for runtime configuration in services.
**Impact**: Tight coupling to config values. Hard to test with different configs.
**Detection**: Constructor has string, int, or array parameters for configuration values.
**Solution**: Inject configuration services (Config contract) or use configuration providers. Keep constructor for injectable dependencies only.

### AP-OI-05: Cascading Over-Injection
**Description**: Class A depends on Class B which depends on Class C, each with 4+ dependencies.
**Root Cause**: No upper-level architecture review of dependency chains.
**Impact**: Deep dependency trees. Changing any class affects many dependents. Test setup complex.
**Detection**: Dependency tree depth > 3 with each level having 3+ dependencies.
**Solution**: Apply dependency inversion principle. Introduce interfaces to break direct dependencies. Consider event-driven architecture.
