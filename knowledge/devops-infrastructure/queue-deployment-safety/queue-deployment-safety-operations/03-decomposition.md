# Decomposition: Queue Deployment Safety Operations

## Topic Overview

Deploying code changes to a production Laravel application with active queue workers requires specific safety operations to prevent job failures, data corruption, and silent data loss. The key operations — `php artisan queue:restart`, backward-compatible job payloads via `SerializesModels`, pre-deploy code deployment, `horizon:terminate` for graceful worker shutdown, and post-deploy monitoring of failed jobs — form a deployment safety net that maintains queue integrity across version transitions.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded operational domain with independent decisions, tradeoffs, and deployment guidance. No further decomposition is needed.

## Proposed Folder Structure

```
queue-deployment-safety-operations/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
  05-rules.md
  06-skills.md
  07-decision-trees.md
  08-anti-patterns.md
  09-checklists.md
```

## Knowledge Unit Inventory

### Queue Deployment Safety Operations
- **Purpose:** Defines the operational procedures and code patterns needed to safely deploy a Laravel application with active queue workers. Covers `queue:restart`, `horizon:terminate`, backward-compatible job payloads, phased schema migrations, feature flags for risky rollout, staggered worker groups, and post-deploy monitoring of failed jobs.
- **Difficulty:** Advanced
- **Dependencies:** K046 `$tries` and `$maxExceptions` (retry behavior during deploys), K052 `WithoutOverlapping` (lock safety), K055 `ShouldBeUnique` (unique lock safety)

## Dependency Graph

This KU depends on: K046, K052, K055 (queue engineering fundamentals)
This KU is depended on by: Deployment automation, CI/CD pipeline design, incident response procedures.

## Boundary Analysis

**In scope:**
- `php artisan queue:restart` — mechanism, timing, cache dependency
- `horizon:terminate` — graceful shutdown, timeout configuration, worker lifecycle
- `SerializesModels` — payload compatibility, model re-fetching
- Backward-compatible job constructor signatures
- Deploy code before schema changes (migration ordering)
- Feature flags for risky job rollout
- Staggered deployment with multiple worker groups
- Post-deploy failed_jobs monitoring
- Job delivery delays and old code compatibility window
- Config cache / route cache safety during deploys
- Phased migrations for large tables

**Out of scope:** General CI/CD pipeline design (covered in other DevOps KUs), specific deployment tools (Forge/Envoyer/Vapor configuration), database migration strategies for specific engines, queue driver selection.

## Future Expansion Opportunities

None identified — the topic is stable and well-bounded at this granularity.

---

## Success Criteria

This decomposition is complete when:

- [x] No Knowledge Unit is overloaded
- [x] No major concept is missing
- [x] Boundaries are clear
- [x] Future phases can operate on individual units
- [x] The structure can scale without reorganization
