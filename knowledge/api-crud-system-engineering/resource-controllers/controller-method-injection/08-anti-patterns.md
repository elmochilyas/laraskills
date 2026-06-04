# Anti-Patterns â€” Controller Method Injection
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Controller Method Injection |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Overuse of Method Injection for Services | High | Medium | Method injection for services that should be constructor-injected |
| Method Injection Without Route Model Binding | Medium | Medium | Type-hinted models without proper route parameter matching |
| Excessive Method Injection Parameters | Medium | Medium | 3+ injected services making signature confusing |
| Mixing Service and Data Parameters | Medium | Medium | Confusing ordering of injected vs route parameters |
| Method Injection When Constructor Is Appropriate | Medium | High | Same services injected in every method |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Method Injection Convention | No standard for when method injection is preferred | Inconsistent patterns |
| Ignoring Route Model Binding | Manual model queries instead of method injection binding | Extra code |

## Anti-Pattern Details

### AP-CMI-01: Overuse of Method Injection for Services
**Description**: Method injection used for shared services used in multiple methods.
**Root Cause**: Preference for method injection without considering constructor.
**Impact**: Every method signature includes same services.
**Detection**: Same service in 3+ methods.
**Solution**: Move shared services to constructor.

### AP-CMI-02: Method Injection Without Route Model Binding
**Description**: Type-hinted model in method without matching route parameter.
**Root Cause**: Expecting container resolution instead of binding.
**Impact**: Wrong model instance resolved.
**Detection**: Variable name doesn't match route parameter.
**Solution**: Match variable name to route parameter for implicit binding.

### AP-CMI-03: Excessive Method Injection Parameters
**Description**: Method has 3+ injected services plus route parameters.
**Root Cause**: Method does too much.
**Impact**: Long signatures, complex test setup.
**Detection**: Method has 3+ service injections.
**Solution**: Move shared deps to constructor.

### AP-CMI-04: Mixing Service and Data Parameters
**Description**: Confusing ordering of injected vs route parameters.
**Root Cause**: No parameter ordering convention.
**Impact**: Hard to parse method signatures.
**Detection**: Inconsistent ordering across controllers.
**Solution**: Follow convention: route params first, then injected services.
