# Skill: Optimize Composer Autoloader for Production

## Purpose
Generate an optimized classmap autoloader that replaces PSR-4 filesystem-based resolution with O(1) array lookups, reducing bootstrap overhead by 2-5ms per request.

## When To Use
- Every production deployment — always use `--optimize-autoloader` or `-o`
- After every `composer install` or `composer update` in production
- For Octane deployments — authoritative mode (`-a`) when classmap is guaranteed complete

## When NOT To Use
- Local development — classmap must be regenerated after every new class file
- Applications with dynamic class generation (factories, proxies, stubs) requiring authoritative mode
- When APCu extension is unavailable (for APCu autoloader variant)

## Prerequisites
- Composer installed and configured
- Application codebase with all dependencies installed
- Access to production or CI shell

## Inputs
- `composer.json` with configured autoload namespaces
- Vendor directory with installed packages

## Workflow
1. Run `composer install --no-dev --optimize-autoloader` in production deployment
2. Verify `vendor/composer/autoload_classmap.php` exists and is non-empty
3. Optionally run `composer dump-autoload -o` if classmap needs regeneration after install
4. For Octane: audit for dynamic class generation (factories, proxies)
5. If no dynamic classes exist, run `composer dump-autoload -a` for authoritative mode
6. Configure OpCache to cache the autoloader PHP files
7. Optionally enable APCu autoloader in `composer.json` for high-throughput apps

## Validation Checklist
- [ ] `composer install --no-dev -o` is used in production deployment script
- [ ] `vendor/composer/autoload_classmap.php` exists
- [ ] No `ClassNotFoundException` for expected classes
- [ ] For authoritative mode: no dynamic class generation in the application
- [ ] OpCache enabled to cache autoloader files
- [ ] Autoloader regenerated after every composer change

## Common Failures
- Running plain `composer install` without `-o` — PSR-4 fallback on every class
- Authoritative mode with dynamic classes (factories) — `ClassNotFoundException`
- Stale classmap after adding new classes — class not found until regeneration
- Not regenerating after `composer require` — new package classes not found

## Decision Points
- **Optimized (-o) vs Authoritative (-a)**: `-o` safe for most apps; `-a` faster but fragile — use only without dynamic class generation
- **APCu autoloader**: Adds ~0.5ms savings for high-throughput apps; requires APCu extension

## Performance Considerations
- Standard PSR-4: 2-5ms total per request for 300-500 class resolutions
- Optimized classmap: ~0.001ms per class — single `isset()` lookup
- Authoritative mode: Same as optimized but skips filesystem fallback
- APCu autoloader: ~0.5ms additional savings by reading classmap from shared memory
- OpCache interaction: autoloader PHP files benefit from opcode caching

## Security Considerations
- Classmap file is generated from `composer.json` — ensure no malicious class paths
- Authoritative mode crashes on missing classes — test thoroughly
- APCu classmap shared across all PHP processes — ensure consistency across deployments

## Related Rules
- Use optimized autoloader in every production deployment
- Regenerate autoloader after every composer change
- Use authoritative mode (-a) only when classmap is complete
- Combine optimized autoloader with OpCache
- Do not use authoritative mode in development
- Consider APCu autoloader for high-throughput applications

## Related Skills
- Configure OpCache for Laravel Production
- Execute Optimize in Deployment Sequence

## Success Criteria
- Class resolution uses O(1) array lookup instead of PSR-4 filesystem scanning
- Bootstrap time reduced by 2-5ms per request
- No class-not-found errors from stale classmap
- Autoloader regenerated as part of standard deployment workflow
