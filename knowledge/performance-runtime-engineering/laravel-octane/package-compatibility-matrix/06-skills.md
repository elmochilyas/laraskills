# Skill: Audit and Maintain Octane Package Compatibility Matrix

## Purpose
Systematically evaluate third-party package compatibility with Laravel Octane, identify incompatible patterns (static properties, global state, superglobal access), implement compatibility wrappers using scoped bindings, and maintain a living compatibility matrix as part of the CI/CD pipeline.

## When To Use
- Before migrating an existing application from PHP-FPM to Octane
- After adding new packages via `composer require` to an Octane-deployed application
- After updating packages via `composer update` in an Octane-deployed application
- When debugging cross-request data leaks that may originate from vendor packages
- When setting up Octane compatibility testing as a standard part of the development workflow

## When NOT To Use
- For greenfield applications choosing Octane-compatible packages from the start
- For applications using only Laravel first-party packages (Horizon, Telescope, etc.)
- Without running actual Octane tests (theoretical compatibility is not sufficient)

## Prerequisites
- Laravel application with `laravel/octane` installed
- Complete list of all third-party Composer packages (from `composer.json`)
- Access to vendor package source code for static property inspection
- Staging environment running Octane for compatibility testing
- CI/CD pipeline that can run `php artisan octane:test`

## Inputs
- `composer.json` with all required packages and versions
- Output of `grep -rn "public static \" vendor/ --include="*.php"` for each package
- List of service providers registered by each package
- Current Octane test results: `php artisan octane:test` output
- Known compatibility information from package documentation and GitHub issues

## Workflow

### 1. Enumerate All Third-Party Packages
- List all packages from `composer.json` `require` and `require-dev` sections
- Exclude Laravel framework packages (illuminate/*, laravel/*)
- Categorize each package: first-party Laravel ecosystem, well-known community (Spatie, etc.), niche/small community
- Check each package's GitHub issues for "octane" label to find known compatibility information

### 2. Audit Each Package for Octane-Incompatible Patterns
- For each package, search for problematic patterns:
  - `grep -rn "public static \" vendor/package --include="*.php"` — mutable static properties
  - `grep -rn "protected static \" vendor/package --include="*.php"` — protected static state
  - `grep -rn '\$_SESSION\|\$_GET\|\$_POST\|\$_REQUEST\|\$_SERVER\|\$_ENV' vendor/package --include="*.php"` — superglobal access
  - `grep -rn 'singleton(' vendor/package --include="*ServiceProvider.php"` — singleton bindings for request-scoped data
  - `grep -rn 'function boot' vendor/package --include="*ServiceProvider.php"` — boot-time side effects
- Classify each finding: safe (read-only config), unsafe (request-scoped mutable state), or unknown
- Document findings per package

### 3. Create Compatibility Matrix
- Build a table with columns: Package, Version, Status, Pattern Found, Mitigation, Tested Date
- Status values: `Compatible`, `Compatible with Config`, `Incompatible`, `Unknown`, `Untested`
- Example:
  | Package | Version | Status | Pattern | Mitigation | Tested |
  |---------|---------|--------|---------|------------|--------|
  | spatie/laravel-permission | 6.0+ | Compatible with Config | Static $permission model cache | Use scoped() binding | 2026-06-02 |
  | barryvdh/laravel-debugbar | 3.x | Incompatible | Static $data, $_SESSION | Remove in production | 2026-06-02 |
- Store the matrix in the repository (e.g., `docs/octane-compatibility.md`)

### 4. Test Each Package Under Octane in Isolation
- In staging, start Octane with the application
- Disable all packages except the one being tested
- Run `php artisan octane:test` — verify it passes
- Send concurrent requests to endpoints that use the package's functionality
- Run ordered-request tests (A, B, A) to detect cross-request contamination from the package
- Enable next package and repeat
- If a package fails, isolate whether the failure is from the package itself or an interaction with another package

### 5. Implement Compatibility Wrappers for Problematic Packages
- For packages with static properties that cause leaks, create a scoped wrapper:
```php
// In a service provider
$this->app->scoped(IncompatiblePackageService::class, function () {
    return new IncompatiblePackageService(); // Fresh instance per request
});
```
- For packages with superglobal access, create a compatibility shim that replaces superglobal reads with Laravel's request facade
- For packages with global state, implement `resetState()` method and register it with Octane's lifecycle hooks
- Never modify vendor code directly — changes are lost on `composer update`
- Document each wrapper with the package name, pattern, and wrapper approach

### 6. Add octane:test to CI/CD Pipeline
- Add `php artisan octane:test` to CI pipeline after every commit
- Add `composer update && php artisan octane:test` as a manual pre-deploy step
- Configure CI to fail the build on any octane:test warning or error
- Add automated static property scanning for vendor packages in CI

### 7. Maintain the Compatibility Matrix
- Update the matrix with every `composer update` or `composer require`
- When a new version of a package is released, re-test and update the status
- When a wrapper is implemented, document it in the matrix
- Review the matrix quarterly for stale entries
- Assign a team member as the compatibility matrix owner

### 8. Create Package Replacement Policy
- For incompatible packages without a compatibility wrapper option:
  - Search for alternative packages that are Octane-compatible
  - Evaluate migration effort for the replacement
  - Create a migration plan and timeline
- For packages with active maintainers, submit issues/PRs adding Octane compatibility
- For abandoned packages, prioritize replacement

## Validation Checklist
- [ ] All third-party packages enumerated from composer.json
- [ ] Static property audit completed for each vendor package
- [ ] Compatibility matrix created with all packages classified
- [ ] Each package tested under Octane in isolation
- [ ] Compatibility wrappers implemented for incompatible packages
- [ ] `php artisan octane:test` passing in CI pipeline
- [ ] CI fails the build on Octane incompatibility warnings
- [ ] Compatibility matrix stored in repository and version-controlled
- [ ] Package replacement plan created for truly incompatible packages
- [ ] Matrix owner assigned and review cadence established

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Package declared compatible but leaks | Intermittent cross-request data contamination | Static property not detected in initial audit | Re-test with ordered-request tests, update matrix |
| Wrapper breaks on package update | Wrapper no longer works after composer update | Package internals changed | Test after every composer update, update wrapper |
| octane:test passes but production leaks | No warnings from octane:test | Leak only manifests under specific traffic patterns | Add ordered-request tests to complement octane:test |
| Multiple packages incompatible | Migration blocked by package dependencies | Core infrastructure packages (auth, billing) incompatible | Evaluate replacement or defer Octane migration |
| Developer unaware of incompatible package | New package added without compatibility check | No CI gate for composer changes | Add pre-commit hook or CI step to check new packages |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Wrap vs replace incompatible package | Wrap if the package is actively maintained and the wrapper is simple (<1 day). Replace if the package is abandoned or the wrapper is too invasive |
| Rely on octane:test vs manual audit | Use octane:test as the primary gate. Manual audit adds depth but doesn't replace automated testing |
| Include dev-only packages in matrix | Include if they have production impact (debugbar). Exclude if they're never loaded in production |
| Fix package vs wait for upstream | Fix via PR if the team has capacity and the fix is small. Wait if the package maintainer has committed to a fix |

## Performance Considerations
- scoped() wrappers add ~0.01ms per request per wrapped service — negligible
- Compatibility wrappers may prevent optimization opportunities (package's internal caching)
- Static property audit in CI adds ~10-30s to pipeline — worth the safety
- Running octane:test in CI adds ~5-15s — mandatory for Octane applications
- Each incompatible package adds maintenance burden — prefer Octane-compatible alternatives

## Security Considerations
- Incompatible packages are a primary vector for cross-request data leakage (User A sees User B's data)
- Static property caches in packages may retain sensitive data (PII, tokens, credentials) across requests
- Superglobal-dependent packages (debugbar) may leak request data from one request to another
- Compatible-with-config packages must be tested after every configuration change
- Authentication and authorization packages must be verified Octane-compatible before production deployment

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Run octane:test before every deployment and after every composer update | `05-rules.md:1` | Step 6: CI/CD testing |
| Audit every third-party package's static properties before Octane deployment | `05-rules.md:27` | Step 2: vendor static property audit |
| Use Octane's scoped() binding to wrap incompatible packages | `05-rules.md:54` | Step 5: compatibility wrappers |
| Maintain a written compatibility matrix for all packages | `05-rules.md:80` | Steps 3, 7: matrix creation and maintenance |

## Related Skills

| Skill | Relation |
|-------|----------|
| Perform FPM-to-Octane Migration | Package audit is a critical phase of the full migration |
| Manage and Prevent Octane State Leaks | Package static properties are a common source of state leaks |
| Optimize Service Providers for Octane Persistent Execution | Package integration may require provider configuration changes |
| Install and Configure Octane for a Laravel Project | Octane must be running for compatibility testing |

## Success Criteria
- Complete compatibility matrix documented and stored in repository
- All third-party packages classified with status and mitigation approach
- Incompatible packages wrapped with scoped() bindings or replaced
- `php artisan octane:test` passes with zero warnings in CI
- CI pipeline fails on any new Octane incompatibility
- No cross-request data leaks originating from vendor packages
- Matrix reviewed and updated after every composer change
- Team can quickly determine compatibility of any package from the matrix
