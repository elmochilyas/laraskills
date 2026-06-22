# Metadata
**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering / Billing Webhook Queues
**Knowledge Unit:** Queue Deployment Safety and Worker Lifecycle
**Generated:** 2026-06-22

# Quick Checklist (10-20 derived items)
- [ ] Deployment script deploys code before running migrations
- [ ] Deployment script restarts queue workers after config cache
- [ ] All schema changes use phased approach (add column in N, remove in N+1)
- [ ] Renamed classes keep old class as alias for one deploy cycle
- [ ] Workers restarted gracefully (`queue:restart` or `horizon:terminate`), never force-killed
- [ ] Post-deploy monitoring of failed jobs is automated or documented as manual step
- [ ] Risky billing changes gated behind feature flags (Pennant), off by default
- [ ] Config cache and route cache refreshed on every deploy
- [ ] No synchronous HTTP endpoints trigger `queue:restart`

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Deployment order**: (1) Deploy code, (2) Run reversible migrations, (3) Cache config/routes, (4) Restart workers, (5) Monitor
- **Schema change compatibility**: Add nullable columns in Deploy N, remove in Deploy N+1
- **Class rename transition**: Keep old class as alias for one deploy cycle, then remove
- **Blue-green deployment**: Blue drains old jobs, green starts with new code, no overlap
- **Feature flags**: Pennant for risky billing changes — deployed off, enabled gradually

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Deployment script runs `composer install --no-dev --optimize-autoloader`
- [ ] Deployment script runs `php artisan config:cache && php artisan route:cache`
- [ ] Deployment script runs `php artisan queue:restart` (for `queue:work` daemons)
- [ ] Deployment script runs `php artisan horizon:terminate` (for Horizon)
- [ ] Deployment script includes post-deploy monitoring step (check failed_jobs at 5, 10, 15 min)
- [ ] Old job class aliases include comment: "Remove after next deploy cycle when queues are drained"
- [ ] Feature flags gating new billing behavior default to OFF
- [ ] Column removal migrations separated from code changes that stop using those columns

# Performance Checklist
- `queue:restart` is instant (sets cache key); workers check on next iteration (after current job + sleep)
- `horizon:terminate` may take up to `timeout` seconds for long-running jobs
- Config/route caching reduces worker bootstrap time by 50-200ms per job
- Migrations during active workers must not lock tables for extended periods

# Security Checklist
- [ ] Feature flag changes logged with actor and timestamp for audit
- [ ] `queue:restart` never exposed via HTTP endpoint — CLI-only maintenance command
- [ ] Failed jobs table access restricted — contains serialized model and billing data
- [ ] Worker restarts do not invalidate active user sessions or tokens

# Reliability Checklist
- [ ] Deployment script uses `set -e` to abort on any failure
- [ ] Post-deploy monitoring detects failed jobs within 5 minutes of deploy
- [ ] Rollback procedure documented: deploy old code → config:cache → restart workers → retry failed jobs
- [ ] Supervisor `autorestart=true` verified for Horizon processes
- [ ] Phased migration strategy in place for large-table ALTER operations

# Testing Checklist
- [ ] Test deployment script in staging before production
- [ ] Test class rename with alias — verify old jobs deserialize correctly
- [ ] Test column addition/removal in two-deploy cycle — verify no jobs fail
- [ ] Test feature flag controls new billing behavior correctly (on/off)
- [ ] Test `queue:restart` and `horizon:terminate` graceful shutdown
- [ ] Test rollback procedure end-to-end

# Maintainability Checklist
- [ ] Deployment script under version control
- [ ] Phase 3 cleanup deploys documented with prerequisite queue verification step
- [ ] Transition aliases have documented removal timeline
- [ ] Multi-deploy column migration schedule communicated to team

# Anti-Pattern Prevention Checklist
- [ ] Prevent: kill -9 on queue workers (mid-job loss, no retry)
- [ ] Prevent: Migrations before code deploy (old workers crash on new schema)
- [ ] Prevent: Direct class rename without alias (permanent deserialization failures)
- [ ] Prevent: queue:restart exposed via HTTP (DoS vector)
- [ ] Prevent: No post-deploy monitoring (failed jobs accumulate silently)

# Production Readiness Checklist
- [ ] Deployment sequence documented and tested in staging
- [ ] `php artisan queue:restart` runs as part of every code deployment
- [ ] `php artisan horizon:terminate` runs for Horizon deployments
- [ ] Supervisor config has `autorestart=true` and appropriate `stopwaitsecs`
- [ ] Post-deploy monitoring automated or checklist-based for 15-minute window
- [ ] Feature flags (Pennant) configured for gradual rollout of billing changes
- [ ] Rollback procedure documented and accessible to on-call team
- [ ] Column-drop migration plan spans at least two deployment cycles

# Final Approval Checklist
- [ ] Architecture review completed (deployment ordering, transition strategy)
- [ ] Security review completed (feature flag audit, queue:restart access control)
- [ ] Performance impact assessed (graceful shutdown timing, config cache)
- [ ] Testing coverage adequate (deploy script, class rename, feature flags, rollback)
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Rules/Skills/Trees/Anti-Patterns
## Rules
- Deploy Code Before Running Destructive Migrations
- Keep Old Job Class as a Transition Alias When Renaming
- Use Feature Flags to Deploy Risky Billing Code Off-by-Default
- Prefer Serializing IDs or DTOs Over Full Eloquent Models in Jobs
- Never Expose queue:restart via HTTP Endpoint
## Anti-Patterns
- Kill -9 on queue workers
- Migrations before code deploy
- Direct class rename without alias
- queue:restart exposed via HTTP
- No post-deploy monitoring
