# Skill: Split A Feature Into Sub-Features

## Purpose

Organize an oversized feature (20+ files) into sub-features grouped by sub-domain to restore navigability and maintain cohesion.

## When To Use

- Feature exceeds 20 files and navigation is becoming difficult
- Feature contains multiple distinct sub-domains (e.g., Billing has Invoicing, Subscriptions, Payments)
- Two or more developers need to work on different parts of the same feature without conflicts

## When NOT To Use

- Features with <15 tightly related files
- Splitting prematurely "just in case" the feature grows
- When sub-domains are not clearly distinguishable

## Prerequisites

- Feature exceeds ~20 files threshold
- Sub-domain boundaries are identified
- Feature has a service provider that registers all components

## Inputs

- Feature name (e.g., `Billing`)
- Identified sub-domains (e.g., `Invoicing`, `Subscriptions`, `Payments`)
- Files belonging to each sub-domain

## Workflow

1. Identify sub-domain boundaries within the feature (e.g., Invoicing, Subscriptions)
2. Create sub-feature directories: `app/Features/Billing/Invoicing/`, `app/Features/Billing/Subscriptions/`
3. Create standard subdirectories in each: `Controllers/`, `Models/`, `Services/`, `Providers/`
4. Move relevant files from the parent feature into each sub-feature
5. Update namespaces: `App\Features\Billing\Controllers\` → `App\Features\Billing\Invoicing\Controllers\`
6. Update all imports in files that reference the moved classes
7. Create service providers for each sub-feature (e.g., `InvoicingServiceProvider`, `SubscriptionsServiceProvider`)
8. Register sub-feature providers in the parent feature's provider
9. Update routes: move sub-domain routes to sub-feature route files
10. Update tests: move and mirror the sub-feature test structure
11. Run `composer dump-autoload` and full test suite

## Validation Checklist

- [ ] Sub-feature directories follow the same internal structure as top-level features
- [ ] Namespaces updated in all moved files
- [ ] Sub-feature service providers created and registered by parent provider
- [ ] Routes moved to sub-feature route files with appropriate prefixes
- [ ] Tests mirrored for sub-features
- [ ] `composer dump-autoload` run
- [ ] Full test suite passes
- [ ] Sub-feature conventions are consistent across all sub-features

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Premature splitting | Creating sub-features for 5-file feature | Wait until ~20 files |
| Inconsistent conventions | Some sub-features have providers, some don't | Define and enforce standard structure |
| Missed imports | Old namespace references not updated | Use automated find-and-replace |
| Over-splitting | Creating sub-features for 2-3 files | Consolidate related sub-domains |

## Decision Points

- **Sub-feature vs New top-level feature**: If the sub-domain has independent business value and could be extracted, make it a top-level feature. If it's tightly coupled to the parent, keep it as a sub-feature.
- **Provider registration**: Sub-feature providers are registered by the parent provider, not in `config/app.php`. The parent provider is the single entry point.

## Performance Considerations

Additional nested directories do not affect runtime performance. Composer's optimized autoloader handles deep paths efficiently. Additional sub-feature providers add minimal boot time (~1ms each).

## Security Considerations

Sub-features follow the same security model as top-level features. No special considerations. Ensure middleware and authorization policies are still applied correctly after file moves.

## Related Rules

- Split Features Into Sub-Features At ~20 Files (05-rules.md)
- Establish Sub-Feature Convention Consistency (05-rules.md)
- Use Domain Groups For Related Features (05-rules.md)
- Establish A Feature Lifecycle (05-rules.md)

## Related Skills

- Set Up Domain Groups For Related Features
- Create A New Feature Scaffold
- Maintain Consistent Feature Directory Structure (module-organization)

## Success Criteria

- Each sub-feature directory is navigable (<20 files each)
- Sub-features follow consistent internal structure
- All tests pass after migration
- Parent feature service provider registers sub-feature providers
- Developers can work on different sub-features without conflicts

---

# Skill: Set Up Domain Groups For Related Features

## Purpose

Organize related features under domain group directories when the top-level feature count exceeds ~20, reducing navigation overhead and enabling team-level ownership.

## When To Use

- Top-level feature count exceeds ~20 features
- Multiple teams own different business domains
- Related features need to be grouped for navigability
- Team ownership needs to be enforced at the domain group level

## When NOT To Use

- Projects with <15 features (extra hierarchy not justified)
- Single-team projects where flat structure is simpler
- Features that don't have clear domain relationships

## Prerequisites

- 15+ feature directories at the top level
- Clear domain group boundaries identified
- Team structure aligns with domain groups

## Inputs

- List of all features
- Domain group boundaries (e.g., Financial, Content, UserManagement)
- Team ownership assignments

## Workflow

1. Identify domain groups: clusters of related features (e.g., Financial = Billing, Payments, Accounting)
2. Create domain group directories: `app/Features/Financial/`, `app/Features/Content/`
3. Move feature directories into their domain group: `app/Features/Financial/Billing/`
4. Update namespaces: `App\Features\Billing\` → `App\Features\Financial\Billing\`
5. Optionally create a domain group service provider that registers child feature providers
6. Update `config/app.php` to register domain group providers (or individual feature providers with updated namespaces)
7. Update CODEOWNERS: assign domain groups to teams
8. Update CI path triggers to match new directory structure
9. Run `composer dump-autoload` and full test suite

## Validation Checklist

- [ ] Domain group directories created for each business cluster
- [ ] Feature directories moved under domain groups
- [ ] Namespaces updated to include domain group
- [ ] Service providers updated with correct namespace
- [ ] Provider registrations in `config/app.php` updated
- [ ] CODEOWNERS reflects new domain group structure
- [ ] CI path triggers updated for domain groups
- [ ] `composer dump-autoload` run
- [ ] Full test suite passes

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Unclear group boundaries | Features in wrong groups | Define criteria upfront |
| Deep nesting | Groups > groups > features | Limit to one level of grouping |
| Orphaned features | Feature doesn't fit any group | Create a general group or evaluate if feature is needed |
| Circular group dependencies | Financial depends on Content, Content depends on Financial | Enforce with static analysis |

## Decision Points

- **Domain group vs flat**: Use domain groups at ~20 top-level features. Below that, flat is simpler.
- **Group provider**: Create a domain group provider that registers child feature providers. This simplifies the `config/app.php` providers array.

## Performance Considerations

Additional nesting has no runtime performance cost. Directory depth only affects developer navigation. IDE features mitigate deep paths.

## Security Considerations

Domain groups are organizational, not security boundaries. Authentication and authorization are handled at the controller/middleware level regardless of directory depth.

## Related Rules

- Use Domain Groups For Related Features (05-rules.md)
- Enforce Dependency Direction With Static Analysis (05-rules.md)
- Use CODEOWNERS For Team Ownership (05-rules.md)
- Run Static Analysis With Directory-Scoped Rules (05-rules.md)

## Related Skills

- Split A Feature Into Sub-Features
- Extract A Feature Into A Standalone Package
- Evaluate Organizational Structure For A New Project

## Success Criteria

- Top-level `app/Features/` now shows domain groups, not 50+ individual features
- Each domain group contains related features
- CODEOWNERS assigns each domain group to a team
- CI runs only affected domain group tests
- Full test suite passes

---

# Skill: Extract A Feature Into A Standalone Package

## Purpose

Move a stable, reusable feature from the monorepo into a standalone Composer package with independent versioning and deployment.

## When To Use

- Feature has been stable (API unchanged) for 3+ months
- Feature is consumed by multiple projects
- Independent versioning and deployment are needed
- Feature's code is cleanly separable from the main application

## When NOT To Use

- Feature is still under active development with frequent API changes
- Feature depends heavily on the application's specific configuration or infrastructure
- Feature has deep dependencies on other features that cannot be resolved
- Project has <100 features and extraction would add complexity without benefit

## Prerequisites

- Feature lifecycle defines "Stable" and "Extracted" stages
- Feature has no circular dependencies with other features
- Feature has its own service provider, routes, views, migrations
- Full test suite passes before extraction
- Feature extraction process is documented

## Inputs

- Feature directory (e.g., `app/Features/Billing/`)
- Package vendor name and package name
- Target directory (e.g., `packages/vendor/billing/`)

## Workflow

1. Create `packages/vendor/package/src/` directory
2. Move feature files: `git mv app/Features/Billing/ packages/acme/billing/src/`
3. Create `composer.json` for the package with PSR-4 autoloading
4. Update all namespaces from `App\Features\Billing\` to `Acme\Billing\`
5. Update the service provider to extend the correct base class (it's no longer inside the app)
6. Add package to the main app's `composer.json`: `"acme/billing": "@dev"`
7. Run `composer update` in the main app
8. Publish migrations and config from the package
9. Move tests to the package's test directory
10. Update CI to run package tests
11. Remove old feature directory reference from `config/app.php` (package provider auto-discovers or registers separately)

## Validation Checklist

- [ ] Feature directory moved to `packages/vendor/package/src/`
- [ ] `composer.json` has correct PSR-4 autoloading
- [ ] Namespaces updated to vendor namespace
- [ ] Service provider updated for package context
- [ ] Main app's `composer.json` references the package
- [ ] `composer dump-autoload` regenerated
- [ ] Migrations publishable via `php artisan vendor:publish`
- [ ] Config publishable via `php artisan vendor:publish --tag=billing-config`
- [ ] Package tests pass
- [ ] Full application test suite passes

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Namespace remnants | Missed namespace references | Use automated search-and-replace |
| Missing autoload | composer.json autoload misconfigured | Test with Composer |
| Broken routes | Route paths assume app context | Update route references |
| Unpublishable assets | No `publishes()` in provider | Add publish configuration |
| Hidden app dependency | Feature uses app-specific services | Extract app-specific code first |

## Decision Points

- **Monorepo vs Multi-repo**: Keep in monorepo unless independent versioning is needed. Use `packages/` directory within the monorepo for simpler management.
- **Split package**: If the feature depends on shared kernel contracts, create the shared kernel as a separate package first, then extract the feature.
- **Versioning**: Start with 0.x for the extracted package. Move to semantic versioning once the API is stable.

## Performance Considerations

Packaged features perform identically to in-app features after Composer's optimized autoloader generates the classmap. Route and config caching works the same way.

## Security Considerations

Packaged features should not bypass the application's security model. Ensure middleware, authentication, and authorization are still applied. Packages should not introduce security vulnerabilities through outdated dependencies.

## Related Rules

- Establish A Feature Lifecycle (05-rules.md)
- Version The Shared Kernel Independently (05-rules.md)
- Document The Feature Extraction Process (05-rules.md)
- Use Domain Groups For Related Features (05-rules.md)
- Enforce Dependency Direction With Static Analysis (05-rules.md)

## Related Skills

- Split A Feature Into Sub-Features
- Set Up Domain Groups For Related Features
- Create Feature Service Provider
- Evaluate Organizational Structure For A New Project

## Success Criteria

- Feature is fully functional as a standalone Composer package
- Package has its own versioning and release cycle
- Main application functions correctly with the package
- No namespace references to the old feature location remain
- Package tests pass independently of the main application
- Feature can be updated without requiring a full application deployment
