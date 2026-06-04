# Skill: Implement Config Caching in Deployment Pipeline

## Purpose
Integrate `php artisan config:cache` into the deployment pipeline to eliminate per-request config file parsing and freeze environment values for production.

## When To Use
- Setting up production deployment scripts
- Optimizing application response time
- Preventing `env()` calls in application code from causing production bugs

## When NOT To Use
- In development environments (caching prevents config changes from taking effect)
- When application has feature flags in config files that change frequently (use database-backed flags instead)

## Prerequisites
- Production server or CI/CD pipeline access
- All `env()` calls must be inside `config/*.php` files only
- Config file syntax must be valid PHP

## Inputs
- Deployment script template
- Current `config/` directory contents
- List of required environment variables

## Workflow
1. Audit all code for `env()` calls outside `config/` files — search `app/`, `routes/`, `resources/`, `database/` for `env(`
2. Replace all non-config `env()` calls with `config('filename.key')` equivalents
3. Validate all `env()` calls inside config files include a default value: `env('KEY', default)`
4. Add validation at the end of config files for required production values:

```php
$key = env('STRIPE_KEY');
if (empty($key) && app()->environment('production')) {
    throw new RuntimeException('STRIPE_KEY is not configured.');
}
return ['key' => $key];
```

5. Add to deployment script:
   - `php artisan config:clear` (remove stale cache)
   - `php artisan config:cache` (generate new cache)
6. Verify: deploy script exits with non-zero if `config:cache` fails
7. Verify production: check `bootstrap/cache/config.php` exists and contains expected values

## Validation Checklist
- [ ] No `env()` calls exist outside `config/` directory
- [ ] Every `env()` call in config files has a default value
- [ ] Required production values are validated and throw on missing
- [ ] `config:cache` runs as part of every deployment
- [ ] `config:clear` runs before `config:cache` in deployment scripts
- [ ] Deployment fails if `config:cache` encounters an error
- [ ] Cached config file permissions restrict access to web server user only
- [ ] Secrets are referenced via `env()` — no hardcoded secrets in config files

## Common Failures
- `config:cache` passes but production behavior differs — caused by `env()` calls in application code returning `null` after caching
- `config:cache` fails with "Your configuration files are not serializable" — caused by closures or unserializable values in config arrays
- Validation in config files uses `env()` instead of checking after assignment — the `env()` call resolves at cache time, not request time

## Decision Points
- Validate in config file vs service provider? Validate in config file for deploy-time detection, service provider for runtime flexibility
- Default value vs validation throw? Provide defaults for optional values; throw for required values in production

## Related Rules
- Use env() Only in Config Files (05-rules.md)
- Always Provide Default Values for env() Calls (05-rules.md)
- Validate Required Config Values in Production (05-rules.md)
- Never Use Configuration for Runtime Feature Flags (05-rules.md)
- Never Hardcode Secrets in Config Files (05-rules.md)
- Always Clear and Rebuild Config Cache on Deployment (05-rules.md)

## Related Skills
- Skill: Audit and Fix env() Misuse
- Skill: Optimize Bootstrap Performance
- Skill: Configure Deployment Pipeline

## Success Criteria
- `config:cache` runs successfully in every deployment
- No `env()` calls exist outside `config/` files
- Config validation catches missing required values at deploy time
- Production config cache is properly secured

---

# Skill: Audit and Fix env() Misuse

## Purpose
Identify and correct all `env()` helper calls outside of `config/` files throughout the codebase to prevent production caching bugs.

## When To Use
- Code review before a production deployment
- Debugging production-only bugs after config caching
- Onboarding onto an existing Laravel project
- Setting up static analysis rules for `env()` enforcement

## When NOT To Use
- In config files (where `env()` is required)
- When the codebase already passes a static analysis rule banning `env()` outside config

## Prerequisites
- Access to the full codebase
- grep/rg or IDE search capabilities
- Understanding that `env()` returns `null` after `php artisan config:cache`

## Inputs
- Codebase directory
- List of files to search (exclude `vendor/` by default)

## Workflow
1. Search the codebase for `env(` calls, excluding the `config/` directory:
   ```
   grep -rn "env(" --include="*.php" app/ resources/ routes/ database/
   ```
2. For each match, determine the correct `config()` equivalent:
   - Find the config file that defines the referenced variable (e.g., `config('app.debug')` for `APP_DEBUG`)
   - If no config file defines the variable, either add it to the appropriate config file or create a new one
3. Replace `env('VARIABLE', default)` with `config('file.key', default)` in all non-config files
4. Ensure the config file defines the mapping: `'key' => env('VARIABLE', default)`
5. Run `php artisan config:cache` to verify the fix works
6. Run the test suite to verify no behavior changes
7. (Optional) Add a static analysis rule (PHPStan/Psalm) to flag `env()` calls outside config files

## Validation Checklist
- [ ] All `env()` calls outside `config/` are identified and listed
- [ ] Each identified call is replaced with the correct `config()` equivalent
- [ ] Corresponding config file entries exist for all replaced variables
- [ ] `php artisan config:cache` succeeds without errors
- [ ] Test suite passes
- [ ] PHPStan/Psalm rule (or custom sniff) is configured to prevent future `env()` misuse
- [ ] CI pipeline catches any new `env()` calls in non-config files

## Common Failures
- Replacing `env('KEY')` with `config('key')` without verifying the config file key exists
- Using the wrong config file key name (e.g., `config('app.debug')` vs `config('app.DEBUG')`)
- Overlooking `env()` calls in Blade templates or JavaScript mixed with PHP
- Missing `env()` calls in cached or compiled files

## Related Rules
- Use env() Only in Config Files (05-rules.md)
- Always Provide Default Values for env() Calls (05-rules.md)
- Never Use Configuration for Runtime Feature Flags (05-rules.md)
- Avoid Runtime Config Mutability (05-rules.md)

## Related Skills
- Skill: Implement Config Caching in Deployment Pipeline
- Skill: Manage Environment Variables

## Success Criteria
- Zero `env()` calls exist outside `config/` directory
- `config()` correctly replaces all non-config `env()` usage
- Config files define all environment variables with appropriate defaults
- Static analysis enforcement prevents regression
