# Optimize Command

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
`php artisan optimize` is a composite command that runs multiple caching operations in sequence: `config:cache`, `route:cache`, and manifest generation. It is designed to be run during deployment to pre-compile as much of the framework as possible. Its counterpart, `php artisan optimize:clear`, reverses all these operations. Understanding precisely what each command does and when to run them is critical for both development workflow and production deployment.

## Core Concepts
- **Composite Nature:** `optimize` bundles several independent caching commands into a single invocation. The exact set has changed across Laravel versions.
- **Command Sequence (Laravel 11):**
  1. `config:cache` — caches configuration
  2. `route:cache` — caches routes
  3. `event:cache` — caches event listener manifest (not part of `optimize` in all versions)
  4. Service provider manifest generation (deferred providers)
- **Optimize:Clear Sequence:**
  1. `config:clear` — removes config cache
  2. `route:clear` — removes route cache
  3. `event:clear` — removes event cache
  4. Clears compiled view files
  5. Clears application cache
- **Version Differences:** The exact commands bundled in `optimize` differ by Laravel version:
  - **Laravel 5.x:** Also included classmap generation via `composer dump-autoload -o`
  - **Laravel 7.x:** Included compiled classes file
  - **Laravel 9+:** Removed compiled classes file; focused on config, routes, events, views
  - **Laravel 11+:** Streamlined to config + routes + events

## Mental Models
- **Deployment Switch:** Think of `optimize` as flipping the application from "development mode" (writes are easy, reads are slow) to "production mode" (writes are hard, reads are fast).
- **Compilation Pipeline:** Like a build tool (webpack, vite) that compiles frontend assets, `optimize` compiles the framework's runtime configuration into optimized forms.
- **Toggle Analogy:** `optimize` enables all caches; `optimize:clear` disables all caches. There is no granularity — it's all or nothing.

## Internal Mechanics
1. **`\Illuminate\Foundation\Console\OptimizeCommand::handle()`** iterates through the registered optimization commands.
2. Each sub-command is called via `$this->call('config:cache')` etc.
3. The command respects the application environment — in `local`, it may skip certain steps (config:cache should not run in local development where config changes frequently).
4. **`\Illuminate\Foundation\Console\OptimizeClearCommand::handle()`** calls each clear command in reverse order.
5. The manifest regeneration for services cache happens implicitly — the application bootstraps fresh for `config:cache`, which regenerates the provider manifest as a side effect.
6. Various compiled view caches are cleared: `view:clear` removes compiled Blade templates from `storage/framework/views/`.

## Patterns
- **Composite Command:** A single facade command that delegates to focused sub-commands. This follows the Facade pattern applied to CLI commands.
- **Symmetry:** Every caching operation has a corresponding clear operation. `optimize` and `optimize:clear` are symmetric inverses.
- **Idempotent Clear:** `optimize:clear` is idempotent — calling it multiple times has no additional effect beyond the first invocation. Clear commands delete files; if files don't exist, the operation is a no-op.

## Architectural Decisions
- **Decision:** Bundle multiple caches into a single command.
  - **Rationale:** Simplifies deployment scripts — one command instead of three. But this obscures what's happening and makes partial caching harder.
- **Decision:** Make `optimize:clear` the inverse of `optimize`.
  - **Rationale:** Clear, predictable semantics. Developers always know how to undo.
- **Decision:** Do not include `event:cache` in all versions of `optimize`.
  - **Rationale:** Event caching is less universally needed. The command set evolves to match typical use cases.
- **Decision:** Implicitly regenerate services cache during `optimize`.
  - **Rationale:** The fresh application bootstrap triggered by sub-commands rebuilds the provider manifest as a side effect.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Single command replaces 3-4 separate calls | Developers may not know what `optimize` actually does | Misunderstanding leads to incomplete caching |
| Consistent cache state across all systems | Full cache rebuild takes 2-5 seconds | Slower deployment warmup; annoying in CI |
| `optimize:clear` provides a clean reset | No partial clear — clears everything | Overkill when only one cache type needs clearing |
| Simple deployment integration | Not all caches may be needed (e.g., event cache for non-event apps) | Extra file creation with no benefit |

## Performance Considerations
- **Execution Time:** Running `php artisan optimize` takes 2-5 seconds depending on route count and configuration complexity. This is acceptable in deployment but disruptive in development.
- **Cache File Size:** Combined cache files (config + routes + events + services) typically total 500KB-3MB. Disk space is negligible.
- **Bootstrap Improvement:** After `optimize`, Laravel bootstrap time drops 50-150ms on average. The gain comes from eliminating file parsing, reflection, and class instantiation during bootstrap.
- **OpCache Benefit:** All generated PHP cache files benefit from OpCache, making their overhead essentially zero after the first request.

## Production Considerations
- **Run `optimize` as the last Artisan command in your deployment script**, after `migrate` and before serving traffic. Typical sequence:
  1. `composer install --no-dev --optimize-autoloader`
  2. `php artisan migrate --force`
  3. `php artisan optimize`
  4. `php artisan event:cache` (if using events)
- **Do not run `optimize` in development.** It makes configuration changes invisible until `optimize:clear` is run. Use individual clear commands during development.
- **Use `optimize:clear` before deploy** if you're not running `optimize` afterward. A stale cache from a previous deployment causes confusion.
- **CI/CD Integration:** Warm up the cache in CI and include cached files in your deploy artifact. This speeds up deployment by shifting cache generation time to the build phase.
- **Monitoring:** After deployment, verify caches are active by checking `bootstrap/cache/` contents.

## Common Mistakes
- **Running `optimize` in development** and wondering why config/route changes don't take effect. Always run `optimize:clear` after `optimize` in development.
- **Assuming `optimize` runs `event:cache`.** In most Laravel versions, `event:cache` must be run separately. Check your version's command list.
- **Running `optimize` before `migrate` fails** because cached routes reference columns that don't exist yet. Run migrations first, then cache.
- **Not running `optimize:clear` after `composer update`.** New package providers may not register with stale cache.
- **Forgetting `optimize` in the deployment script.** The app runs in development mode — slower bootstrap and potential `env()` issues.

## Failure Modes
- **Partial Cache Failure:** If `config:cache` succeeds but `route:cache` fails (e.g., due to closures), `optimize` exits with an error but leaves config cached. The app is in an inconsistent state.
- **Stale Cache Across Deployments:** If `optimize:clear` is not run before a new `optimize`, old cache files from a previous deployment persist if the new cache generation differs.
- **Version Mismatch:** Upgrading Laravel between deployments can produce cache files from the old version that are incompatible with the new bootstrap code.
- **Deploy Script Failure:** If `optimize` fails in a deploy script, the script often continues. The app runs with partial or stale caches.

## Ecosystem Usage
- **Forge & Envoyer:** Both include `php artisan optimize` as the final step in their default deployment scripts. Envoyer also runs `event:cache` separately.
- **Laravel Vapor:** The `vapor build` command runs `optimize` automatically as part of the build process.
- **Laravel Octane:** Octane workers need caches to be built before starting the worker pool. `optimize` is part of the recommended Octane deployment flow.
- **Sail (Docker):** Local Sail environments typically do not run `optimize`. The `APP_ENV=local` check prevents accidental caching.
- **Serverless:** Platforms like Vapor and Bref run `optimize` during the build phase to minimize cold start time.

## Related Knowledge Units

### Prerequisites
- [Bootstrapper Sequence](../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md) — the bootstrap pipeline that optimize commands accelerate.
- [Config Caching](./config-caching/02-knowledge-unit.md) — first step in the optimize sequence.

### Related Topics
- [Route Caching](./route-caching/02-knowledge-unit.md) — second step in the optimize sequence.
- [Events Caching](./events-caching/02-knowledge-unit.md) — optional step, often run separately.
- [Services Cache](./services-cache/02-knowledge-unit.md) — implicitly regenerated during optimize.
- [Composer Autoloader Optimization](./composer-autoloader-optimization/02-knowledge-unit.md) — complementary to optimize for class loading.

### Advanced Follow-up Topics
- [Cache Invalidation Deployment](./cache-invalidation-deployment/02-knowledge-unit.md) — the clear-before-cache strategy.
- [Bootstrap Warmup in CI/CD](./bootstrap-warmup-in-cicd/02-knowledge-unit.md) — optimize as part of the CI pipeline.
- [Octane Boot Timing](../boot-order-timing/octane-boot-timing/02-knowledge-unit.md) — how optimize reduces Octane worker startup cost.

## Research Notes
- Laravel 7 included a `bootstrap/cache/compiled.php` file that was a concatenation of commonly used classes. This was removed in Laravel 8 as modern PHP autoloaders made it redundant.
- The `OptimizeCommand` source is at `src/Illuminate/Foundation/Console/OptimizeCommand.php`. It uses `$this->getLaravel()->environment()` to conditionally skip caching in non-production environments.
- Laravel 11 added more granular control: you can define which commands `optimize` runs via `optimizeCommands` in `bootstrap/app.php`.
- The `optimize` command's behavior can be extended by registering additional commands in the service container. Package developers can hook into the optimize pipeline.
