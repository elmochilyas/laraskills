# ECC Anti-Patterns — Cache Invalidation Deployment

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Cache Invalidation Deployment |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Building Caches on the Production Server
2. Manual Cache Invalidation via SSH
3. One-Size-Fits-All Cache Clear on Every Deploy
4. No Cache Verification After Deploy
5. Not Clearing Cache Before Regeneration

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — cache warmup triggers database calls during build
- Premature Caching — deploying with stale cache files from previous build

---

## Anti-Pattern 1: Building Caches on the Production Server

### Category
Security

### Description
Running `php artisan optimize` directly on the production server (e.g., via SSH or cron) rather than building caches in CI/CD or in a dedicated build step.

### Why It Happens
Smaller teams manage servers manually and run cache commands as part of the deploy process on the live server.

### Warning Signs
- Deployment runbook includes SSH commands to run `php artisan optimize` on production
- Cache is generated in the production environment, not in CI/CD
- Build dependencies (composer, extensions) required on production server

### Why It Is Harmful
Running cache commands on production exposes build logic and environment variables to the production filesystem. If the command fails or produces warnings, production state may be inconsistent. The production server must have all build dependencies installed, increasing the attack surface.

### Real-World Consequences
A developer SSHes into production and runs `php artisan optimize`. The `route:cache` step fails because a route file has a syntax error. The error message is printed to stdout — visible in the SSH session but not logged. The config and services caches were already written before the failure. Production now has a stale config cache and no route cache. Routes that depend on cached config work, but all routes fall back to uncached — silently degrading performance.

### Preferred Alternative
Build caches in CI/CD or during the build phase of a deployment pipeline. Deploy the pre-built cache files as part of the release artifact.

### Refactoring Strategy
1. Move `php artisan optimize` commands from production SSH to CI/CD deployment pipeline
2. For Docker builds, generate caches in the build stage
3. If CI/CD is not feasible, use a deployment tool (Envoyer, Deployer) that handles cache warmup in isolation

### Detection Checklist
- [ ] Cache commands run on production server
- [ ] Production server has build dependencies installed
- [ ] No CI/CD step for cache generation

### Related Rules
Cache Invalidation Deployment (04-standardized-knowledge.md): Build caches in CI/CD, not on the server.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Manual Cache Invalidation via SSH

### Category
Reliability

### Description
SSHing into production to run `php artisan optimize:clear` as a troubleshooting step, rather than automating invalidation in the deployment pipeline.

### Why It Happens
When something goes wrong post-deploy, developers instinctively SSH in and clear caches. Over time, this becomes the standard "fix."

### Warning Signs
- Team runbook includes "SSH and run optimize:clear" as the first troubleshooting step
- Manual cache clear is the known fix for post-deploy issues
- No automated cache invalidation in deployment pipeline

### Why It Is Harmful
Manual intervention is unrepeatable, unrecorded, and varies between team members. In multi-server environments, clearing caches on only one server masks the issue on others. The root cause (missing cache regeneration in deploy) is never fixed.

### Real-World Consequences
A team deploys new code without cache regeneration. The on-call engineer SSHes into server 1 and runs `optimize:clear`. The app works. The engineer doesn't SSH into servers 2-5. Users on servers 2-5 continue hitting stale caches. The ticket is closed as "fixed." Next deployment, the same issue occurs.

### Preferred Alternative
Automate cache invalidation and regeneration in the deployment pipeline. If a manual clear is needed, use a deployment command (e.g., `php artisan optimize:clear` via deployment tool) rather than SSH.

### Refactoring Strategy
1. Add `php artisan optimize:clear && php artisan optimize && php artisan event:cache` to the deployment script
2. Remove manual cache clear from troubleshooting runbooks
3. If deployment tool supports it, add a "clear cache" button/command for emergencies

### Detection Checklist
- [ ] Production cache cleared via SSH
- [ ] No automated cache invalidation in deploy
- [ ] Cache issues recurring across deployments

### Related Rules
Cache Invalidation Deployment (04-standardized-knowledge.md): Cache management should be automated in deployment.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: One-Size-Fits-All Cache Clear on Every Deploy

### Category
Performance

### Description
Running `php artisan optimize:clear` on every deployment even when no cacheable code changed (e.g., CSS-only change).

### Why It Happens
Deployment scripts use a fixed sequence of commands without checking whether cache invalidation is needed.

### Warning Signs
- Deploy script runs `optimize:clear` unconditionally on every deploy
- Infrastructure-only deployments trigger cache regeneration
- Team cannot describe when cache clear is necessary vs. unnecessary

### Why It Is Harmful
Running `optimize:clear` + `optimize` adds 5-30 seconds to every deployment. For frequent deployments (multiple per day), this accumulates to minutes of unnecessary downtime or delay. More importantly, it introduces a window where the app is uncached during the regenerate step.

### Real-World Consequences
A team deploys 20 times per day with a 15-second cache warmup step. That's 300 seconds (5 minutes) per day of deployment time spent regenerating caches that didn't need to change. Over a month: 2.5 hours of wasted deployment time.

### Preferred Alternative
Run cache commands conditionally: only clear and regenerate when config, routes, events, or providers have changed.

### Refactoring Strategy
1. Audit which file changes require cache regeneration
2. Use conditional logic in deployment scripts (check file modification times)
3. For infrastructure-only changes, skip cache commands entirely

### Detection Checklist
- [ ] Cache regenerated on every deploy regardless of change type
- [ ] Deploy time dominated by cache warmup
- [ ] Team cannot distinguish when cache clear is needed

### Related Rules
Cache Invalidation Deployment (04-standardized-knowledge.md): Invalidation triggers are code changes, not deployments.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: No Cache Verification After Deploy

### Category
Reliability

### Description
Deploying without verifying that cache files were generated correctly — assuming `optimize` succeeded without checking.

### Why It Happens
Deployment scripts run `php artisan optimize` and proceed without inspecting the output or verifying file existence.

### Warning Signs
- Deploy script runs `optimize` but ignores its exit code
- No check for cache file existence after deploy
- Post-deploy monitoring doesn't include cache freshness metrics

### Why It Is Harmful
If `optimize` fails partway through (e.g., `route:cache` throws on a Closure route), some caches may be written and others not. The application degrades silently — config cached, routes not — with no alert. Developers may not notice until users report slowness.

### Real-World Consequences
A `route:cache` step fails due to a Closure route. `config:cache` succeeded before it. The config is cached, but routes are not. Bootstrap time drops from 100ms to 70ms (config cached) but remains 30ms higher than fully optimized (route registration still runs). The team doesn't notice for weeks, assuming the app is fully cached.

### Preferred Alternative
Check exit codes of all cache commands. Verify cache file existence and freshness after deployment. Alert if any cache is missing or stale.

### Refactoring Strategy
1. Check the exit code of `php artisan optimize` — fail the deployment if non-zero
2. Add a post-deploy health check that verifies cache files exist
3. Monitor `LARAVEL_START` to middleware delta — a value above expected indicates missing caches

### Detection Checklist
- [ ] Deploy script ignores `optimize` exit code
- [ ] No post-deploy cache verification
- [ ] Bootstrap time higher than expected without alert

### Related Rules
Cache Invalidation Deployment (04-standardized-knowledge.md): Verify cache build succeeded before considering deployment complete.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Not Clearing Cache Before Regeneration

### Category
Reliability

### Description
Running `php artisan optimize` without first running `optimize:clear`, allowing stale cache files from previous builds to persist.

### Why It Happens
Deployment scripts run `php artisan optimize` alone, assuming it overwrites all cache files.

### Warning Signs
- Deploy script: `php artisan optimize && php artisan event:cache` without `optimize:clear` first
- Old cache file timestamps after deployment
- "Mixed" behavior where some config changes appear and others don't

### Why It Is Harmful
If `optimize` fails partway through, old cache files from the previous build remain. New code references new providers/routes/config keys, but old cache files reference old ones. This creates a mixed state where the application behaves inconsistently.

### Real-World Consequences
A deployment adds a new config key `services.new_api.key`. `optimize` runs without `optimize:clear` first. `config:cache` overwrites the config file successfully. `route:cache` fails. The old route cache (which references old config keys) remains. The application fails with "undefined array key" errors on routes that depend on the new config key.

### Preferred Alternative
Always run `php artisan optimize:clear` immediately before `php artisan optimize` to ensure a clean state.

### Refactoring Strategy
1. Update deployment script to run `optimize:clear` before `optimize`
2. Verify no cache files exist after `clear` and exist after `optimize`
3. For Docker builds, start with a clean `bootstrap/cache/` directory

### Detection Checklist
- [ ] `optimize` run without preceding `optimize:clear`
- [ ] Stale cache file timestamps after deploy
- [ ] Post-deploy bugs related to old cached values

### Related Rules
Cache Invalidation Deployment (04-standardized-knowledge.md): Always run optimize:clear before optimize.

### Related Skills
N/A

### Related Decision Trees
N/A
