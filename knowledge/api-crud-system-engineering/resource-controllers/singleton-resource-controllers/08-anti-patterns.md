# Anti-Patterns â€” Singleton Resource Controllers
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Singleton Resource Controllers |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Using Resource Instead of Singleton | Medium | Medium | resource() for singleton resources |
| Missing Show Route Awareness | Medium | Medium | Not knowing singleton auto-creates show |
| Nesting Under Singleton | Medium | Low | Routes nested under singleton |
| Missing Authorization in Singleton Context | High | Medium | No parent-scoped authorization |
| Inconsistent Singleton Implementation | Medium | Medium | Some use singleton(), others manual |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Singleton Pattern Documentation | Unaware of Laravel's singleton route | Manual implementation |
| Overusing Singleton Routes | Treating non-singletons as singleton | Missing routes |

## Anti-Pattern Details

### AP-SRC-01: Using Resource Instead of Singleton
**Description**: resource() for resources that exist once per parent.
**Root Cause**: Unaware of singleton() method.
**Impact**: Extra unnecessary routes.
**Detection**: Profile/settings use resource().
**Solution**: Use Route::singleton().

### AP-SRC-02: Missing Show Route Awareness
**Description**: Not realizing singleton includes show by default.
**Root Cause**: Not reading singleton docs.
**Impact**: Clients unaware of show endpoint.
**Detection**: Confusion about singleton route list.
**Solution**: Document singleton includes show.

### AP-SRC-03: Nesting Under Singleton
**Description**: Resources nested under singleton routes.
**Root Cause**: Treating singleton as regular resource.
**Impact**: Confusing URLs.
**Detection**: Nesting under singleton.
**Solution**: Nest under parent directly.

### AP-SRC-04: Missing Authorization in Singleton Context
**Description**: No parent-scoped authorization for singleton.
**Root Cause**: Assuming singleton is user-specific.
**Impact**: Users access other users' singletons.
**Detection**: No auth checks in singleton controller.
**Solution**: Always authorize within parent context.

### AP-SRC-05: Inconsistent Singleton Implementation
**Description**: Mix of singleton() and resource() with restrictions.
**Root Cause**: Different developers.
**Impact**: Inconsistent route patterns.
**Detection**: Both approaches used.
**Solution**: Standardize on singleton().
