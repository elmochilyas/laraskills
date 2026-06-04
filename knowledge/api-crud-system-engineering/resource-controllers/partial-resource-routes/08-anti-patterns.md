# Anti-Patterns â€” Partial Resource Routes
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Partial Resource Routes |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Full Resource When Partial Needed | Medium | High | apiResource() when only 2-3 methods used |
| Manual Routes Instead of Resource | Medium | Medium | Manually defining each route instead of only()/except() |
| Inconsistent Method Selection | Medium | Medium | Different subsets without clear pattern |
| Overly Restrictive Partial Routes | Low | Medium | Excluding methods that will clearly be needed |
| Registering Web Methods for API | Medium | High | resource() includes create/edit for API |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Partial Route Convention | No guidelines for partial vs full routes | Inconsistent endpoint availability |
| Missing Documentation | Partial resources don't document available endpoints | Client confusion |

## Anti-Pattern Details

### AP-PRR-01: Full Resource When Partial Needed
**Description**: apiResource() registers all routes when only 2-3 implemented.
**Root Cause**: Default resource without considering implementation.
**Impact**: Undefined endpoints return 404.
**Detection**: Controller lacks methods for registered routes.
**Solution**: Use only()/except() for implemented methods.

### AP-PRR-02: Manual Routes Instead of Resource
**Description**: Each route defined manually instead of apiResource()->only().
**Root Cause**: Not aware of only()/except().
**Impact**: Verbose, less intention-revealing.
**Detection**: Manual routes matching resource pattern.
**Solution**: Use apiResource()->only().

### AP-PRR-03: Inconsistent Method Selection
**Description**: Different resources expose different method subsets.
**Root Cause**: Individual developer decisions.
**Impact**: Unpredictable endpoint availability.
**Detection**: Same type resources with different methods.
**Solution**: Standardize per resource type.

### AP-PRR-04: Overly Restrictive Partial Routes
**Description**: only(['index', 'show']) when store/update clearly needed soon.
**Root Cause**: Overly cautious.
**Impact**: Extra deployment for route additions.
**Detection**: Store method exists but route not registered.
**Solution**: Include anticipated methods.

### AP-PRR-05: Registering Web Methods for API
**Description**: resource() instead of apiResource() adds create/edit.
**Root Cause**: Not using --api flag.
**Impact**: Extra routes, potential security concerns.
**Detection**: API routes with GET create/edit.
**Solution**: Use apiResource().
