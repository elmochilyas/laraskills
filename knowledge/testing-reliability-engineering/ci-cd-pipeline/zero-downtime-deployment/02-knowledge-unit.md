# Metadata
Domain: Testing & Reliability Engineering
Subdomain: CI/CD Pipeline Integration
Knowledge Unit: Zero-Downtime Deployment
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Zero-downtime deployment for Laravel applications updates production code without interrupting service to users. The primary tools are Deployer (PHP deployment tool) and Laravel Forge hooks, with strategies including blue/green deployment, rolling updates, and pre-warmed cache deployments. The critical challenges are database migration compatibility (old code running alongside new schema), queue job compatibility during deployment, and session/cache invalidation. Zero-downtime deployment requires architectural decisions about schema changes (expand-contract pattern), environment configuration, and deployment atomicity.

# Core Concepts
- **Deployer**: PHP-based deployment tool with Laravel recipe. Manages release folders, symlinks, shared files, and rollback.
- **Release folder**: Each deployment creates a timestamped directory (`releases/20260602120000/`). The `current` symlink points to the active release.
- **Symlink swap**: The deployment atomically switches the `current` symlink from old release to new release. Zero downtime if the app is configured via path, not timestamp.
- **Blue/green deployment**: Two identical environments (blue = live, green = staging). Deploy to inactive environment, then switch traffic. Complete isolation, but double infrastructure cost.
- **Rolling update**: Behind a load balancer, instances are updated one at a time. Each instance is taken out of service, updated, health-checked, and returned to service.
- **Graceful drain**: Before stopping an old instance, stop sending new traffic and allow in-flight requests to complete (up to a timeout).
- **Expand-contract migrations**: Database changes are deployed in two phases: expand (add new columns/tables, keep old ones working) → migrate data → contract (remove old columns/tables).

# Mental Models
- **Symlink swap as atomic transaction**: The symlink change is the atomic commit of a deployment. All setup (Composer install, migrations, asset build) happens in the new release folder before the swap.
- **Side-by-side compatibility**: During deployment, both old and new code may be running simultaneously. Database changes must be backward-compatible for the duration.
- **Warm-up before swap**: The new release should be fully warm (config cached, routes cached, views compiled) before traffic hits it. Cold start = slow first requests.
- **Rollback as redeploy**: Rolling back is deploying the previous release. The same zero-downtime principles apply. Rollback must be reversible and tested.

# Internal Mechanics
- **Deployer release structure**: `releases/20260602120000/` contains full application. `shared/` contains `.env`, `storage/`, `public/uploads`. `current` symlinks to active release.
- **Deployer Laravel recipe**: `dep deploy` runs: `git:clone` → `deploy:vendors` (Composer install) → `artisan:storage:link` → `artisan:config:cache` → `artisan:route:cache` → `artisan:view:cache` → `artisan:migrate` → `symlink` → `artisan:queue:restart`.
- **Migration ordering**: Migrations run before symlink swap (new code reads new schema) or after (old code must work with new schema). Expand-contract requires separate deploy steps.
- **Queue restart**: After symlink swap, `php artisan queue:restart` signals all queue workers to restart and pick up the new code. Workers gracefully finish their current job.
- **Horizon deployment**: Laravel Horizon requires `php artisan horizon:terminate` to gracefully restart all queue worker processes. Deployer's recipe handles this.

# Patterns
- **Pattern: Deployer standard deployment**
  - Purpose: Zero-downtime deploy with symlink swap
  - Benefits: Atomic switch; instant rollback (symlink to previous release)
  - Tradeoffs: Requires shared storage for uploads/sessions
  - Implementation: `dep deploy` using Laravel recipe. Configure `config/deploy.php` with server, repo, and shared paths.

- **Pattern: Expand-contract database migrations**
  - Purpose: Schema changes without downtime
  - Benefits: Old code continues working during migration
  - Tradeoffs: Requires two deployments (expand and contract); temporary redundant columns
  - Implementation: Phase 1: Add nullable column, deploy. Phase 2: Backfill data, deploy. Phase 3: Remove old column, deploy.

- **Pattern: Blue/green with load balancer**
  - Purpose: Complete environment isolation for high-traffic apps
  - Benefits: Instant switch; easy rollback (swap back)
  - Tradeoffs: Double infrastructure cost
  - Implementation: Two separate server groups. Deploy to green, health-check, switch DNS/load balancer to green.

- **Pattern: Warm-up deployment**
  - Purpose: Prevent cold-start performance degradation after deploy
  - Benefits: First users don't experience slow page loads
  - Tradeoffs: Adds 10-30 seconds to deploy time
  - Implementation: After cache build and symlink swap, curl the app's health endpoint and a few key pages to warm opcache and Laravel caches.

# Architectural Decisions
- **Deployer vs Forge**: Deployer for complex multi-server deployments with custom hooks. Forge for single-server or simple deployments. Deployer is more configurable; Forge is simpler.
- **Migration timing**: Run migrations before symlink swap (code reads new schema) or after (old code uses old schema). Before-swap is simpler but requires backward-compatible schema. After-swap requires old code to work with new schema (rarely practical).
- **Shared filesystem vs artifacts**: Deployer's shared folder approach works for single server or NFS. For multi-server, consider building deployment artifacts (Docker images) with code baked in.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero user-facing downtime | Complexity; requires careful migration planning | Worth it for production applications |
| Instant rollback via symlink | Previous releases need disk space | Keep last 3-5 releases |
| Backward-compatible migrations | Expand-contract takes 2-3 deploys | Plan schema changes carefully |
| Blue/green isolation | 2x infrastructure cost | Use for high-traffic or compliance-critical apps |

# Performance Considerations
- Symlink swap: <1ms. Instantaneous.
- Cache warm-up: 10-30 seconds (config cache, route cache, view cache). Pre-warm before swap.
- Migration time: 1 second to 30 minutes depending on data volume. Large migrations should use chunked processing.
- Queue restart: Workers finish current job (up to job timeout duration). Queue drain may take minutes.
- Opcache reset: PHP opcache must detect file changes. With symlink swap, opcache sees new file paths. Use `opcache.validate_timestamps=1` for automatic detection.

# Production Considerations
- **Rollback testing**: Test rollback procedure at least quarterly. Ensure rollback does not corrupt data or leave inconsistent state.
- **Migration locks**: Use MySQL's `GET_LOCK()` or PostgreSQL advisory locks for migrations that cannot run concurrently with application code.
- **Health check gate**: After symlink swap but before marking deployment successful, run health checks against the new release. Rollback on failure.
- **Session consistency**: Sessions stored in file system must be in shared path. Use Redis for session storage to avoid shared filesystem dependency.
- **Asset versioning**: Use Laravel Mix/Vite versioning to prevent stale CSS/JS from being served after deployment. Old code references old assets; no cache-busting issues.

# Common Mistakes
- **Mistake: Running destructive migrations during deploy**
  - Why: `Schema::drop('old_table')` in a migration
  - Why harmful: Old code still running references old table; 500 errors for in-flight requests
  - Better: Use expand-contract; drop columns/tables in a separate deployment after old code is fully drained

- **Mistake: Not testing rollback**
  - Why: "We'll fix forward instead"
  - Why harmful: When forward fix is impossible (corrupt data, incompatible change), rollback fails and downtime extends
  - Better: Test rollback in staging before every production deploy

- **Mistake: Cache not pre-warmed**
  - Why: Config/route/view cache built but page cache not warmed
  - Why harmful: First 100 users after deploy experience 2-5 second page loads (config loading, route matching, view compilation)
  - Better: Curl critical pages after symlink swap to warm caches

- **Mistake: Ignoring queue job compatibility**
  - Why: New code dispatches jobs with new serialization format
  - Why harmful: Old queue workers cannot deserialize new job format; jobs fail
  - Better: Ensure job serialization is backward-compatible or drain old queue workers before deploy

# Failure Modes
- **Migration failure during deploy**: Schema migration fails, deploy stops. Application is in inconsistent state (old code with partially migrated schema). Pre-validate migrations on a copy of the database.
- **Symlink race condition**: Request arrives during symlink swap, reads new bootstrap file but old config file (or vice versa). Extremely rare but possible. Solution: use atomic rename.
- **Disk space exhaustion**: Releases accumulate; disk fills up. Configure Deployer to keep only last 5 releases. Monitor disk space.
- **Queue worker mismatch**: Old workers running after deploy. New code's jobs fail on old workers. Use `php artisan queue:restart` (or `horizon:terminate`) and wait for workers to restart.
- **Shared file permission mismatch**: New release has different file permissions if built with different user. Ensure consistent umask in deploy scripts.

# Ecosystem Usage
- **Laravel core**: Laravel's documentation recommends Deployer for zero-downtime deployment. The framework is designed to work with the symlink-swap pattern.
- **Laravel Forge**: Forge provides Quick Deploy with zero-downtime via queue worker restart and daemon management. Supports deployment scripts for custom commands.
- **Laravel Vapor**: Vapor handles zero-downtime natively via AWS Lambda version management. Each deployment creates a new Lambda version; Vapor switches traffic atomically.
- **Deployer**: The `deployer/deployer` package (14k+ stars) includes a Laravel recipe with all standard hooks. Community recipes extend it for Horizon, Nova, and Spark.

# Related Knowledge Units
- **Prerequisites**: Linux server administration, Nginx/Apache configuration, Database migration patterns
- **Related Topics**: Post-deployment health checks, CI/CD pipeline design, Queue management with Horizon
- **Advanced Follow-up**: Docker-based Laravel deployment, Kubernetes deployment for Laravel, Blue/green infrastructure automation

# Research Notes
- Deployer's `current` symlink pattern is the most widely used zero-downtime approach for Laravel; it works with both Nginx and Apache by setting the document root to the `current` symlink
- The expand-contract migration pattern is essential for zero-downtime; it adds 2-3 deployment steps for each schema change but prevents the most common deployment failure: old code reading new schema
- Queue draining during deployment is a known challenge; `php artisan horizon:terminate` tells Horizon workers to finish their current job and exit, but in-flight jobs may take up to the job timeout value (default 60s for Horizon) to complete
- Laravel's configuration caching (`php artisan config:cache`) must be re-run after each deploy; the cached config file is environment-specific and cannot be shared across releases
- Opcache file path changes with each Deployer release (new release folder); `opcache.validate_timestamps=0` is not recommended with Deployer because file paths change with each release; use `opcache.validate_timestamps=1` with `opcache.revalidate_freq=2`
