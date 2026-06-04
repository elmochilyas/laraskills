# ECC Anti-Patterns — Namespace Conventions

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | Namespace conventions and directory-to-namespace mapping |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Flat Namespace
2. Deep Namespace Nesting
3. Namespace Aliasing Abuse
4. Namespace Mismatch
5. Custom Root Namespace

---

## Repository-Wide Anti-Patterns

- Massive Configuration Files
- Overengineering

---

## Anti-Pattern 1: Flat Namespace

### Category
Code Organization

### Description
All application classes declared under the root `App\` namespace without any sub-namespace organization. Classes like `App\UserService`, `App\PaymentGateway`, `App\ReportGenerator`, `App\Invoice` all live at the top level, risking name collisions and providing no organizational structure.

### Why It Happens
Assuming the default structure means "no sub-namespaces." Not understanding that PSR-4 allows sub-namespaces without extra configuration. Laziness in declaring `namespace App\Services\Payment` instead of just `namespace App`.

### Warning Signs
- All classes imported as `use App\SomeClass` without any intermediate namespace
- Class names must carry organizational burden (e.g., `App\PaymentStripeService` vs `App\Services\Payment\Stripe`)
- IDE autocomplete returns 50+ classes from `App\`
- Name collisions requiring manual resolution

### Why It Is Harmful
Class name collisions become inevitable as the codebase grows. No organizational discoverability — developers can't navigate by namespace hierarchy. Import lists become long and undifferentiated.

### Real-World Consequences
A project with 80+ classes directly under `App\` developed class name conflicts: `App\Invoice` (the model) couldn't coexist with a library expecting its own `Invoice` class. The team had to rename all their classes with prefixes, creating names like `App\AppInvoice`.

### Preferred Alternative
Use sub-namespaces matching directory structure. Every leaf directory under `app/` should be a namespace segment. `App\Models\User`, `App\Services\Payment\Stripe`, `App\Jobs\ProcessInvoice`.

### Refactoring Strategy
1. Group all top-level classes by purpose (models, services, jobs, etc.)
2. Create corresponding namespace directories
3. Move files and update `namespace` declarations
4. Update all `use` imports across the codebase
5. Add architecture tests preventing new classes in the root namespace

### Detection Checklist
- [ ] Count classes directly under `App\` namespace (excluding sub-namespace directories)
- [ ] Check if any class file in `app/` root has `namespace App;` as its declaration
- [ ] Verify that new classes are placed in appropriate sub-namespaces

### Related Rules
- R01: Always Declare a Namespace Matching the Directory Path (COS-04/05-rules.md)

### Related Skills
- Apply Namespace Conventions Aligned with Directory Structure (COS-04/06-skills.md)

---

## Anti-Pattern 2: Deep Namespace Nesting

### Category
Maintainability

### Description
Creating namespace hierarchies with 8+ segments from root, producing FQCNs like `App\Domains\Billing\Subscriptions\Plans\Http\Controllers\Admin\PlanController`. FQCNs exceed standard line length, import statements wrap, and file paths approach Windows MAX_PATH limits.

### Why It Happens
Over-organizing by every possible dimension (domain → subdomain → entity → layer → sub-layer → specific role). No team convention on namespace depth limits. Mirroring deep organizational hierarchies into namespace structure.

### Warning Signs
- FQCNs exceed 80 characters
- Import statements wrap in standard code review tools
- File paths approach 250+ characters (Windows MAX_PATH is 260)
- `use` statements contain 7+ namespace segments
- Developers create namespace aliases purely for readability

### Why It Is Harmful
Reduced code readability — FQCNs are illegible. IDE line-wrapping in import blocks. Potential Windows MAX_PATH issues. Higher cognitive load for developers reading namespace declarations.

### Real-World Consequences
A team used 9-level deep namespaces. FQCNs consistently exceeded 120 characters, requiring line-wrapping in every file. Windows developers couldn't check out the repository to paths with long prefixes. The team had to flatten the structure.

### Preferred Alternative
Limit namespace depth to 5-6 segments maximum. Flatten unnecessary hierarchy levels. Instead of `App\Domains\Billing\Subscriptions\Plans\Http\Controllers\Admin`, use `App\Domains\Billing\Http\Controllers\Admin\PlanController`.

### Refactoring Strategy
1. Map current namespace depth for all application classes
2. Identify which hierarchy levels can be removed (e.g., merge "Subscriptions" into "Billing")
3. Rename directories to flatten structure
4. Update all namespace declarations and imports
5. Set a team rule: maximum 5-6 namespace segments

### Detection Checklist
- [ ] Calculate the longest FQCN in the project
- [ ] Check if any namespace has more than 6 segments from root
- [ ] Verify import statements fit within 120-character line limit

### Related Rules
- R04: Keep Sub-Namespace Depth at 5-6 Levels Maximum (COS-04/05-rules.md)

### Related Skills
- Apply Namespace Conventions Aligned with Directory Structure (COS-04/06-skills.md)

### Related Decision Trees
- Deep Sub-Namespace Nesting vs Flat Namespace Structure (COS-04/07-decision-trees.md)

---

## Anti-Pattern 3: Namespace Aliasing Abuse

### Category
Maintainability

### Description
Using `use App\Models\User as AppUser` and `use App\Domains\Identity\Models\User as IdentityUser` to disambiguate application classes that share the same unqualified name. Returns `as` aliases scattered across files to work around poor class naming or namespace structure.

### Why It Happens
Two classes legitimately need different names but share a common term. Instead of renaming one class, developers use aliases because it's the quickest fix. Team lacks naming conventions that prevent collisions.

### Warning Signs
- Multiple `use ... as` statements for application (not vendor) classes
- Different files alias the same class differently
- New developers confused about which `User` is which
- Aliases are inconsistent — `AppUser` in one file, `AppModelsUser` in another

### Why It Is Harmful
Aliasing masks poor naming choices. Aliases are local to each file — different files may alias the same class differently. Import blocks become inconsistent and confusing. The underlying naming problem never gets fixed.

### Real-World Consequences
A project had three `User` model variants aliased differently in 15 files. `AppUser`, `UserModel`, `UserEntity`, `BillingUser` — all referring to different classes. A developer added `use App\Models\User as UserEntity` thinking it was the billing User, causing a production data leak.

### Preferred Alternative
Rename conflicting classes to eliminate the ambiguity. `App\Models\User` and `App\Domains\Identity\Models\IdentityUser`. Namespace aliasing is only acceptable for vendor package disambiguation.

### Refactoring Strategy
1. Identify all classes that are aliased in `use` statements
2. For each aliased pair, rename one class to a unique name
3. Update the class file's name and `namespace` (if applicable)
4. Remove all `use ... as` statements, replacing with direct `use` of renamed class
5. Update all references to the old class name

### Detection Checklist
- [ ] Search for all `use ... as` statements — how many alias application classes?
- [ ] Check if the same class is aliased differently across files
- [ ] Verify that all application classes have unique unqualified names

### Related Rules
- R03: Never Use Namespace Aliasing for Application Classes (COS-04/05-rules.md)

### Related Skills
- Apply Namespace Conventions Aligned with Directory Structure (COS-04/06-skills.md)

### Related Decision Trees
- Namespace Aliasing vs Class Renaming for Disambiguation (COS-04/07-decision-trees.md)

---

## Anti-Pattern 4: Namespace Mismatch

### Category
Reliability

### Description
File's `namespace` declaration does not match its directory path relative to the PSR-4 root. A class at `app/Domains/Billing/Services/InvoiceService.php` with `namespace App\Services;` instead of `namespace App\Domains\Billing\Services;` causes autoload failures.

### Why It Happens
Moving files without updating namespace declarations. Creating files in one location but declaring a namespace for a different location. Copy-pasting code from elsewhere without adjusting the namespace. Not using IDE refactoring tools for moves.

### Warning Signs
- "Class not found" errors after directory reorganization
- Files are in one directory but `namespace` says different directory
- IDE can navigate to file but autoloading throws ClassNotFoundException
- Teams manually move files without IDE refactoring support

### Why It Is Harmful
Classes cannot be autoloaded by PSR-4. Debugging requires tracing namespace declaration vs actual file path. If the wrong namespace happens to match another class, subtle bugs where wrong class is loaded.

### Real-World Consequences
A class accidentally had `namespace App\Services;` but was at `app/Domains/Billing/Services/InvoiceService.php`. Autoloader looked for `app/Services/InvoiceService.php`, didn't find it. The class was effectively dead code for 2 weeks until the mismatch was discovered.

### Preferred Alternative
Always use IDE refactoring tools that update both file path and namespace declaration simultaneously. When creating new files, always set the correct `namespace` first.

### Refactoring Strategy
1. Scan all PHP files via a script that compares `namespace` declaration to file path
2. For each mismatch, determine the correct namespace from the directory path
3. Update the `namespace` declaration
4. Update all `use` imports that referenced the old namespace
5. Run `composer dump-autoload` and verify all classes resolve

### Detection Checklist
- [ ] Script the validation: for each file, extract `namespace` and compare to directory path
- [ ] Check for files with no `namespace` declaration inside `app/`
- [ ] Verify after any file move that namespace was updated

### Related Rules
- R01: Always Declare a Namespace Matching the Directory Path (COS-04/05-rules.md)
- R06: Update Both File Path and Namespace When Refactoring (COS-04/05-rules.md)

### Related Skills
- Apply Namespace Conventions Aligned with Directory Structure (COS-04/06-skills.md)

---

## Anti-Pattern 5: Custom Root Namespace

### Category
Framework Usage

### Description
Changing the root namespace from `App\` to a project-specific name like `AcmeCorp\SuperPlatform\` without strong justification. Every `artisan make:` command produces files with wrong namespaces. All stubs must be overridden. Framework conventions break.

### Why It Happens
Desire for "professional" namespace matching company name. Previous experience from non-Laravel PHP projects where custom roots are common. Assumption that namespace identity is important for branding.

### Warning Signs
- `composer.json` maps `AcmeCorp\SuperPlatform\` → `app/` instead of `App\` → `app/`
- `php artisan make:model User` generates `namespace AcmeCorp\SuperPlatform\Models\User;`
- Custom stubs directory exists for every `artisan make:` command
- README documents the non-standard root namespace

### Why It Is Harmful
Every framework generator produces files with wrong namespaces. Stub overrides needed for all `make:` commands. New Laravel developers are confused. Documentation references must use custom root. Switching back requires updating every file.

### Real-World Consequences
A team changed the root namespace to `Company\Product\`. After 2 years, they wanted to open-source part of the application but couldn't because the namespace exposed their company name. Renaming everything took a full sprint.

### Preferred Alternative
Keep `App\` as the root namespace. Use sub-namespaces for organizational clarity under the `App\` prefix. Only change the root namespace for reusable packages distributed to third parties.

### Refactoring Strategy
1. Change `composer.json` back to `"App\\": "app/"`
2. Update all file `namespace` declarations from `AcmeCorp\SuperPlatform\` to `App\`
3. Update all `use` imports
4. Regenerate stubs to use default `App\` namespace
5. Update any documentation referencing the custom root

### Detection Checklist
- [ ] Check `composer.json` for non-standard root namespace
- [ ] Run `php artisan make:model TestNamespace` — check generated namespace
- [ ] Verify IDE navigation resolves `App\` namespace correctly

### Related Rules
- R05: Keep Root Namespace as `App\` Unless Absolutely Necessary (COS-04/05-rules.md)

### Related Skills
- Apply Namespace Conventions Aligned with Directory Structure (COS-04/06-skills.md)

### Related Decision Trees
- Keep Root Namespace as App\ vs Change to Project-Specific Name (COS-04/07-decision-trees.md)
