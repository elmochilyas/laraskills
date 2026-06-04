# Skill: Create A New Feature With Consistent Directory Structure

## Purpose

Scaffold a new feature following the project's standard directory structure, ensuring every feature has the same predictable layout, naming conventions, and component placement.

## When To Use

- Creating a new feature from scratch
- Standardizing existing features that have inconsistent structures
- Onboarding new team members who need to create features

## When NOT To Use

- For concepts that belong in an existing feature
- For single-file additions that don't warrant a full feature directory
- Prototypes where directory overhead slows iteration

## Prerequisites

- Feature-based structure is established in the project
- Standard subdirectory naming convention is documented (PascalCase: `Controllers/`, `Models/`)
- Feature scaffold command exists (or manual directory creation is acceptable)
- Service provider template is available

## Inputs

- Feature name (singular PascalCase noun: `Billing`, `Users`, `CMS`)
- List of needed component types (controllers, models, services, events, etc.)

## Workflow

1. Create `app/Features/{FeatureName}/` as the feature root
2. Create only the subdirectories needed for this feature: `Controllers/`, `Models/`, `Services/`, `Requests/` — no empty directories
3. Create the service provider: `Providers/{FeatureName}ServiceProvider.php`
4. In the provider, implement `boot()` with `$this->loadRoutesFrom(__DIR__.'/../routes.php')`
5. Create `routes.php` at the feature root with `Route::middleware([...])->prefix('/feature-name')->name('feature-name.')`
6. Use fully qualified class names in routes: `[App\Features\{Feature}\Controllers\IndexController::class, '__invoke']`
7. Create initial model files with proper namespace and explicit `$table` property
8. Create initial controller files in `Controllers/` directory
9. Keep nesting shallow — maximum 3 levels from feature root
10. Run `composer dump-autoload` and verify with `php artisan route:list`

## Validation Checklist

- [ ] Feature root directory follows PascalCase naming
- [ ] Subdirectory names follow consistent casing: `Controllers/`, not `controllers/` or `http/`
- [ ] Only directories with files are created — no empty directories
- [ ] Maximum nesting depth of 3 levels or less
- [ ] Service provider uses `__DIR__.'/../'` relative paths — no hardcoded paths
- [ ] Routes use fully qualified class names for controllers
- [ ] Route prefixes are unique across all features
- [ ] View namespace matches feature name convention: `feature_name::`
- [ ] Models have explicit `$table` property with feature prefix
- [ ] Migrations co-located at `Database/Migrations/` if applicable

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Wrong directory casing | Inconsistent conventions | Enforce with CI |
| Empty directories | Scaffolding all subdirs upfront | Create only when needed |
| Deep nesting | Organizing by sub-category | Flatten or extract sub-feature |
| All files at root | No subdirectory organization | Enforce subdirectory rules in PRs |
| Inconsistent structure across features | No standard template | Create a scaffold command |

## Decision Points

- **Subdirectories to create**: Only create `Controllers/`, `Models/`, `Services/`, `Requests/` if the feature has files of that type. Avoid empty `Events/`, `Listeners/`, `Jobs/` directories.
- **Nesting depth**: 2 levels (e.g., `Billing/Controllers/`) is standard. 3 levels is OK. 4+ levels → extract sub-feature.
- **Scaffold command vs manual**: An `artisan make:feature` command guarantees consistency. Without it, manual creation risks missing the service provider or using wrong casing.

## Performance Considerations

No runtime performance impact. Composer's optimized autoloader handles deep directory paths efficiently. View namespacing adds negligible overhead.

## Security Considerations

Module organization has no security implications. Controller middleware, authorization policies, and validation function identically regardless of directory depth.

## Related Rules

- Maintain Consistent Feature Directory Structure (05-rules.md)
- Only Create Directories When Needed (05-rules.md)
- Keep Nesting Shallow — Maximum 3 Levels (05-rules.md)
- Align View Namespace With Feature Name (05-rules.md)
- Co-locate Migrations Within The Feature (05-rules.md)
- Keep Feature Files In Correct Subdirectories (05-rules.md)
- Use Fully Qualified Class Names In Routes (05-rules.md)
- Use A Feature Scaffold Command (05-rules.md)

## Related Skills

- Create A New Feature Scaffold (feature-foundations)
- Enforce Feature Structure Conventions With CI
- Create Feature Service Provider

## Success Criteria

- New feature follows exact same directory structure as all other features
- Any developer can navigate the feature without reading its README
- CI passes with no structure convention violations
- Feature is self-contained with its service provider registered
- No empty directories exist in the feature

---

# Skill: Enforce Feature Structure Conventions With CI

## Purpose

Automate detection and rejection of feature structure violations (wrong directory casing, files in wrong locations, missing providers) using CI linting.

## When To Use

- Project has 5+ features and structural drift is a concern
- Multiple developers work across features without consistent oversight
- Onboarding new team members who may not know conventions
- Case-sensitive filesystems (Linux, CI) cause autoloading failures from casing mismatches

## When NOT To Use

- Projects with 1-3 features where manual review suffices
- Single-developer projects with consistent mental model
- Prototype phase where structure is still evolving

## Prerequisites

- Feature structure conventions are documented (allowed directory names, casing, file placement rules)
- CI pipeline is configured
- All existing features follow the correct conventions (fix existing violations first)

## Inputs

- Documented feature structure conventions
- List of allowed subdirectory names
- CI platform configuration (GitHub Actions, GitLab CI, etc.)

## Workflow

1. Define allowed subdirectory names: `Controllers`, `Models`, `Services`, `Requests`, `Providers`, `Actions`, `DTOs`, `Events`, `Listeners`, `Jobs`, `Notifications`, `Policies`, `Rules`, `Exceptions`
2. Create a CI lint step that scans all feature directories for:
   - Invalid subdirectory names (not in the allowed list)
   - Incorrect casing (e.g., `controllers/` instead of `Controllers/`)
   - Files at the feature root (only `routes.php` allowed)
   - Empty subdirectories
3. Configure CI to fail the build if any violations are found
4. Add a separate check for consistent subdirectory casing across all features
5. Optionally check for required files: every feature must have a service provider
6. Run the lint on every PR and on push to main

## Validation Checklist

- [ ] CI step scans all `app/Features/*/` directories
- [ ] Invalid subdirectory names are detected and reported
- [ ] Incorrect casing is detected (e.g., `controllers/` vs `Controllers/`)
- [ ] Files at feature root (besides `routes.php`) are flagged
- [ ] Empty subdirectories are flagged
- [ ] CI fails with clear error messages showing which feature and which violation
- [ ] Existing features all pass the lint check before enabling

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| False positives | Allowed list doesn't include all valid dirs | Update list as new dir types are added |
| Only works on Linux | OS-specific commands in lint script | Use cross-platform tools or Docker |
| No error output | Lint script fails without details | Print specific violation messages |
| Not enforced on PRs | Only runs on push to main | Configure for PR checks |
| Existing violations | Old features fail new CI check | Fix all existing features first |

## Decision Points

- **Grep vs Custom tool**: Simple grep-based checks work for small projects. Use a custom PHP script or PHPStan/Psalm extension for larger codebases.
- **Allowed directories**: Include commonly used directories. Update the list proactively as the project adopts new component types.
- **Required checks**: Start with directory name casing and invalid names. Add file placement checks and empty directory checks in subsequent iterations.

## Performance Considerations

CI lint steps add negligible time (<1s for 50 features). Run in parallel with other lint/static analysis steps.

## Security Considerations

No security implications. This is a code quality check, not a security control.

## Related Rules

- Maintain Consistent Feature Directory Structure (05-rules.md)
- Only Create Directories When Needed (05-rules.md)
- Keep Nesting Shallow — Maximum 3 Levels (05-rules.md)
- Enforce Naming Conventions With CI (05-rules.md)
- Keep Feature Files In Correct Subdirectories (05-rules.md)
- Use A Feature Scaffold Command (05-rules.md)

## Related Skills

- Create A New Feature With Consistent Directory Structure
- Set Up Domain Groups For Related Features
- Configure Per-Feature PHPUnit Suites For CI (feature-tests)

## Success Criteria

- CI blocks PRs with structure violations
- All features pass the structure lint check
- New features are created with correct structure (prevented by scaffold command, caught by CI)
- No casing mismatches across any features
- No empty subdirectories in any feature
- No files placed at the feature root (except `routes.php`)
