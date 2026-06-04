# Anti-Patterns â€” Controller Code Limits
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Controller Code Limits |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Controller Exceeds 200 Lines | High | High | File exceeds recommended maximum |
| Single Controller for Multiple Resources | High | Medium | One controller handles CRUD for multiple related models |
| Method Exceeds 20 Lines | Medium | Medium | Individual method exceeds recommended length |
| Too Many Dependencies Injected | Medium | Medium | Constructor has 4+ injected services |
| Inline Query Building in Controller | Medium | High | Complex DB queries built directly in methods |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Line/Method Count Standards | Team lacks defined limits | Controllers grow without check |
| No Refactoring Triggers | No criteria for when controller needs refactoring | Gradual degradation |

## Anti-Pattern Details

### AP-CCL-01: Controller Exceeds 200 Lines
**Description**: Controller grows beyond recommended limits.
**Root Cause**: No maximum line limit.
**Impact**: Hard to navigate, SRP violated.
**Detection**: File exceeds 200 lines.
**Solution**: Split into multiple controllers by domain.

### AP-CCL-02: Single Controller for Multiple Resources
**Description**: One controller handles multiple related models.
**Root Cause**: Resources are related, so same controller.
**Impact**: Large controller, hard to test.
**Detection**: Methods reference different resources.
**Solution**: One controller per resource.

### AP-CCL-03: Method Exceeds 20 Lines
**Description**: Method exceeds 20 lines, indicating too much.
**Root Cause**: Multiple operations combined.
**Impact**: Hard to understand and test.
**Detection**: Method over 20 lines.
**Solution**: Extract steps to private methods or delegate.

### AP-CCL-04: Too Many Dependencies Injected
**Description**: Constructor has 4+ injected services.
**Root Cause**: Controller handles too many responsibilities.
**Impact**: Hard to instantiate in tests.
**Detection**: Constructor parameter count >= 4.
**Solution**: Split controller by domain.

### AP-CCL-05: Inline Query Building
**Description**: Complex Eloquent queries built directly in controller.
**Root Cause**: Shortest route from request to response.
**Impact**: Duplicated queries across controllers.
**Detection**: Complex query builder chains in methods.
**Solution**: Move queries to repositories, scopes, or actions.
