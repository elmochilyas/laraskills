# Anti-Patterns â€” Resource Controller Pattern
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Resource Controller Pattern |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Breaking RESTful Method Signatures | High | Medium | Modifying standard method signatures |
| Adding Non-Resourceful Methods | Medium | Medium | Custom methods on resource controllers |
| Resource Pattern for Non-Resource Ops | High | Medium | CRUD methods for non-CRUD operations |
| Inconsistent Method Implementation | Medium | High | Some methods throw 404, others implemented |
| Ignoring Single Responsibility | Medium | Medium | Controller handles multiple related models |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Resource Controller Standards | No conventions for implementation | Inconsistent patterns |
| Resource Controller Overuse | Using for every endpoint including non-CRUD | Mismatched semantics |

## Anti-Pattern Details

### AP-RCP-01: Breaking RESTful Method Signatures
**Description**: Modifying standard method signatures in resource controllers.
**Root Cause**: Custom parameter needs.
**Impact**: Route model binding may break.
**Detection**: Altered parameter lists in resource methods.
**Solution**: Keep standard signatures. Use method injection for extras.

### AP-RCP-02: Adding Non-Resourceful Methods
**Description**: Custom methods on resource controllers.
**Root Cause**: Easier to add to existing controller.
**Impact**: Controller grows beyond resourceful scope.
**Detection**: 2+ methods outside standard set.
**Solution**: Create separate controller or action.

### AP-RCP-03: Resource Pattern for Non-Resource Operations
**Description**: CRUD methods for non-CRUD operations.
**Root Cause**: Desire to use resource routing everywhere.
**Impact**: Wrong HTTP semantics.
**Detection**: store() sends emails. update() triggers workflows.
**Solution**: Explicit routes with meaningful HTTP methods.

### AP-RCP-04: Inconsistent Method Implementation
**Description**: Some methods implemented, others throw 404.
**Root Cause**: Resource registered without full implementation.
**Impact**: Clients hit 404 on standard endpoints.
**Detection**: Unimplemented resource methods.
**Solution**: Use only() to register implemented methods.

### AP-RCP-05: Ignoring Single Responsibility
**Description**: Resource controller handles multiple related models.
**Root Cause**: Related operations in same controller.
**Impact**: Hard to maintain.
**Detection**: Methods reference different models.
**Solution**: One controller per resource.
