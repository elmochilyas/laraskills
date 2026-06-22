# Skill: Backward-Compatible Deployments with Queued Jobs

## Purpose
Deploy code changes that modify queued job classes, model schemas, or constructor signatures without breaking serialized job payloads already in the queue. Master safe vs. unsafe changes, phased migration strategies, class rename transition aliases, and DTO-based job serialization for long-term deployment safety.

## When To Use
- Every deployment that modifies queued job classes or constructor signatures
- When renaming or restructuring job classes (e.g., `ProcessOrder` → `ProcessOrderJob`)
- When adding or removing columns from tables that serialized jobs reference
- When changing model attributes that existing jobs access on deserialization
- During any billing system migration where old queued jobs reference old schema

## When NOT To Use
- For deployments with zero queued jobs (queue verified empty)
- For simple config or view changes with no job impact
- During scheduled maintenance windows where queues are drained before deploy
- During initial development before any jobs exist in production

## Prerequisites
- Understanding of PHP serialization and how Laravel serializes job payloads
- Familiarity with `SerializesModels` trait and its limitations
- Knowledge of safe vs. unsafe schema changes for queued jobs
- Understanding of Laravel Pennant for feature flag-driven deployments
- Familiarity with blue-green deployment patterns

## Inputs
- The job classes being modified, renamed, or refactored
- The schema changes being deployed (new columns, dropped columns, type changes)
- Whether the queue has pending jobs (queue depth check)
- The constructor signature changes (new parameters, removed parameters, type changes)
- Whether new billing behavior is being introduced (needs feature flag)

## Workflow
1. **Classify each change as safe or unsafe** — Safe: adding nullable columns, adding optional constructor parameters with defaults, adding new methods. Unsafe: renaming classes, changing constructor signatures, removing columns jobs reference.
2. **For safe changes** — Deploy immediately. No transition period needed.
3. **For unsafe changes, plan a phased deployment** — Phase 1: deploy dual-format code handling both old and new. Phase 2: drain old jobs (wait for queue depth to reach zero). Phase 3: deploy clean code + run migration to remove old format.
4. **For class renames, create transition aliases** — `class OldName extends NewName {}` prevents deserialization failures. Remove the alias in the next deploy cycle.
5. **For column removals, split across two deploys** — Deploy N: add new nullable column + populate via background job. Deploy N+1: drop old column after queue is verified empty.
6. **Serialize IDs or DTOs instead of full Eloquent models** — Re-fetch the model in `handle()`. This eliminates the risk of deserialization failures from schema changes.
7. **Gate new billing behavior behind feature flags** — Deploy with flag OFF. Enable for internal teams, then 1% of production, then ramp up over hours/days.
8. **Verify queue depth before Phase 3 cleanup** — Use `php artisan queue:monitor` or Horizon dashboard. Never assume "it's been enough time."

## Validation Checklist
- [ ] Before renaming a job class, transition alias is created or queue is verified empty
- [ ] Adding nullable columns: safe to deploy immediately (no transition needed)
- [ ] Changing constructor parameters: new parameters are optional with defaults
- [ ] Removing model attributes: kept during transition; dropped only after old jobs drain
- [ ] Feature flags used for new billing behavior — deployed OFF, enabled gradually
- [ ] Jobs serialize IDs or DTOs, not full Eloquent models
- [ ] Config keys that jobs reference are not renamed within a single deployment
- [ ] Blue-green deployments drain old workers before decommission
- [ ] Queue depth verified at zero before Phase 3 cleanup deploy
- [ ] Column-drop migrations separated from code changes that stop using those columns

## Common Failures
- Dropping a column in the same deploy that stops using it — old serialized jobs crash
- Renaming a job class without keeping an alias — all queued instances fail permanently
- Serializing full Eloquent models — every schema change becomes a deployment risk
- Not verifying queue depth before cleanup deploy — old-format jobs remain and fail
- Deploying new billing behavior for 100% of customers — bug affects everyone

## Decision Points
- **Is the change safe or unsafe?** — Safe changes deploy immediately; unsafe changes need phasing
- **Is the queue empty?** — If yes, unsafe changes are safe (no old serialized payloads)
- **Should the job serialize a model or an ID?** — Default to IDs; re-fetch in `handle()`
- **Does new billing behavior need a feature flag?** — Yes, if a bug could cause financial impact

## Performance Considerations
- Dual-format code in Phase 1 has negligible performance impact (one if/else branch)
- Background migration jobs for column population should use chunking to avoid table locks
- Blue-green deployments require double the server capacity during transition
- Queue depth verification before Phase 3 adds a few minutes to deployment time

## Security Considerations
- Feature flags controlling billing behavior must be auditable — log every flag change
- Blue-green environments must have the same security configuration (firewall, secrets)
- Config keys containing secrets must not be renamed without coordinating secret rotation
- Failed jobs table may contain serialized model data — restrict access

## Related Rules (from 05-rules.md)
- Add Columns in Deploy N, Remove Columns in Deploy N+1
- Serialize Identifiers, Not Full Eloquent Models, in Job Constructors
- Never Rename a Job Class Without a Transition Alias
- Deploy New Billing Behavior Behind a Feature Flag That Defaults to OFF
- Verify Queue Depth Is Zero Before Cleanup Deploy

## Related Skills
- Queue restart, Horizon verification (post-deploy monitoring)
- Queue deployment safety (worker lifecycle during deploys)
- Feature flags with Laravel Pennant (gradual rollout for billing changes)

## Success Criteria
- No serialized job fails due to a deployment change
- Class renames include transition aliases until old jobs drain
- Column removals are phased across two deploys
- New billing behavior is deployed behind feature flags with safe fallbacks
- Jobs serialize IDs or DTOs, not full Eloquent models, by default
