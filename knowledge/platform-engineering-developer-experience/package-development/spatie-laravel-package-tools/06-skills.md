# Skill: Set Up a Package Service Provider with Spatie Tools

## Purpose
Use `spatie/laravel-package-tools` to create a declarative service provider that handles migrations, views, config files, commands, Blade components, and translations through a fluent builder API, eliminating boilerplate.

## When To Use
- Building any new Laravel package that needs migrations, views, config, commands, or translations
- Converting an existing package from manual service provider registration to cleaner pattern
- Standardizing package development across an organization

## When NOT To Use
- Very simple packages with only a single config file (direct ServiceProvider is lighter)
- Packages supporting multiple frameworks (Laravel + Symfony); Spatie tools are Laravel-specific
- Packages requiring exotic registration scenarios (dynamic view namespaces, complex conditional registrations)
- When minimizing dependency count is critical and the package is extremely simple

## Prerequisites
- Laravel package skeleton or existing package structure
- Composer dependency: `composer require spatie/laravel-package-tools`
- Service provider class extending `Spatie\LaravelPackageTools\PackageServiceProvider`

## Inputs
- Package name (used for config namespace, view namespace, migration prefix)
- Package resources list (config files, migrations, views, commands, Blade components, translations)
- Conditional registration rules

## Workflow (numbered)
1. **Require the package** — `composer require spatie/laravel-package-tools`
2. **Extend PackageServiceProvider** — Create provider extending `Spatie\LaravelPackageTools\PackageServiceProvider`
3. **Implement configurePackage()** — Use the fluent builder: `$package->name('my-package')->hasConfigFile()->hasViews()->hasMigration('create_my_table')`
4. **Set up config file** — Create `config/my-package.php` with documented defaults; use snake_case keys
5. **Register commands** — `->hasCommand(MyCommand::class)` for artisan commands; `->hasInstallCommand(MyInstallCommand::class)` for packages with publishable resources
6. **Set up views/components** — `->hasViews()` for Blade views; `->hasViewComponent('prefix', Component::class)` for Blade components
7. **Handle migrations** — `->hasMigration('create_my_table')` with migration files in `database/migrations/`
8. **Add conditional registration** — Use `->when()` or callbacks for environment-aware registration (e.g., only in console)
9. **Verify parent calls** — If overriding `register()` or `boot()`, ensure `parent::register()` and `parent::boot()` are called

## Validation Checklist
- [ ] Service provider extends `Spatie\LaravelPackageTools\PackageServiceProvider`
- [ ] `configurePackage()` method implemented with all necessary builder calls
- [ ] `parent::register()` and `parent::boot()` called if overridden
- [ ] Config file at `config/package-name.php` with documented defaults
- [ ] Migrations in `database/migrations/` with unique package-prefixed filenames
- [ ] Install command registered for packages with publishable resources
- [ ] Auto-discovery configured in `composer.json` `extra.laravel`
- [ ] No manual registration calls duplicate builder method functionality
- [ ] Package name stable and unique within the organization

## Common Failures
- **Not calling parent::boot()/register()** — base class never processes the specification; no registrations performed
- **Over-parameterizing package name** — name used for config, views, and migration prefix; changing later requires breaking changes
- **Assuming all features must be publishable** — only make publishable what consumers legitimately need to customize
- **Ignoring install command pattern** — users must manually publish each resource type; poor DX
- **Mixing Spatie tools with manual calls** — `hasConfigFile()` + manual `mergeConfigFrom()` causes double-registration

## Decision Points
- Use Spatie tools vs direct ServiceProvider: default to Spatie tools for any package with > 1 resource type
- Package name: use organization prefix as vendor namespace; unique within the organization
- Conditional registration: use `->when()` for compile-time conditions; `if()` guards for runtime conditions

## Performance/Security Considerations
- Spatie tools add microseconds during provider boot; no runtime impact after registration
- Use lazy registration for commands and event listeners to reduce boot time
- Be careful with `->hasCommand()` for destructive commands; add `--force` flags or confirmation prompts
- Review all registered commands, routes, and views for security implications before publishing
- Published config files with `env()` calls need safe fallback defaults, not sensitive defaults

## Related Rules (from 05-rules.md)
- SPATIE-RULE-001: Default starting point
- SPATIE-RULE-002: Use configurePackage() DSL consistently
- SPATIE-RULE-003: Call parent::register() and parent::boot()
- SPATIE-RULE-004: Include install command
- SPATIE-RULE-005: Unique stable package name
- SPATIE-RULE-013: Not calling parent::boot()/register() (most common bug)

## Related Skills
- Scaffold a Laravel Package from the Standard Skeleton
- Implement Service Provider Registration (register vs boot)
- Configure Package Auto-Discovery

## Success Criteria
- Package service provider registered via auto-discovery with all resources working
- `php artisan package-name:install` publishes config, migrations, and assets in one command
- Zero double-registration or registration conflicts
- Provider boot time < 1ms overhead from Spatie tools
- Developer experience: adding a new resource type requires a single line in `configurePackage()`

---

# Skill: Implement Advanced Spatie Tools Features

## Purpose
Leverage Spatie Laravel Package Tools' advanced features — conditional registration, Inertia component support, install commands, and Blade component namespacing — for complex package requirements.

## When To Use
- Package needs Blade components with custom prefixes
- Package should register differently in different environments
- Package has Inertia components as well as standard Laravel resources
- Package needs a single install command for all publishable resources

## When NOT To Use
- Simple packages with only config and migrations
- Developer is still learning the basic `configurePackage()` DSL

## Prerequisites
- Basic Spatie Package Tools provider already set up
- Blade component or Inertia component files ready
- Conditional registration requirements identified

## Workflow (numbered)
1. **Register Blade components** — `->hasViewComponent('prefix', MyComponent::class)`; prefix prevents component name collisions
2. **Set up Inertia components** — `->hasInertiaComponent('component-name')`; register when `app()->bound('inertia')` via conditional
3. **Implement install command** — `->hasInstallCommand()` with class that publishes config, migrations, assets; user calls `php artisan package-name:install`
4. **Add conditional registration** — Use `->when()` callback: `->when($condition, function ($package) { ... })`; or `if()` in boot for runtime checks
5. **Register multiple commands** — `->hasCommands([CommandOne::class, CommandTwo::class])` in a single call
6. **Register translations** — `->hasTranslations()` with language files in `resources/lang/`

## Validation Checklist
- [ ] Blade components render with correct prefix
- [ ] Inertia components only register when Inertia is available
- [ ] Install command publishes all resources in correct order
- [ ] Conditional registration works in expected environments
- [ ] Translations load correctly with `__('package-name::file.key')` syntax

## Common Failures
- **Inertia components registered without Inertia** — causes errors; always use conditional registration
- **Install command missing resources** — ensure all publishable resources are covered by the install command
- **Component prefix collision** — choose a unique prefix; check existing projects for conflicts

## Decision Points
- Component prefix: short (2-3 letters) unique to the package/org; check for collisions with other packages
- Conditional depth: use `->when()` for simple conditions; separate service providers for complex conditions
- Install command scope: include all publishable resources in one command; don't split into separate publish commands

## Performance/Security Considerations
- Conditional registration prevents unnecessary boot-time work in environments that don't need the feature
- Install commands should not run destructive operations without confirmation
- Review Inertia components for server-side exposure of sensitive data

## Related Rules (from 05-rules.md)
- SPATIE-RULE-007: Conditional registration
- SPATIE-RULE-004: Include install command
- SPATIE-RULE-010: Command registration

## Related Skills
- Set Up a Package Service Provider with Spatie Tools
- Implement Service Provider Registration (register vs boot)
- Register Blade Components with Namespacing

## Success Criteria
- Blade components render correctly with org-specific prefix
- Install command: single command publishes all resources
- Conditional registration: features register only when their prerequisites exist
- Zero component name collisions with other packages
