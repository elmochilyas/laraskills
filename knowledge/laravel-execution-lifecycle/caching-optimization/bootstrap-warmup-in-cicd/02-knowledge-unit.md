# Bootstrap Warmup in CI/CD

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
Bootstrap cache warmup in CI/CD is the practice of generating all Laravel cache files during the continuous integration/build phase and including them in the deployment artifact — rather than generating them on the production server during deployment. This reduces deployment time, ensures cache generation failures are caught in CI before reaching production, and enables immutable deployment artifacts with pre-computed bootstrap state.

## Core Concepts
- **Warmup in CI:** Run `php artisan optimize`, `event:cache`, and `composer dump-autoload -o` as steps in your CI/CD pipeline (GitHub Actions, GitLab CI, Jenkins).
- **Artifact Inclusion:** Include the generated `bootstrap/cache/` files in the deployable artifact (Docker image, tarball, Lambda zip).
- **Immutable Artifact:** The artifact is built once and deployed to multiple environments. Each environment gets identical cache files.
- **Provider Count Impact:** The number of registered service providers directly affects bootstrap time. Each eager provider adds `register()` + `boot()` time. Measuring provider count is the first step in understanding bootstrap performance.
- **Measurement Tooling:** Laravel Telescope and Clockwork provide provider count and bootstrap timing on the Debugbar.

## Mental Models
- **Build Once, Deploy Everywhere:** Generate caches as part of the build artifact. The deployment step becomes a simple file copy or image pull — no runtime cache generation.
- **Shift-Left for Caches:** Move cache generation from "deploy time" to "build time" to catch errors earlier and reduce deployment risk.
- **Pre-Warmed Engine:** The deployment artifact is an engine that has already been warmed up. Starting it requires no compilation step — it's ready to run immediately.

## Internal Mechanics
1. **CI Pipeline Stages:**
   - **Install:** `composer install --no-dev --optimize-autoloader`
   - **Build:** `php artisan optimize` (config + routes + events)
   - **Verify:** `php artisan optimize:clear && php artisan optimize` (clean rebuild test)
   - **Artifact:** Package `bootstrap/cache/`, `vendor/`, and application code.
   - **Deploy:** Push artifact to production, extract, restart PHP.

2. **Provider Count Measurement:**
   - Check `config/app.php` `providers` array length.
   - Inspect `bootstrap/cache/services.php` `providers` array for the full count.
   - Use Telescope's "Providers" tab or Clockwork's timeline to see provider registration time.
   - Formula: `BootstrapTime ≈ Σ(EagerProviderRegisterTime) + Σ(EagerProviderBootTime) + Σ(DeferredProviderLazyLoadTime)`

3. **CI Artifact Structure:**
   ```
   deploy-package.tar.gz
   ├── app/
   ├── bootstrap/cache/
   │   ├── config.php
   │   ├── routes.php
   │   ├── events.php
   │   └── services.php
   ├── vendor/
   ├── public/
   └── artisan
   ```

4. **Docker Multi-Stage Build:**
   ```dockerfile
   FROM composer:2 AS vendor
   COPY composer.* ./
   RUN composer install --no-dev --optimize-autoloader
   
   FROM php:8.3 AS app
   COPY --from=vendor /app/vendor ./vendor
   COPY . .
   RUN php artisan optimize && php artisan event:cache
   ```

## Patterns
- **Build-Artifact Pattern:** All cache files are generated during the CI build phase and travel with the artifact. Production does nothing but extract and serve.
- **Clean-Build Verification:** After building caches, run `optimize:clear` and a fresh `optimize` to verify cache generation is reproducible and error-free.
- **Bootstrap Budget:** Set a maximum allowed bootstrap time in CI. If `optimize` takes longer than the budget, fail the build. This catches regressions from new service providers or bloated config.

## Architectural Decisions
- **Decision:** Build caches in CI rather than on the production server.
  - **Rationale:** CI environments have predictable dependencies and fail fast. Production deployment becomes a file copy, reducing deployment time and risk.
- **Decision:** Include `bootstrap/cache/` in the deploy artifact.
  - **Rationale:** Ensures all production instances get identical cache files. Prevents environment-specific cache divergence.
- **Decision:** Verify cache integrity in CI (clear + rebuild).
  - **Rationale:** A cache that fails during CI is caught before deployment. A cache that fails during production deployment causes downtime.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Catch cache errors in CI, not production | CI build time increases by 5-15 seconds | Longer feedback loop for developers |
| Reduced production deployment time (no cache build) | Artifact size increases by 1-5MB | Larger Docker images, slower image pull |
| Identical caches across all production instances | Build environment must match production (PHP version, extensions) | Environment drift causes cache format incompatibility |
| Provider count tracking enables bootstrap budgeting | Requires Telescope or Clockwork setup in non-local environments | Additional overhead for monitoring infrastructure |

## Performance Considerations
- **Provider Count Impact:** Each eager provider adds 1-5ms to bootstrap time. 50 providers = 50-250ms. Deferred providers add 0ms until their services are first resolved.
- **Bootstrap Time Measurement:** Use `laravel/bootstrap.js` timing or custom middleware measuring `LARAVEL_START` to `app('router')` dispatch.
- **CI Build Time Budget:** Typical `optimize` execution time: 2-5 seconds. Additional `event:cache`: 1-2 seconds. Total warmup: 3-7 seconds.
- **Artifact Size:** `bootstrap/cache/` files are 500KB-3MB. `vendor/` is 20-50MB (without dev). Total artifact: 30-60MB.
- **Cold Start in Production:** Without warmup, first request after deployment triggers cache generation: 5-10 seconds for that single request. With warmup, first request is at full speed.

## Production Considerations
- **CI environment parity:** The CI environment must match production PHP version and extensions. Config caching with PHP 8.3 produces files compatible with PHP 8.3 only.
- **Secrets in cached config:** CI should use production-like `.env` values when generating caches. But CI may not have access to production secrets. Consider generating caches on the production server instead if secrets in config are a concern.
- **Multi-environment deployment:** If deploying to staging and production from the same CI build, ensure the cached config reflects the target environment. This may require environment-specific CI jobs or on-server cache rebuild.
- **Rollback strategy:** If rolling back to a previous deployment, the old artifact includes old cache files. No additional cache steps needed — just deploy the old artifact.
- **Blue/Green deployment with warmup:** Warm caches in the green environment before switching traffic. The cached files are already present from the artifact.
- **Kubernetes with init containers:** Use init containers for cache warmup if files are not in the image (e.g., ConfigMap-mounted config).
- **Monitoring:** Create a health check that reports bootstrap time. Alert if bootstrap time exceeds baseline by 30%.

## Common Mistakes
- **Not matching PHP versions between CI and production.** Cache files generated with PHP 8.2 but production runs PHP 8.3. The config file format is version-dependent.
- **Building caches before `composer install` completes.** The autoloader or packages may not be fully available, causing incomplete caches.
- **Including `bootstrap/cache/` with wrong permissions.** The web server user cannot read the files. Set correct permissions in the Dockerfile or artifact extraction.
- **Not clearing `bootstrap/cache/` between CI builds.** Stale cache files from a previous build contaminate the new artifact, resulting in inconsistent state.
- **Assuming `config:cache` resolves secrets correctly in CI.** CI typically uses different `.env` values than production. The cached config reflects CI values, not production values.
- **Skipping cache warmup for ephemeral environments (CI review apps).** Every CI environment runs uncached, making performance tests unreliable.

## Failure Modes
- **CI Build Passes, Production Deployment Fails:** Environment mismatch causes cache generation artifacts to fail in production. Example: CI uses PHP 8.3 but production uses PHP 8.1 with different OpCache behavior.
- **Stale Caches in Artifact:** If the CI build step that generates caches is skipped (cached pipeline), stale cache files from a previous build are included in the artifact.
- **Secrets Leaked in Cached Config:** The cached config contains production secrets visible in the CI artifact. Anyone with access to the artifact can read secrets.
- **Cache Corruption During Artifact Packaging:** `bootstrap/cache/` files are being written while the artifact archiver reads them, producing corrupted files. Ensure cache generation completes before packaging starts.

## Ecosystem Usage
- **Laravel Vapor:** The canonical example. `vapor build` runs in CI, generates all caches, and creates a Lambda deployment artifact. The artifact is deployed without further cache generation.
- **Laravel Forge + Envoyer:** Forge servers with Envoyer generate caches on the server during deployment (not in CI). This is the on-server approach vs. the CI approach.
- **Docker + GitHub Actions:** Multi-stage Docker builds in GitHub Actions generate caches in the build stage. The final image includes pre-computed cache files.
- **GitLab CI:** Similar pattern — `artifacts:` section includes `bootstrap/cache/` for deployment jobs.
- **Telescope for Monitoring:** Use Telescope in a non-production environment to measure provider count and bootstrap time before deployment. Set a "provider budget" that fails CI if exceeded.
- **Clockwork:** Lightweight alternative to Telescope for measuring bootstrap performance. Can be enabled in CI environments without the overhead of Telescope.

## Related Knowledge Units

### Prerequisites
- [Optimize Command](./optimize-command/02-knowledge-unit.md) — the primary command invoked during CI warmup.
- [Composer Autoloader Optimization](./composer-autoloader-optimization/02-knowledge-unit.md) — autoloader file included in artifact.

### Related Topics
- [Config Caching](./config-caching/02-knowledge-unit.md) — primary cache generated during warmup.
- [Route Caching](./route-caching/02-knowledge-unit.md) — generated during warmup.
- [Events Caching](./events-caching/02-knowledge-unit.md) — generated during warmup.
- [Services Cache](./services-cache/02-knowledge-unit.md) — generated during warmup.

### Advanced Follow-up Topics
- [OpCache Configuration](./opcache-configuration/02-knowledge-unit.md) — OpCache behavior must match CI/production.
- [Cache Invalidation Deployment](./cache-invalidation-deployment/02-knowledge-unit.md) — relationship between CI warmup and deployment invalidation.
- [Octane Boot Timing](../boot-order-timing/octane-boot-timing/02-knowledge-unit.md) — how warmup strategies apply to Octane worker initialization.

## Research Notes
- The `LARAVEL_START` constant is defined at the top of `public/index.php` and `artisan`. It provides a reference point for measuring total bootstrap time: `(microtime(true) - LARAVEL_START) * 1000` in milliseconds.
- Telescope's `\Laravel\Telescope\Watchers\RequestWatcher` records bootstrap duration. Clockwork provides similar data via its timeline.
- Provider count is available via `app()->getLoadedProviders()` which returns an associative array of `ProviderClass => bool` (true if booted).
- Laravel 11 reduced the default provider count significantly by consolidating framework providers into `bootstrap/app.php`. This is a trend: fewer providers = faster bootstrap.
- Docker multi-stage builds are the recommended approach for CI warmup. The first stage installs dependencies and generates caches; the second stage copies only the necessary files (including caches) into a slim production image.
