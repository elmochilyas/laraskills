# Skill: Design and Maintain an OpCache Preload Script

## Purpose

Create a maintainable preload script that loads the right classes for optimal performance without introducing side effects or maintenance burden.

## When To Use

- Implementing OpCache preloading for the first time
- Refactoring an existing preload script
- Adding new packages or modules that should be preloaded
- Transitioning from manual preload class lists to automatic generation

## When NOT To Use

- When preloading is not needed (small applications)
- Without first profiling to identify the right classes to preload
- When the preload class list would exceed 500 classes (diminishing returns)

## Prerequisites

- OpCache preloading configured and working
- Understanding of which classes are loaded on every request
- Profiling data showing autoloading overhead
- PHP 7.4+ runtime

## Inputs

- Current preload script (if any)
- Autoloader class load statistics
- Framework type and version
- Application class autoloading map

## Workflow (numbered steps)

1. Profile autoloading: capture which classes are loaded on every request (top 100-200 by load frequency)
2. Create preload script structure: return early if not in production, define class list, require files or use Composer's autoloader
3. For Laravel: use `php artisan optimize` to generate an optimized preload configuration
4. For Symfony: use `composer dump-autoload --classmap-authoritative` and reference the generated classmap
5. Group preloaded classes by category: framework core, first-party modules, third-party packages
6. Add comments explaining why each class group is preloaded (load frequency, class complexity)
7. Test the preload script: execute it in isolation to verify no side effects (database connections, file writes, API calls)
8. Configure preload in php.ini and restart PHP-FPM
9. Verify preloaded classes via `opcache_get_status(false)['preload_statistics']`
10. Update the preload script when significant packages are added or removed — automate this in CI/CD

## Validation Checklist

- [ ] Autoloading profiled and top classes identified
- [ ] Preload script created with categorized class list
- [ ] No side effects confirmed (no DB, file, API calls during preload)
- [ ] Preload script tested in isolation
- [ ] opcache.preload configured
- [ ] Preloaded classes verified
- [ ] CI/CD automation for preload script updates considered
- [ ] Script documented with maintenance instructions

## Common Failures

- **Preloading classes with side effects**: Class autoloaders or constructors that connect to databases, write files, or make API calls
- **Hardcoding file paths**: Use Composer's autoloader or classmap rather than hardcoding require statements
- **Not maintaining the list**: Preloaded classes become stale as packages change — update periodically
- **Preloading too many classes**: Beyond the top 200-300, additional preloading provides diminishing returns

## Decision Points

- Laravel app: use `php artisan optimize` as the preload script base
- Symfony app: use Composer's classmap with `--classmap-authoritative`
- Custom app: manually list the top 200 classes by load frequency
- Multiple apps on same server: use separate preload scripts per application

## Performance Considerations

- Preloading 100-200 classes saves 1-3ms per request
- Preloading 500+ classes adds 200-500ms to startup time with minimal additional request-time benefit
- Preloaded classes consume shared memory permanently — they are never garbage collected
- The preload script execution time adds to PHP-FPM startup time

## Security Considerations

- Preload script runs with full PHP-FPM user privileges
- Never include user-provided input or dynamic file paths in preload scripts
- Preload scripts should be read-only by the PHP-FPM user — prevent modification
- Review preload script changes in code review (same scrutiny as any production code)

## Related Rules (from 05-rules.md)

- Preload Framework Classes for Cold-Start Reduction
- Never Use opcache_reset() for Preloading Invalidation
- Set opcache.preload_user for Security

## Related Skills

- Preloading Cold-Start Latency Reduction
- OpCache Lifecycle and Invalidation
- Composer Autoloader Optimization

## Success Criteria

- Preload script created with categorized, maintainable class list
- No side effects in preload execution
- Autoloading overhead reduced by 1-3ms per request
- Preload script integrated into CI/CD for updates
- Documentation created with maintenance instructions
