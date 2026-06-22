# Skill: Queue Deployment Safety and Worker Lifecycle

## Purpose
Deploy code changes to systems with active queue workers without losing jobs, breaking serialized payloads, or causing billing state divergence. Master the deployment sequence (code → migrations → config cache → worker restart → monitoring), use feature flags for risky billing changes, and implement phased migrations for schema changes.

## When To Use
- Every production deployment to a system with active queue workers
- Before schema changes that modify columns, tables, or constraints used by queued jobs
- When renaming or refactoring job classes, models, or events referenced in serialized payloads
- When deploying new billing behavior that could have bugs
- When scaling Horizon supervisors or changing queue topology

## When NOT To Use
- For deployments that only change static assets (CSS, JS, images)
- For deployments to environments without active queue workers (dev, local)
- When the deployment platform already handles worker lifecycle (Forge, Envoyer, Vapor)

## Prerequisites
- Understanding of Laravel queue worker lifecycle (`queue:work`, `queue:restart`)
- Familiarity with Horizon `horizon:terminate` and supervisor auto-restart
- Knowledge of serialized job payload compatibility (class names, constructor signatures)
- Understanding of `config:cache` and why it must run before worker restart
- Familiarity with Laravel Pennant for feature flags

## Inputs
- The deployment pipeline (CI/CD script, Forge, Envoyer, custom script)
- The schema changes being deployed (new columns, dropped columns, renamed tables)
- The job classes being renamed or refactored
- Whether new billing behavior is being introduced (needs feature flag)
- The queue topology (which queues exist, how many workers)

## Workflow
1. **Deploy new code first** — Deploy application code before running destructive migrations. Old workers must be able to process serialized jobs against the new schema.
2. **Run reversible migrations** — Add nullable columns, add new tables. Never drop columns in the same deploy that stops using them.
3. **Cache configuration and routes** — Run `config:cache`, `route:cache`, `view:cache`, `event:cache` so workers pick up fresh configuration on restart.
4. **Restart queue workers** — Run `queue:restart` for `queue:work` daemons, `horizon:terminate` for Horizon. Workers gracefully finish current jobs, then restart with new code.
5. **Verify Horizon health** — Run `horizon:status` and check the dashboard. All supervisors should be active with correct worker counts.
6. **Monitor failed jobs for 15 minutes** — Check at 5, 10, 15 minutes. Any spike in failures indicates a serialization or compatibility issue.
7. **Keep old job classes as aliases when renaming** — `class OldJob extends NewJob {}` prevents deserialization failures for jobs queued before the rename.
8. **Gate new billing behavior behind feature flags** — Deploy with flag OFF. Enable for internal teams, then 1% of production, then ramp up.
9. **Plan column removals across two deploys** — Deploy N: add nullable column + populate. Deploy N+1: drop old column after queues are drained.

## Validation Checklist
- [ ] Deployment script deploys code before running migrations
- [ ] `config:cache` runs before `queue:restart` or `horizon:terminate`
- [ ] Workers are restarted gracefully (never force-killed with `kill -9`)
- [ ] Post-deploy monitoring of failed jobs for 15 minutes
- [ ] Horizon health verified after every deployment
- [ ] Renamed job classes keep old class as alias for one deploy cycle
- [ ] Schema changes use phased approach (add in N, remove in N+1)
- [ ] Risky billing changes gated behind feature flags
- [ ] No HTTP endpoint exposes `queue:restart`
- [ ] Rollback procedure documented and tested

## Common Failures
- Running migrations before code deploy — old workers crash on new schema
- Renaming a job class without an alias — all queued instances fail permanently
- Force-killing workers with `kill -9` — half-processed billing webhooks
- Not monitoring failed jobs after deploy — billing failures accumulate silently
- Deploying new billing code enabled for 100% of customers — bug affects everyone

## Decision Points
- **Is the queue guaranteed empty?** — If yes, class renames and column drops are safe without aliases/phasing
- **Is the new billing behavior risky?** — Gate behind a feature flag, deploy OFF, enable gradually
- **Are workers force-killed or gracefully restarted?** — Always graceful; force-kill only in emergencies

## Performance Considerations
- `queue:restart` is instant (sets a cache key). Workers restart within `sleep` seconds after finishing current job.
- `horizon:terminate` may take up to `timeout` seconds if a job is long-running.
- Config/route caching reduces worker boot time by 50-200ms per job.
- Non-blocking migrations are essential for large tables — use batched or online schema changes.

## Security Considerations
- Feature flags controlling billing behavior must be auditable — log every change
- `queue:restart` must never be exposed via HTTP — it's a CLI-only maintenance command
- Failed jobs table may contain serialized model data — restrict access
- Worker restarts should not invalidate user sessions or tokens

## Related Rules (from 05-rules.md)
- Deploy Code Before Running Destructive Migrations
- Keep Old Job Class as a Transition Alias When Renaming
- Use Feature Flags to Deploy Risky Billing Code Off-by-Default
- Prefer Serializing IDs or DTOs Over Full Eloquent Models in Jobs
- Never Expose queue:restart via HTTP Endpoint

## Related Skills
- Backward-compatible deployments (safe vs unsafe changes, phased migrations)
- Queue restart, Horizon verification (post-deploy monitoring)
- Webhook queue design (idempotent processing survives worker restarts)

## Success Criteria
- No job is lost or corrupted during deployment
- Old serialized payloads are processed correctly by new code (via aliases and phased migrations)
- New billing behavior is deployed behind feature flags with safe fallbacks
- Failed jobs are detected within 15 minutes of deployment
- Horizon is verified healthy after every deployment
