# Decision Trees: Production Queue Deployment Patterns

## Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** 11-production-patterns
**Knowledge Unit:** Production Queue Deployment Patterns
**Generated:** 2026-06-04

---

## Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Full Rollout vs Canary Deployment | Operational | Deploy |
| 2 | horizon:terminate vs queue:restart | Configuration | Design |
| 3 | Deploy During Peak vs Low Traffic | Operational | Schedule |
| 4 | Emergency Hotfix vs Standard Deploy | Operational | Deploy |
| 5 | Automated vs Manual Worker Restart | Configuration | Design |
| 6 | Stop Processing vs Drain Then Restart | Operational | Deploy |

---

## Decision 1: Full Rollout vs Canary Deployment

### Context
Whether to deploy the change to all workers simultaneously or stage the rollout.

### Decision Tree
Does the change modify job processing logic (data transformation, write operations)?
- **YES** → Consider canary
- **NO** → Full rollout is safe

Does the change affect schema, data format, or destructive operations?
- **YES** → Canary deployment required
- **NO** → Continue

Is this an emergency hotfix for a critical production issue?
- **YES** → Full rollout (accept risk of canary skip)
- **NO** → Continue

Is the change a log message, comment, or non-functional adjustment?
- **YES** → Full rollout (safe change)
- **NO** → Canary recommended

### Recommended Default
Full rollout for safe changes. Canary for any data-modifying or destructive change.

### Risks
- Full rollout for destructive change: 100% data corruption if bug exists
- Canary for safe change: unnecessary delay, complexity

---

## Decision 2: horizon:terminate vs queue:restart

### Context
Which command to use for worker restart.

### Decision Tree
Are you using Horizon for queue management?
- **YES** → Use `php artisan horizon:terminate`
- **NO** → Continue

Are you using Supervisor with standard queue workers?
- **YES** → Use `php artisan queue:restart`
- **NO** → Continue

Do you need to restart specific supervisors without affecting others?
- **YES** → `horizon:terminate` (Horizon supports per-supervisor restart)
- **NO** → Either is acceptable

### Recommended Default
`horizon:terminate` for Horizon deployments. `queue:restart` for standard queue workers.

### Risks
- `queue:restart` with Horizon: may not work as expected (Horizon manages workers differently)
- `horizon:terminate` without Horizon: command doesn't exist

---

## Decision 3: Deploy During Peak vs Low Traffic

### Context
When to schedule the deployment.

### Decision Tree
Do you have queue traffic metrics showing peak vs low periods?
- **YES** → Continue
- **NO** → Collect metrics first, then decide

Is this a destructive job change?
- **YES** → Schedule during lowest traffic window
- **NO** → Continue

Can the deployment be scheduled outside business hours?
- **YES** → Schedule during measured low-traffic window
- **NO** → Continue

Is there a deployment freeze during known peak periods (Black Friday)?
- **YES** → Respect freeze; defer if possible
- **NO** → Schedule during low traffic

### Recommended Default
Low-traffic windows for all queue-related deploys. Destructive changes must go during lowest traffic.

### Risks
- Peak-hour deploy: maximum blast radius, longer recovery, delayed processing
- Low-traffic deploy: requires out-of-hours work, may conflict with team schedule

---

## Decision 4: Emergency Hotfix vs Standard Deploy

### Context
Whether to follow standard procedures or expedite for an emergency fix.

### Decision Tree
Is there a critical production issue actively causing data loss or revenue impact?
- **YES** → Continue
- **NO** → Standard deploy procedure

Can the hotfix be applied without code changes (config toggle, feature flag)?
- **YES** → Use existing mechanism (no deploy needed)
- **NO** → Continue

Does the hotfix change job processing logic?
- **YES** → Emergency hotfix (skip canary, accept risk)
- **NO** → Standard deploy

Is the hotfix a revert to known-good code?
- **YES** → Canary is optional (revert has known behavior)
- **NO** → Continue

### Recommended Default
Full emergency procedures for critical issues. Standard procedures for all others.

### Risks
- Hotfix without canary: bug in fix affects all workers
- Standard procedure for emergency: unacceptable delay in fixing critical issue

---

## Decision 5: Automated vs Manual Worker Restart

### Context
How worker restart is triggered during deployment.

### Decision Tree
Is the deployment managed by a CI/CD pipeline?
- **YES** → Automated restart in pipeline
- **NO** → Continue

Is a human operator available during deployment?
- **YES** → Manual restart acceptable (with runbook)
- **NO** → Automated restart required

Are there multiple servers or worker pools?
- **YES** → Automated, coordinated restart
- **NO** → Manual restart may suffice

Has a forgotten restart caused incidents in the past?
- **YES** → Automated restart (prevent human error)
- **NO** → Continue

### Recommended Default
Automated restart in CI/CD pipeline. Manual only with documented runbook and verification steps.

### Risks
- Manual restart: human forgetfulness, inconsistent timing, no audit trail
- Automated restart: requires pipeline integration, may restart during processing

---

## Decision 6: Stop Processing vs Drain Then Restart

### Context
Whether to immediately stop workers or let them drain before restart.

### Decision Tree
Does the job change affect serialization format (job parameters changed)?
- **YES** → Drain first (let in-flight jobs complete with old code)
- **NO** → Continue

Do in-flight jobs hold database locks or external resources?
- **YES** → Drain first (release resources before new code runs)
- **NO** → Continue

Is the change a critical security fix?
- **YES** → Stop immediately (security risk outweighs drain benefit)
- **NO** → Drain then restart

### Recommended Default
Drain then restart for standard deploys. Stop immediately for security fixes.

### Risks
- Stop immediately: in-progress jobs are killed, may cause partial writes
- Drain first: delay before new code takes effect, backlog may grow
