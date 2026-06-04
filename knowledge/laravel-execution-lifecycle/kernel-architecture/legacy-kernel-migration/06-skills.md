# Skill: Migrate HTTP Kernel Middleware Configuration from Properties to withMiddleware()

## Purpose
Convert the three middleware property arrays in `app/Http/Kernel.php` (`$middleware`, `$middlewareGroups`, `$routeMiddleware`) to the ApplicationBuilder `->withMiddleware()` syntax in `bootstrap/app.php` with incremental, verifiable steps.

## When To Use
- Migrating a Laravel 10 middleware configuration to Laravel 11+ format
- Refactoring middleware configuration in Laravel 10.43+ before a version upgrade
- Consolidating middleware configuration into a single source of truth

## When NOT To Use
- New Laravel 11+ projects — start with `->withMiddleware()` from scratch
- Projects staying on Laravel 10 indefinitely — migration is optional
- Migrating command or schedule configuration (use separate skills for those)

## Prerequisites
- Existing `app/Http/Kernel.php` with populated `$middleware`, `$middlewareGroups`, and `$routeMiddleware` arrays
- `bootstrap/app.php` with `Application::configure()` set up (Laravel 10.43+ or 11+)
- `php artisan route:list -v` command available
- A pre-migration baseline of middleware output

## Inputs
- The `$middleware` (global) array from `app/Http/Kernel.php`
- The `$middlewareGroups` array (e.g., 'web', 'api')
- The `$routeMiddleware` aliases array
- The `$middlewarePriority` array (if defined)

## Workflow
1. **Create the baseline**: Run `php artisan route:list -v > before-migration.txt` and save this as a reference
2. **Ensure `bootstrap/app.php` has the ApplicationBuilder boilerplate**:
   ```php
   return Application::configure()
       ->withMiddleware(function (Middleware $middleware) {
           // Migration target
       })
       ->create();
   ```
3. **Add the` use` import** at the top of `bootstrap/app.php`:
   ```php
   use Illuminate\Foundation\Configuration\Middleware;
   ```
4. **Migrate `$middleware` (global stack)** in a single commit:
   - Map `protected $middleware = [A::class, B::class]` to:
     ```php
     $middleware->append([A::class, B::class]);
     ```
   - If the property has entries before the parent defaults, use `prepend()` instead
   - Run `php artisan route:list -v > step1.txt` and diff against baseline — must match
5. **Migrate `$middlewareGroups`** in a separate commit:
   - Map `'web' => [X::class, Y::class]` to:
     ```php
     $middleware->web(append: [X::class, Y::class]);
     ```
   - Repeat for 'api' and any custom groups
   - Run `php artisan route:list -v > step2.txt` and diff against baseline — must match
6. **Migrate `$routeMiddleware`** in a separate commit:
   - Map `'auth' => Authenticate::class` to:
     ```php
     $middleware->alias('auth', Authenticate::class);
     ```
   - Run `php artisan route:list -v > step3.txt` and diff against baseline — must match
7. **Do NOT delete `app/Http/Kernel.php` yet** — the BC layer keeps it as a safety net
8. **Run full application test suite** — all routes, controllers, and middleware must behave identically
9. **Delete `app/Http/Kernel.php` only after staging verification** matches baseline

## Validation Checklist
- [ ] Pre-migration baseline captured via `php artisan route:list -v > baseline.txt`
- [ ] Global middleware entries mapped to `$middleware->append()` or `$middleware->prepend()`
- [ ] Group middleware entries mapped to `$middleware->{groupName}(append: [...])` or `->{groupName}(prepend: [...])`
- [ ] Route middleware aliases mapped to `$middleware->alias(name, class)`
- [ ] After each migration step, `route:list -v` output matches baseline (identical middleware per route)
- [ ] All service provider `$kernel->pushMiddleware()` calls are also migrated
- [ ] Import statement `use Illuminate\Foundation\Configuration\Middleware;` is present in `bootstrap/app.php`
- [ ] `app/Http/Kernel.php` is removed only after staging verification

## Common Failures
- Duplicate middleware: Old kernel file defines middleware AND `withMiddleware()` adds the same middleware — it runs twice. Fix: remove from one source or verify with `route:list -v`
- Silent middleware loss: `withMiddleware()` entries don't cover all old kernel entries — middleware silently disappears. Fix: diff `route:list -v` before and after
- Wrong `prepend` vs `append`: Using `prepend()` when the old kernel had entries after defaults causes wrong order. Fix: examine the parent class defaults to determine correct position
- Missing group: Only migrating 'web' and forgetting custom middleware groups like 'api' or custom group names. Fix: capture all groups in the baseline

## Decision Points
- **prepend vs append**: Use `append` to add after framework defaults (matching `$middleware = [...]` when it inherits from parent). Use `prepend` to add before framework defaults
- **One property per commit vs bulk**: One property per commit (first global, then groups, then aliases). Each produces a verifiable diff in `route:list -v`
- **Keep old kernel vs delete**: Keep old kernel during migration for BC safety. Delete only after staging verification

## Performance Considerations
- Zero runtime performance impact — internal middleware arrays are identical after bootstrap
- ApplicationBuilder intermediate objects are short-lived (freed after construction)
- Route caching works identically with both approaches — no change needed

## Security Considerations
- Missing middleware after migration is silent — no warning, no error. Diff verification is the only reliable detection
- Security middleware (auth, CSRF, throttle) must be present in the migrated config — verify each security route's middleware list
- The BC merge (old kernel + withMiddleware) is additive — duplicate security middleware is safer than missing, but still wrong

## Related Rules
- Migrate configuration one property at a time with verification between each step (Reliability)
- Use the BC layer — keep old kernel files until ApplicationBuilder config is verified (Security)
- Replace all `$kernel->pushMiddleware()` calls in service providers before migration (Architecture)
- Verify middleware lists match exactly using `php artisan route:list -v` before and after (Testing)

## Related Skills
- Migrate Console Kernel Commands and Schedules to ApplicationBuilder
- Verify Migration Completeness Using route:list -v Diff Comparison

## Success Criteria
- All three middleware property arrays are migrated to `->withMiddleware()` syntax
- `php artisan route:list -v` output is identical before and after each migration step
- Application test suite passes with the migrated configuration
- Legacy `app/Http/Kernel.php` is deleted only after staging verification confirms equivalence
- No middleware is duplicated or missing in the migrated configuration

---

# Skill: Migrate Console Kernel Commands and Schedules to ApplicationBuilder

## Purpose
Convert command registration and schedule definitions from `app/Console/Kernel.php` to the ApplicationBuilder `->withCommands()` and `->withSchedule()` syntax in `bootstrap/app.php`.

## When To Use
- Completing the full kernel migration from Laravel 10 to 11+ after middleware migration
- Moving console configuration out of `app/Console/Kernel.php` into `bootstrap/app.php`
- Consolidating all kernel configuration into a single source of truth

## When NOT To Use
- Projects with no custom commands or schedules — nothing to migrate
- Laravel 11+ skeleton projects — `app/Console/Kernel.php` doesn't exist
- HTTP middleware migration — use the HTTP middleware migration skill instead

## Prerequisites
- Existing `app/Console/Kernel.php` with `$commands` array, `commands()` method, and/or `schedule()` method
- `bootstrap/app.php` already has `Application::configure()` setup (possibly after middleware migration)
- All registered commands exist and are testable
- Understanding of the application's scheduled task behavior

## Inputs
- The `$commands` property array from `app/Console/Kernel.php`
- The `commands()` method body (including `$this->load()` calls)
- The `schedule()` method body
- Laravel version (for syntax differences)

## Workflow
1. **Capture pre-migration state**: List all commands with `php artisan list` and verify scheduled tasks work
2. **Migrate command registration**:
   - Convert `protected $commands = [A::class, B::class]` to `->withCommands([A::class, B::class])` in `bootstrap/app.php`
   - Convert `$this->load(__DIR__.'/Commands')` to explicit imports in the `->withCommands()` array
   - For Laravel 11+ with no `$commands` equivalent, simply add `->withCommands([...])` with the explicit list
3. **Migrate schedule definitions**:
   - Move the entire body of the `schedule()` method into `->withSchedule(function (Schedule $schedule) { ... })`
   - The `$schedule` variable in the closure is the same `Illuminate\Console\Scheduling\Schedule` instance
   - Keep all scheduling calls (`->daily()`, `->withoutOverlapping()`, `->runInBackground()`) exactly as they were
4. **Verify command registration**:
   - Run `php artisan list` and confirm all custom commands appear
   - Run each custom command with `--help` and a test flag to confirm execution
5. **Verify schedule definitions**:
   - Run `php artisan schedule:list` (Laravel 11+) or `php artisan schedule:run` with a test frequency to verify
   - Confirm scheduled tasks are registered and parse correctly
6. **Keep `app/Console/Kernel.php`** during testing (BC layer fallback)
7. **Delete `app/Console/Kernel.php`** only after full verification

## Validation Checklist
- [ ] All custom commands appear in `php artisan list`
- [ ] Each command executes correctly (`php artisan <command>`)
- [ ] Command auto-discovery (`load()`) is replaced with explicit imports
- [ ] `->withCommands()` array matches the old `$commands` property coverage
- [ ] Schedule tasks are listed in `php artisan schedule:list`
- [ ] Schedule frequencies and constraints (withoutOverlapping, runInBackground, environments) match original
- [ ] Schedule closures or callbacks work identically
- [ ] `app/Console/Kernel.php` is removable without losing commands or schedules
- [ ] No "command not found" errors for previously registered commands

## Common Failures
- Commands not listed: `->withCommands()` array is empty or has incorrect class names. Fix: verify each class exists and is autoloadable
- Schedule not executing: The closure inside `->withSchedule()` has a syntax error or references variables from the old method scope. Fix: ensure all dependencies are resolved inside the closure
- Missing `Schedule` import: `use Illuminate\Console\Scheduling\Schedule;` must be added to `bootstrap/app.php`. Fix: add the import
- Auto-discovery lost: `$this->load(__DIR__.'/Commands')` scanned a directory for commands — must be replaced with explicit imports of each command class. Fix: inspect the commands directory and list all command classes
- Partial migration: Migrating middleware but leaving commands and schedules in old kernel file creates confusion. Fix: migrate all kernel configuration in the same upgrade cycle

## Decision Points
- **Explicit commands vs discovered**: Always use explicit `->withCommands([...])` in production. If many commands exist in development, consider a helper that globs the Commands directory and returns class names
- **Schedule closure vs command**: If old `schedule()` used `$schedule->call(fn)`, prefer migrating to `$schedule->command()` if the logic warrants a dedicated Artisan command. If not, the closure syntax works identically in `->withSchedule()`
- **Keep ConsoleKernel until fully migrated**: Same principle as HTTP — keep the legacy file until all configuration is verified and moved

## Performance Considerations
- Command registration via `->withCommands()` produces identical internal state — zero performance difference
- Schedule resolution is identical between `schedule()` method and `->withSchedule()` closure
- Explicit command registration (vs auto-discovery) avoids autoloader overhead for every command file — a small performance improvement

## Security Considerations
- Commands registered in `->withCommands()` have the same access level as before — ensure sensitive commands have environment guards or confirmation prompts
- Schedule tasks moved to `->withSchedule()` run with the same permissions — verify `->environments()` constraints are preserved
- If the old `schedule()` method had environment-specific logic, ensure the closure in `->withSchedule()` replicates it

## Related Rules
- Do not mark migration as complete until command and schedule registration is also migrated (Maintainability)
- Prefer explicit command registration over auto-discovery in production (Performance)
- Use the BC layer — keep old kernel files until ApplicationBuilder config is verified (Security)

## Related Skills
- Migrate HTTP Kernel Middleware Configuration from Properties to withMiddleware()
- Verify Migration Completeness Using route:list -v Diff Comparison

## Success Criteria
- All commands are registered and functional via `->withCommands()`
- All schedule definitions work correctly via `->withSchedule()`
- `php artisan list` and `php artisan schedule:list` match pre-migration output
- `app/Console/Kernel.php` is removed only after verification in staging
- Both HTTP and Console kernel configurations are fully consolidated in `bootstrap/app.php`

---

# Skill: Verify Migration Completeness Using route:list -v Diff Comparison

## Purpose
Produce a baseline middleware listing before migration and diff it against the post-migration output to confirm identical middleware per route, catching silent omissions or duplications.

## When To Use
- After migrating `$middleware` → `->withMiddleware()` to verify completeness
- After adding or removing middleware during migration to confirm intent
- Before deleting legacy kernel files to verify the new configuration is a superset
- As a CI step after deployment to verify middleware configuration hasn't changed unexpectedly

## When NOT To Use
- Verifying command or schedule migration (use `php artisan list` and `php artisan schedule:list` instead)
- Initial middleware development without a pre-existing baseline
- Verifying non-middleware configuration changes

## Prerequisites
- `php artisan route:list -v` command available
- A pre-migration baseline file (saved before any migration changes)
- A text diff tool (e.g., `diff` on Linux/Mac, `Compare-Object` on PowerShell)
- The migrated `->withMiddleware()` configuration in place

## Inputs
- Pre-migration output file: `php artisan route:list -v > baseline.txt`
- Post-migration output file: `php artisan route:list -v > migrated.txt`
- Any additional middleware changes made during migration (for intentional diff)

## Workflow
1. **Create the baseline** before making any migration changes:
   ```bash
   php artisan route:list -v > baseline.txt
   ```
2. **Make the migration change** (one property at a time as described in the migration skills)
3. **Generate the post-migration output**:
   ```bash
   php artisan route:list -v > migrated.txt
   ```
4. **Diff the two files**:
   - PowerShell: `Compare-Object (Get-Content baseline.txt) (Get-Content migrated.txt)`
   - Linux/Mac: `diff baseline.txt migrated.txt`
5. **Analyze differences**:
   - Identify any middleware rows that appear in baseline but not in migrated (missing middleware)
   - Identify any middleware rows that appear in migrated but not in baseline (duplicate or extra middleware)
   - Check ordering differences between the two outputs
6. **If differences exist and are not intentional**:
   - Go back to the migration step and add the missing middleware or fix ordering
   - Re-run `route:list -v` and diff again
   - Repeat until the diff is empty (for pure migration) or contains only intentional changes
7. **For intentional differences** (e.g., removing obsolete middleware during migration):
   - Document each intentional difference with the rationale
   - Save the approved diff as `migration-changes-notes.md`
   - Ensure the changes are reviewed and approved
8. **Only delete legacy kernel files** after the diff is verified (empty or fully documented)

## Validation Checklist
- [ ] Pre-migration baseline captured before any changes
- [ ] Post-migration output generated after migration step
- [ ] Diff shows zero differences for pure middleware migration
- [ ] Any intentional differences are documented with rationale
- [ ] Security middleware (auth, CSRF, throttle) is confirmed present in migrated output
- [ ] Route-specific middleware aliases resolve to the same classes
- [ ] Middleware ordering per route matches between baseline and migrated
- [ ] Diff comparison is repeated after each migration property (global, groups, aliases)

## Common Failures
- Whitespace differences causing false positives: `route:list -v` output may vary slightly in whitespace due to terminal width. Fix: redirect to files and use structured diff tools that ignore whitespace
- Route list changes from other work: If routes were modified between baseline and migration (new controllers, added routes), the diff shows false differences. Fix: take baseline immediately before migration and migrate in a stable branch
- Ignoring ordering differences: If middleware are present but in different order, the diff shows them as different rows. Fix: ordering changes are significant — they can break authentication or data binding
- Missing route alias middleware: Route-specific middleware (`->middleware('auth')`) depends on `$middleware->alias()`. If the alias is missing, the route middleware is silently absent. Fix: verify every route with route-specific middleware aliases

## Decision Points
- **Full diff vs per-route sampling**: Always do a full diff. Sampling misses edge cases where a single route loses middleware due to an unmigrated alias
- **Automated CI check vs manual**: Add the diff comparison to CI/CD pipeline for automated migration validation. Manual comparison is error-prone for large route tables
- **Pure migration vs cleanup during migration**: If the migration also includes removing obsolete middleware, document intentional diffs explicitly. Better practice: migrate purely first, then remove middleware in a separate change

## Performance Considerations
- `php artisan route:list -v` regenerates the middleware list from current configuration — no caching concerns
- For very large applications with 500+ routes, the command may take 1-3 seconds — acceptable for migration verification
- Route caching does not affect the `route:list -v` output — it reads from the resolved configuration

## Security Considerations
- A missing middleware row is a potential security vulnerability — particularly auth, throttle, or CSRF middleware
- Diff comparison is the most reliable way to detect middleware loss, since the framework produces no error for missing middleware
- If the diff shows extra middleware in the migrated version, investigate — it could be a duplicate causing unexpected behavior (e.g., double CSRF validation)

## Related Rules
- Verify middleware lists match exactly using `php artisan route:list -v` before and after (Testing)
- Migrate configuration one property at a time with verification between each step (Reliability)
- Use the BC layer — keep old kernel files until ApplicationBuilder config is verified (Security)

## Related Skills
- Migrate HTTP Kernel Middleware Configuration from Properties to withMiddleware()
- Migrate Console Kernel Commands and Schedules to ApplicationBuilder

## Success Criteria
- `php artisan route:list -v` diff between pre-migration and post-migration is empty (pure migration) or contains only documented, intentional changes
- All security-critical middleware is confirmed present in the migrated configuration
- Legacy kernel files are deleted only after diff verification passes
- The diff comparison process is repeatable and can be integrated into CI/CD
