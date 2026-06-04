# Skill: Establish Module Autonomy (Routes, Migrations, Config, Tests)

## Purpose
Configure each module to own its routes, migrations, config, and tests so the module is self-contained and extraction-ready. Module resources are loaded from the module directory via the service provider.

## When To Use
- Every modular monolith after module structure is established
- Every new module created in an existing modular monolith

## When NOT To Use
- Before module boundaries are established
- Module is too simple to justify full autonomy (single file may suffice)

## Prerequisites
- Module internal structure established (MMD-03)
- Module service provider created
- Laravel service provider boot/register pattern

## Inputs
- Module directory path
- Module route, migration, config, test file contents

## Workflow
1. **Load routes from the module directory.** In the module's service provider `boot()` method, use `$this->loadRoutesFrom(__DIR__ . '/../routes/api.php')`. Never add module routes to the central `routes/` directory.

2. **Load migrations from the module directory.** Use `$this->loadMigrationsFrom(__DIR__ . '/../database/migrations')`. Prefix migration filenames with module abbreviation to prevent cross-module name collisions.

3. **Load config from the module directory.** Use `$this->mergeConfigFrom(__DIR__ . '/../config/config.php', 'module_name')`. Namespace config keys with the module name to prevent collisions.

4. **Load views and translations from the module directory.** Use `$this->loadViewsFrom()` and `$this->loadTranslationsFrom()` for server-rendered UI and i18n.

5. **Colocate module tests.** Place all tests in `Modules/{Name}/tests/`. Ensure they can run independently of other modules. Use `vendor/bin/phpunit Modules/{Name}/tests` for per-module test execution.

6. **Document the migration ordering strategy.** Define whether ordering is alphabetical, dependency-based, or priority-based. Document this to prevent deploy failures from cross-module table references.

7. **Use DeferrableProvider for binding-only providers.** If the module's provider only registers bindings (no boot-time route/migration loading), implement `DeferrableProvider` to reduce boot time.

## Validation Checklist
- [ ] Module routes loaded via `loadRoutesFrom()` in provider
- [ ] Module migrations loaded via `loadMigrationsFrom()` in provider
- [ ] Migration filenames include module prefix for uniqueness
- [ ] Module config keys are namespaced to prevent collision
- [ ] Module views/translations loaded from module directory
- [ ] Module tests colocated and independently runnable
- [ ] Migration ordering strategy is documented

## Common Failures
- **Routes in central file.** Adding module routes to `routes/api.php` instead of module directory.
- **Shared migrations directory.** All migrations in `database/migrations/` instead of module-specific directory.
- **Config key collisions.** Two modules with same bare config key `config('prefix')` producing wrong values.

## Decision Points
- **Load routes from module vs central route file?** Always load from module. Central route files break extraction readiness.

## Performance Considerations
- Multiple migration directories add ~10-20ms to `migrate` command with 10+ modules.
- Route loading from multiple files is negligible.
- Deferred providers reduce boot time for binding-only modules.

## Security Considerations
- Module autonomy does not provide security isolation — apply auth at route level.

## Related Rules
- Rule: Load Routes from Module (MMD-05/05-rules.md)
- Rule: Load Migrations from Module (MMD-05/05-rules.md)
- Rule: Namespace Config Keys (MMD-05/05-rules.md)
- Rule: Colocate Module Tests (MMD-05/05-rules.md)
- Rule: Migration Name Prefixing (MMD-05/05-rules.md)
- Rule: Load Views/Translations from Module (MMD-05/05-rules.md)
- Rule: Document Migration Ordering Strategy (MMD-05/05-rules.md)

## Related Skills
- Implement Module Internal Structure (MMD-03/06-skills.md)
- Configure Module Registration (MMD-04/06-skills.md)
- Manage Inter-Module Communication via Contracts (MMD-06/06-skills.md)

## Success Criteria
- Module routes, migrations, config, views, and tests are all located within the module directory.
- Service provider loads all module resources from the module directory.
- Module tests can run independently of other modules.
- Migration ordering is documented and reliable.
