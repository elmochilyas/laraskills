# Anti-Patterns â€” Controller Dependency Injection
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Controller Dependency Injection |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Too Many Constructor Dependencies | High | Medium | 5+ injected services, indicating too many responsibilities |
| Resolving Dependencies Inside Method | High | Medium | Using app()->make() instead of constructor injection |
| Injecting HTTP-Specific Dependencies | Medium | Medium | Request-dependent services used outside HTTP context |
| Excessive Method Injection Parameters | Medium | Low | Method has 3+ injected parameters |
| Mixing Constructor and Method Injection | Medium | Medium | No consistent pattern for injection placement |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No DI Convention Documentation | Missing conventions for controller DI | Inconsistent patterns |
| Over-Injection of Optional Dependencies | Services injected even when only used in some methods | Unnecessary instantiation |

## Anti-Pattern Details

### AP-CDI-01: Too Many Constructor Dependencies
**Description**: Controller constructor has 5+ injected services.
**Root Cause**: Controller handles too many operations.
**Impact**: Hard to test. Constructor changes frequently.
**Detection**: Constructor parameter count >= 5.
**Solution**: Split controller by domain. Use action pattern.

### AP-CDI-02: Resolving Dependencies Inside Method
**Description**: Using app()->make() inside methods.
**Root Cause**: Shortcut to avoid adding constructor parameter.
**Impact**: Hidden dependencies, harder to test.
**Detection**: Methods contain app() or resolve().
**Solution**: Always use constructor injection.

### AP-CDI-03: Injecting HTTP-Specific Dependencies
**Description**: Injecting Request into services also used outside HTTP.
**Root Cause**: Service uses Request objects instead of DTOs.
**Impact**: Services tied to HTTP context.
**Detection**: Service constructor injects Request.
**Solution**: Services accept DTOs. Controllers extract data from Request.

### AP-CDI-04: Excessive Method Injection Parameters
**Description**: Method has 3+ injected parameters beyond Request.
**Root Cause**: Method does too much.
**Impact**: Long signatures, confusing.
**Detection**: Methods with 3+ non-route injections.
**Solution**: Constructor inject shared services.
