# Skill: Apply Laravel's Default Directory Structure for Small Teams

## Purpose
Set up and maintain Laravel's default directory structure for teams of 3-5 engineers, following framework conventions without premature architectural customization.

## When To Use
- Projects under 3-5 engineers
- CRUD-heavy applications with straightforward business rules
- Rapid shipping priority over long-term maintainability
- Teams where all developers are Laravel-familiar
- Prototypes and MVPs where architecture decisions would slow iteration

## When NOT To Use
- Growing teams (10+ engineers) needing clear ownership boundaries
- Multiple business domains with distinct logic requiring isolation
- Complex business rules not well-served by Controller → Model pattern
- Applications expected to live 5+ years without reorganization
- When codebase has >50 files in any single default directory

## Prerequisites
- Laravel project created via `composer create-project laravel/laravel`
- Understanding of the default directory tree structure
- PHP PSR-4 autoloading basics

## Inputs
- The project's `composer.json` autoload configuration
- List of application feature areas
- Team size and experience level

## Workflow
1. **Verify default structure is intact.** Confirm the project has the standard directories: `app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `tests/`, `vendor/`. Check that `App\` namespace maps to `app/` in `composer.json`.

2. **Use subdirectories within defaults.** Before adding custom top-level directories, use subdirectories within standard locations. Place API controllers in `app/Http/Controllers/Api/`, admin controllers in `app/Http/Controllers/Admin/` to prevent flat-file dumping grounds.

3. **Keep `app/` nesting at 4 levels max.** Limit directory depth under `app/` to 4-5 levels. Avoid paths like `app/Domains/Billing/Subscriptions/Plans/Http/Controllers/Admin/PlanController.php` (7 levels).

4. **Align custom additions with `artisan make:` conventions.** When creating custom directories like `app/Services/`, ensure generator commands still place artifacts correctly. Document any stub overrides.

5. **Document all custom directory additions.** For every non-default directory, add an entry in README or ARCHITECTURE.md explaining what goes there and why.

6. **Run `composer dump-autoload -o` in production.** Include `--optimize-autoloader` in deployment scripts to generate optimized class maps for O(1) autoloading.

7. **Preserve `routes/` → `Controllers` entry point pattern.** Keep routes dispatching to controller methods, never calling services directly from route closures. This preserves middleware, authorization, and framework conventions.

## Validation Checklist
- [ ] All `artisan make:` commands produce files in expected locations
- [ ] `composer dump-autoload` completes without errors after custom directory additions
- [ ] IDE navigation (Ctrl+click on class names) resolves correctly
- [ ] Production deployment includes optimized autoload (`-o` flag)
- [ ] New developers can find expected artifacts (controllers, models, routes) within 30 seconds
- [ ] Custom directories are documented in README or ARCHITECTURE.md
- [ ] No `vendor/` or `storage/` directories are web-accessible

## Common Failures
- **Flat dumping ground**: Files added to `app/` without namespace organization. Use subdirectories even within defaults.
- **Fighting framework conventions**: Custom directories that break `artisan make:` commands without documentation. Override stubs or document new locations.
- **Over-organization before pain**: Deeply nested custom structures on day one. Start simple, evolve with demonstrated complexity.

## Decision Points
- **When to add `app/Services/`?** Add when controllers exceed 200 lines or contain business logic beyond HTTP orchestration.
- **When to deviate from defaults?** Only when specific, measurable friction emerges — never for architectural fashion.

## Performance Considerations
- Directory structure has negligible impact on runtime performance.
- `composer dump-autoload -o` makes autoloading O(1) regardless of directory depth.
- Config caching and route caching are unaffected by directory structure.

## Security Considerations
- Never expose `vendor/` or `storage/` via web server configuration.
- Ensure `public/` is the document root — no other directory should be web-accessible.
- Custom directories containing sensitive logic must still respect Laravel's middleware and auth boundaries.

## Related Rules
- Rule: Use Default Structure for Projects Under 5 Engineers (COS-01/05-rules.md)
- Rule: Keep `app/` Directory Nesting at 4 Levels Max (COS-01/05-rules.md)
- Rule: Align Custom Directories with `artisan make:` Conventions (COS-01/05-rules.md)
- Rule: Document All Custom Directory Additions (COS-01/05-rules.md)
- Rule: Never Expose `vendor/` or `storage/` via Web Server (COS-01/05-rules.md)
- Rule: Use Subdirectories Within Default Directories (COS-01/05-rules.md)
- Rule: Run `composer dump-autoload -o` in Production Deployments (COS-01/05-rules.md)
- Rule: Start With Defaults, Evolve With Demonstrated Pain (COS-01/05-rules.md)
- Rule: Preserve `routes/` → `Controllers` Entry Point Pattern (COS-01/05-rules.md)

## Related Skills
- Organize Code by Layer Within Default Laravel Structure (COS-02/06-skills.md)
- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)
- Evaluate When to Deviate from Defaults (COS-09/06-skills.md)

## Success Criteria
- The project follows standard Laravel directory conventions recognizable to any Laravel developer.
- Custom extensions are documented and compatible with framework generators.
- No single directory contains more than 50 unrelated files.
- Production autoloading is optimized and secure.
