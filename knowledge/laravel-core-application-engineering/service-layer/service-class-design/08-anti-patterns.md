# Anti-Patterns â€” Service Class Design
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Service Layer |
| Knowledge Unit | Service Class Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| God Service | High | High | Service handles too many unrelated responsibilities |
| Service as Thin Delegator | Medium | Medium | Service only delegates to models/repositories without adding value |
| Service with Too Many Dependencies | High | Medium | Service constructor has 5+ injected dependencies |
| Stateful Service | High | Medium | Service maintains instance state between method calls |
| Service Tightly Coupled to Framework | Medium | Medium | Service extends framework classes or depends on HTTP concerns |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Service Design Standards | No documented principles for service design | Inconsistent quality, hard-to-maintain services |
| Services as Dumping Ground | All non-controller logic ends up in services | Services become god classes |

## Anti-Pattern Details

### AP-SCD-01: God Service
**Description**: Service class handles multiple unrelated responsibilities â€” user management, billing, notifications, analytics.
**Root Cause**: Starting with a single service and adding methods over time.
**Impact**: Hard to understand, test, maintain. High coupling.
**Detection**: Service has 10+ public methods spanning multiple domains.
**Solution**: Split into focused services by domain responsibility.

### AP-SCD-02: Service as Thin Delegator
**Description**: Service method body consists of a single delegation: eturn ->repository->create().
**Root Cause**: Creating services for every operation regardless of complexity.
**Impact**: Indirection without benefit. Extra test mocking.
**Detection**: Service methods are one-liners delegating to other classes.
**Solution**: Don't create services for trivial CRUD. Use action classes for operations with real business logic.

### AP-SCD-03: Stateful Service
**Description**: Service maintains instance state (properties set in one method, used in another).
**Root Cause**: Developer treats service as a workflow object rather than stateless utility.
**Impact**: Thread safety issues. Unpredictable behavior between calls.
**Detection**: Service has non-constant properties modified in multiple methods.
**Solution**: Services should be stateless. Pass data between methods as parameters. Use value objects for results.

### AP-SCD-04: Service with Too Many Dependencies
**Description**: Service constructor has 5+ injected dependencies, indicating too many responsibilities.
**Root Cause**: Service handles cross-cutting operations requiring many collaborators.
**Impact**: Hard to instantiate and test. Constructor changes frequency indicates instability.
**Detection**: Constructor has 5+ type-hinted parameters.
**Solution**: Split service by responsibility. Consider event-driven architecture for cross-cutting concerns.

### AP-SCD-05: Service Tightly Coupled to Framework
**Description**: Service depends on HTTP-specific classes (Request, Response) or extends framework base classes.
**Root Cause**: Convenience â€” using Request directly avoids creating DTOs.
**Impact**: Service can't be used outside HTTP context (CLI, queue, tests).
**Detection**: Service imports classes from Illuminate\Http.
**Solution**: Services should accept DTOs and primitive types. Keep framework dependencies in controllers.
