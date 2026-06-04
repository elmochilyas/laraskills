# Anti-Patterns â€” Domain Vs Application Services
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Service Layer |
| Knowledge Unit | Domain Vs Application Services |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Mixing Domain and Application Logic | High | High | Services contain both domain rules and application orchestration |
| Anemic Domain Services | High | Medium | Domain services only getters/setters with no business logic |
| Application Service Doing Domain Work | High | Medium | Application service implements business rules that belong in domain |
| No Clear Service Boundary | Medium | High | Unclear whether a service is domain or application â€” no classification |
| Fat Application Services | Medium | Medium | Application services handle orchestration, response formatting, and error handling |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Service Classification | No standard for organizing services by domain vs application | Services mix concerns, hard to maintain |
| Inconsistent Naming | Domain and application services named without distinction | Unclear responsibility from class name alone |

## Anti-Pattern Details

### AP-DVAS-01: Mixing Domain and Application Logic
**Description**: A single service class contains both domain business rules and application orchestration (HTTP concerns, logging, transactions).
**Root Cause**: Developer puts all logic in one class without separating concerns.
**Impact**: Domain rules coupled to infrastructure. Can't reuse domain logic outside web context.
**Detection**: Service class imports both domain models and HTTP/response classes.
**Solution**: Separate domain services (pure business rules) from application services (orchestration).

### AP-DVAS-02: Anemic Domain Services
**Description**: Domain services contain no real business logic â€” only CRUD operations and property access.
**Root Cause**: Business logic placed in controllers or application services instead of domain.
**Impact**: Domain model is anemic. Business rules scattered across application layer.
**Detection**: Domain service methods are one-liners delegating to repositories.
**Solution**: Move business logic from application layer into domain services. Keep domain services rich.

### AP-DVAS-03: Application Service Doing Domain Work
**Description**: Application service implements business rules, validations, or calculations that belong in domain.
**Root Cause**: Convenience â€” putting logic in the closest service.
**Impact**: Domain rules duplicated across application services. Business logic not centralized.
**Detection**: Application service has if/else or calculations about domain state.
**Solution**: Move domain rules to domain services. Application services call domain services.

### AP-DVAS-04: No Clear Service Boundary
**Description**: No distinction between domain and application services in directory structure or naming.
**Root Cause**: Team hasn't defined service layers.
**Impact**: New developers don't know where to add new logic.
**Detection**: All services in same directory with no layer indication.
**Solution**: Separate directories: Domain/Services, Application/Services. Document the distinction.
