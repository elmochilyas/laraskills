# ECC Anti-Patterns — Composer Autoloader Optimization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Composer Autoloader Optimization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Optimizing Autoloader Without Deploying
2. Authoritative Mode in Development
3. Manual Classmap Editing
4. Not Optimizing Autoloader in Production
5. Forgetting to Regenerate After Composer Changes

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — autoloader affects class resolution, not database
- Premature Caching — classmap built before all class files exist

---

## Anti-Pattern 1: Optimizing Autoloader Without Deploying

### Category
Deployment

### Description
Running `composer dump-autoload -o` locally without deploying the generated classmap to production.

### Why It Happens
Developers run the command expecting it to globally apply to their application, not realizing the classmap is a file that must be deployed.

### Warning Signs
- `composer dump-autoload -o` run on local machine but production classmap unchanged
- Developer reports "I optimized the autoloader but production is still slow"
- No deployment pipeline that includes autoloader optimization

### Why It Is Harmful
The optimized classmap file (`vendor/composer/autoload_classmap.php`) lives in `vendor/` directory. Running `dump-autoload -o` updates the local file only. Production still uses the old, unoptimized classmap until the next `composer install --no-dev` deployment.

### Real-World Consequences
A developer runs `composer dump-autoload -o` on their laptop, sees a 2ms bootstrap improvement locally, and considers the task done. Production continues with the unoptimized autoloader. Every production request pays 3-5ms extra autoloader overhead. The performance gain is never realized.

### Preferred Alternative
Include `--optimize-autoloader` flag in the `composer install` command within the deployment pipeline. Never run `dump-autoload` as a standalone optimization step.

### Refactoring Strategy
1. Update deploy script: `composer install --no-dev --optimize-autoloader`
2. Remove standalone `dump-autoload -o` from local workflows (it's a dev concern)
3. Verify classmap file exists in production after deployment

### Detection Checklist
- [ ] `dump-autoload -o` run locally without deployment
- [ ] Production `vendor/composer/autoload_classmap.php` missing or outdated
- [ ] No `--optimize-autoloader` in deploy script

### Related Rules
Composer Autoloader Optimization (04-standardized-knowledge.md): Run `composer dump-autoload -o` in deployment.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Authoritative Mode in Development

### Category
Reliability

### Description
Using `composer dump-autoload -a` (authoritative mode) in development where new classes are added frequently.

### Why It Happens
Developers copy production config to development without understanding that authoritative mode requires a complete classmap.

### Warning Signs
- `composer.json` has `"optimize-autoloader": true` always enabled
- New classes throw `ClassNotFoundException` in development
- Developer runs `dump-autoload` after every new file creation

### Why It Is Harmful
Authoritative mode assumes the classmap is complete and skips PSR-4 filesystem fallback. In development, new classes are added constantly. Each new class requires `dump-autoload` regeneration. Without regeneration, the class is not found.

### Real-World Consequences
A developer adds a new DTO class and runs the code immediately. `ClassNotFoundException` because authoritative mode doesn't find the new class in the static classmap. The developer spends 10 minutes debugging before realizing the autoloader needs regeneration.

### Preferred Alternative
Use standard classmap optimization (`composer dump-autoload -o`) in development. Reserve authoritative mode (`-a`) for production/CI where the class set is stable.

### Refactoring Strategy
1. Remove `"optimize-autoloader": true` from `composer.json` in dev
2. Alternatively, switch to `-o` instead of `-a` in development
3. Configure CI/CD to use `-a` for production builds

### Detection Checklist
- [ ] Authoritative mode active in local development
- [ ] Frequent `ClassNotFoundException` for new classes
- [ ] Developer regenerating autoloader constantly

### Related Rules
Composer Autoloader Optimization (04-standardized-knowledge.md): Authoritative mode is for production, not development.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Manual Classmap Editing

### Category
Reliability

### Description
Editing `vendor/composer/autoload_classmap.php` by hand to add or remove class mappings.

### Why It Happens
Developers encounter a missing class and manually add it to the classmap as a "quick fix."

### Warning Signs
- `vendor/composer/autoload_classmap.php` differs from generated version
- Manual edits visible in version control for the file
- Developer describes "fixing" the autoloader by adding a line to the classmap

### Why It Is Harmful
The classmap is machine-generated by Composer. Manual edits are overwritten on the next `composer dump-autoload` or `composer install`. They are not reproducible and may conflict with the PSR-4 configuration.

### Real-World Consequences
A developer adds a manual entry to `autoload_classmap.php` to fix a missing class. The fix works locally. The next deployment runs `composer install --no-dev`, which regenerates the classmap and removes the manual entry. Production crashes with `ClassNotFoundException`.

### Preferred Alternative
Fix the root cause: add the class to the correct namespace in `composer.json` autoload section, then regenerate the classmap via `composer dump-autoload`.

### Refactoring Strategy
1. Revert any manual edits to `autoload_classmap.php`
2. Add the missing class entry to `composer.json` autoload section
3. Run `composer dump-autoload` to regenerate the classmap
4. Verify the class is now found

### Detection Checklist
- [ ] Manual edits in `autoload_classmap.php`
- [ ] Classmap file in version control (it should not be)
- [ ] Class not found after `composer install --no-dev`

### Related Rules
Composer Autoloader Optimization (04-standardized-knowledge.md): Always regenerate via composer, never edit manually.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Not Optimizing Autoloader in Production

### Category
Performance

### Description
Running `composer install --no-dev` without the `--optimize-autoloader` flag, leaving production with unoptimized PSR-4 autoloading.

### Why It Happens
Developers copy basic `composer install` commands from documentation without understanding the optimization flags.

### Warning Signs
- Deploy script: `composer install --no-dev` without `-o` or `--optimize-autoloader`
- No separate `composer dump-autoload -o` step in deployment
- PSR-4 filesystem fallback active in production

### Why It Is Harmful
Without the classmap, Composer resolves every class by iterating PSR-4 namespace prefixes and checking file existence. For Laravel, which loads 100-300 classes per request, this adds 3-5ms per request in filesystem overhead.

### Real-World Consequences
An application deploys with `composer install --no-dev` (no optimization). Every request resolves 250 classes via PSR-4 scanning. Each resolution checks 2-3 namespace prefixes and performs a `file_exists()` call. Total overhead: 5ms per request. At 500 req/s, that's 2.5 seconds of cumulative filesystem time per second.

### Preferred Alternative
Always use `composer install --no-dev --optimize-autoloader` (or short flag `-o`) in production deployments.

### Refactoring Strategy
1. Update deploy script to `composer install --no-dev --optimize-autoloader`
2. For existing deployments, run `composer dump-autoload -o` once to generate the classmap
3. Verify `vendor/composer/autoload_classmap.php` exists in production

### Detection Checklist
- [ ] Deploy script uses plain `composer install --no-dev`
- [ ] No `--optimize-autoloader` or `-o` flag
- [ ] Bootstrap overhead higher than expected (measure LARAVEL_START delta)

### Related Rules
Composer Autoloader Optimization (04-standardized-knowledge.md): Always use `-o` in production deployment.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Forgetting to Regenerate After Composer Changes

### Category
Reliability

### Description
Running `composer require` or `composer update` without regenerating the autoloader classmap.

### Why It Happens
Developers assume `composer require` regenerates the classmap automatically (it does generate it, but only for the new package — the full optimization must be triggered explicitly).

### Warning Signs
- Classes from newly added packages not found
- `ClassNotFoundException` for package classes that exist in vendor/
- Running `composer require` without subsequent `composer dump-autoload -o`

### Why It Is Harmful
Adding or updating packages changes the autoloader configuration. Without regeneration, the optimized classmap does not include the new package's classes. If authoritative mode is active, these classes are not found at all.

### Real-World Consequences
A developer runs `composer require spatie/laravel-analytics`. The package's facade class is not in the existing classmap. Authoritative mode is active. Any code referencing `Analytics::class` throws `ClassNotFoundException`. The developer spends an hour debugging before realizing the autoloader needs regeneration.

### Preferred Alternative
Run `composer dump-autoload -o` after every `composer require` or `composer update`. Alternatively, use `composer install --optimize-autoloader` which handles this automatically.

### Refactoring Strategy
1. After every `composer require` or `composer update`, run `composer dump-autoload -o`
2. In deployment, use `composer install --no-dev --optimize-autoloader` which regenerates the classmap
3. Verify new package classes are found before deployment

### Detection Checklist
- [ ] `ClassNotFoundException` after adding a package
- [ ] No `composer dump-autoload` after `composer require`
- [ ] Production classmap missing new package entries

### Related Rules
Composer Autoloader Optimization (04-standardized-knowledge.md): Regenerate after any composer change.

### Related Skills
N/A

### Related Decision Trees
N/A
