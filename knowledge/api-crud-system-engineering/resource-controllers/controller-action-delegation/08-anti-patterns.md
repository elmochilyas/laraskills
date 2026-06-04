# Anti-Patterns â€” Controller Action Delegation
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Controller Action Delegation |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Controller Does Everything Inline | High | High | Controller performs all operations instead of delegating |
| Inconsistent Delegation Pattern | Medium | Medium | Some controllers delegate, others don't |
| Delegating Too Early | Medium | Medium | Delegating trivial operations when direct ORM call suffices |
| Missing Error Handling After Delegation | High | Medium | Controller assumes action always succeeds |
| Action Returns HTTP Response | High | Medium | Action returns redirect/response making it HTTP-coupled |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Delegation Convention | No standard for when to delegate vs inline | Inconsistent codebase |
| Mixed Delegation Targets | Some delegate to services, some to actions, some to repositories | Confusing architecture |

## Anti-Pattern Details

### AP-ACD-01: Controller Does Everything Inline
**Description**: Controller methods contain all business logic instead of delegating.
**Root Cause**: Direct approach feels faster.
**Impact**: Untestable logic, duplicated code, fat controllers.
**Detection**: Method exceeds 15 lines with complex business decisions.
**Solution**: Delegate to action classes. Controller handles HTTP only.

### AP-ACD-02: Inconsistent Delegation Pattern
**Description**: No consistent pattern for when and how controllers delegate.
**Root Cause**: Different developers implement different patterns.
**Impact**: Multiple delegation strategies in codebase.
**Detection**: Some use actions, some services, some repositories.
**Solution**: Standardize on one delegation pattern.

### AP-ACD-03: Delegating Too Early
**Description**: Delegating trivial operations to action classes that do nothing but Model::create().
**Root Cause**: Dogmatic application of action pattern.
**Impact**: Unnecessary file count, indirection without benefit.
**Detection**: Action body is one line calling Model::create().
**Solution**: Inline trivial operations. Only delegate for real business logic.

### AP-ACD-04: Missing Error Handling After Delegation
**Description**: Controller assumes delegated action always succeeds.
**Root Cause**: Trusting action to handle all errors internally.
**Impact**: Unhandled exceptions bubble up.
**Detection**: Try-catch blocks missing around action calls.
**Solution**: Handle expected exceptions in controller.

### AP-ACD-05: Action Returns HTTP Response
**Description**: Action returns Response or Redirect, coupling to HTTP.
**Root Cause**: Action handles HTTP concerns for convenience.
**Impact**: Can't use from CLI, queue, or other non-HTTP contexts.
**Detection**: Action returns Illuminate\Http\Response classes.
**Solution**: Action returns domain data. Controller handles HTTP response.
