# ECC Anti-Patterns — Bootstrap Warmup in CI/CD

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Bootstrap Warmup in CI/CD |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Manual Warmup via SSH
2. Skipping Warmup for Emergency Deploys
3. One Pipeline for All Environments
4. Warmup After Traffic Switch
5. Cache Built with Wrong Environment Variables

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — warmup triggers database calls if providers resolve services during cache build
- Premature Caching — warming cache before all config/route/event changes are finalized

---

## Anti-Pattern 1: Manual Warmup via SSH

### Category
Deployment

### Description
SSHing into production servers to run `php artisan optimize` manually instead of automating cache generation in CI/CD.

### Why It Happens
Developers skip CI/CD setup and warm caches by hand as an "occasional" task.

### Warning Signs
- Deployment runbook includes "SSH into server and run optimize"
- Cache files are regenerated during incidents by hand
- No CI/CD step for cache warmup

### Why It Is Harmful
Manual warmup is error-prone, unrepeatable, and does not scale. For multi-server deployments, each server must be warmed individually — a process that is almost always forgotten for some servers.

### Real-World Consequences
A production incident requires a hotfix. The developer SSHes into server 1, runs `optimize`, and sees the fix. Servers 2-4 are not warmed. 75% of traffic hits uncached or stale-cached code. Users see mixed behavior — some get the fix, others don't.

### Preferred Alternative
Automate cache warmup as a CI/CD deployment step. For Docker, include cache generation in the build stage.

### Refactoring Strategy
1. Add `php artisan optimize:clear && php artisan optimize && php artisan event:cache` to the deployment pipeline
2. For multi-server, ensure each server runs warmup before accepting traffic
3. Remove manual warmup from deployment runbooks

### Detection Checklist
- [ ] Manual SSH-based warmup in deployment runbook
- [ ] No CI/CD step for cache regeneration
- [ ] Inconsistent cache state across servers

### Related Rules
Bootstrap Warmup in CI/CD (04-standardized-knowledge.md): Warm caches before traffic is routed.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Skipping Warmup for Emergency Deploys

### Category
Deployment

### Description
Deploying urgent hotfixes without cache warmup, thinking "it's a small change."

### Why It Happens
Under pressure, developers prioritize speed and assume a small code change doesn't need cache regeneration.

### Warning Signs
- Deployment script has an "emergency mode" that skips cache warmup
- Post-deploy monitoring shows elevated bootstrap times
- Hotfix deployments described as "skip optimize, just deploy"

### Why It Is Harmful
Even a 2-line config change requires cache rebuild because the cached config file is a snapshot. Without warmup, every request pays 50-150ms bootstrap penalty until caches regenerate naturally or the next full deployment occurs.

### Real-World Consequences
A "quick" security patch is deployed without warmup. For 4 hours until the next scheduled deployment, all 10,000 requests per hour pay 80ms extra bootstrap time. Total lost time: 800 seconds of CPU time wasted.

### Preferred Alternative
Always run cache warmup as part of every deployment, including hotfixes. The 5-10 seconds of warmup time is negligible compared to the performance cost of running uncached.

### Refactoring Strategy
1. Remove the "skip warmup" option from emergency deploy scripts
2. If warmup time is genuinely critical, use `config:cache` alone (fastest single cache)
3. Monitor bootstrap times post-deploy to catch missed warmup

### Detection Checklist
- [ ] "Emergency deploy" script skips cache warmup
- [ ] Bootstrap time spikes after hotfix deployments
- [ ] Team policy allows skipping warmup for urgent changes

### Related Rules
Bootstrap Warmup in CI/CD (04-standardized-knowledge.md): Every production deployment benefits from warmup.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: One Pipeline for All Environments

### Category
Deployment

### Description
Using the same cached artifacts (config, routes, events) for staging and production environments.

### Why It Happens
CI/CD pipelines are shared across environments for efficiency. The same build step produces artifacts deployed to both staging and production.

### Warning Signs
- Single `php artisan optimize` run whose output is deployed to multiple environments
- Staging and production share the same cached config values
- Environment detection in config files (`env('APP_ENV')`) resolved to one value for all environments

### Why It Is Harmful
Config values differ between environments — database names, API keys, debug settings. A cache built with staging's `.env` values deployed to production means production runs with staging's database credentials and debug mode settings.

### Real-World Consequences
A staging build caches `APP_DEBUG=true`. The cache artifact is deployed to production. Production now shows full stack traces to users. Sensitive information (DB credentials, file paths, query parameters) is exposed in error pages for all production users.

### Preferred Alternative
Build caches separately for each environment using that environment's `.env` values. For Docker, build the image per-environment or inject env vars at container start.

### Refactoring Strategy
1. Generate caches in the deploy step for each environment, not in the shared build step
2. Use environment-specific CI jobs for cache generation
3. Verify cached values match expected environment before deploying

### Detection Checklist
- [ ] Single cache build deployed to multiple environments
- [ ] `APP_ENV` value in cached config doesn't match runtime environment
- [ ] Environment-specific secrets shared across environments

### Related Rules
Bootstrap Warmup in CI/CD (04-standardized-knowledge.md): Include environment-appropriate values when building caches.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Warmup After Traffic Switch

### Category
Deployment

### Description
Switching traffic to a new deployment first, then running cache warmup.

### Why It Happens
Deployment scripts run warmup commands in the "activate" hook after the symlink swap or load balancer update.

### Warning Signs
- Warmup commands run after traffic is routed to new deployment
- First requests to new deployment time out or are slow
- Deployment script has warmup in the "post-activate" phase

### Why It Is Harmful
The first requests to a new deployment hit an uncached application. Each request pays 50-150ms bootstrap penalty. In auto-scaling environments, this can trigger false positive health check failures.

### Real-World Consequences
A deployment to Kubernetes warms caches after the pod becomes Ready and starts receiving traffic. The first 50 requests to each new pod time out because bootstrap takes 150ms uncached. The load balancer marks pods as unhealthy and routes traffic away, causing a deployment failure.

### Preferred Alternative
Warm caches before traffic is routed. In symlink-swap deployments, run warmup in the new release directory before swapping the symlink.

### Refactoring Strategy
1. Move cache warmup commands to before the traffic switch step
2. For symlink-swap: run warmup in the new release directory, then swap
3. For Kubernetes: add an initialization container that warms caches before the main container starts

### Detection Checklist
- [ ] Warmup runs in post-activate or post-switch phase
- [ ] First requests to new deployment are slow
- [ ] Health check failures during deployment

### Related Rules
Bootstrap Warmup in CI/CD (04-standardized-knowledge.md): Warm caches before traffic is routed.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Cache Built with Wrong Environment Variables

### Category
Security

### Description
Building bootstrap caches in CI/CD using development or CI-specific environment variables instead of production-like values.

### Why It Happens
CI/CD pipelines use simplified `.env` files for testing. The same pipeline generates caches that are deployed to production.

### Warning Signs
- CI/CD `.env` has placeholder values for secrets
- Production uses different database, Redis, or mail credentials
- Cached config file contains CI/CD values when inspected

### Why It Is Harmful
Cached config files freeze `env()` calls at build time. If the CI/CD `.env` has different values than production, those incorrect values are frozen in the cache. Production runs with wrong database credentials, API keys, or service configurations.

### Real-World Consequences
CI/CD uses `DB_DATABASE=myapp_test` for testing. The cache is built with this value and deployed to production. Production attempts to connect to `myapp_test` database — which doesn't exist in production. The entire application is down with database connection errors.

### Preferred Alternative
Use production-like environment variables when building caches. For secrets, inject them via CI/CD secrets or build the cache on the production server.

### Refactoring Strategy
1. Store production environment variables as CI/CD secrets
2. Export production env vars before running `php artisan optimize`
3. Verify cached config values match production by inspecting the output artifact
4. For maximum security, build caches on the production server during deployment

### Detection Checklist
- [ ] CI/CD `.env` differs from production `.env`
- [ ] Cached config contains non-production values
- [ ] Database or API connection issues after deployment

### Related Rules
Bootstrap Warmup in CI/CD (04-standardized-knowledge.md): Use production-like environment variables when building caches.

### Related Skills
N/A

### Related Decision Trees
N/A
