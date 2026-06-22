# Skill: Execute Safe Queue Deployments

## Purpose
Deploy Laravel application code safely when active queue workers are processing jobs, ensuring no job loss, no payload incompatibility, no stale locks, and no data corruption during the version transition.

## When To Use
Every production deployment where queue workers are actively processing jobs — which is almost every production Laravel deployment.

## When NOT To Use
Serverless environments (Vapor) with ephemeral workers; local development; deployments during fully drained queues in a scheduled maintenance window.

## Prerequisites
- Horizon installed and configured (or `queue:work` with supervisor)
- Cache driver supporting `queue:restart` (Redis, database, memcached — NOT array)
- Monitoring for `failed_jobs` table
- Deployment pipeline with post-deploy hooks

## Inputs
- Deployment script/CI pipeline
- Job classes with queue worker dependencies
- Database migration plan
- Feature flag system (if using risky rollout)
- p99 job execution time metrics

## Workflow
1. **Pre-deploy**: Document which job constructor signatures are changing. Verify backward compatibility (all new params have defaults).
2. **Deploy code**: Push new code to servers. New code handles both old and new schema states.
3. **Restart workers**: `php artisan queue:restart` — signals workers to reload with new code.
4. **Graceful Horizon restart**: `php artisan horizon:terminate` — workers finish current jobs, then exit. Supervisor restarts.
5. **Verify Horizon**: `php artisan horizon:status` — confirm all supervisors are running with new code.
6. **Run migrations**: `php artisan migrate --force` — schema changes applied. New code handles both states.
7. **Monitor failed_jobs**: For 15 minutes post-deploy, watch `failed_jobs` growth rate. Alert on spikes.
8. **Activate feature flags**: If using gradual rollout, enable new job logic flags after verification.
9. **Staggered deployment**: For multiple worker groups, repeat steps 2-7 for each group sequentially.

## Validation Checklist
- [ ] `queue:restart` executed after code deploy
- [ ] `horizon:terminate` used (not hard kill)
- [ ] Horizon timeout configured > p99 job execution time
- [ ] All job constructor changes are backward-compatible (new params have defaults)
- [ ] `SerializesModels` trait used on all jobs with Eloquent model parameters
- [ ] Code deployed before migrations (code handles both old and new schema)
- [ ] `failed_jobs` monitored for 15 minutes post-deploy
- [ ] Feature flags configured for risky job logic changes
- [ ] Phased migration plan for large table changes
- [ ] Config cache and route cache properly handled

## Common Failures
- Skipping `queue:restart` — old code processes indefinitely
- Removing constructor parameters — old payloads fail deserialization
- Running migrations before code deploy — old workers crash on new schema
- Hard-killing Horizon — stale locks, partial transactions
- Not monitoring `failed_jobs` — payload incompatibility discovered hours later
- Using `array` cache — `queue:restart` has no effect (signal not persisted)
- Deploying without `SerializesModels` — full model serialization breaks on schema changes

## Decision Points
- Graceful vs hard worker restart: always graceful (`horizon:terminate`)
- Code vs migration ordering: always code first
- Feature flag vs direct deploy: flag for Medium+ risk changes
- Single-group vs staggered deploy: staggered for High-risk changes
- Immediate vs phased migration: phased for tables > 10M rows

## Performance Considerations
- `queue:restart` adds ~1ms per job (cache read)
- Worker cold boot: 100-500ms for first job after restart
- `horizon:terminate` waits for current jobs to finish — configurable timeout
- Phased migrations: multiple deploy cycles, each with restart overhead

## Security Considerations
- `queue:restart` signal stored in cache — ensure cache is not accessible from untrusted sources
- Config cache must be rebuilt after deploy to pick up security-sensitive config changes
- Feature flag infrastructure must be secured (unauthorized flag toggling is a security risk)
- Post-deploy monitoring must not expose job payload data in alert messages

## Related Rules
- Rule 1: restart-queue-after-every-deploy
- Rule 2: use-serializes-models-on-all-jobs
- Rule 3: deploy-code-before-migrations
- Rule 4: graceful-horizon-terminate-with-timeout
- Rule 5: monitor-failed-jobs-post-deploy
- Rule 6: backward-compatible-constructor-changes

## Related Skills
- Implement Job Middleware
- Configure Queue Workers and Horizon
- Manage Database Migrations

## Success Criteria
Post-deployment: zero job deserialization failures, zero stale locks, zero schema-code mismatch errors, failed_jobs growth within normal bounds, all workers running new code within 5 minutes of deploy.
