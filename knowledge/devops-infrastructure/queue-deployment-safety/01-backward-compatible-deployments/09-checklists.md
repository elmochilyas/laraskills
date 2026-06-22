# Metadata
**Domain:** DevOps & Infrastructure
**Subdomain:** Queue Deployment Safety
**Knowledge Unit:** Backward-Compatible Deployments with Queued Jobs
**Generated:** 2026-06-22

# Quick Checklist (10-20 derived items)
- [ ] Before renaming a job class, existing queue is empty or a transition alias is created
- [ ] Adding nullable columns: safe to deploy immediately (no transition needed)
- [ ] Changing constructor parameters: new parameters are optional with defaults; old parameters not removed
- [ ] Removing model attributes: kept during transition period; only dropped after old jobs drain
- [ ] Feature flags (Pennant) used for new billing behavior — deployed off, tested, enabled gradually
- [ ] Jobs serialize IDs or DTOs rather than full Eloquent models
- [ ] Config keys that jobs reference are not renamed within a single deployment
- [ ] Blue-green deployments drain old workers before decommission
- [ ] Queue depth verified at zero before Phase 3 cleanup deploy
- [ ] Column-drop migrations are separated from code changes that stop using those columns

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Phase 1 (Dual-format)**: Deploy code handling both old and new formats, add nullable columns
- **Phase 2 (Drain)**: Monitor queues until old-format jobs are processed
- **Phase 3 (Cleanup)**: Remove old columns, old class aliases, old code paths — only after queue depth verified zero
- **Feature flags**: Pennant gates new behavior — off by default, enabled for beta teams first
- **Serialization strategy**: IDs/DTOs preferred over full Eloquent models

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Old class alias: `class OldJobName extends NewJobName { /* Transition alias */ }`
- [ ] New constructor parameters use defaults: `public ?string $newParam = null`
- [ ] Column additions: nullable, added in Deploy N, populated by background job
- [ ] Column removals: only in Deploy N+1 after all old jobs drained
- [ ] Config key migration: old key kept alongside new key during transition
- [ ] Feature flag definition: `Feature::define('billing-v2', fn (Team $team) => $team->isInBeta())`
- [ ] Job `handle()` checks feature flag and falls back to old behavior

# Performance Checklist
- Dual-format code paths add negligible runtime overhead (a single feature flag check)
- Queue depth monitoring for Phase 2 completion: check every 5 minutes until zero
- Blue-green deployments: blue workers drain in `stopwaitsecs` seconds maximum
- Config cache rebuild before worker restart adds ~1-2 seconds to deploy time

# Security Checklist
- [ ] Feature flag changes logged with actor and timestamp
- [ ] Old class aliases don't extend permissions or access beyond new class
- [ ] Config keys transition doesn't expose old secrets after migration
- [ ] Column removal doesn't delete audit trail data needed for compliance

# Reliability Checklist
- [ ] Multi-phase deploy strategy prevents all jobs from failing during transition
- [ ] Feature flags enable instant rollback of billing changes (no deploy needed)
- [ ] Queue depth verification before Phase 3 prevents premature cleanup
- [ ] Blue-green deploys provide rollback environment if green fails health check
- [ ] Background data migration jobs on dedicated queue (don't compete with billing)

# Testing Checklist
- [ ] Test Phase 1 dual-format code handles both old and new job payloads
- [ ] Test class alias correctly deserializes old class name into new class
- [ ] Test feature flag toggles between old and new billing behavior
- [ ] Test that old column removal in Phase 3 doesn't break existing API queries
- [ ] Test config key migration with both old and new keys present
- [ ] Test blue-green worker drain before decommission

# Maintainability Checklist
- [ ] Transition aliases have documented removal timeline (remove after next deploy)
- [ ] Multi-phase deploy plan documented in deployment runbook
- [ ] Feature flag cleanup tracked: remove old code path after new path at 100% for one week
- [ ] Column removal schedule communicated to team with migration ticket

# Anti-Pattern Prevention Checklist
- [ ] Prevent: Dropping columns in same deployment as code change
- [ ] Prevent: Renaming class without transition alias
- [ ] Prevent: Assuming queue:restart makes everything safe (doesn't help serialized jobs)
- [ ] Prevent: Serializing full Eloquent models with SerializesModels as safety net
- [ ] Prevent: Deploying new billing behavior enabled for all customers without feature flag

# Production Readiness Checklist
- [ ] Transition aliases created for any renamed job classes
- [ ] Feature flags configured for new billing behavior, default OFF
- [ ] Column-drop migration plan spans at least two deployment cycles
- [ ] Queue depth verification step in Phase 3 deploy checklist
- [ ] Blue-green or rolling deployment strategy documented
- [ ] Rollback procedure tested and accessible
- [ ] All new nullable columns added, none removed in current deploy

# Final Approval Checklist
- [ ] Architecture review completed (multi-phase deploy strategy, serialization approach)
- [ ] Security review completed (feature flag audit, config key migration)
- [ ] Performance impact assessed (dual-format overhead, queue drain timing)
- [ ] Testing coverage adequate (dual-format, class alias, feature flag, column migration)
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Rules/Skills/Trees/Anti-Patterns
## Rules
- Add Columns in Deploy N, Remove Columns in Deploy N+1
- Serialize Identifiers, Not Full Eloquent Models, in Job Constructors
- Never Rename a Job Class Without a Transition Alias
- Deploy New Billing Behavior Behind a Feature Flag That Defaults to OFF
- Verify Queue Depth Is Zero Before Cleanup Deploy (Phase 3)
## Anti-Patterns
- Dropping columns in the same deployment as code change
- Renaming a class without a transition alias
- Assuming queue:restart makes everything safe
- Serializing Eloquent models with SerializesModels as a safety net
