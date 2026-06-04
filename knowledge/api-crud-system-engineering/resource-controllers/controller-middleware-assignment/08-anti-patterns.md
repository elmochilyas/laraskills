# Anti-Patterns â€” Controller Middleware Assignment
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Controller Middleware Assignment |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Middleware in Routes Instead of Controller | Medium | High | Middleware defined in routes when it belongs in controller |
| Middleware in Controller Constructor | High | Medium | ->middleware() in constructor â€” deprecated pattern |
| Inconsistent Middleware Assignment | Medium | Medium | Some in routes, some in controllers |
| Missing Route-Specific Exclusions | High | Medium | Middleware applied to all methods when some need different auth |
| Duplicate Middleware in Route and Controller | Medium | Medium | Same middleware applied twice |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Middleware Convention | No guidelines for middleware placement | Inconsistent patterns |
| Middleware at Wrong Scope | Global middleware when per-route needed | Unnecessary overhead |

## Anti-Pattern Details

### AP-CMA-01: Middleware in Routes Instead of Controller
**Description**: All middleware defined in routes even when semantically belongs to controller.
**Root Cause**: Developer preference for explicit route middleware.
**Impact**: Middleware changes require route updates.
**Detection**: Route definitions contain middleware for all methods.
**Solution**: Keep method-specific middleware in controller.

### AP-CMA-02: Middleware in Controller Constructor
**Description**: ->middleware() in constructor runs before middleware is resolved.
**Root Cause**: Following outdated Laravel patterns.
**Impact**: Unreliable middleware application.
**Detection**: ->middleware() in constructor.
**Solution**: Define middleware in routes.

### AP-CMA-03: Inconsistent Middleware Assignment
**Description**: No consistent pattern for middleware placement.
**Root Cause**: Different developer preferences.
**Impact**: Hard to audit security.
**Detection**: Middleware in routes, controllers, groups.
**Solution**: Establish convention for placement.

### AP-CMA-04: Missing Route-Specific Exclusions
**Description**: Auth middleware applied to all methods including public ones.
**Root Cause**: Broad middleware application without exclusions.
**Impact**: Public methods return 401.
**Detection**: Public routes with auth middleware.
**Solution**: Use withoutMiddleware() for public methods.

### AP-CMA-05: Duplicate Middleware
**Description**: Same middleware applied at group and controller level.
**Root Cause**: Redundant application.
**Impact**: Middleware runs twice.
**Detection**: Same middleware in route group and controller.
**Solution**: Define middleware once.
