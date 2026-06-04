# Knowledge Unit: Stub Customization in Laravel

## Metadata
- **Subdomain:** Code Generation & Scaffolding
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-generation-scaffolding/stub-customization-laravel
- **Maturity:** Mature
- **Related Technologies:** Laravel Artisan, Stubs, PHP, Blade

## Executive Summary

Laravel's stub customization system allows developers to override the default templates used by `make:` commands (make:model, make:controller, make:migration, etc.) by publishing and modifying stub files. The `php artisan stub:publish` command copies Laravel's vendor stubs from `vendor/laravel/framework/src/Illuminate/Console/stubs` to the application's `stubs/` directory. Once published, modified stubs are automatically used by all `make:` commands. Custom stubs enable teams to enforce coding standards (consistent docblocks, logging, typing), add project-specific boilerplate (base classes, traits, interfaces), and automate repetitive patterns (adding event dispatch, authorization checks, or repository injection to generated controllers). Stub customization is the foundation for custom generator commands and is essential for teams that follow specific architectural patterns.

## Core Concepts

- **Stub Files:** PHP template files containing skeleton code with `{{ placeholder }}` variables for dynamic content like class names, namespaces, and imports
- **Placeholder Variables:** Built-in variables: `{{ class }}`, `{{ namespace }}`, `{{ rootNamespace }}`, `{{ namespacedModel }}`, `{{ model }}`, `{{ modelVariable }}`, `{{ user }}`, and import-related placeholders
- **Stub Publishing:** `php artisan stub:publish` copies vendor stubs to the project's `stubs/` directory; only published stubs are customizable
- **Stub Resolution Order:** Laravel checks `stubs/` first, then falls back to vendor stubs when generating classes
- **Custom Stub Files:** Files in `stubs/` not from the vendor set (e.g., `stubs/dto.stub`, `stubs/action.stub`) can be referenced by custom generator commands
- **Laravel 11+ Stub Location:** The publish command creates `stubs/` in the project root; custom stubs can also be organized in subdirectories

## Mental Models

- **Stub as Template:** A stub is a template file—like a Blade view—with variables that are replaced at generation time to produce a complete PHP class
- **Stub as Convention Document:** Custom stubs encode team conventions in executable form—every generated class follows the same patterns because the stubs enforce them
- **Stub as Boilerplate Reducer:** Where a generated model previously had just the `use Illuminate\Database\Eloquent\Model;` import, a custom stub might add `use App\Traits\HasUuid;`, `use App\Concerns\HasAuditLog;`, and other team-standard imports

## Internal Mechanics

1. **Stub Resolution:** `GeneratorCommand::getStub()` returns a path; if a file with the same relative name exists in `stubs/`, it's used instead of the vendor file
2. **Stub Loading:** The stub file is read into a string via `file_get_contents()` or `File::get()`
3. **Placeholder Replacement:** `GeneratorCommand::buildClass()` calls `replaceNamespace()`, `replaceClass()`, and any model-specific replacement methods
4. **Custom Replacement:** `buildClass()` can be overridden to add custom placeholders: `str_replace('{{ customPlaceholder }}', $value, $stub)`
5. **File Writing:** The processed stub is written to the target namespace path; `GeneratorCommand::alreadyExists()` checks for conflicts before writing
6. **Stub Root Path:** Laravel checks for stubs in `base_path('stubs')` first; this path is configurable via `GeneratorCommand::$stubPath`

## Patterns

- **Conventions Enforcement Pattern:** Customize model stubs to always include: `HasFactory`, `SoftDeletes`, a UUID trait, and audit log integration
- **Base Class Injection Pattern:** Modify controller stubs so generated controllers extend a project-specific base controller instead of Laravel's default
- **Docblock Standardization Pattern:** Add consistent PHPDoc blocks to all generated classes: `@property` annotations for models, `@method` annotations for facades
- **Testing Scaffold Pattern:** Customize test stubs to include `RefreshDatabase` and `CreatesApplication` traits, and default test methods with assertions
- **Namespace Alignment Pattern:** Add `declare(strict_types=1)` to all generated PHP files via stub customization
- **Migration Enhancement Pattern:** Customize migration stubs to always include `->charset('utf8mb4')` and `->collation('utf8mb4_unicode_ci')` for column definitions
- **Service Class Pattern:** Customize seeder stubs to disable query logging and batch insert for performance with large datasets
- **Resource Convention Pattern:** Customize resource stubs to wrap responses in a standardized JSON envelope (`data`, `message`, `meta` keys)

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Stub modification | Direct edit vs sectioned stubs vs Blade stubs | Direct edit for simple changes; sectioned stubs (overriding Tinker commands) for targeted customization |
| Conventions encoding | Stubs vs traits vs base classes | Stubs for generation defaults; traits for reusable behavior; base classes for shared implementation |
| Custom stub organization | Flat `/stubs` vs `/stubs/my-app` vs `/stubs/vendor` | Flat for simple projects; subdirectories for multiple convention sets |
| Stub variable strategy | Built-in only vs custom vs Blade-like | Built-in for basic info; custom placeholders for project-specific data; Blade-like for complex logic |

## Tradeoffs

- **Stubs vs Traits:** Stubs add code to every generated class (boilerplate), while traits are included once and reused. Use stubs for structural defaults (extends, implements) and traits for reusable behavior.
- **Published Stubs vs Base Classes:** Published stubs modify generated code at creation time, while base classes define shared behavior at runtime. Stubs are easier to understand (explicit code), while base classes are easier to maintain (inherit changes).
- **Global vs Per-Generator Stubs:** Modifying `stubs/model.stub` affects all make:model calls. For project-specific generators, create dedicated stubs in subdirectories and reference them from custom command classes.

## Performance Considerations

- **Stub File I/O:** Reading stub files from disk adds ~1ms per generation. This is negligible for interactive use but may add up in bulk generation scenarios.
- **Placeholder Replacement:** String replacement operations are fast (microseconds). The overhead is dominated by file writing, not placeholder processing.
- **Custom Stub Loading:** Custom stubs don't affect runtime performance—they only impact generation time. Once files are generated, stubs are not loaded or executed.

## Production Considerations

- **Stub Version Control:** Stub files should be committed to version control and reviewed as code changes. Team members building on new stubs get consistent output.
- **Stub Documentation:** Document what each custom stub provides. New team members need to understand what conventions are encoded in stubs.
- **Stub Compatibility with Laravel Upgrades:** When upgrading Laravel, check if vendor stubs have changed. Diff old and new vendor stubs to identify changes that should be ported to custom stubs.
- **Environment-Agnostic Stubs:** Stubs should not contain environment-specific values (API keys, database names, paths). Use placeholders for all project-specific values.

## Common Mistakes

- **Publishing stubs but not customizing them:** Running `stub:publish` copies stubs to the project, but stubs still match vendor defaults—no visible change and developers don't realize they can customize them
- **Overwriting stubs without review:** Re-publishing stubs after customization overwrites changes; manage stubs with version control and re-apply changes deliberately
- **Hard-coding too much in stubs:** Adding business logic, hard-coded strings, or application-specific imports to stubs that should remain generic; stubs are structural templates, not business logic containers
- **Not testing stub output:** Running `php artisan make:model TestModel` and not verifying the generated file reflects stub customizations; always test after stub modifications
- **Forgetting to update stubs after package updates:** When a package adds new stubs (e.g., Livewire adds `livewire.stub`), existing custom stubs may miss the new stub's features

## Failure Modes

- **Stub Placeholder Not Replaced:** A custom placeholder `{{ customValue }}` is added to a stub but not implemented in the replacement logic; the placeholder appears verbatim in generated code. Mitigate: always implement replacement for all custom placeholders and test generation.
- **Stub Path Misconfiguration:** The stub path referenced by a custom generator doesn't exist. Mitigate: validate stub paths in the command's constructor and provide descriptive error messages.
- **Vendor Stub Change on Upgrade:** A vendor stub structure changes in a new Laravel version, but the published stub is outdated. Mitigate: re-publish stubs after upgrades and diff against custom versions.
- **Namespace Collision from Stub:** A stub adds an import for a class that doesn't exist in the application (e.g., a trait that hasn't been created). Mitigate: ensure stubs reference only existing classes or conditionally include them.

## Ecosystem Usage

- **Laravel Framework:** All core `make:` commands use stub files for generation; the stubs are updated with each Laravel release to reflect current conventions
- **Laravel Breeze/Jetstream:** Starter kits use stubs for authentication scaffolding generation; custom stubs can override generated view/controller structure
- **Laravel Nova:** Nova's `nova:resource` and other generators use stubs that can be customized for organization-specific Nova patterns
- **Laravel Livewire:** Livewire's `make:livewire` command uses stubs for component classes and views; stubs can be published and customized
- **Spatie Packages:** Spatie's package skeleton provides stubs for package development with recommended structure and testing setup

## Related Knowledge Units

- custom-artisan-make-commands
- custom-generator-commands
- blueprint-code-generation
- code-generation-scaffolding (domain overview)

## Research Notes

- The `stub:publish` command has been available since Laravel 5.0; it copies stubs from the framework's Console directory to `stubs/`
- Laravel 8.x expanded the placeholder system from the original `DummyClass`/`DummyNamespace` format to the more intuitive `{{ class }}`/`{{ namespace }}` syntax
- Laravel 11.x changed stub organization: stubs from multiple sources (framework, packages) can be published to `stubs/` with naming conventions to avoid collisions
- The customizable stub files include: model.stub, controller.stub, migration.stub, seeder.stub, factory.stub, test.stub, request.stub, policy.stub, event.stub, listener.stub, job.stub, mail.stub, notification.stub, rule.stub, command.stub, channel.stub, middleware.stub, provider.stub, resource.stub, exception.stub, cast.stub, scope.stub, observer.stub, and more
