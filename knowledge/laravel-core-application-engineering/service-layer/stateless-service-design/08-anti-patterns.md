# Anti-Patterns â€” Stateless Service Design
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Service Layer |
| Knowledge Unit | Stateless Service Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Stateful Service Properties | High | Medium | Service maintains instance state via properties |
| Service with Mutable Configuration | Medium | Medium | Service configuration set via methods that modify instance state |
| Thread-Unsafe Service | High | Medium | Service with state used in async/queue/Octane context |
| Service State Set in Constructor | Medium | Medium | Constructor sets state that varies per request |
| Service Leaking State Between Method Calls | High | Medium | One method call affects behavior of subsequent calls via instance state |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Stateless Service Standard | No documented requirement for stateless services | Stateful services cause subtle bugs |
| Stateful Services in Octane/Async | Stateful services used in long-running processes | Request state leaks across requests |

## Anti-Pattern Details

### AP-SSD-01: Stateful Service Properties
**Description**: Service class has non-constant properties that change during execution.
**Root Cause**: Developer uses properties to avoid passing parameters between methods.
**Impact**: Thread safety issues. Unpredictable behavior across calls. Octane/queue incompatibility.
**Detection**: Service has properties set in one method, read in another.
**Solution**: Keep services stateless. Pass data as method parameters. Use return values for results.

### AP-SSD-02: Service with Mutable Configuration
**Description**: Service has setter methods that modify configuration per-call.
**Root Cause**: Developer wants to reuse service with different configurations.
**Impact**: Not thread-safe. Configuration leaks across requests.
**Detection**: Service has setX() methods for configuration.
**Solution**: Pass configuration as method parameters. Use factory pattern for configuration variants.

### AP-SSD-03: Thread-Unsafe Service Registered as Singleton
**Description**: Stateful service registered as singleton (default Laravel binding) and used in concurrent contexts.
**Root Cause**: Not considering thread safety when registering service as singleton.
**Impact**: Race conditions, data corruption in concurrent requests.
**Detection**: Stateful service registered without 'shared => false'. Used in Octane or queue workers.
**Solution**: Make service stateless or register as non-shared binding.

### AP-SSD-04: Service State Set in Constructor
**Description**: Service constructor accepts runtime-variable data and stores it as properties.
**Root Cause**: Convenience â€” passing data through constructor avoids method parameters.
**Impact**: Service becomes request-scoped. Can't be shared across requests.
**Detection**: Constructor parameter sets property used in service methods.
**Solution**: Accept data as method parameters. Keep constructor for injected dependencies only.
