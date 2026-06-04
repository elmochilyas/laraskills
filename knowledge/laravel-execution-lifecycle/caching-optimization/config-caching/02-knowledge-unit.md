# Config Caching

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
Config caching in Laravel merges all configuration files under `config/` into a single serialized file (`bootstrap/cache/config.php`), resolving all environment variable references at cache-build time. This eliminates the need to parse config files and resolve ENV vars on every request, significantly reducing bootstrap overhead. The core insight is that configuration is deterministic for a given deployment — once resolved, it should never change until the next deployment.

## Core Concepts
- **Configuration Merging:** Laravel merges `config/*.php` into a single keyed array. Each filename becomes a top-level key (e.g., `app.php` → `$config['app']`).
- **ENV Resolution at Build Time:** When `config:cache` runs, all `env()` calls in config files are evaluated immediately. At runtime, `env()` reads from the cached array, not `$_ENV` or `.env`.
- **Cascade Order:** Config is merged in this order: defaults → package configs → application configs → environment-specific overrides. The cache freezes this final state.
- **Cache File Location:** `bootstrap/cache/config.php` — returns a plain PHP array via `<?php return [...]`.
- **Clear Command:** `php artisan config:clear` removes the cached file, reverting to file-based loading.

## Mental Models
- **Snapshot Model:** Config caching is a photographic snapshot of all configuration values at a single point in time. Any changes to `.env` or config files after the snapshot are invisible until a new snapshot is taken.
- **Freeze-and-Thaw Model:** At build/deploy time, freeze the config into a compact form. At runtime, thaw the frozen form without re-parsing. The application never sees the original files during normal operation.
- **Key-Value Store Analogy:** The cached config behaves like an in-memory key-value store (`config('app.name')` is a simple array lookup), whereas uncached config requires file inclusion, array merging, and ENV substitution.

## Internal Mechanics
1. **`\Illuminate\Foundation\Console\ConfigCacheCommand::handle()`** is the entry point.
2. It calls `$this->call('config:clear')` to remove any stale cache.
3. The `Illuminate\Foundation\Application::bootstrapWith()` loads `\Illuminate\Foundation\Bootstrap\LoadConfiguration`, which uses `\Illuminate\Config\Repository`.
4. The command calls `$app['config']->all()` to retrieve the fully resolved configuration array.
5. This array is serialized using `var_export()` into a PHP script that returns the array.
6. The resulting string is written to `bootstrap/cache/config.php` with a leading `<?php return ` and a trailing `;\n`.
7. On subsequent requests, `\Illuminate\Foundation\Bootstrap\LoadConfiguration` checks for the cached file. If present, it requires it and populates the repository directly — skipping all file loading and environment resolution.

## Patterns
- **Cache-Aside (Lazy Population):** Config is populated once (the cache build), then read many times. There is no cache miss path — if the cache exists, files are never loaded.
- **Write-Through Cache:** The `config:cache` command acts as a write-through operation, persisting the computed state to disk so subsequent reads bypass computation.
- **Stampede Protection:** Since config is a single file and only written atomically by one process, there is no stampede risk. The check for file existence is a single `file_exists()` call.

## Architectural Decisions
- **Decision:** Resolve `env()` calls at cache-build time rather than at runtime.
  - **Rationale:** Eliminates per-request overhead of reading `.env` and environment variables. Accepts the tradeoff that runtime changes to environment variables are ignored.
- **Decision:** Use `var_export()` instead of `serialize()`.
  - **Rationale:** The cached file is plain PHP that can be `require`d directly — no deserialization overhead. `var_export()` produces valid PHP parseable code.
- **Decision:** Store in `bootstrap/cache/` rather than `storage/framework/cache/`.
  - **Rationale:** Bootstrap cache must be available before the storage directory is initialized. The bootstrap directory is intentionally minimal and writable during deployment.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| ~50-100ms reduction in bootstrap time per request | `env()` calls in config files are frozen at build time | Config changes require re-caching; runtime ENV overrides ignored |
| Single `require` replaces dozens of file reads | Config files using `env()` outside of `config/` break after caching | Developers must wrap all `env()` calls in config files |
| Consistent configuration across all requests | Cache must be cleared and rebuilt on deploy | Adds deployment step; stale config causes subtle bugs |
| Reduced filesystem I/O during bootstrap | Larger deploy artifact if config contains secrets | Secrets in cached config must be protected |

## Performance Considerations
- **Bootstrap Time:** Uncached config loads 20-50 files, performs string interpolation, and evaluates hundreds of `env()` calls. Cached config is a single `require` + array assignment. Measured improvement: 30-80ms on typical hardware.
- **Memory:** The cached config array resides in PHP memory for the lifetime of the request (or worker process in Octane). Typical memory: 500KB-3MB depending on config complexity.
- **OpCache Interaction:** The cached config file benefits from OpCache — after the first request, the opcode is cached in shared memory, reducing parsing overhead to zero.
- **File Size:** Typical `bootstrap/cache/config.php` ranges from 100KB to 500KB. Large files can cause noticeable `require` time on slow disks; OpCache mitigates this on subsequent requests.

## Production Considerations
- **Always cache in production.** Running Laravel in production without `config:cache` is a measurable performance regression. Include `php artisan config:cache` in your deployment script.
- **Cache after every deployment.** Run `config:cache` as part of the deployment warmup phase, after `composer install` and before serving traffic.
- **Avoid `env()` outside config files.** After caching, `env()` calls in application code return `null` because the `.env` file is never loaded. Use `config()` instead.
- **Secrets in cached config.** If database passwords or API keys are resolved into config at cache time, they are written in plaintext to `bootstrap/cache/config.php`. Secure this file with filesystem permissions.
- **CI/CD pipeline.** Build the config cache in your CI/CD pipeline or as a deployment step. Treat the cached file as a deploy artifact.
- **Shared hosting.** If you cannot run `config:cache`, ensure `config:clear` is run and accept the performance penalty.

## Common Mistakes
- **Calling `env()` in application code** after `config:cache`. This returns `null` because `.env` is bypassed. Always access via `config()`.
- **Forgetting to re-cache after config changes.** Changes to config files or `.env` are invisible until `config:cache` is re-run.
- **Caching with wrong `.env` values.** Running `config:cache` while the wrong `.env` is loaded caches the wrong values. Always verify `.env` before caching.
- **Committing `bootstrap/cache/config.php` to version control.** This file is environment-specific and should be in `.gitignore` (it already is by default).
- **Using `env()` with a dynamic key.** `env($dynamicKey)` cannot be resolved at cache time and will fail silently.

## Failure Modes
- **Stale Config After Env Rotation:** If environment variables are rotated (e.g., database password change) without re-caching, the application continues using the old values. Automated rotation systems must trigger `config:cache` or accept a deployment.
- **Corrupted Cache File:** Partial write during `config:cache` (disk full, process killed) causes PHP parse error on next request. Mitigation: atomic write via `file_put_contents` with `LOCK_EX` or write to temp file then rename.
- **Permission Denied:** The web server user cannot read `bootstrap/cache/config.php`. Check filesystem permissions after deployment.
- **Fatal Error on Non-Existent Cache:** If `config:cache` fails silently and the file is missing, Laravel falls back to file loading. This is a degradation, not a crash, but may hide the problem.

## Ecosystem Usage
- **Laravel Octane:** Config caching is mandatory. Octane workers persist across requests, so the config file is loaded once per worker start.
- **Laravel Vapor:** Serverless environments use `config:cache` as part of the build process. Cold starts are improved by eliminating file parsing.
- **Forge & Envoyer:** Both include `php artisan config:cache` in their default deployment scripts.
- **Spatie packages:** Many Spatie packages publish config files that rely on `env()` — they correctly use `config()` internally after caching.

## Related Knowledge Units

### Prerequisites
- [Bootstrapper Sequence](../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md) — the LoadConfiguration bootstrapper that config caching optimizes.
- [Application Builder Configuration](../application-bootstrap/application-builder-configuration/02-knowledge-unit.md) — how builder-configured settings are frozen at cache time.

### Related Topics
- [Route Caching](./route-caching/02-knowledge-unit.md) — similar caching mechanism for routes with different tradeoffs.
- [Services Cache](./services-cache/02-knowledge-unit.md) — deferred provider manifest that interacts with config loading order.
- [Optimize Command](./optimize-command/02-knowledge-unit.md) — `php artisan optimize` runs config:cache as one of its steps.

### Advanced Follow-up Topics
- [OpCache Configuration](./opcache-configuration/02-knowledge-unit.md) — OpCache caches the compiled PHP of config files.
- [Bootstrap Warmup in CI/CD](./bootstrap-warmup-in-cicd/02-knowledge-unit.md) — config caching as part of CI/CD pipeline.
- [Cache Invalidation Deployment](./cache-invalidation-deployment/02-knowledge-unit.md) — stale config detection and atomic cache refresh.

## Research Notes
- Laravel's `env()` helper in `src/Illuminate/Support/helpers.php` uses `$_ENV`, `getenv()`, and the `.env` parser. When config is cached, the helper shortcuts via `$config` array.
- The `var_export()` approach means closures in config files cause a fatal error — closures cannot be exported. This is why all config values must be serializable.
- Laravel 9+ uses `Illuminate\Support\Env` for type-strict environment variable access, but the caching mechanism is unchanged.
- Future direction: Laravel may adopt PHP 8.1's `readonly` properties for config objects, but the array-based approach remains.
