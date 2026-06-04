# Skill: Manage PHP Versions for Laravel

## Purpose
Select, switch, and manage PHP versions across Laravel development environments and CI to match production requirements and support version-specific features.

## When To Use
- Setting up a new Laravel project with the appropriate PHP version
- Switching PHP versions to match production
- CI matrix testing across multiple PHP versions
- Upgrading to a new PHP version

## When NOT To Use
- Projects with a fixed PHP version that never changes
- When production and development already use identical versions

## Prerequisites
- Laravel Sail (for version isolation via Docker) or phpbrew
- Knowledge of project's PHP requirements

## Inputs
- `.env` — `PHP_VERSION` variable (for Sail)
- `composer.json` — `require.php` field

## Workflow

1. **Check Laravel Requirements:** Verify the PHP version required: Laravel 11 requires PHP 8.2+, Laravel 10 requires PHP 8.1+. Check `composer.json`'s `require.php` for the minimum version.

2. **Set PHP Version in Sail:** Change `PHP_VERSION=8.3` in `.env`. Run `sail build --no-cache` to rebuild the PHP container with the new version.

3. **Match Production:** Set the development PHP version to match production exactly. PHP version differences cause version-dependent bugs (named args, enums, property hooks).

4. **Configure CI Matrix Testing:** In CI, test against multiple PHP versions: `strategy.matrix.php: [8.2, 8.3]`. This catches version-specific issues before deployment.

5. **Monitor EOL Dates:** Track PHP version EOL: PHP 8.1 EOL Dec 2025, 8.3 EOL Dec 2026. Plan upgrades before EOL. Use `php -v` to check current version.

6. **Use Sail for Version Isolation:** Each project gets its own PHP version via Docker. This avoids system-wide conflicts when working on multiple projects with different PHP requirements.

## Validation Checklist

- [ ] PHP version matches between dev and production
- [ ] Sail container rebuilt after version change
- [ ] CI matrix tests against multiple PHP versions
- [ ] `composer.json` specifies minimum PHP version
- [ ] EOL dates known and upgrade planned
- [ ] Extensions compatible with selected PHP version

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Dev/prod version mismatch | Feature works in dev but fails in production |
| Sail not rebuilt after version change | Old PHP image persists without rebuild |
| PHP version EOL passed | No security updates; must upgrade |
| Extension not available for version | Build fails; check extension compatibility |

## Decision Points

- **Default to PHP 8.3 for new Laravel projects** (current stable)
- **Use latest PHP only if production supports it** — New features cause deployment issues if prod is behind
- **CI matrix testing** — Test against multiple PHP versions even if dev uses one

## Performance/Security Considerations

- **PHP 8.x performance:** 2-3x faster than 7.x; upgrading speeds up applications significantly
- **Security support:** Use supported PHP versions only; EOL versions receive no security patches
- **Extension compatibility:** Extensions compiled per PHP version; switching versions may need recompilation

## Related Rules

- PHPVER-RULE-001: Match production exactly
- PHPVER-RULE-002: CI matrix testing
- PHPVER-RULE-003: Use Sail for version isolation
- PHPVER-RULE-004: Rebuild after version change
- PHPVER-RULE-005: Check Laravel compatibility

## Related Skills

- Configure Laravel Sail
- Customize Sail with Dockerfiles
- Configure Static Analysis in CI

## Success Criteria

- Development PHP version matches production
- CI tests pass across multiple PHP versions
- PHP version is supported (not EOL)
- Each project has isolated PHP version via Docker
