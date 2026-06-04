# Knowledge Unit: PHP Version Management

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/php-version-management
- **Maturity:** Mature
- **Related Technologies:** PHP, Laravel Sail, Docker, phpbrew, PHP-FPM

## Executive Summary

PHP version management in Laravel development involves selecting and switching between PHP versions (8.0 through 8.4) to match project requirements, production environments, and testing matrices. In Sail, PHP version is managed via the PHP_VERSION environment variable in docker-compose.yml, which selects the appropriate Docker image tag. Outside Sail, tools like phpbrew, Homebrew (macOS), and multiple PHP versions via PPA (Linux) provide version management. PHP version affects: language features (named arguments, match expressions, readonly properties, enums), performance (PHP 8.x is 2-3x faster than PHP 7.x), Laravel compatibility (Laravel 11 requires PHP 8.2+), and extension availability. Development environments should match production PHP versions to avoid deployment surprises.

## Core Concepts

- **PHP Version Numbering:** PHP uses semantic versioning (major.minor.patch); major releases every year (8.0, 8.1, 8.2, 8.3, 8.4); each major version gets 2 years of active support + 1 year of security fixes
- **Sail PHP Version:** Controlled by PHP_VERSION variable in .env (PHP_VERSION=8.3); selects the PHP Docker image tag for the laravel.test service
- **phpbrew:** CLI tool for installing and switching between multiple PHP versions on a single machine; useful for teams maintaining projects with different PHP requirements
- **PHP-FPM Version:** Each PHP version has its own PHP-FPM binary; the FPM version must match the PHP version used by the web server
- **Extension Compatibility:** PHP extensions (redis, xdebug, imagick, etc.) must be compiled for the specific PHP version; switching PHP versions may require recompiling extensions
- **Composer PHP Constraint:** composer.json specifies the required PHP version: "require": { "php": "^8.1" }; Composer enforces this during install/update

## Mental Models

- **PHP Version as Platform:** Each PHP version is like a platform version—features, performance, and behavior differ; developing on PHP 8.4 and deploying on PHP 8.1 means losing access to newer features
- **Version Constraint as Contract:** The PHP version constraint in composer.json is a contract—it declares which PHP versions the application supports; Composer enforces it
- **Docker Image as Version Container:** Each Sail PHP image (8.0, 8.1, 8.2, 8.3, 8.4) is a self-contained PHP version environment with the correct extensions, tools, and configuration

## Internal Mechanics

1. **Sail Image Selection:** Sail's docker-compose.yml uses ${PHP_VERSION:-8.3} in the image tag: image: sail-8.3/app or builds from docker/8.3/Dockerfile
2. **PHP-FPM Process:** Each PHP version runs its own PHP-FPM process inside the container; the web server (Nginx) proxies PHP requests to the FPM socket at the correct version
3. **Extension Compilation:** When building the Docker image, the Dockerfile compiles PHP extensions (phpredis, xdebug, pcntl, etc.) for the specific PHP version using pecl or docker-php-ext-install
4. **Composer Resolution:** composer install reads the PHP version constraint from composer.json and resolves dependencies compatible with the installed PHP version
5. **Version Detection:** phpversion() and PHP_VERSION constant report the runtime PHP version; Laravel uses this for conditional feature support
6. **Multiple Version Setup (phpbrew):** phpbrew installs PHP versions to separate directories (/usr/local/php/8.2, /usr/local/php/8.3) and switches the active version via PATH manipulation

## Patterns

- **Production Match Pattern:** Match the development PHP version to the production PHP version exactly. If production uses PHP 8.2, development should use PHP 8.2. This prevents version-dependent bugs.
- **Version Testing Matrix Pattern:** Test the application against multiple PHP versions in CI (8.1, 8.2, 8.3) using GitHub Actions matrix strategy, even if development uses one version.
- **Sail Version Switch Pattern:** Change PHP version in Sail by setting PHP_VERSION=8.3 in .env, then rebuilding: sail build --no-cache. This switches the entire stack to the new PHP version.
- **Per-Project Version Isolation Pattern:** Use Docker-based development (Sail) for per-project PHP version isolation. Each project has its own PHP version, independent of other projects.
- **Legacy Project Pattern:** For legacy projects stuck on PHP 7.4, use a custom Sail image with PHP 7.4 while transitioning to PHP 8.x.
- **Octane Version Consideration Pattern:** If using Laravel Octane (Roadrunner or Swoole), ensure the PHP version has the required extension (Swoole requires specific PHP version support).

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Development approach | Sail (Docker) vs phpbrew vs native | Sail for team consistency; phpbrew for individual flexibility |
| PHP version | 8.0 through 8.4 | Latest stable (8.4) for new projects; match production for existing projects |
| Extension strategy | Pre-built vs compile during build | Pre-built for common extensions; compile for custom extensions |
| Version switching speed | Image rebuild (2-5 min) vs PHP-FPM restart (<1s) | Image rebuild for major version changes; FPM restart for minor/patch changes |

## Tradeoffs

- **Sail vs phpbrew:** Sail provides complete environment isolation (PHP version, extensions, services) but adds Docker overhead. phpbrew is lighter but doesn't manage services (database, Redis). For team projects, Sail's consistency outweighs Docker overhead.
- **Latest PHP vs Production Match:** Using the latest PHP version in development provides access to new features but risks deploying code that uses features not available in the production PHP version. Always match production.
- **Multiple Versions vs Single Version:** Having multiple PHP versions available enables testing across versions but adds disk space and complexity. CI matrix testing is a lighter alternative to maintaining multiple local versions.

## Performance Considerations

- **PHP Version Performance:** PHP 8.4 is approximately 2-3x faster than PHP 7.4 for typical Laravel workloads. Each major 8.x release improves performance by 10-30% over the previous version.
- **JIT Compilation:** PHP 8.0+ supports JIT (Just-In-Time) compilation, which can improve CPU-intensive operation performance by 2-5x. JIT is less beneficial for typical Laravel web requests (I/O-bound) but helps with data processing tasks.
- **Extension Performance:** Different PHP versions may have different extension versions with different performance characteristics. Redis, Xdebug, and OPcache versions should match the PHP version.
- **Docker Version Overhead:** Running PHP in Docker adds ~5% performance overhead compared to native PHP. This is acceptable for development but should be considered for performance-sensitive testing.

## Production Considerations

- **Version Support Timeline:** PHP 8.0 ended security support in November 2024; PHP 8.1 ends in December 2025. Plan upgrades before version end-of-life to avoid security risks.
- **Laravel Version Compatibility:** 
  - Laravel 9 requires PHP 8.0-8.2
  - Laravel 10 requires PHP 8.1+
  - Laravel 11 requires PHP 8.2+
  - Check compatibility before upgrading either Laravel or PHP.
- **Hosting Provider Support:** Ensure the hosting provider (Forge, Vapor, platform.sh, Heroku) supports the target PHP version before upgrading.
- **Extension Availability:** Some PHP extensions may not be available for the latest PHP version immediately after release. Check extension compatibility before upgrading.
- **Docker Image Updates:** Sail's PHP images are updated for each PHP version; check for updated images when upgrading.

## Common Mistakes

- **Developing on PHP 8.4, deploying on PHP 8.1:** Using PHP 8.4 features (property hooks, asymmetric visibility) that don't exist in PHP 8.1; deployment fails with parse errors
- **Not rebuilding Sail after PHP version change:** Changing PHP_VERSION in .env but not running sail build; the old PHP image is still used
- **Ignoring Composer PHP constraints:** composer.lock tracks the PHP version used during install; changing PHP version requires composer install --ignore-platform-reqs (risky)
- **Extension mismatch after version switch:** Switching PHP versions without verifying extension availability; Xdebug or Redis extension is missing
- **Forgetting to update CI to match development PHP version:** Tests pass locally (PHP 8.3) but fail in CI (PHP 8.1); CI should match the target production version

## Failure Modes

- **Composer Platform Requirement Failure:** composer install fails because the installed PHP version doesn't match the composer.json constraint. Mitigate: update PHP version or adjust the constraint.
- **Parse Error on Deployment:** Code uses PHP 8.4 features on a PHP 8.1 production server. Mitigate: match versions; use PHP compatibility checking tools (PHPCompatibility, Rector).
- **Extension Not Found:** A required extension (Redis, Imagick, Sodium) is not installed for the current PHP version. Mitigate: check extension installation; install missing extensions.
- **Deprecation Warning Flood:** Running old code on a newer PHP version generates deprecation warnings. Mitigate: fix deprecations or suppress warnings during migration period.

## Ecosystem Usage

- **Laravel Sail:** Supports PHP 8.0 through 8.4 with official Docker images
- **Laravel Forge:** Forge supports PHP 8.0 through 8.4; you can install multiple PHP versions on a single server
- **Laravel Vapor:** Vapor uses PHP 8.x Lambda runtimes; version availability depends on AWS Lambda PHP support
- **Laravel Shift:** Shift's upgrade service handles PHP version upgrades as part of Laravel version upgrades
- **Laravel Packages:** Package maintainers use CI matrix testing across PHP 8.0-8.4 to ensure compatibility

## Related Knowledge Units

- laravel-sail
- sail-customization-dockerfiles
- docker-compose-for-laravel
- automated-testing-in-ci

## Research Notes

- PHP 8.4 was released November 2024, introducing property hooks, asymmetric visibility, and the #[\Deprecated] attribute
- PHP 8.3 (November 2023) added json_validate(), override attribute, and deep cloning of readonly properties
- PHP 8.2 (December 2022) added readonly classes, null/false/true stand-alone types, and random extension improvements
- PHP 8.1 (November 2021) added enums, readonly properties, fibers, and first-class callable syntax
- PHP 8.0 (November 2020) added named arguments, match expressions, attributes, constructor property promotion, union types, and nullsafe operator
