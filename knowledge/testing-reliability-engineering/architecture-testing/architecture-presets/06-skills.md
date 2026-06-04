# Skill: Define and Enforce Architecture Rules with Presets

## Purpose
Use Pest's architecture testing presets (`->preset()->laravel()`, `->preset()->security()`, etc.) to automatically enforce Laravel conventions, security best practices, and project-specific architectural rules.

## When To Use
- When setting up architecture tests for a new Laravel project
- When enforcing framework conventions across a team
- When preventing common security violations (dd, env in controllers)
- When maintaining code quality standards in CI
- When onboarding new developers to project conventions

## When NOT To Use
- For testing business logic or application behavior (use feature tests)
- When the presets are too restrictive for the project's needs (customize or extend)
- As a replacement for code review — architecture tests catch automated rules, not design judgment
- When the team hasn't agreed on the architectural conventions being enforced

## Prerequisites
- Pest installed with `pestphp/pest-plugin-arch`
- Understanding of Laravel conventions and directory structure
- Knowledge of `expect()` assertions for architecture tests

## Inputs
- Presets to apply (Laravel, PHP, Security, Strict)
- Project-specific architectural rules (naming, directory structure)
- Exceptions to presets (classes that should deviate from conventions)

## Workflow
1. Run `php artisan make:arch-test` or create a test file in `tests/Arch/`
2. Apply the Laravel preset: `test('laravel conventions')->arch()->preset()->laravel()`
3. Apply the security preset: `test('security')->arch()->preset()->security()`
4. Apply the strict preset: `test('strict')->arch()->preset()->strict()`
5. Add project-specific rules: `expect('app/Services')->toExtend('BaseService')->classes()`
6. Add exceptions for valid deviations: `expect('app/Helpers')->not->toUse('dd')->ignoring('app/Helpers/DebugHelper.php')`
7. Run architecture tests as part of CI: `php artisan test --testsuite=Arch`
8. Review and update rules as the codebase evolves

## Validation Checklist
- [ ] Laravel preset is applied to enforce framework conventions
- [ ] Security preset catches `dd()`, `env()`, and `var_dump()` in application code
- [ ] Custom rules enforce project-specific naming and structure
- [ ] Exceptions are documented for valid deviations
- [ ] Architecture tests run in CI and block non-compliant PRs
- [ ] Rules are reviewed quarterly for relevance

## Common Failures
- Applying presets without understanding what they enforce — unexpected test failures
- Too many exceptions — rules become meaningless
- Not updating rules when project structure changes — false failures
- Architecture tests being too slow — optimize by limiting scope
- Team not aware of enforced rules — surprise failures in CI

## Decision Points
- Laravel preset vs custom rules — Laravel for standard conventions, custom for project-specific
- Broad preset vs targeted rules — presets for wide coverage, targeted for precise enforcement
- CI blocking vs advisory — blocking for critical rules, advisory for style preferences

## Performance Considerations
- Architecture tests run quickly (<1 second for most presets)
- Scoping to specific directories reduces analysis time
- Complex custom rules may add analysis overhead
- Run architecture tests before feature tests for fast failure

## Security Considerations
- Security preset enforces critical rules: no `dd()`, `var_dump()` in app code
- Custom security rules can enforce: no raw SQL, no mass assignment without `$guarded`
- Ensure architecture tests run before deployment
- Review security rules when adding new dependency types

## Related Rules
- [Rule: Apply Security Preset to Prevent Common Violations](./05-rules.md)
- [Rule: Document Exceptions Explicitly](./05-rules.md)
- [Rule: Run Arch Tests Before Feature Tests in CI](./05-rules.md)

## Related Skills
- Pest Architecture Fundamentals
- Pest Basics and Configuration
- CI/CD Pipeline Integration

## Success Criteria
- [ ] Laravel preset is active and all conventions pass
- [ ] Security preset catches `dd()`, `env()` in non-config code
- [ ] Project-specific rules enforce naming and structure standards
- [ ] Architecture tests run in CI and fail the pipeline on violations
- [ ] Exceptions are minimal and documented
