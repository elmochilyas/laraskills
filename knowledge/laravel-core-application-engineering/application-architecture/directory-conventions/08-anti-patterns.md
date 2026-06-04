# ECC Anti-Patterns — Directory Conventions

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Directory Conventions |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Premature Top-Level Directory Creation (Empty Structures)
2. Mixed Organizational Strategies (Technical + Domain Simultaneously)
3. Case-Sensitivity Mismatch (Namespace vs Directory)
4. Organization by Developer Role (Admin/Frontend/Backend)

---

## Repository-Wide Anti-Patterns

- Technical-Before-Domain Dogma (pure technical for 100k-line app with multiple teams)
- Domain-Before-Technical Dogma (pure domain for 20-file CRUD app)
- Excessive Directory Nesting (>4 levels under `app/`)

---

## Anti-Pattern 1: Premature Top-Level Directory Creation

### Category
Architecture

### Description
Creating `app/Services/`, `app/Actions/`, `app/DTOs/`, `app/Repositories/`, `app/Enums/`, `app/Traits/` on day one — all empty, all anticipating future needs that may never materialize.

### Why It Happens
Developers follow boilerplate templates or "best practice" structures from blog posts without evaluating whether their project needs these patterns.

### Warning Signs
- Empty top-level directories under `app/` with no files
- Directories named after patterns (Services, Actions, DTOs) that the team hasn't decided to use
- Developers ask "should I put this in Services/ or Actions/?" before either has content

### Preferred Alternative
Add directories only when you have the first file to place in them. Let conventions be earned by complexity.

### Related Rules
- Rule: Prevent Premature Top-Level Directory Creation

---

## Anti-Pattern 2: Mixed Organizational Strategies

### Category
Maintainability

### Description
Having both `app/Services/PaymentService.php` and `app/Domain/Payment/Services/PaymentService.php` in the same project.

### Why It Happens
Different developers add files at different times without agreeing on conventions. No one cleans up legacy locations.

### Warning Signs
- Files with the same role (e.g., services) are split between `app/Services/` and `app/Domain/*/Services/`
- New team members ask "where should I put this?"
- CODEOWNERS cannot be assigned because files are scattered

### Preferred Alternative
Choose one convention, document it, and apply it to every file. Migrate legacy files during dedicated refactoring.

### Related Rules
- Rule: Never Mix Organizational Strategies

---

## Anti-Pattern 3: Case-Sensitivity Mismatch

### Category
Reliability

### Description
Namespace declares `App\Models\User` but the file is at `app/models/User.php` (lowercase `m`).

### Why It Happens
Developers work on macOS or Windows (case-insensitive filesystems) where the mismatch is invisible.

### Warning Signs
- CI tests pass but production deployment fails with "class not found" for specific classes
- Local development works but server (Linux) deployment fails
- git diff shows case-only changes after CI pipeline runs

### Preferred Alternative
Enforce case-consistent naming with CI checks or PHPStan rules.

### Related Rules
- Rule: Maintain Case Consistency Between Namespace and Directory

---

## Anti-Pattern 4: Organization by Developer Role

### Category
Design

### Description
Top-level directories named `Admin/`, `Frontend/`, `Backend/` as the primary organizational unit.

### Why It Happens
Developers organize by who uses the feature (admin users, frontend users) rather than by what the code does.

### Warning Signs
- Duplicate controllers in `Admin/` and `Frontend/` that share most logic
- Code reuse between `Admin/` and `Frontend/` is difficult
- URL prefixes drive file organization (e.g., `Admin/UserController.php` for `admin/users`)

### Preferred Alternative
Organize by technical role or business domain. URL prefixes are routing concerns, not structural concerns.

### Related Rules
- Rule: Do Not Organize by Developer Role
