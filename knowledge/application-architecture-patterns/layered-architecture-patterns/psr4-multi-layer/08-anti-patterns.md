# ECC Anti-Patterns — PSR-4 Autoloading for Multi-Layer Projects

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Layered Architecture Patterns |
| **Knowledge Unit** | PSR-4 Autoloading for Multi-Layer Projects |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. Single Monster Root
2. Root per File Fragmentation
3. Overlapping Namespace Roots
4. Case Sensitivity Blindness
5. Forgotten Autoloader Regeneration

---

## Repository-Wide Anti-Patterns

- Overlapping namespace mappings
- Inconsistent namespace conventions
- Missing autoloader regeneration in deployment scripts

---

## Anti-Pattern 1: Single Monster Root

### Category
Architecture | Autoloading

### Description
Placing all layered code under a single PSR-4 namespace root (e.g., `App\\`) while organizing layers as subdirectories only. The namespace `App\\` maps to `app/`, and Domain, Application, Infrastructure are subdirectories under `app/`. No namespace-level isolation exists between layers.

### Why It Happens
Default Laravel installation uses `App\\` mapping to `app/`. Adding layered directories under `app/` is the path of least resistance. No immediate consequence during development, so the pattern persists.

### Warning Signs
- All classes import from `App\` namespace regardless of layer
- A Domain entity and an Infrastructure repository share the same namespace root
- Architecture tests cannot distinguish layer of origin from the namespace alone
- `use App\Models\Invoice; use App\Services\PaymentService; use App\Domain\ValueObjects\Email;` — no visible layer distinction

### Preferred Alternative
Define separate PSR-4 roots per architecture layer. Each layer gets its own namespace root, making layer of origin visible in every `use` statement.

### Refactoring Strategy
1. Create new directories: `src/Domain/`, `src/Application/`, `src/Infrastructure/`
2. Add PSR-4 roots in `composer.json`
3. Move classes from `app/Domain/` to `src/Domain/`
4. Update namespaces on moved classes
5. Update imports in all files referencing moved classes
6. Run `composer dump-autoload -o`
7. Add architecture tests verifying namespace-level layer isolation

### Related Rules
- Rule: Define PSR-4 Namespace Per Layer (LAP-05/05-rules.md)
- Rule: Distinct Namespace Roots Avoid Overlap (LAP-05/05-rules.md)

---

## Anti-Pattern 2: Root per File Fragmentation

### Category
Architecture | Autoloading

### Description
Creating a separate PSR-4 root for every subdirectory or component. Instead of one root per architecture layer, there are roots for `App\\Domain\\Entities\\`, `App\\Domain\\ValueObjects\\`, `App\\Domain\\Services\\`, and so on.

### Why It Happens
Misunderstanding that more granular roots provide better organization. Each subdirectory gets its own mapping for perceived clarity.

### Warning Signs
- 10+ PSR-4 entries in `composer.json`
- Each entry maps to a single subdirectory
- comoposer.json is difficult to read due to autoload section size

### Preferred Alternative
One PSR-4 root per architecture layer, not per subdirectory. Use subdirectories within each layer for further organization.

### Refactoring Strategy
1. Consolidate all entries under the same layer into one root
2. Remove granular entries
3. Update namespace resolution expectations — sub-namespaces resolve automatically under the layer root

### Related Rules
- Rule: Define PSR-4 Namespace Per Layer (LAP-05/05-rules.md)

---

## Anti-Pattern 3: Overlapping Namespace Roots

### Category
Architecture | Autoloading

### Description
Defining `"App\\": "app/"` and `"App\\Domain\\": "app/Domain/"` where `app/Domain/` is a subdirectory of `app/`. The overlapping roots are technically valid but create confusion: `App\Domain\Invoice` could be in `app/Invoice.php` (matched by `App\\`) or `app/Domain/Invoice.php` (matched by `App\\Domain\\`).

### Why It Happens
Developers add a new root for namespacing but keep the old root in place. Both are active simultaneously.

### Warning Signs
- PSR-4 entries where the directory of one is a subdirectory of another
- Confusion about where to place new classes
- Some classes in `app/Domain/`, others in `app/` with `Domain` namespace

### Preferred Alternative
Use distinct, non-overlapping directory paths. Map `App\Domain\` to `src/Domain/`, not `app/Domain/`.

### Related Rules
- Rule: Distinct Namespace Roots Avoid Overlap (LAP-05/05-rules.md)

---

## Anti-Pattern 4: Case Sensitivity Blindness

### Category
CI/CD | Development Workflow

### Description
Using case-insensitive directory names in PSR-4 mappings that work on Windows/macOS but fail on Linux. Example: mapping `App\\Domain\\` to `src/domain/` (lowercase) while actual directory is `src/Domain/` (PascalCase).

### Why It Happens
Local development on case-insensitive filesystems (Windows, macOS) works fine. The mismatch is only discovered in CI or production.

### Warning Signs
- CI failures for class-not-found errors that work locally
- Directory case does not match namespace case exactly
- Deployment pipeline does not run autoloader verification

### Preferred Alternative
Always verify that the directory case in PSR-4 mappings matches the namespace case exactly. Add a CI step that runs `composer dump-autoload -o` and verifies no errors.

### Refactoring Strategy
1. Update directory names to match namespace case
2. Update all imports referencing the old namespace
3. Add CI validation for autoloader integrity

### Related Rules
- Rule: Case Sensitivity Matters in CI (LAP-05/05-rules.md)

---

## Anti-Pattern 5: Forgotten Autoloader Regeneration

### Category
Development Workflow

### Description
Adding PSR-4 roots, moving classes, or changing namespaces without running `composer dump-autoload`. The autoloader cache is stale, and new/moved classes are not found.

### Why It Happens
Easy to forget a command-line step, especially when focused on code changes. The error message (class not found) points toward the class file itself, not the autoloader.

### Warning Signs
- Class-not-found errors after refactoring or adding new namespaces
- Errors resolve after running `composer dump-autoload` manually
- Deployment failures that work in development

### Preferred Alternative
Add `composer dump-autoload -o` to the deployment script. In development, add a `post-autoload-dump` Composer hook or integrate into the development workflow.

### Related Rules
- Rule: Run composer dump-autoload After Changes (LAP-05/05-rules.md)
