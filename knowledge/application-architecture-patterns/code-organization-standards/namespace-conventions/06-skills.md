# Skill: Apply Namespace Conventions Aligned with Directory Structure

## Purpose
Maintain consistent PSR-4 namespace-to-directory mapping across the codebase, ensuring every PHP file's namespace declaration exactly matches its file path relative to the PSR-4 root.

## When To Use
- Always — PSR-4 namespace-to-directory mapping is universal in Laravel and PHP
- Any time you create custom directories under `app/`
- When organizing code into sub-namespaces for clarity
- When onboarding new developers to understand namespace structure

## When NOT To Use
- Never deviate from PSR-4 mapping in application code
- Do not use classmap autoloading for new application classes (only for legacy or package files)

## Prerequisites
- PHP namespace syntax understanding
- Knowledge of project's PSR-4 root mapping
- IDE with refactoring support for namespace-aware moves

## Inputs
- Project's `composer.json` autoload configuration
- List of existing namespace declarations across the codebase
- Directory structure under PSR-4 roots

## Workflow
1. **Declare namespace matching directory path.** For every PHP class file, ensure the `namespace` declaration exactly matches the directory path relative to the PSR-4 root. File `app/Services/Payment/StripeService.php` must declare `namespace App\Services\Payment;`.

2. **Use PascalCase for all namespace segments.** Every namespace segment must start with an uppercase letter: `App\Http\Controllers\Api`. Mixed case causes production failures on case-sensitive Linux filesystems.

3. **Keep sub-namespace depth at 5-6 levels maximum.** Limit namespace segments from the root to a manageable depth. `App\Domains\Billing\Http\Controllers\Admin` (5 segments) is acceptable; adding more makes FQCNs unwieldy.

4. **Never use namespace aliasing for application classes.** Avoid `use App\Models\User as AppUser`. If two classes share the same unqualified name, restructure rather than alias.

5. **Keep root namespace as `App\`.** Do not change the root namespace to `Company\Project\` unless absolutely necessary. Custom roots break all `artisan make:` commands and require stub overrides.

6. **Update both file path and namespace when refactoring.** When moving a class, update its `namespace` declaration to match the new directory. Use IDE refactoring tools that automate both changes.

7. **Avoid non-PHP directories inside `app/`.** Every directory under `app/` containing PHP files should correspond to a namespace segment. Assets and templates belong in `resources/`.

## Validation Checklist
- [ ] Every PHP file has a `namespace` declaration matching its directory path
- [ ] `composer dump-autoload` validates all namespace mappings
- [ ] IDE navigation (Go to Definition) resolves all class references
- [ ] No `use ... as` aliases for application classes (excluding vendor disambiguation)
- [ ] All namespace segments use PascalCase
- [ ] Sub-namespace depth does not exceed 5-6 levels
- [ ] Root namespace is `App\` unless documented exception exists

## Common Failures
- **Namespace mismatch:** File moved from `app/Services/` to `app/Domains/Billing/Services/` without updating `namespace App\Services` to `namespace App\Domains\Billing\Services`. Result: ClassNotFoundException.
- **Missing namespace declaration:** File without `namespace` keyword defines classes in global namespace, preventing PSR-4 autoloading.
- **Wrong root namespace in custom structures:** Creating `app/Domains/Billing/UserService.php` with `namespace Domains\Billing;` when PSR-4 root is `App\`. Must be `namespace App\Domains\Billing;`.

## Decision Points
- **Namespace depth limits?** Max 5-6 segments from root. Deeper namespaces reduce readability and approach Windows MAX_PATH limits.
- **When to change root namespace?** Only for multi-tenant platforms, white-label products, or distributed packages. Otherwise keep `App\`.

## Performance Considerations
- Namespace depth does not affect autoloading performance with optimized class maps.
- Development autoloading scans filesystem; depth increases scan time but impact is negligible.

## Security Considerations
- Namespace collisions between application and package code can cause class resolution to unexpected files.
- Ensure custom namespace prefixes do not conflict with vendor namespace prefixes.

## Related Rules
- Rule: Always Declare a Namespace Matching the Directory Path (COS-04/05-rules.md)
- Rule: Use PascalCase for All Namespace Segments (COS-04/05-rules.md)
- Rule: Never Use Namespace Aliasing for Application Classes (COS-04/05-rules.md)
- Rule: Keep Sub-Namespace Depth at 5-6 Levels Maximum (COS-04/05-rules.md)
- Rule: Keep Root Namespace as `App\` Unless Absolutely Necessary (COS-04/05-rules.md)
- Rule: Update Both File Path and Namespace When Refactoring (COS-04/05-rules.md)
- Rule: Never Create Directories Inside `app/` Without PHP Files (COS-04/05-rules.md)
- Rule: Ensure Custom Namespace Prefixes Do Not Conflict with Vendor Packages (COS-04/05-rules.md)

## Related Skills
- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)
- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)
- Organize Code by Domain (COS-06/06-skills.md)

## Success Criteria
- Every PHP file's namespace declaration matches its directory path.
- All namespace segments use consistent PascalCase.
- No namespace aliasing is required for application classes.
- IDE navigation resolves all class references correctly.
