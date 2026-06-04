# Skill: Migrate PHPUnit Test Files to Pest Syntax

## Purpose
Gradually migrate individual PHPUnit test files to Pest syntax while maintaining a working mixed-mode test suite throughout the transition.

## When To Use
- Converting existing PHPUnit test files to Pest syntax
- Setting up a mixed PHPUnit/Pest project structure
- Using PHPUnit-specific features (like `@depends`) from Pest test files

## When NOT To Use
- New projects starting fresh (just use Pest syntax)
- Stable, working PHPUnit tests that are not actively maintained (leave as-is)
- When the team has no bandwidth for migration work

## Prerequisites
- Pest installed in the project
- `phpunit.xml` configured with both `*Test.php` and `*.test.php` discovery
- `pest.php` configured with proper trait scoping
- `pest-plugin-migrate` installed (`composer require pestphp/pest-plugin-migrate --dev`)

## Inputs
- PHPUnit test file paths to migrate
- Knowledge of which files use PHPUnit-only features (annotations, custom extensions)

## Workflow
1. Identify the target file and run `php artisan pest:convert tests/Path/To/Test.php` for automated conversion
2. Review the converted file manually — check for edge cases: complex data providers, custom `setUp()` patterns, `@depends` annotations
3. For files using `@depends` or annotations that inject method arguments, use `test()` syntax (not `it()`)
4. Replace `use RefreshDatabase` with `uses(RefreshDatabase::class)` — scope to file or directory
5. Replace `$this->assert*()` calls — keep as-is (PHPUnit assertions work in Pest) or convert to `expect()->*()` style
6. Keep `phpunit.xml` as the single source of truth — do not duplicate env vars in `pest.php`
7. Run the full test suite to verify the converted file passes and no other tests regressed
8. Commit the single converted file — never batch more than 5-10 files per PR

## Validation Checklist
- [ ] Migrated file uses consistent Pest syntax (no mixing with PHPUnit class methods)
- [ ] `test()` used for `$this` access, `it()` for pure assertions
- [ ] `@depends` annotations use `test()` closures, not `it()`
- [ ] `phpunit.xml` remains the single source of truth for env config
- [ ] Both `*Test.php` and `*.test.php` files still run in CI
- [ ] Transpilation cache cleared after migration (`php artisan pest:clear`)
- [ ] No regression in unmigrated files

## Common Failures
- Migrating all files at once (big-bang) — one regression blocks the entire migration
- Using `it()` with `@depends` — `$this` not available for argument injection
- Accidentally mixing Pest and PHPUnit syntax in the same file
- Duplicating config from `phpunit.xml` into `pest.php`
- Forgetting to clear transpilation cache after migration

## Decision Points
- Leave stable, unmaintained PHPUnit files as-is; migrate only actively maintained files
- For complex custom `@dataProvider` methods, consider keeping the PHPUnit file if the migration cost is high
- Use `pest-plugin-migrate` for ~95% accuracy but manually review every file

## Performance Considerations
- Transpilation cache must be cleared after framework upgrades (`php artisan pest:clear`)
- Cold transpilation cache adds ~20-50ms per file on first CI run after migration
- No runtime overhead difference between transpiled Pest and native PHPUnit

## Security Considerations
- Migration tools run with test process permissions; vet before use
- Custom PHPUnit extensions may behave differently in transpiled context — test compatibility

## Related Rules (from 05-rules.md)
- Rule 1: Keep `phpunit.xml` as the single source of truth for test suite configuration
- Rule 2: Migrate test files one at a time, never in a big-bang migration
- Rule 3: Use `test()` (not `it()`) when PHPUnit annotations like `@depends` are needed
- Rule 4: Never mix Pest syntax and PHPUnit class syntax in the same file
- Rule 5: Run both framework syntaxes in CI during active migration
- Rule 6: Use `pest-plugin-migrate` for automated conversion but review every file
- Rule 7: Never rewrite working PHPUnit tests without a clear benefit
- Rule 8: Clear transpilation cache after framework version upgrades

## Success Criteria
- Migrated files pass all assertions identically to original PHPUnit versions
- Mixed-mode suite runs correctly in CI (both syntaxes discovered and executed)
- Migration is incremental with no long-lived broken branch
- Team understands when to use each syntax during transition
