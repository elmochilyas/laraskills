# Skill: Evaluate Organizational Structure For A New Project

## Purpose

Make an informed decision between layer-based and feature-based organizational structure based on project complexity, team size, and growth expectations.

## When To Use

- Starting a new Laravel project
- Evaluating whether to migrate from layer-based to feature-based
- Reviewing structural decisions during architecture planning

## When NOT To Use

- Projects already committed to a structure (only migrate when cost is clearly justified)
- Rapid prototypes where speed is the priority (layer-based defaults are fine)

## Prerequisites

- Understanding of the project's scope and expected growth
- Knowledge of both organizational approaches
- Team input on navigation preferences

## Inputs

- Estimated model count
- Number of distinct business domains
- Team size and structure
- Growth projections
- Team experience level

## Workflow

1. Count estimated models: <15 models → layer-based; 15+ → consider feature-based
2. Identify business domains: 1-2 domains → layer-based; 3+ → feature-based provides better cohesion
3. Assess team: single developer → either; multiple teams → feature-based enables clear ownership
4. Evaluate growth: stable scope → layer-based; high growth → feature-based scales better
5. Document the decision in the project README with clear rationale
6. If feature-based: customize Artisan stubs, create feature scaffold command, set up shared kernel
7. If layer-based: proceed with Laravel defaults, set criteria to revisit the decision

## Validation Checklist

- [ ] Structure decision documented in README with rationale
- [ ] If feature-based: all controllers, models, services in feature directories
- [ ] If feature-based: Artisan stubs customized or module package installed
- [ ] If feature-based: shared kernel directory exists
- [ ] If feature-based: cross-feature communication rules documented
- [ ] If layer-based: criteria for revisiting decision documented
- [ ] If layer-based: no feature directories created inadvertently

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| No decision | Default layer-based by accident | Decide in week 1 |
| Partial adoption | Some in features, some in layers | Commit fully to one approach |
| Feature explosion | Feature for every concept | Feature = business domain, 3-20 files |
| Premature feature-based | 5-model app with feature structure | Wait until complexity earns it |
| Retrofit pain | Migrating layer→feature at 30 models | Decide early or plan incremental migration |

## Decision Points

- **Layer-based**: <15 models, single developer, simple CRUD, prototypes, MVPs
- **Feature-based**: 15+ models across 3+ domains, multiple teams, complex business logic, expected growth
- **Hybrid**: Core stays layered; complex domains get feature directories. Document the criteria clearly.
- **Full commitment required**: Partial adoption creates ambiguity about where to put new code.

## Performance Considerations

No runtime difference. Both use PSR-4 autoloading. Directory structure only affects developer experience, not performance. Run `composer dump-autoload -o` in production regardless of structure.

## Security Considerations

Neither structure introduces security differences. Authentication, authorization, middleware, and validation work identically. Feature boundaries are organizational, not security boundaries.

## Related Rules

- Make The Structure Decision Early (05-rules.md)
- Commit Fully To One Structure (05-rules.md)
- One Feature Per Business Domain (05-rules.md)
- Maintain A Shared Kernel For Cross-Cutting Code (05-rules.md)
- Customize Artisan Stubs For Feature Namespace Generation (05-rules.md)
- Document The Structural Decision (05-rules.md)

## Related Skills

- Create A New Feature Scaffold
- Migrate From Layer-Based To Feature-Based Structure
- Maintain Consistent Feature Directory Structure (module-organization)

## Success Criteria

- Structure decision is documented with clear rationale
- All code follows the chosen convention consistently
- Team members know where to place new files
- Criteria for revisiting the decision are documented

---

# Skill: Migrate From Layer-Based To Feature-Based Structure

## Purpose

Move an existing layer-based Laravel project to feature-based structure one feature at a time, with tests passing after each migration step.

## When To Use

- Existing layer-based project has reached the complexity threshold (15+ models, 3+ domains)
- Team decides the benefit of feature-based structure now justifies the migration cost
- Partial migration for one complex domain while keeping the rest layer-based (hybrid)

## When NOT To Use

- Small projects where migration cost exceeds benefit
- Projects with no test coverage (migration risk is too high without test safety net)
- Projects near end-of-life or planned replacement

## Prerequisites

- Full test suite that passes before migration
- Team agreement on feature boundaries
- Documented feature boundary criteria
- `composer.json` with PSR-4 autoloading (`"App\\": "app/"`)

## Inputs

- Current layer-based file structure
- Defined feature boundaries
- List of files to move per feature

## Workflow

1. Run full test suite and confirm it passes (baseline)
2. Create the shared kernel directory: `app/Shared/` or `app/Kernel/` (for truly shared models like `User`)
3. Choose the first feature to migrate (start with the most self-contained domain)
4. Create `app/Features/{Feature}/` directory with subdirectories: `Controllers/`, `Models/`, `Services/`
5. Move files from `app/Http/Controllers/`, `app/Models/`, `app/Services/` into the feature directory
6. Update namespaces in moved files: `App\Http\Controllers\` → `App\Features\{Feature}\Controllers\`
7. Update all imports in files that reference the moved classes
8. Create the feature's service provider with `loadRoutesFrom()`, `loadViewsFrom()`, `loadMigrationsFrom()`
9. Create `app/Features/{Feature}/routes.php` and move feature-specific routes from global route files
10. Register the feature provider in `config/app.php`
11. Run `composer dump-autoload`
12. Run tests and fix any failures
13. Repeat steps 4-12 for each additional feature
14. Run full test suite (should pass same as baseline)

## Validation Checklist

- [ ] Feature directories created for each business domain
- [ ] Namespaces updated in all moved files
- [ ] All imports updated to reflect new namespaces
- [ ] Feature service providers created and registered
- [ ] Routes moved from global files to feature route files
- [ ] Views moved or namespaced per feature
- [ ] Migrations moved or loaded from feature directories
- [ ] `composer dump-autoload` run
- [ ] Full test suite passes (same as baseline)
- [ ] No controllers or models remain in old locations for migrated features

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Missed namespace updates | Manual search missed some files | Use automated find-and-replace |
| Broken route references | Route file loaded from wrong path | Verify with `php artisan route:list` |
| Missing provider registration | Provider not in `config/app.php` | Tests catch this as 404 errors |
| Shared model left in feature | Model used by 3+ features stays in feature | Move to `App\Models\` or `app/Shared/` |
| Partial migration | Some controllers left in old location | Commit fully to one structure per file type |

## Decision Points

- **Feature order**: Migrate the most self-contained feature first. Leave features with the most cross-cutting dependencies for last.
- **Incremental vs Big bang**: One feature at a time with tests passing after each → safer but slower. All at once → faster but higher risk.
- **Hybrid outcome**: If migration cost is too high for some features, leave them layer-based and document the hybrid convention clearly.

## Performance Considerations

No performance change — structure does not affect runtime. Run `composer dump-autoload -o` in production after migration.

## Security Considerations

Migration does not change security. Auth, middleware, and validation remain intact. Verify that authorization policies still function correctly after namespace changes.

## Related Rules

- Make The Structure Decision Early (05-rules.md)
- Commit Fully To One Structure (05-rules.md)
- One Feature Per Business Domain (05-rules.md)
- Maintain A Shared Kernel For Cross-Cutting Code (05-rules.md)
- Customize Artisan Stubs For Feature Namespace Generation (05-rules.md)
- Do Not Mix Feature And Layer Structure (05-rules.md)

## Related Skills

- Evaluate Organizational Structure For A New Project
- Create A New Feature Scaffold
- Create Feature Service Provider

## Success Criteria

- Each feature has its own directory with controllers, models, services
- Feature service providers register routes, views, migrations
- All old layer-based directories for migrated features are empty
- Full test suite passes with the same results as before migration
- Team knows where to place new code
