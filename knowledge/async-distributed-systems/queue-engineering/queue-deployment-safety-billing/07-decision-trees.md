# Decision Trees for Queue Deployment Safety

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering / Billing Webhook Queues |
| Knowledge Unit | Queue Deployment Safety and Worker Lifecycle |
| Related KUs | Backward-compatible deployments, Queue restart & Horizon verify, Webhook queue design |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-QDS-001 | What is the correct deployment sequence for this change? | P0 |
| DT-QDS-002 | Does this class rename need a transition alias? | P0 |
| DT-QDS-003 | Should this schema change be phased across two deploys? | P0 |
| DT-QDS-004 | Does this billing change need a feature flag? | P1 |

---

## DT-QDS-001: What Is the Correct Deployment Sequence for This Change?

### Decision Context
Deploying to a system with active queue workers requires careful ordering. Deploying migrations before code breaks old workers. Restarting workers before caching config means they load stale values. The correct sequence prevents job failures during deployment.

### Decision Criteria
- Does the deployment include code changes?
- Does the deployment include database migrations?
- Does the deployment include configuration changes?
- Are there active queue workers?

### Decision Tree

```
Are there active queue workers?
├── NO → Standard deploy: code → migrations → config:cache. No worker restart needed.
├── YES → Does the deployment include code changes?
    ├── NO → Does it include config changes?
    │   ├── YES → config:cache → queue:restart (workers pick up new config)
    │   └── NO → Static asset deploy. No worker restart needed.
    ├── YES → Does it include destructive migrations (column drops, renames)?
        ├── YES → DEPLOY CODE FIRST → add nullable columns → restart workers → drop old columns in NEXT deploy
        └── NO → Deploy code → run non-destructive migrations → config:cache → queue:restart/horizon:terminate → verify Horizon → monitor 15min
```

### Rationale
The deployment sequence is designed to ensure old workers can always process jobs against the current schema, and new workers pick up new code and config after restart. Deploying code first means old workers running old code can handle the new schema (nullable columns are inert). Restarting after config:cache ensures workers load fresh configuration.

### Recommended Default
**Standard sequence: (1) deploy code, (2) run migrations, (3) config:cache + route:cache, (4) queue:restart + horizon:terminate, (5) verify Horizon, (6) monitor 15 minutes.** For destructive schema changes, split across two deploys.

### Risks Of Wrong Choice
- **Migrations before code**: Old workers crash on new schema constraints. Jobs fail silently.
- **Restart before config:cache**: Workers restart with stale config. New config values never take effect.

### Related Rules
- Deploy Code Before Running Destructive Migrations

---

## DT-QDS-002: Does This Class Rename Need a Transition Alias?

### Decision Context
When renaming a job class that may have instances in the queue, the old serialized payload references the old fully-qualified class name. PHP's autoloader can't find the old class after the rename. A transition alias (`class OldName extends NewName {}`) bridges the gap.

### Decision Criteria
- Is the queue guaranteed empty before deploy?
- Has the job class ever been dispatched to the queue?
- Is the class a queued job (implements `ShouldQueue`)?

### Decision Tree

```
Is the class a queued job (implements ShouldQueue)?
├── NO → No alias needed. Non-queued classes aren't serialized in the queue.
├── YES → Is the queue guaranteed empty before deploy?
    ├── YES → No alias needed. No serialized instances exist.
    ├── NO → Has the job class ever been dispatched?
        ├── NO → No alias needed. No serialized instances exist.
        └── YES → CREATE TRANSITION ALIAS: class OldName extends NewName {}
            └── Remove alias in the next deploy cycle after queues are drained.
```

### Rationale
PHP serialization stores the fully-qualified class name. Jobs queued as `App\Jobs\ProcessOrder` cannot be deserialized as `App\Jobs\ProcessOrderJob`. The empty alias `class ProcessOrder extends ProcessOrderJob {}` allows old payloads to deserialize into the alias, which inherits all behavior from the new class.

### Recommended Default
**When in doubt, create the alias.** The cost is one empty class file; the benefit is preventing permanent deserialization failures for all queued instances.

### Risks Of Wrong Choice
- **No alias when needed**: Permanent deserialization failures. All jobs queued before the rename fail. Manual replay required — for billing, this means re-fetching from Stripe's API.
- **Alias when not needed**: One extra empty class file. Negligible cost.

### Related Rules
- Keep Old Job Class as a Transition Alias When Renaming

---

## DT-QDS-003: Should This Schema Change Be Phased Across Two Deploys?

### Decision Context
Dropping or renaming a database column that serialized jobs reference causes deserialization failures. The safe approach is to add the new column in deploy N, populate it, and drop the old column in deploy N+1 after all old jobs have drained.

### Decision Criteria
- Does any queued job reference the column being dropped/renamed?
- Is the queue guaranteed empty before deploy?
- Is the column referenced by `SerializesModels` model re-fetching?

### Decision Tree

```
Is the change adding a new column or new table?
├── YES → SAFE TO DEPLOY IMMEDIATELY. New nullable columns are inert to old code.
├── NO → Is the change dropping or renaming an existing column?
    ├── YES → Do any queued jobs reference this column?
        ├── YES → Is the queue guaranteed empty?
        │   ├── YES → Safe to drop in one deploy.
        │   └── NO → PHASE ACROSS TWO DEPLOYS: add nullable in N, drop in N+1.
        ├── NO → Safe to drop (no job references it).
        └── UNKNOWN → Assume yes. PHASE ACROSS TWO DEPLOYS.
    └── NO → Non-destructive change (type cast, index). Deploy normally.
```

### Rationale
Jobs serialized before the deploy may reference the old column by name. If the column is dropped, the model re-fetch fails. Phasing across two deploys ensures old jobs (referencing the old column) are processed before the old column is removed.

### Recommended Default
**Default to phasing column removals across two deploys.** Only skip the phasing if the queue is verified empty or no job references the column.

### Risks Of Wrong Choice
- **No phasing when needed**: Deserialization failures for all jobs referencing the dropped column. Billing webhooks lost.
- **Phasing when not needed**: One extra deploy cycle. Negligible cost.

### Related Rules
- Deploy Code Before Running Destructive Migrations

---

## DT-QDS-004: Does This Billing Change Need a Feature Flag?

### Decision Context
New billing behavior (invoice calculation changes, subscription sync logic, tax handling) carries risk: a bug can overcharge, undercharge, or grant/deny features incorrectly. A feature flag limits the blast radius to a controlled cohort and enables instant rollback without re-deploying.

### Decision Criteria
- Is this a new billing behavior (not a bug fix)?
- Could a bug in this code cause financial impact (overcharge, undercharge)?
- Is the change being deployed to all customers simultaneously?
- Is there a safe fallback to the previous behavior?

### Decision Tree

```
Is this a bug fix for existing behavior?
├── YES → No feature flag needed. Deploy directly (the fix is universally beneficial).
├── NO → Is this a new billing behavior or modified billing logic?
    ├── NO → No feature flag needed (non-billing change).
    ├── YES → Could a bug cause financial impact (overcharge, undercharge, wrong features)?
        ├── YES → FEATURE FLAG REQUIRED. Deploy OFF, enable gradually.
        │   └── Is there a safe fallback to the previous behavior?
        │       ├── YES → Deploy with flag + fallback. Enable 1% → 10% → 50% → 100%.
        │       └── NO → Create a fallback before deploying. Never deploy without fallback.
        └── NO → Feature flag optional but recommended for any non-trivial billing change.
```

### Rationale
Billing bugs have immediate financial impact. A feature flag limits the blast radius: if the new code has a bug, the flag can be disabled instantly — no rollback, no re-deploy, no waiting for CI/CD. This is the fastest possible recovery from a billing bug.

### Recommended Default
**Default to feature flags for all new billing behavior.** Deploy with the flag OFF, enable for internal teams, then ramp to 1% → 10% → 50% → 100% over hours or days while monitoring billing metrics.

### Risks Of Wrong Choice
- **No feature flag for risky billing change**: Bug affects 100% of customers. Revenue impact is immediate. Recovery requires full rollback (minutes to hours).
- **Feature flag for a bug fix**: Unnecessary complexity. Bug fixes should be deployed directly.

### Related Rules
- Use Feature Flags to Deploy Risky Billing Code Off-by-Default
