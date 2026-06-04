# Anti-Patterns â€” Route Name Generation
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing |
| Knowledge Unit | Route Name Generation |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Routes Without Names | High | High | Route definitions missing ->name() call |
| Inconsistent Naming Convention | Medium | Medium | Some routes use dot notation, others use snake_case or camelCase |
| Generic Route Names | Medium | Medium | Route names like 'index', 'show' without resource prefix cause collisions |
| Name Doesn't Reflect HTTP Method | Medium | Medium | Route name doesn't indicate the HTTP verb or action |
| Hardcoded URLs Instead of Named Routes | High | High | Views/controllers use url('/posts') instead of oute('posts.index') |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Route Naming Convention Documented | No team-wide standards for route naming | Inconsistent names, collisions, confusion |
| Names Not Reflecting Resource Structure | Route names don't map to clear resource hierarchy | Hard to guess correct route name |

## Anti-Pattern Details

### AP-RNG-01: Routes Without Names
**Description**: Route definitions omit ->name(), making routes unreferenceable by name.
**Root Cause**: Developer doesn't see route naming as important.
**Impact**: Can't use oute() helper. Changing URL requires searching all files.
**Detection**: Route file shows Route::get('/posts', [PostController::class, 'index']) without ->name().
**Solution**: Name all routes, especially those used in views or redirects.

### AP-RNG-02: Inconsistent Naming Convention
**Description**: Route names use different conventions â€” dots, underscores, camelCase mixed.
**Root Cause**: Different developers followed different conventions.
**Impact**: Impossible to guess route names. Must check route list for each.
**Detection**: 'posts.index', 'user_show', 'getUserById' all in same route file.
**Solution**: Standardize on dot notation (resource.action) for all route names.

### AP-RNG-03: Generic Route Names
**Description**: Route names like 'index', 'show' without prefix cause naming collisions.
**Root Cause**: Route names defined manually without resource prefix.
**Impact**: oute('index') is ambiguous. Route caching may fail on duplicate names.
**Detection**: Duplicate route names in route:list output.
**Solution**: Always prefix route names with resource or domain name (posts.index, users.show).

### AP-RNG-04: Hardcoded URLs Instead of Named Routes
**Description**: URLs hardcoded as strings in views, controllers, and redirects.
**Root Cause**: Developer takes shortest path without considering maintainability.
**Impact**: URL changes require full-text search of codebase.
**Detection**: String URLs like '/posts/create' in blade or controller files.
**Solution**: Use oute('posts.create') for all URL generation.
