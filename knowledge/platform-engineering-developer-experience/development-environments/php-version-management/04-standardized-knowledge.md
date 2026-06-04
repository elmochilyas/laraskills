# 04-Standardized Knowledge: PHP Version Management

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | php-version-management |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, sail-customization-dockerfiles, docker-compose-for-laravel |
| **Framework/Language** | PHP, Laravel Sail, Docker, phpbrew |

## Overview

PHP version management in Laravel development involves selecting/switching between PHP 8.0-8.4 to match project requirements and production. In Sail, controlled by `PHP_VERSION` env var selecting Docker image tag. Outside Sail: phpbrew, Homebrew (macOS), PPA (Linux). Version affects language features (named args, enums, property hooks), performance (8.x is 2-3x faster than 7.x), Laravel compatibility (L11 requires PHP 8.2+), and extension availability.

## Core Concepts

- **PHP Versioning**: semver; annual major releases; 2 years active + 1 year security support
- **Sail PHP Version**: `PHP_VERSION=8.3` in .env selects Docker image tag
- **phpbrew**: CLI for installing/switching multiple PHP versions on one machine
- **PHP-FPM Version**: each PHP version has its own FPM binary
- **Extension Compatibility**: extensions compiled per PHP version; switching versions may need recompile
- **Composer Constraint**: `composer.json` `"require": { "php": "^8.1" }` declares supported versions

## When to Use

- Every project — development PHP version should match production
- Multi-version testing in CI for package/ecosystem development
- Legacy projects needing specific PHP versions

## When NOT to Use

- Projects always using the same PHP version (just set it once)
- When production PHP version is not yet decided

## Best Practices (WHY)

- **Match production exactly**: prevents version-dependent bugs from reaching production
- **CI matrix testing**: test against multiple PHP versions even if dev uses one
- **Use Sail for version isolation**: each project gets its own PHP version via Docker
- **Rebuild after version change**: `sail build --no-cache` after changing `PHP_VERSION`
- **Check Laravel compatibility**: L11 requires 8.2+, L10 requires 8.1+
- **Monitor EOL dates**: PHP 8.1 EOL Dec 2025; plan upgrades before

## Architecture Guidelines

- Set `PHP_VERSION` in .env, not docker-compose.yml
- Commit docker-compose.yml with `PHP_VERSION` placeholder
- Use CI matrix for multi-version testing; local dev uses single version
- For legacy projects, use custom Sail images with older PHP versions

## Performance Considerations

- PHP 8.4 is 2-3x faster than PHP 7.4
- Each 8.x release improves 10-30% over previous
- JIT (PHP 8.0+): 2-5x improvement for CPU-intensive tasks
- Docker: ~5% overhead vs native PHP

## Security Considerations

- PHP 8.0 security support ended Nov 2024 — upgrade to supported version
- Match version to get security patches
- Older versions have known CVEs

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Dev on 8.4, prod on 8.1 | Using features not in prod | Parse errors on deploy | Match versions |
| Not rebuilding Sail after version change | Old image still used | Version not actually changed | sail build --no-cache |
| Extension mismatch | Extension compiled for wrong PHP version | Missing functionality | Check extension availability |
| CI version doesn't match dev | Tests pass locally, fail in CI | Flaky CI | Align CI PHP with dev |

## Anti-Patterns

- **Latest PHP for all projects**: new features may cause deployment issues if prod is behind
- **Ignoring composer PHP constraints**: platform requirements prevent unexpected version usage

## Examples

```env
# .env for PHP 8.3 (matching production)
PHP_VERSION=8.3

# CI matrix testing
strategy:
  matrix:
    php: ['8.1', '8.2', '8.3']
```

## Related Topics

- laravel-sail — Sail PHP version selection
- sail-customization-dockerfiles — custom Dockerfile per PHP version
- docker-compose-for-laravel — Docker Compose PHP service

## AI Agent Notes

- Default to PHP 8.3 for new Laravel projects (current stable)
- Always check composer.json `require` php constraint

## Verification

- [ ] PHP version matches production
- [ ] `PHP_VERSION` set in .env
- [ ] Sail rebuilt after version change
- [ ] Composer php constraint matches
- [ ] CI matrix includes target production version
- [ ] Extensions available for selected version
