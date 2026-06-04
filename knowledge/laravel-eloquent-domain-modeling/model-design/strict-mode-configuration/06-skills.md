# Skill: Enable Eloquent Strict Mode Across Environments

## Purpose

Configure `Model::shouldBeStrict()` to enable lazy loading prevention, silent discarding prevention, and missing attribute access prevention, catching data-integrity issues early in non-production environments.

## When To Use

- Setting up a new Laravel application
- Enabling strict mode in development and testing environments
- Configuring production with individual controls for each protection
- Onboarding new developers to prevent common Eloquent mistakes

## When NOT To Use

- Legacy application where silent discarding is expected behavior (migrate gradually)
- Application has code that intentionally accesses non-existent attributes (EAV patterns)

## Prerequisites

- Access to `AppServiceProvider` or ability to create a dedicated service provider
- Laravel 8.x or higher (for `shouldBeStrict()`)

## Inputs

- Environment list for full strict mode (typically `local`, `testing`, `staging`)
- Environment list for production (granular controls)
- Admin panel route prefix (for lazy loading exception)

## Workflow

1. Create a dedicated service provider `App\Providers\ModelStrictServiceProvider`:
   ```
   php artisan make:provider ModelStrictServiceProvider
   ```
2. Register it in `config/app.php` providers array
3. In the provider's `boot()` method, enable strict mode for non-production:
   ```
   public function boot(): void
   {
       if (! app()->isProduction()) {
           Model::shouldBeStrict()
       }
   }
   ```
4. For production, use individual controls:
   ```
   if (app()->isProduction()) {
       Model::preventSilentlyDiscardingAttributes()
       Model::preventLazyLoading(
           throw: fn () => request()->is('admin/*') ? false : true
       )
       // preventAccessingMissingAttributes: evaluate overhead vs benefit
   }
   ```
5. For the testing environment, ensure `Model::shouldBeStrict()` is enabled in the test suite

## Validation Checklist

- [ ] `Model::shouldBeStrict()` enabled in `local`, `testing`, and `staging`
- [ ] `preventSilentlyDiscardingAttributes()` enabled in every environment
- [ ] Production lazy loading configured with custom handler (log instead of throw for admin)
- [ ] Test environment has strict mode enabled and CI pipeline enforces it
- [ ] Admin panel lazy loading is handled gracefully (logged, not thrown)
- [ ] Strict mode is in a dedicated service provider (not `AppServiceProvider`)

## Common Failures

- **All-or-nothing in production**: Using `shouldBeStrict()` in production when only some protections are needed. Use individual controls.
- **Admin panel crashes**: `preventLazyLoading()` throws exceptions on admin pages that rely on lazy loading. Use a custom throw callback to log instead.
- **Missing attribute prevention breaks dynamic attributes**: Models with JSON columns or EAV patterns break. Disable `preventAccessingMissingAttributes` for those models.
- **Strict mode disabled in CI**: Tests pass locally with strict mode but CI runs without it, letting violations through. Enable in `phpunit.xml` environment.

## Decision Points

- **shouldBeStrict vs individual**: Use `shouldBeStrict()` for non-production simplicity. Use individual controls in production for granularity.
- **Throw vs log for lazy loading**: Throw in development/testing to catch issues. Log in production for admin panels to avoid broken UIs.

## Performance Considerations

- `preventAccessingMissingAttributes` adds a minor check on every attribute access — acceptable in most applications
- `preventLazyLoading` adds no runtime overhead — it only throws when a violation occurs
- `preventSilentlyDiscardingAttributes` adds a check on mass assignment — negligible cost

## Security Considerations

- `preventSilentlyDiscardingAttributes` prevents silent data loss — critical for data integrity
- Missing attribute prevention catches access to undefined columns — prevents null-propagated bugs

## Related Rules

- Enable `Model::shouldBeStrict()` in Non-Production Environments
- Use Individual Controls for Fine-Grained Production Configuration
- Enable Strict Mode in Test Environment
- Never Deploy Without `preventSilentlyDiscardingAttributes`
- Create a Dedicated Service Provider for Strict Mode

## Related Skills

- Base Model Class Configuration
- Event Control / Quiet Operations for Bulk Suppression
- Model Configuration Properties for Overrides

## Success Criteria

- Non-production environments throw exceptions on lazy loading, silent discarding, and missing attribute access
- Production has `preventSilentlyDiscardingAttributes` enabled at minimum
- Admin panels function correctly with lazy loading violations logged, not thrown
- CI pipeline fails on strict mode violations
- All developers are aware of strict mode behavior during local development
