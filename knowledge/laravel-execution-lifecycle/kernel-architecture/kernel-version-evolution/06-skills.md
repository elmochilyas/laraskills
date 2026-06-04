# Skill: Migrate Kernel Configuration from Laravel 10 to ApplicationBuilder Pattern

## Purpose
Transition middleware, command, and schedule configuration from Laravel 10 userland kernel classes (`App\Http\Kernel`, `App\Console\Kernel`) to Laravel 11+ ApplicationBuilder pattern in `bootstrap/app.php` with staged, verifiable steps.

## When To Use
- Upgrading a Laravel 10 application to Laravel 11 or later
- Modernizing Laravel 10.43+ application configuration before a version upgrade
- Consolidating configuration into `bootstrap/app.php` as a single source of truth

## When NOT To Use
- New Laravel 11+ projects — start with ApplicationBuilder from scratch
- Projects staying on Laravel 10 indefinitely — migration is optional (though recommended)
- Framework kernel files — only userland configuration files are migrated

## Prerequisites
- Laravel 10.43+ (for backported `withMiddleware()` support) or Laravel 11+
- Existing `app/Http/Kernel.php` and/or `app/Console/Kernel.php` files
- Understanding of middleware, command, and schedule configuration
- `php artisan route:list -v` available for verification

## Inputs
- The full contents of `app/Http/Kernel.php` (middleware arrays)
- The full contents of `app/Console/Kernel.php` (`$commands`, `commands()`, `schedule()`)
- The Laravel version being migrated to

## Workflow
1. **Create the baseline**: Before any changes, run `php artisan route:list -v > pre-migration-middleware.txt` and save it as a reference
2. **Migrate HTTP Kernel middleware** (one property at a time in separate commits):
   - Step A: Move `$middleware` → `->withMiddleware(function (Middleware $m) { $m->append([...]) })` — add `->withMiddleware()` to `bootstrap/app.php`
   - Step B: Move `$middlewareGroups` → `$m->web(append: [...])`, `$m->api(append: [...])` etc.
   - Step C: Move `$routeMiddleware` → `$m->alias('name', Class::class)`
   - After each step, run `php artisan route:list -v` and diff against the pre-migration baseline
3. **Migrate Console Kernel commands**:
   - Move `$commands` array → `->withCommands([...])` in `bootstrap/app.php`
   - Move `commands()` method `$this->load(...)` → import commands explicitly in the array
4. **Migrate Console Kernel schedule**:
   - Move the entire `schedule()` method body → `->withSchedule(function (Schedule $schedule) { ... })` in `bootstrap/app.php`
5. **Keep old kernel files** (BC layer) — do not delete them yet
6. **Run full verification**: `php artisan route:list -v` output must match the pre-migration baseline (with the same middleware per route)
7. **Test all commands**: `php artisan list` shows all registered commands; `php artisan <command>` executes correctly
8. **Delete legacy files**: Remove `app/Http/Kernel.php` and `app/Console/Kernel.php` only after full verification in staging

## Validation Checklist
- [ ] `php artisan route:list -v` output matches pre-migration baseline for every route
- [ ] All global middleware entries are present in `->withMiddleware()`
- [ ] All middleware groups have the same entries in the same order
- [ ] All route middleware aliases resolve to the same classes
- [ ] All custom Artisan commands appear in `php artisan list`
- [ ] All scheduled tasks execute at their configured frequencies
- [ ] Service provider `$kernel->pushMiddleware()` calls are migrated to `withMiddleware()`
- [ ] Type-hints referencing `App\Http\Kernel` are replaced with `Illuminate\Contracts\Http\Kernel`
- [ ] Legacy kernel files are deleted only after staging verification

## Common Failures
- Silent middleware loss: Running `withMiddleware()` with incomplete config while old kernel is absent causes middleware to silently disappear. Fix: keep old kernel file until verification is complete
- Duplicate middleware: Both old kernel file AND `withMiddleware()` define the same middleware — it runs twice. Fix: verify with `route:list -v` and remove from one source
- Missing `use` statements in `bootstrap/app.php`: Forgetting `use Illuminate\Foundation\Configuration\Middleware;` causes "class not found" errors. Fix: add the import
- Routing not migrated: `->withRouting()` is separate from `->withMiddleware()` — if routing configuration is needed, migrate alongside

## Decision Points
- **Migrate before upgrade vs during upgrade**: Migrate in Laravel 10.43+ before upgrading to 11. This separates configuration errors from upgrade errors, making debugging easier
- **Keep old kernel vs delete**: Keep old kernel until ApplicationBuilder config is verified in staging with production-like traffic. Deletion is the final step
- **One commit per property vs bulk**: One commit per property (`$middleware`, then `$middlewareGroups`, then `$routeMiddleware`, then commands, then schedule). This makes each change independently verifiable and revertible

## Performance Considerations
- Zero runtime performance impact — ApplicationBuilder produces identical internal middleware arrays
- BC detection (`class_exists('App\Http\Kernel')`) is a microsecond-level autoloader check
- ApplicationBuilder intermediate objects are short-lived and freed after bootstrap
- Route caching continues to work identically — no performance difference

## Security Considerations
- If `withMiddleware()` is incomplete, middleware silently doesn't run — no error or warning. Full test coverage is essential
- Both old kernel AND `withMiddleware()` configured causes additive merge — potential duplicate middleware and unexpected ordering
- Security middleware (auth, CSRF) must be verified in the migrated configuration — a missing entry is a security gap

## Related Rules
- Migrate kernel configuration in Laravel 10.43+ before upgrading to Laravel 11 (Reliability)
- Keep the old kernel file until migration is fully verified in staging (Reliability)
- Audit all `$kernel->pushMiddleware()` calls in service providers before upgrading (Security)
- Use `Contracts\Http\Kernel` type-hints to ensure version compatibility (Maintainability)

## Related Skills
- Write Version-Compatible Package Code Supporting Both Laravel 10 and 11+
- Audit and Remediate Kernel-Breaking Service Provider Code Before Upgrade

## Success Criteria
- All middleware, command, and schedule configurations are migrated to `bootstrap/app.php`
- `php artisan route:list -v` output is identical before and after migration (pure migration, no changes)
- All Artisan commands are available and functional
- Legacy kernel files are deleted after verified staging deployment
- The migration was completed in separately testable steps, not in one bulk change

---

# Skill: Write Version-Compatible Package Code Supporting Both Laravel 10 and 11+

## Purpose
Write package code that detects whether the application uses legacy kernel classes or the ApplicationBuilder pattern and branches behavior accordingly to support both Laravel 10 and 11+.

## When To Use
- Maintaining a package that must support Laravel 10 and 11+ in the same release
- Writing middleware-registering packages that work across versions
- Developing plugins that must integrate with both kernel configuration approaches

## When NOT To Use
- Packages targeting Laravel 11+ exclusively — use ApplicationBuilder patterns always
- Application-specific code (not a reusable package) — adapt to the project's specific version
- Laravel 10-only packages — no need for version detection

## Prerequisites
- Understanding of both `App\Http\Kernel` (Laravel 10) and `->withMiddleware()` (Laravel 11+) patterns
- Familiarity with service provider `boot()`, `register()`, and `callAfterResolving()` hooks
- Knowledge of `class_exists()` for version detection

## Inputs
- The middleware or services the package needs to register
- The package's minimum Laravel version requirement
- The detection strategy (class_exists vs version comparison)

## Workflow
1. **Choose the detection strategy**: Use `class_exists('App\Http\Kernel')` rather than comparing `Application::VERSION` strings. The class existence check directly detects whether the legacy kernel pattern is in use, while version strings require maintenance as new versions release
2. **In the service provider's `boot()` method**, branch on the detection:
   ```php
   public function boot(): void
   {
       if (class_exists(\App\Http\Kernel::class)) {
           // Laravel 10 path: register via kernel push
           $this->registerWithLegacyKernel();
       } else {
           // Laravel 11+ path: register via Middleware configuration object
           $this->registerWithApplicationBuilder();
       }
   }
   ```
3. **Implement the Laravel 10 path** using `pushMiddleware()` on the resolved kernel:
   ```php
   private function registerWithLegacyKernel(): void
   {
       $kernel = $this->app->make(\App\Http\Kernel::class);
       $kernel->pushMiddleware(MyPackageMiddleware::class);
   }
   ```
4. **Implement the Laravel 11+ path** using `callAfterResolving()` on the `Middleware` configuration object:
   ```php
   private function registerWithApplicationBuilder(): void
   {
       $this->callAfterResolving(
           \Illuminate\Foundation\Configuration\Middleware::class,
           function (Middleware $middleware) {
               $middleware->append(MyPackageMiddleware::class);
           }
       );
   }
   ```
5. **Always type-hint contracts** in public APIs — use `Illuminate\Contracts\Http\Kernel` never `App\Http\Kernel`
6. **Test on both Laravel 10 (with userland kernel) and Laravel 11+ (without)** to confirm both paths work

## Validation Checklist
- [ ] `class_exists('App\Http\Kernel')` correctly detects Laravel 10 vs 11+ in testing
- [ ] Laravel 10 path: middleware is appended via `pushMiddleware()` on the kernel
- [ ] Laravel 11+ path: middleware is appended via `callAfterResolving()` on `Middleware` config
- [ ] No code references `App\Http\Kernel` or `App\Console\Kernel` in type-hints
- [ ] Public APIs use `Contracts\Http\Kernel` or `Contracts\Console\Kernel`
- [ ] Both paths produce equivalent middleware registration
- [ ] Package installs without "class not found" errors on both versions

## Common Failures
- `class_exists()` returning false incorrectly: The autoloader may not have `App\Http\Kernel` registered if the application hasn't booted fully yet. Fix: perform detection in `boot()`, not `register()`
- `callAfterResolving()` not firing: If the `Middleware` object was already resolved before the package's `callAfterResolving()` is registered, the callback never runs. Fix: register early in the boot sequence or use alternative hooks
- Using version string comparison: `app()->version()` returns strings like "10.48.0" — comparing these with semver operators breaks on new minor releases. Fix: use `class_exists()` instead
- Hardcoding `App\Http\Kernel` in type-hints: Package's public methods type-hinting `App\Http\Kernel` throw "Class not found" on Laravel 11+. Fix: use the contract interface

## Decision Points
- **class_exists vs version comparison**: Prefer `class_exists()` — it directly detects the actual pattern in use. Version strings require maintenance and may be less reliable for patch versions with backported features
- **Both paths vs separate package versions**: Single package version with branching is easier for users (one install) but adds testing complexity. Separate versions per Laravel major version is cleaner but doubles maintenance
- **Middleware config vs Kernel push**: The `Middleware` configuration object is the future-proof path. Once your minimum version is Laravel 11+, remove the legacy branch entirely

## Performance Considerations
- `class_exists()` triggers autoloader but only on first call — negligible cost (microseconds)
- `callAfterResolving()` adds a container hook — zero per-request cost (one-time during bootstrap)
- The branch is resolved once at bootstrap — no per-request overhead
- Remove legacy code path once package minimum version is Laravel 11+ to reduce codebase size

## Security Considerations
- If the legacy kernel path fails silently (e.g., `pushMiddleware()` not available), middleware won't register. Fix: verify by checking return value or catching exceptions
- The Middleware configuration object in Laravel 11+ supports `remove()` — package code should not rely on framework default middleware being present
- Testing on both paths is essential — a bug in either path creates a security gap on that version

## Related Rules
- For packages supporting pre-11 and 11+, detect version via `class_exists()` (Maintainability)
- Use `Contracts\Http\Kernel` type-hints to ensure version compatibility (Maintainability)
- Audit all `$kernel->pushMiddleware()` calls in service providers before upgrading (Security)

## Related Skills
- Migrate Kernel Configuration from Laravel 10 to ApplicationBuilder Pattern
- Audit and Remediate Kernel-Breaking Service Provider Code Before Upgrade

## Success Criteria
- Package works without modification on both Laravel 10 (with userland kernel) and Laravel 11+ (without)
- Middleware/service registration is equivalent across both code paths
- No "class not found" errors related to `App\Http\Kernel` on any supported version
- Users of the package do not need to know which code path is running

---

# Skill: Audit and Remediate Kernel-Breaking Service Provider Code Before Upgrade

## Purpose
Identify and replace all service provider code that directly references kernel classes, calls `$kernel->pushMiddleware()`, or type-hints `App\Http\Kernel`, so the application is ready for Laravel 11+.

## When To Use
- Preparing a Laravel 10 application for upgrade to Laravel 11+
- Auditing a codebase for potential upgrade blockers before starting migration
- Reviewing third-party packages for kernel compatibility
- After upgrading, debugging "class not found" errors related to kernel classes

## When NOT To Use
- New Laravel 11+ projects — no legacy kernel code exists
- Applications with no service providers manipulating the kernel directly
- Framework kernel files — these are framework-owned and not part of the audit

## Prerequisites
- grep/ripgrep or IDE search for searching across the codebase
- Understanding of `$kernel->pushMiddleware()`, `$kernel->prependMiddleware()`, and type-hinting patterns
- Access to all service provider files and `bootstrap/app.php`

## Inputs
- All files in `app/Providers/` directory
- Any custom service providers in the application
- Third-party package service providers that may reference kernel classes
- Type-hints in constructor signatures and method parameters

## Workflow
1. **Search for all kernel references** across the codebase:
   ```
   grep -rn "App\\Http\\Kernel" app/ --include="*.php"
   grep -rn "App\\Console\\Kernel" app/ --include="*.php"
   grep -rn "pushMiddleware\|prependMiddleware" app/ --include="*.php"
   grep -rn "->make(Kernel" app/ --include="*.php"
   ```
2. **Categorize each finding**:
   - **Category A**: Type-hints using `App\Http\Kernel` or `App\Console\Kernel` in constructor/method signatures
   - **Category B**: Direct calls to `$kernel->pushMiddleware()` or `$kernel->prependMiddleware()` on the kernel instance
   - **Category C**: `$this->app->make(\App\Http\Kernel::class)` resolution calls
   - **Category D**: Service provider `register()` or `boot()` that depends on kernel state
3. **Remediate Category A**: Replace `App\Http\Kernel` type-hints with `Illuminate\Contracts\Http\Kernel`
4. **Remediate Category B**: Move `pushMiddleware()` logic into `bootstrap/app.php` using `->withMiddleware(function (Middleware $m) { $m->append(...); })`
5. **Remediate Category C**: Use contract-based resolution: `$this->app->make(\Illuminate\Contracts\Http\Kernel::class)`
6. **Remediate Category D**: If the provider depends on kernel state (e.g., checking which middleware is registered), refactor to use application configuration instead
7. **Verify no remaining references**: Re-run the search to confirm all kernel-breaking code is remediated
8. **Test the application**: Run the full test suite and verify middleware lists with `php artisan route:list -v`

## Validation Checklist
- [ ] No `App\Http\Kernel` type-hints remain in any PHP file
- [ ] No `App\Console\Kernel` type-hints remain in any PHP file
- [ ] No `$kernel->pushMiddleware()` or `$kernel->prependMiddleware()` calls remain
- [ ] All kernel resolutions use contract interfaces (`Illuminate\Contracts\Http\Kernel`, `Illuminate\Contracts\Console\Kernel`)
- [ ] `php artisan route:list -v` shows the same middleware list as before remediation
- [ ] Full test suite passes
- [ ] Third-party package code is reviewed and patched if necessary

## Common Failures
- Missing dynamic middleware: `pushMiddleware()` called conditionally (e.g., based on request data) cannot be simply moved to static `->withMiddleware()` — refactor to a middleware that checks the condition internally
- Overlooked third-party packages: Vendor code may reference `App\Http\Kernel` — patch in a service provider or override the package. Fix: use `class_exists()` detection in the patching provider
- False negatives from case-insensitive search: Search for case-insensitive patterns to catch `app\Http\Kernel` or other variants
- Service provider `register()` vs `boot()`: Moving kernel-dependent code from `register()` to `boot()` may change behavior (boot order). Fix: test the ordering impact

## Decision Points
- **In-place migration vs Middleware refactoring**: If `pushMiddleware()` adds a middleware conditionally, move the condition INTO the middleware itself and register it statically via `withMiddleware()`. This is cleaner than dynamic registration
- **Contract type-hint vs class_exists detection**: Use contract type-hints for all code. Use `class_exists()` only in package BC layers (see "Write Version-Compatible Package Code")
- **Vendor patch vs fork**: For third-party packages with kernel-breaking code, prefer contributing a fix upstream. If urgent, use a `class_exists()` patching provider in the application

## Performance Considerations
- Contract type-hints have zero runtime cost — resolved at compile/autoload time
- Removing `pushMiddleware()` calls from service providers eliminates bootstrap-time kernel manipulation overhead
- Replacing dynamic middleware registration with static `->withMiddleware()` allows route caching to work optimally

## Security Considerations
- Missing a `pushMiddleware()` call means that middleware silently stops running after upgrade — no error is thrown. The audit must be exhaustive
- Type-hint changes that are not caught by static analysis may cause runtime errors on Laravel 11+ — run tests on the target version
- If a `pushMiddleware()` call was adding security middleware (auth, CSRF filter), the migration to `withMiddleware()` is critical for security posture

## Related Rules
- Audit all `$kernel->pushMiddleware()` calls in service providers before upgrading (Security)
- Use `Contracts\Http\Kernel` type-hints to ensure version compatibility (Maintainability)
- Do not keep old kernel files indefinitely after migration is complete (Maintainability)

## Related Skills
- Migrate Kernel Configuration from Laravel 10 to ApplicationBuilder Pattern
- Write Version-Compatible Package Code Supporting Both Laravel 10 and 11+

## Success Criteria
- Zero references to `App\Http\Kernel` or `App\Console\Kernel` remain in application code
- All kernel manipulations are centralized in `bootstrap/app.php` via `->withMiddleware()`
- The application is ready for Laravel 11+ without "class not found" errors or silent middleware loss
- The test suite passes and `php artisan route:list -v` matches the pre-audit baseline
