# Queue Deployment Safety Operations — Checklist

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Queue Deployment Safety
- **Knowledge Unit:** Queue Deployment Safety Operations
- **Last Updated:** 2026-06-22

---

## Prerequisites Checklist
- [ ] Horizon installed and configured (or `queue:work` with supervisor)
- [ ] Cache driver supports `queue:restart` (Redis, database, memcached — NOT array)
- [ ] Deployment pipeline with post-deploy hooks
- [ ] Access to `failed_jobs` table monitoring
- [ ] p99 job execution time is known (for timeout configuration)
- [ ] Feature flag infrastructure available (if using risky rollout)

## Implementation Checklist
- [ ] Deploy script includes `php artisan queue:restart` after code deploy
- [ ] Deploy script uses `php artisan horizon:terminate` (not `kill` or `systemctl stop`)
- [ ] Horizon timeout configured > p99 job execution time (2× recommended)
- [ ] All job classes with Eloquent model parameters use `SerializesModels` trait
- [ ] New constructor parameters have default values for backward compatibility
- [ ] Code deployed before migrations (code handles both old and new schema states)
- [ ] Feature flags gating risky job logic changes with flags disabled by default
- [ ] Staggered worker groups configured for high-risk deployments (if applicable)
- [ ] Phased migration plan in place for tables > 10M rows
- [ ] Config cache operations always followed by `queue:restart`

## Verification Checklist
- [ ] Workers restart and pick up new code within 5 minutes of `queue:restart`
- [ ] `horizon:terminate` completes gracefully (no jobs killed mid-execution)
- [ ] Post-deploy `failed_jobs` count within 10% of pre-deploy baseline
- [ ] Zero deserialization errors in failed_jobs exceptions
- [ ] Zero schema-code mismatch errors in worker logs
- [ ] Feature flags functional (enable/disable verified)
- [ ] Horizon status shows all supervisors running with new code
- [ ] Old payloads deserialize successfully on new workers (tested with representative payloads)

## Security Checklist
- [ ] `queue:restart` cache key not accessible from untrusted sources
- [ ] Config cache rebuilt with updated security-sensitive values before worker restart
- [ ] Feature flag management UI access restricted to authorized operators
- [ ] Post-deploy monitoring alert messages do not expose job payload data
- [ ] Credential rotations always trigger worker restart

## Performance Checklist
- [ ] `queue:restart` overhead: ~1ms per job (cache read) — negligible
- [ ] Worker cold boot: 100-500ms for first job after restart — acceptable
- [ ] `horizon:terminate` timeout does not exceed deployment pipeline patience
- [ ] Phased migrations do not lock production tables (verified with EXPLAIN)
- [ ] Job payload sizes are small (< 500 bytes) — indicative of `SerializesModels` usage

## Production Readiness Checklist
- [ ] Deployment runbook documented with exact command sequence
- [ ] Post-deploy monitoring automated (5, 10, 15 minute checks)
- [ ] Alert configured for `failed_jobs` spike > 10% within 15 minutes of deploy
- [ ] Rollback procedure documented: revert code → `queue:restart` → verify
- [ ] Stale lock recovery procedure documented (manual Redis key deletion)
- [ ] Failed job re-dispatch procedure documented for payload incompatibility recovery
- [ ] Deployment window communicated to team (who is on-call, expected duration)
- [ ] Staggered deployment groups documented with per-group verification criteria

## Common Mistakes to Avoid
- [ ] Not calling `queue:restart` after deploy (old code runs indefinitely)
- [ ] Removing constructor parameters (old payloads fail deserialization)
- [ ] Running migrations before code deploy (old workers crash on new schema)
- [ ] Hard-killing Horizon (stale locks, partial transactions)
- [ ] Not monitoring `failed_jobs` post-deploy (incompatibility discovered too late)
- [ ] Using `array` cache driver for `queue:restart` (signal not persisted)
- [ ] Deploying high-risk changes without feature flags (slow rollback)
- [ ] Clearing config cache without worker restart (stale config)

## Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review: deploy ordering, feature flag strategy, worker group configuration
- [ ] Security review: credential rotation handling, cache access, feature flag access control
- [ ] Performance review: timeout tuning, phased migration impact, cold boot overhead
- [ ] Testing review: backward-compatible payload deserialization tested
- [ ] Anti-pattern review: none of the 8 anti-patterns present
- [ ] Production readiness: runbook, monitoring, alerting, rollback all documented
