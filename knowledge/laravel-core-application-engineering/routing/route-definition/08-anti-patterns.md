# Anti-Patterns â€” Route Definition
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing |
| Knowledge Unit | Route Definition |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Business Logic in Route Files | High | Medium | Route files contain closures with business logic instead of controller references |
| Inconsistent Route Method Usage | Medium | Medium | Mixing Route::any(), Route::match(), and specific methods inconsistently |
| Missing Route Name Convention | Medium | High | Routes unnamed or named inconsistently, preventing reverse routing |
| Route Definitions Too Dense | Medium | Medium | All routes in a single file without grouping or organization |
| Hardcoded URLs in Views/Controllers | High | High | Using hardcoded URLs instead of named route references |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Route Naming Convention | Routes named inconsistently or not at all | Can't use route() helper, refactoring breaks URLs |
| Inconsistent Route Structure | Different developers define routes differently | Hard to understand routing architecture |

## Anti-Pattern Details

### AP-RD-01: Business Logic in Route Files
**Description**: Route files contain closure-based routes with business logic instead of delegating to controllers.
**Root Cause**: Developer takes shortcut for simple routes without extracting controller.
**Impact**: Closures prevent route caching. Business logic in wrong layer. Untestable.
**Detection**: Route file contains Route::get('/...', function () { ... }) with logic.
**Solution**: Always use controller methods. Keep route files for routing only.

### AP-RD-02: Missing Route Name Convention
**Description**: Routes not given names via ->name() or named inconsistently.
**Root Cause**: Developer sees naming as optional or unnecessary overhead.
**Impact**: Hardcoded URLs throughout codebase. Route changes require searching all files.
**Detection**: Views/controllers use url('/posts') instead of route('posts.index').
**Solution**: Name all routes using dot notation convention (resource.model.action).

### AP-RD-03: Route Definitions Too Dense
**Description**: All route definitions in a single file without grouping or organization.
**Root Cause**: Default Laravel structure used without modification.
**Impact**: Hard to find specific routes. Merge conflicts common in route files.
**Detection**: Single route file with 50+ definitions.
**Solution**: Split routes into domain/organization-specific files. Use groups.

### AP-RD-04: Hardcoded URLs in Views/Controllers
**Description**: URLs hardcoded as strings instead of using oute() helper.
**Root Cause**: Developer takes the obvious path without considering maintainability.
**Impact**: Route changes require updating every hardcoded URL.
**Detection**: String URLs like '/posts/'. in views or controllers.
**Solution**: Use oute('posts.show', ) for all URL generation.
