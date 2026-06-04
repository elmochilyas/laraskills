# Anti-Patterns — Directory Organization Strategies

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Directory Organization Strategies |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Namespace Confusion | High | Medium | Autoloading errors: class not found despite file existing |
| Circular Domain Dependencies | High | Low | Code review: Domain A imports from Domain B, Domain B imports from Domain A |
| Architecture By URL | Medium | Medium | Code review: directory structure mirrors URL paths |
| Premature Domain-First | Medium | Medium | Code review: domain directories with 1-2 files each |
| Inconsistent Strategy Mix | High | Medium | Code review: some features in domain structure, others in layer structure |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Monolithic App Directory | All classes in `app/` with no sub-directories beyond Laravel defaults | 500+ files in `app/`, impossible to navigate without search |
| Empty Domain Shells | Domain directories created but never populated beyond initial scaffolding | Developers wonder if these domains have any code or were abandoned |
| Namespace/Directory Mismatch | Class namespace doesn't match file path due to incomplete PSR-4 mapping | Autoloading failures, IDE navigation broken |

---

## Anti-Pattern Details

### AP-DIR-01: Namespace Confusion

**Description**: The file's directory path does not match its namespace. A class at `app/Domain/Users/Controllers/UserController.php` has namespace `App\Http\Controllers\Users\UserController` instead of `App\Domain\Users\Controllers\UserController`. This causes autoloading errors, IDE confusion, and breaks PSR-4 conventions.

**Root Cause**: Refactoring directory structure without updating namespaces. Moving files without updating `composer.json` PSR-4 prefixes. Copy-paste from other projects that uses different conventions.

**Impact**:
- `composer dump-autoload` fails to find classes
- IDE cannot navigate from usage to file
- Manual require statements or broken imports
- New team members can't predict namespaces from directory structure

**Detection**:
- Autoloading: class not found exceptions despite file existing
- IDE: broken navigation, "class not found" on valid code
- Code review: `use` statements don't match directory structure

**Solution**:
- Ensure every namespace component matches a directory component
- Configure PSR-4 prefixes in `composer.json` for non-standard structures
- Run `composer dump-autoload` after any directory change
- Add a CI check that verifies namespace matches file path

**Example**:
```php
// File: app/Domain/Users/Controllers/UserController.php
// INCORRECT namespace:
namespace App\Http\Controllers\Users; // ❌ doesn't match path

// CORRECT namespace:
namespace App\Domain\Users\Controllers; // ✅ matches app/Domain/Users/Controllers/
```

---

### AP-DIR-02: Circular Domain Dependencies

**Description**: Domain directories import from each other, creating a dependency graph with cycles. `Users/Domain/` imports from `Orders/`, and `Orders/` imports from `Users/`. The domain directories are not independent modules — they are a flat group of related code whose organization provides no isolation benefit.

**Root Cause**: Poor domain boundary identification. Domains are defined by technical categories (backend services, third-party integrations) rather than business boundaries. Cross-domain dependencies are not extracted to a shared module.

**Impact**:
- Domain boundaries are meaningless — all domains are coupled to all others
- Changes to one domain risk breaking all others
- Extracting a domain into a separate package is impossible without refactoring all cycles
- Team ownership boundaries cannot be enforced by directory structure

**Detection**:
- Code review: `use App\Domain\Orders\` imports in `app/Domain/Users/` and vice versa
- Static analysis: dependency graph shows cycles between module directories
- Metrics: no "well-separated" domains, all domains depend on all others

**Solution**:
- Extract shared types (DTOs, interfaces, value objects) to a `Shared/` or `Common/` directory
- Define domain boundaries by business capability, not technical function
- Use dependency inversion: domains depend on interfaces in the shared directory
- Enforce cycle-free dependency rules with PHPStan or architectural tests

**Example**:
```bash
# BEFORE: Circular dependencies between domains
app/Domain/Users/ → imports from app/Domain/Orders/
app/Domain/Orders/ → imports from app/Domain/Users/

# AFTER: Shared types extracted
app/Shared/DTOs/
app/Domain/Users/ → imports only from app/Shared/
app/Domain/Orders/ → imports only from app/Shared/
```

---

### AP-DIR-03: Architecture By URL

**Description**: The directory structure mirrors the URL structure of the API. `app/Api/V1/Users/Controllers/`, `app/Api/V1/Orders/Controllers/` — the code organization is a reflection of the routing structure. When API versions change or endpoints are restructured, the directory structure must change too. Business logic is coupled to API structure.

**Root Cause**: The team organizes code the same way the API is organized, thinking this makes navigation predictable. It does, but at the cost of coupling code architecture to API versioning concerns.

**Impact**:
- Moving from v1 to v2 requires duplicating or moving business logic files
- API versioning concerns leak into directory structure (actions in `V1/`, actions in `V2/`)
- Two endpoints in different versions that share business logic don't share code naturally
- Code architecture must change when the API changes

**Detection**:
- Code review: directory structure contains `Api/`, `V1/`, `V2/` segments
- Code review: business logic classes (services, actions) are inside API version directories
- Refactoring: adding a new API version requires copying entire directory trees

**Solution**:
- Organize by business domain, not by API structure
- Keep API versioning at the routing level only (RouteServiceProvider)
- Business logic classes (DTOs, actions, services) should have no API version in their namespace
- Controllers can be organized by API version if needed, but they delegate to versionless services

**Example**:
```bash
# BEFORE: Architecture by URL
app/Api/V1/Users/Controllers/UserController.php
app/Api/V1/Users/Actions/CreateUserAction.php
app/Api/V2/Users/Controllers/UserController.php   # duplicate!
app/Api/V2/Users/Actions/CreateUserAction.php      # duplicate!

# AFTER: Domain-focused with versioned controllers
app/Domain/Users/Actions/CreateUserAction.php      # versionless
app/Domain/Users/Controllers/V1/UserController.php # thin, delegates to action
app/Domain/Users/Controllers/V2/UserController.php # thin, delegates to same action
```
