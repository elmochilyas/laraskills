# Skill: Create A New Feature Scaffold

## Purpose

Set up a new feature directory with the correct structure, service provider, and component registrations, ensuring consistency with the project's feature-based conventions.

## When To Use

- Adding a new business domain to the application
- Extracting a sub-feature from an existing oversized feature
- Starting a new Laravel project using feature-based structure

## When NOT To Use

- For concepts that belong in an existing feature
- For single-file additions that don't warrant a full feature directory
- When the project uses layer-based structure (use default Laravel conventions)

## Prerequisites

- Project uses feature-based structure (documented in README)
- Artisan stubs customized for feature namespaces (or `nwidart/laravel-modules` installed)
- `composer.json` autoloading includes `"App\\": "app/"`

## Inputs

- Feature name (singular noun, PascalCase: `Billing`, `Users`, `CMS`)
- List of components the feature needs (controllers, models, routes, views, migrations)

## Workflow

1. Create `app/Features/{FeatureName}/` directory
2. Create subdirectories based on needed components: `Controllers/`, `Models/`, `Services/`, `Requests/` (only what's needed — no empty dirs)
3. Create `Providers/{FeatureName}ServiceProvider.php` extending `ServiceProvider`
4. In the provider, implement `register()` for container bindings and `boot()` for `loadRoutesFrom()`, `loadViewsFrom()`, `loadMigrationsFrom()`
5. Create `routes.php` with a grouped route definition using `prefix()` and `->name()` matching the feature name
6. Register the provider in `config/app.php` providers array (or set up auto-discovery)
7. Create initial model files in `Models/` with proper namespace
8. Run `composer dump-autoload` to update classmap
9. Verify with `php artisan route:list` and `php artisan make:test` to confirm autoloading

## Validation Checklist

- [ ] Feature directory named with singular PascalCase noun
- [ ] Service provider exists at `Providers/{FeatureName}ServiceProvider.php`
- [ ] `loadRoutesFrom(__DIR__.'/../routes.php')` in provider boot
- [ ] `loadViewsFrom(__DIR__.'/../views', 'feature_name')` if feature has views
- [ ] `loadMigrationsFrom(__DIR__.'/../Database/Migrations')` if feature has migrations
- [ ] Provider registered in `config/app.php` providers array
- [ ] Routes use unique prefix and name: `prefix('/billing')`, `name('billing.')`
- [ ] `parent::boot()` called in provider's `boot()` method
- [ ] No empty subdirectories
- [ ] `php artisan route:list` shows all feature routes

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Missing provider registration | Provider not added to `config/app.php` | Check with `route:list` |
| Wrong namespace | Typo in feature name casing | Use consistent PascalCase |
| Empty directories | Scaffolding all subdirs upfront | Create only when needed |
| Hardcoded paths | Using `app_path()` in provider | Use `__DIR__.'/../'` relative paths |
| No autoloading update | Forgetting `dump-autoload` | Run after directory creation |

## Decision Points

- **Feature boundary**: Is this a business domain? Answer: "What business capability does this serve?" If it can be described in one sentence, it's a feature.
- **Feature size**: Will this feature have at least 3 files? If not, consider placing in an existing feature.
- **Shared kernel**: Does this feature need shared contracts? Add to `app/Kernel/Contracts/` only when multiple features will consume them.

## Performance Considerations

Zero runtime performance impact. Feature-based structure uses the same PSR-4 autoloading as layer-based. Run `composer dump-autoload -o` in production for optimized classmap.

## Security Considerations

Feature boundaries are organizational, not security boundaries. Authentication, authorization, and validation function identically. Do not rely on feature directories for access control.

## Related Rules

- Each Feature Is A Bounded Context (05-rules.md)
- Maintain Feature Granularity At 3-20 Files (05-rules.md)
- Use Service Provider Per Feature For Component Registration (05-rules.md)
- Do Not Mix Feature And Layer Structure (05-rules.md)
- Customize Artisan Stubs For Feature Namespaces (05-rules.md)

## Related Skills

- Create Feature Service Provider
- Create And Register Feature Configuration
- Evaluate Organizational Structure (feature-vs-layer)

## Success Criteria

- New feature directory exists with correct structure
- Service provider registers routes, views, migrations
- `php artisan route:list` shows feature routes
- Feature can be disabled by commenting out its provider in `config/app.php`

---

# Skill: Evaluate Organizational Structure For A Laravel Project

## Purpose

Make an informed, early decision between layer-based and feature-based structure based on project complexity, team size, and growth expectations.

## When To Use

- Starting a new Laravel project
- Evaluating whether to migrate an existing layer-based project to feature-based
- Reviewing organizational structure decisions during architecture planning

## When NOT To Use

- Projects already committed to one structure (migrate only when cost is justified)
- Rapid prototypes where any structure decision is premature

## Prerequisites

- Understanding of project scope: expected model count, team size, business domains
- Knowledge of Laravel's default layer-based structure
- Understanding of the team's experience level

## Inputs

- Estimated model count
- Number of distinct business domains
- Team size and structure
- Growth projections

## Workflow

1. Count expected models: < 15 models → layer-based is simpler; 15+ models → evaluate feature-based
2. Identify distinct business domains: 1-2 domains → layer-based; 3+ domains → feature-based provides better cohesion
3. Assess team size: single developer → either works; multiple teams → feature-based enables clear ownership
4. Evaluate growth trajectory: stable scope → layer-based; expected growth → feature-based scales better
5. Document the decision in the project README with rationale
6. If feature-based: customize Artisan stubs, create feature scaffold command, commit fully
7. If layer-based: proceed with Laravel defaults, revisit decision when scale criteria are met

## Validation Checklist

- [ ] Decision documented in README "Project Structure" section
- [ ] Rationale explains why the chosen structure fits the project
- [ ] If feature-based: all Artisan stubs are customized
- [ ] If feature-based: shared kernel directory exists (`app/Shared/` or `app/Kernel/`)
- [ ] No mixed placement: all code follows the chosen convention
- [ ] Team agrees on the decision

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| No decision made | Default layer-based by accident, then expensive migration needed | Decide in week 1 |
| Partial adoption | Some controllers in features, some in Http | Commit fully to one structure |
| Feature explosion | Every concept gets a feature | Feature = business domain, 3-20 files |
| Premature feature-based | 5-model blog with feature structure | Wait until 15+ models across domains |

## Decision Points

- **Layer-based when**: <15 models, single developer/small team, simple CRUD, rapid prototyping
- **Feature-based when**: 15+ models across distinct domains, multiple teams, complex business logic, expected growth
- **Hybrid when**: Core is simple but one or two domains are complex — migrate incrementally
- **Full commit required**: Partial adoption creates ambiguity; decide and commit fully

## Performance Considerations

No runtime difference between structures. Autoloading uses classmap in production. Directory structure only affects developer experience, not application performance.

## Security Considerations

Neither structure introduces security differences. Authentication, authorization, middleware, and validation work identically.

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
- Create Feature Service Provider

## Success Criteria

- Structure decision is documented with clear rationale
- All code follows the chosen convention consistently
- Team members know where to place new files
- Criteria for revisiting the decision are documented
