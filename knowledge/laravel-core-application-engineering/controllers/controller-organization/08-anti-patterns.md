# ECC Anti-Patterns — Controller Organization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Controller Organization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Over-Nesting (5+ Levels of Subdirectories)
2. Mixing Flat and Domain Organization Strategies
3. Structure by User Role (Admin/, Customer/ directories)
4. Empty Subdirectories Created Preemptively
5. Flat Directory with 30+ Controllers

---

## Repository-Wide Anti-Patterns

- Manual File Creation Without Artisan (Namespace Mismatch)
- `/Api/V1/Admin/Reports/` — 4+ Levels Deep
- Structure by HTTP Verb (Get/, Post/, Put/ directories)
- No API Versioning in Directory Structure
- `Controllers/Api/` Without Version Segment for Multi-Version Apps

---

## Anti-Pattern 1: Over-Nesting (5+ Levels)

### Category
Code Organization | Maintainability

### Description
Creating controller subdirectories 4 or more levels deep, such as `app/Http/Controllers/Api/V1/Admin/Reports/UserReportController.php`.

### Why It Happens
Teams try to organize by every possible dimension (version + role + domain + feature) simultaneously, creating deeply nested paths.

### Warning Signs
- Namespace exceeds 5 segments: `App\Http\Controllers\Api\V1\Admin\Reports`
- Import statements wrap across multiple lines due to namespace length
- Artisan command requires typing a very long path: `make:controller Api/V1/Admin/Reports/UserReportController`
- Navigating to a controller file requires expanding 5+ directory levels in the IDE

### Preferred Alternative
Limit nesting to 3 levels maximum from `app/Http/Controllers/`. Flatten within a domain — use `Admin/` at level 1, not level 4. Merge version and role into a single meaningful prefix.

### Related Rules
- Rule: Limit Nesting to 3 Levels Maximum

---

## Anti-Pattern 2: Mixing Flat and Domain Organization

### Category
Code Organization

### Description
Some controllers in the root `app/Http/Controllers/` directory while others are in domain subdirectories, with no consistent placement strategy.

### Why It Happens
Incremental reorganization without an explicit plan. New controllers are placed following different conventions as the team grows or changes.

### Warning Signs
- `app/Http/Controllers/UserController.php` (flat) alongside `app/Http/Controllers/Sales/OrderController.php` (domain)
- Developers ask "where should I put this new controller?" in code review
- Same domain has controllers in both root and subdirectory
- No CONTRIBUTING.md or ADR about organization strategy

### Preferred Alternative
Choose one strategy (flat, domain, or feature) and apply it consistently. If migrating from flat to domain, move ALL controllers in one pass, leaving the root clean.

### Related Rules
- Rule: Choose One Organization Strategy and Apply Consistently
- Rule: Group by Domain for Applications with 20+ Controllers

---

## Anti-Pattern 3: Structure by User Role

### Category
Code Organization | Architecture

### Description
Naming controller directories after user roles (e.g., `Admin/`, `Customer/`, `Manager/`) instead of by domain or feature.

### Why It Happens
Developers confuse authentication roles with code organization boundaries. A controller that serves both admins and customers cannot be placed without duplication.

### Warning Signs
- `Admin/UserController.php` and `Customer/UserController.php` — duplicated logic
- `Admin/` directory contains most controllers; `Customer/` has only a few
- Controllers in role directories contain identical logic for shared operations
- Adding a new role requires creating new directories and duplicating controllers

### Preferred Alternative
Organize by domain (`Users/`, `Orders/`, `Billing/`) where each controller serves all roles for that domain. Use middleware for role-based access control.

### Related Rules
- Rule: Do Not Organize Controllers by User Role

---

## Anti-Pattern 4: Empty Subdirectories Created Preemptively

### Category
Code Organization

### Description
Creating subdirectories like `Admin/`, `Reports/`, `Api/V2/` before any controller files exist in them.

### Why It Happens
Teams plan for future needs and create directories "for organization" without waiting for actual files.

### Warning Signs
- Empty directories exist under `app/Http/Controllers/`
- Directory listing shows `Admin/`, `Api/`, `Reports/` with no `.php` files
- Git repository contains empty directories that persist for months
- Developers create controllers in the root because the empty directory "doesn't feel right"

### Preferred Alternative
Create directories only when the first controller file is added. Artisan's `make:controller` creates the directory automatically if it doesn't exist.

### Related Rules
- Rule: Do Not Create Empty Subdirectories

---

## Anti-Pattern 5: Flat Directory with 30+ Controllers

### Category
Code Organization | Maintainability

### Description
Keeping all controllers in the flat `app/Http/Controllers/` directory after the application exceeds 20-30 controllers.

### Why It Happens
Teams do not notice the directory has grown large because IDEs provide file search that masks the navigation problem. No explicit threshold triggers reorganization.

### Warning Signs
- 40+ files in `app/Http/Controllers/` with no subdirectories
- Scrolling through the file list in the IDE takes multiple seconds
- Team members use "Find File" (Ctrl+P) exclusively because browsing is impractical
- New developers cannot guess where a controller lives without searching

### Preferred Alternative
At 20+ controllers, reorganize into domain subdirectories (`Sales/`, `Billing/`, `Auth/`). Use `php artisan make:controller Domain/NameController` to generate with the correct namespace.

### Related Rules
- Rule: Group by Domain for Applications with 20+ Controllers
