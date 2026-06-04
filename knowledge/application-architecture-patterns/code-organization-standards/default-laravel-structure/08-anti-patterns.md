# ECC Anti-Patterns — Default Laravel Directory Structure

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | Default Laravel directory structure and its design rationale |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. App Dumping Ground
2. Preemptive Architecture
3. Framework Fighting
4. Flat Controller Accumulation

---

## Repository-Wide Anti-Patterns

- Fat Controllers
- Premature Abstraction
- Overengineering

---

## Anti-Pattern 1: App Dumping Ground

### Category
Code Organization

### Description
Adding all classes to the `app/` root namespace without any subdirectories, creating a flat-file dumping ground where files become unfindable. Developers add `UserService.php`, `PaymentGateway.php`, `ReportGenerator.php` directly under `app/` instead of organizing into subdirectories by role.

### Why It Happens
Assuming the default structure means "no structure at all." Lack of team conventions for namespace organization. Time pressure that prioritizes adding files over organizing them.

### Warning Signs
- `app/` directory contains 20+ files directly in the root
- File names carry organizational burden (e.g., `ApiUserController.php` instead of `Api/UserController.php`)
- IDE autocomplete returns too many irrelevant results
- Developers ask "where should I put this?" for common artifact types

### Why It Is Harmful
Files become unfindable. Namespace collisions become likely. PSR-4 autoloading works but adds cognitive load — every file must be searched alphabetically. New developers cannot navigate the codebase intuitively.

### Real-World Consequences
Developers create duplicate classes because they couldn't find the existing one. Code reviews miss duplication. Onboarding time increases as new team members must learn implicit file locations.

### Preferred Alternative
Use subdirectories within default Laravel directories. Place API controllers in `app/Http/Controllers/Api/`, custom services in `app/Services/`, and commands in `app/Console/Commands/`. Even within a default structure, subdirectories preserve discoverability.

### Refactoring Strategy
1. Identify all files currently in `app/` root that belong to a subdirectory category
2. Create target subdirectories (e.g., `app/Services/`, `app/Enums/`, `app/Events/`)
3. Move files and update namespace declarations to match
4. Update all `use` imports across the codebase
5. Run `composer dump-autoload` to regenerate class map
6. Add directory documentation to README or ARCHITECTURE.md

### Detection Checklist
- [ ] Count files directly under `app/` root (excluding `app/Http/`, `app/Models/`, etc.)
- [ ] Check if subdirectories exist for API vs web controllers
- [ ] Verify that custom classes have appropriate namespace grouping

### Related Rules
- R06: Use Subdirectories Within Default Directories (COS-01/05-rules.md)

### Related Skills
- Apply Laravel's Default Directory Structure for Small Teams (COS-01/06-skills.md)

### Related Decision Trees
- Stay With Defaults vs Adopt Custom Structure (COS-01/07-decision-trees.md)

---

## Anti-Pattern 2: Preemptive Architecture

### Category
Architecture

### Description
Building elaborate directory structures and abstractions on day one for an application that doesn't yet exist. Creating `app/Domains/Billing/Contracts/`, `app/Domains/Billing/Repositories/`, and `app/Support/Collections/` before writing a single feature. Six months later, 80% of the structure is unused.

### Why It Happens
Architectural purity over pragmatism. Fear of future refactoring costs. Desire to "do it right the first time." Influence from enterprise patterns that don't match the project's actual complexity.

### Warning Signs
- Day 1 commits include empty directories or placeholder files
- Directory structure describes abstract domains that don't yet have features
- Team spends significant time discussing file placement before writing business logic
- More directories than the project has actual classes

### Why It Is Harmful
Wasted development time on unused abstractions. Team cynicism toward architectural decisions when structures prove unnecessary. Harder to change direction when the codebase skeleton embodies assumptions that may be wrong.

### Real-World Consequences
A startup spent 4 sprints building a domain-driven directory structure with repositories, interfaces, and DTOs — only to discover the business problem was simple CRUD that fit better in the default structure. The abstraction overhead slowed feature delivery by 3x during the critical early phase.

### Preferred Alternative
Start with Laravel's default directory structure. Add custom directories only when concrete, measurable friction emerges — a controller exceeding 200 lines, a third business domain appearing, or a team growing beyond 5 engineers.

### Refactoring Strategy
1. Remove all empty directories that have no classes
2. Consolidate unused abstract interfaces with their single implementations
3. Move classes from overly deep namespaces back to shallower default locations
4. Document the simplified structure in ARCHITECTURE.md
5. Set a team rule: "Add structure when it hurts, not before"

### Detection Checklist
- [ ] Count empty or single-file directories under `app/`
- [ ] Compare directory count to class count — is the ratio >1:3?
- [ ] Check if abstract interfaces have only one implementation

### Related Rules
- R08: Start With Defaults, Evolve With Demonstrated Pain (COS-01/05-rules.md)

### Related Skills
- Evaluate When to Deviate from Defaults (COS-09/06-skills.md)

### Related Decision Trees
- Stay With Defaults vs Adopt Custom Structure (COS-01/07-decision-trees.md)

---

## Anti-Pattern 3: Framework Fighting

### Category
Framework Usage

### Description
Restructuring Laravel's directory layout purely to avoid looking like "default Laravel." Moving controllers to `app/Controllers/` (removing the `Http/` segment), renaming `app/Models/` to `app/Entities/`, or creating custom directories that break `artisan make:` commands — all without documentation or concrete benefit.

### Why It Happens
Perception that "default Laravel" looks amateurish. Previous experience with other frameworks (Symfony, Rails) that use different conventions. Desire to impose personal preferences over framework conventions.

### Warning Signs
- `artisan make:controller` places files in unexpected locations
- "Class not found" errors after running generator commands
- Developers manually moving generated files to match project conventions
- No documentation explaining why default locations were changed

### Why It Is Harmful
Breaks framework conventions that every Laravel developer expects. Generator commands produce files in wrong locations. New hires must learn custom structure before being productive. Documentation burden increases.

### Real-World Consequences
A project renamed `app/Models/` to `app/Entities/` without documenting the change. New developers ran `php artisan make:model`, which created files in `app/Models/`. Half the models ended up in `app/Models/`, half in `app/Entities/`. Months of confusion until someone ran a migration script.

### Preferred Alternative
Keep default Laravel directories for standard artifact types. If relocation is necessary, override generator stubs to maintain compatibility and document all changes explicitly in ARCHITECTURE.md.

### Refactoring Strategy
1. Identify all directories that differ from Laravel defaults
2. For each deviation, determine if it provides measurable value
3. If no measurable value, revert to default locations
4. If valuable, override generator stubs to maintain `artisan make:` compatibility
5. Document all kept deviations in project README or ARCHITECTURE.md

### Detection Checklist
- [ ] Run `artisan make:model Test` — where does it place the file?
- [ ] Run `artisan make:controller Test` — where does it place the file?
- [ ] Compare project directories against vanilla Laravel 11/12 defaults
- [ ] Check if ARCHITECTURE.md documents all custom directory additions

### Related Rules
- R03: Align Custom Directories with `artisan make:` Conventions (COS-01/05-rules.md)
- R04: Document All Custom Directory Additions (COS-01/05-rules.md)

### Related Skills
- Apply Laravel's Default Directory Structure for Small Teams (COS-01/06-skills.md)

### Related Decision Trees
- Stay With Defaults vs Adopt Custom Structure (COS-01/07-decision-trees.md)

---

## Anti-Pattern 4: Flat Controller Accumulation

### Category
Code Organization

### Description
Dumping all controller classes into a single `app/Http/Controllers/` directory without subdirectory grouping, resulting in 40+ flat controller files. API, web, and admin controllers all sit in the same namespace, distinguished only by naming conventions like `ApiUserController`, `AdminUserController`.

### Why It Happens
Subdirectories feel like unnecessary overhead for "just a few controllers." The flat structure works until it doesn't — and by then there are too many files to reorganize easily. Lack of team naming conventions.

### Warning Signs
- `app/Http/Controllers/` contains more than 20 files
- Controller names include prefixes indicating their area (Api, Admin, Web)
- Developers Ctrl+Click through autocomplete lists to find the right controller
- Merge conflicts are common in controller directories

### Why It Is Harmful
Navigation becomes slow and error-prone. Developers accidentally import the wrong `UserController` (web vs API). Merge conflicts increase as multiple developers add controllers to the same flat directory.

### Real-World Consequences
A team with 60+ controllers in a flat directory experienced weekly merge conflicts. Developers started naming controllers `UserController2` after discovering `UserController` was taken. Code review overhead increased as reviewers verified correct controller usage.

### Preferred Alternative
Use subdirectories within `app/Http/Controllers/` from the start: `Api/`, `Web/`, `Admin/`. Even with 5 controllers, placing them in appropriate subdirectories establishes a pattern that scales.

### Refactoring Strategy
1. Categorize all controllers by their route prefix or purpose (API, Web, Admin, Public)
2. Create corresponding subdirectories under `app/Http/Controllers/`
3. Move files and update namespace declarations
4. Update route file imports to reference new namespaces
5. Update all tests that reference controller namespaces
6. Set a team rule: "New controllers must use area subdirectories"

### Detection Checklist
- [ ] Count files in `app/Http/Controllers/` — more than 20?
- [ ] Look for naming prefixes like `Admin` or `Api` in controller names
- [ ] Check if the project has both web.php and api.php routes but flat controllers

### Related Rules
- R06: Use Subdirectories Within Default Directories (COS-01/05-rules.md)

### Related Skills
- Apply Laravel's Default Directory Structure for Small Teams (COS-01/06-skills.md)

### Related Decision Trees
- Stay With Defaults vs Adopt Custom Structure (COS-01/07-decision-trees.md)
