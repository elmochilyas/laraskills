# ECC Anti-Patterns — PSR-4 Autoloading Configuration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | PSR-4 autoloading configuration for custom directories |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Overlapping PSR-4 Roots
2. Forgotten dump-autoload
3. Case Sensitivity Mismatch
4. autoload-dev Neglect
5. Unnecessary Multiple Roots

---

## Repository-Wide Anti-Patterns

- Overengineering
- Hidden Database Queries
- Premature Optimization

---

## Anti-Pattern 1: Overlapping PSR-4 Roots

### Category
Code Organization

### Description
Creating multiple PSR-4 namespace prefixes where one prefix could resolve classes that also match another prefix. Example: `App\` → `app/` and `App\Domains\` → `app/Domains/` — classes under `App\Domains\` can resolve through either root, causing undefined autoloading behavior.

### Why It Happens
Team adds domain-specific prefixes without checking for overlap with the existing `App\` root. Assumption that each PSR-4 entry is independent. Lack of understanding of Composer's prefix matching algorithm.

### Warning Signs
- `composer.json` has `App\` → `app/` AND `App\Something\` → `app/Something/`
- Intermittent "class not found" errors that resolve after `composer dump-autoload`
- Class resolution differs between local and CI environments
- New developers confused about which namespace prefix to use

### Why It Is Harmful
Composer's autoloader behavior with overlapping roots is undefined — resolution depends on entry order in `composer.json` and may change between Composer versions. Production-only bugs occur that cannot be reproduced locally.

### Real-World Consequences
A team added `App\Domains\` → `app/Domains/` while retaining the default `App\` → `app/`. On production (Linux, optimized class map), domain classes sometimes resolved to the wrong autoloader path, causing random 500 errors that appeared and disappeared with each deployment.

### Preferred Alternative
Never create PSR-4 prefixes that overlap with `App\`. Use separate, non-overlapping namespace prefixes like `Domains\` → `app/Domains/` or `Modules\` → `modules/`. The default `App\` → `app/` already covers all subdirectories under `app/`.

### Refactoring Strategy
1. Identify overlapping PSR-4 entries by checking if any prefix is a superset of another
2. Remove the narrower overlapping prefix (the `App\Domains\` entry)
3. Rename any namespace declarations that used the removed prefix to use `App\Domains\` directly
4. Run `composer dump-autoload` to regenerate clean autoloader
5. Add validation in CI to check for prefix overlap on every PR

### Detection Checklist
- [ ] Compare all PSR-4 prefixes — does any prefix start with another prefix in the list?
- [ ] Check for `App\` followed by `App\Something\` — this is always an overlap
- [ ] Verify that all custom namespace prefixes are completely disjoint

### Related Rules
- R02: Never Create Overlapping PSR-4 Roots (COS-03/05-rules.md)

### Related Skills
- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)

### Related Decision Trees
- Single PSR-4 Root vs Multiple Namespace Roots (COS-03/07-decision-trees.md)

---

## Anti-Pattern 2: Forgotten dump-autoload

### Category
Framework Usage

### Description
Adding new directories or modifying PSR-4 mappings in `composer.json` without running `composer dump-autoload` afterward. New classes in custom directories throw "class not found" errors because Composer hasn't regenerated the autoloader configuration.

### Why It Happens
Developers assume new directories are automatically autoloaded. The `app/` directory works without explicit registration — custom directories seem like they should too. `composer dump-autoload` is not part of the development workflow.

### Warning Signs
- "Class not found" errors immediately after adding new directories
- Errors resolve after someone runs `composer dump-autoload` manually
- CI failures that pass locally after running `composer dump-autoload`
- Team doesn't have a documented workflow for PSR-4 changes

### Why It Is Harmful
Frustrating developer experience — classes don't load for reasons that aren't obvious. Debugging time wasted on autoloading issues. CI fails intermittently if fresh checkouts produce different autoloader states.

### Real-World Consequences
A junior developer added a `modules/` directory with PSR-4 mapping but never ran `composer dump-autoload`. Three team members spent 2 hours debugging "class not found" errors before realizing the autoloader hadn't been regenerated.

### Preferred Alternative
Make `composer dump-autoload` a mandatory step after any `composer.json` autoload change. Add it to the development workflow documentation and consider a pre-commit hook that warns if `composer.json` was modified but `vendor/composer/autoload_psr4.php` wasn't updated.

### Refactoring Strategy
1. After any `composer.json` autoload change, immediately run `composer dump-autoload`
2. Verify the new mappings resolve correctly by creating a test class and checking autoloading
3. Add a CI step that fails if the autoloader is stale after `composer.json` changes
4. Document the requirement in CONTRIBUTING.md

### Detection Checklist
- [ ] Check if `vendor/composer/autoload_psr4.php` reflects current `composer.json`
- [ ] Verify CI pipeline includes `composer dump-autoload` after `composer install`
- [ ] Test that new classes in custom directories autoload without explicit `require`

### Related Rules
- R01: Run `composer dump-autoload` After Every PSR-4 Mapping Change (COS-03/05-rules.md)

### Related Skills
- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)

---

## Anti-Pattern 3: Case Sensitivity Mismatch

### Category
Reliability

### Description
Using inconsistent case between namespace declarations and directory names. Development on Windows or macOS (case-insensitive filesystems) masks mismatches that break on Linux production (case-sensitive). `namespace App\Services\Payment` with file at `app/services/payment/` works locally but fails in production.

### Why It Happens
All team members develop on case-insensitive OS (Windows/macOS). No CI runs on Linux. Directory creation tools may use lowercase. Assumption that "it works on my machine" means it works everywhere.

### Warning Signs
- Production-only "class not found" errors
- New directories created with lowercase names while Laravel uses PascalCase
- CI environment is macOS (still case-insensitive) — no Linux test runner
- Autoloading works on all local machines but fails on the deployment server

### Why It Is Harmful
Emergency debugging during production deployments. Hotfix reverts required. The class may work in some requests and fail in others depending on OPcache state. Completely preventable failures erode trust in the deployment pipeline.

### Real-World Consequences
A team deployed a new feature with a `namespace App\Services\PaymentGateway` but stored the file in `app/Services/paymentgateway/`. All local and CI tests passed (macOS). Production immediately returned 500 errors. The deployment had to be rolled back while the case was fixed.

### Preferred Alternative
Use PascalCase consistently for all namespace segments and directories. Enforce with a CI check that verifies directory names match their namespace declarations on a case-sensitive basis.

### Refactoring Strategy
1. Set up a Linux CI runner that catches case sensitivity issues
2. Scan the codebase for mismatches between directory names and `namespace` declarations
3. Rename directories to match namespace PascalCase
4. Update any `use` imports that reference incorrect casing
5. Run `composer dump-autoload` after directory renames

### Detection Checklist
- [ ] Check if any CI job runs on Linux (case-sensitive)
- [ ] Scan for directories like `services/`, `models/`, `controllers/` instead of `Services/`, `Models/`, `Controllers/`
- [ ] Verify `namespace` declaration casing matches directory name casing

### Related Rules
- R03: Keep Namespace Case Consistent with Directory Case (COS-03/05-rules.md)

### Related Skills
- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)

---

## Anti-Pattern 4: autoload-dev Neglect

### Category
Code Organization

### Description
Placing test-only infrastructure (factories, seeders, test support classes) in `autoload` instead of `autoload-dev` in `composer.json`. This bloats the production class map with classes that should never be loaded in production environments.

### Why It Happens
Using the default Laravel setup that places `Database\Factories\` in `autoload`. Copying patterns from online examples that don't distinguish between `autoload` and `autoload-dev`. Not understanding that `autoload-dev` classes are excluded from production optimized class maps.

### Warning Signs
- `Database\Factories\`, `Database\Seeders\`, `Tests\` are all under `autoload` instead of `autoload-dev`
- Production `composer dump-autoload -o` includes factory and test classes
- Production class map is noticeably large (>1000 entries for a small project)
- Test helper classes are importable from production code

### Why It Is Harmful
Larger than necessary production class map increases autoloading overhead. Test-only classes being loadable in production creates a risk — a bug could accidentally invoke test infrastructure in a production context. Seeders may be unintentionally executable in production.

### Real-World Consequences
A production incident occurred when a controller factory method was accidentally triggered in production, causing corrupt test data to be inserted into the production database. The factory was in `autoload` and was resolved via the autoloader despite being test-only.

### Preferred Alternative
Move all test-only infrastructure to `autoload-dev` in `composer.json`. This includes factories, seeders, test support traits, test-specific service providers, and test case base classes.

### Refactoring Strategy
1. Move `Database\Factories\`, `Database\Seeders\`, and `Tests\` from `autoload` to `autoload-dev`
2. Move any test support classes (custom assertions, test traits) to `Tests\` namespace
3. Update any references to test-only classes from production code (should be none)
4. Run `composer dump-autoload -o` and verify production map excludes test classes
5. Document the distinction between `autoload` and `autoload-dev` in CONTRIBUTING.md

### Detection Checklist
- [ ] Search `composer.json` for test namespaces under `autoload` instead of `autoload-dev`
- [ ] Check if production optimized class map includes factory or seeder entries
- [ ] Verify that no production code imports test-only classes

### Related Rules
- R04: Use `autoload-dev` for Test Infrastructure Separately (COS-03/05-rules.md)

### Related Skills
- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)

### Related Decision Trees
- autoload vs autoload-dev for Test Infrastructure (COS-03/07-decision-trees.md)

---

## Anti-Pattern 5: Unnecessary Multiple Roots

### Category
Code Organization

### Description
Creating separate PSR-4 namespace prefixes for each technical layer (`Controllers\` → `app/Http/Controllers/`, `Models\` → `app/Models/`, `Services\` → `app/Services/`) when a single `App\` → `app/` root would cover all of them. Adds configuration complexity without benefit.

### Why It Happens
Desire for "cleaner" namespace prefixes. Misunderstanding that separate prefixes improve autoloading performance. Following patterns from non-Laravel PHP projects that don't have a single root convention.

### Warning Signs
- `composer.json` has 5+ PSR-4 entries for subdirectories of `app/`
- Short prefixes like `Controllers\`, `Models\`, `Services\` are defined
- Developers are confused about which prefix to use for new files
- Documentation must explain each prefix's mapping

### Why It Is Harmful
Unnecessary `composer.json` complexity. Prefix pollution — short, generic prefixes could conflict with vendor package names. Team overhead in learning and remembering custom mappings. No performance benefit over a single root.

### Real-World Consequences
A project defined `C\` → `app/Http/Controllers/`, `M\` → `app/Models/`, `S\` → `app/Services/`. New developers were confused about prefixes. A vendor package introduced `S\Notification\` which conflicted with the project's `S\` mapping. Refactoring required renaming all service classes in the project.

### Preferred Alternative
Keep the default single root `App\` → `app/`. All subdirectories under `app/` are automatically covered. Only add separate PSR-4 roots when code lives outside `app/` (e.g., `modules/`, `src/`, or an extracted domain package).

### Refactoring Strategy
1. Remove all PSR-4 entries that map to subdirectories of `app/`
2. Update namespace declarations in affected files from custom prefixes to `App\` prefix
3. Update all `use` imports across the codebase
4. Run `composer dump-autoload`
5. Add CI check that prevents new subdirectory PSR-4 entries

### Detection Checklist
- [ ] Count PSR-4 entries — more than 3 (app, database factories, database seeders)?
- [ ] Check if any prefix maps to a subdirectory of `app/`
- [ ] Verify that removing custom prefixes and using `App\` would cover all classes

### Related Rules
- R05: Avoid Unnecessary Multiple PSR-4 Roots (COS-03/05-rules.md)

### Related Skills
- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)

### Related Decision Trees
- Single PSR-4 Root vs Multiple Namespace Roots (COS-03/07-decision-trees.md)
