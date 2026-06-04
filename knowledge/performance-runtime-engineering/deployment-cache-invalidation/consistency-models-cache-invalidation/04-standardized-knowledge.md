# Standardized Knowledge: Consistency Models for Cache Invalidation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | Consistency Models for Cache Invalidation |
| Difficulty | Foundation |
| Lifecycle | Design, Deploy |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Cache invalidation during deployment follows a consistency model. Strong consistency: all workers serve new code simultaneously (requires coordination, typically via load balancer drain + atomic cutover). Eventual consistency: workers gradually pick up new code as they restart (simpler but mixed versions serve during transition). Choose based on tolerance for mixed-version execution.

## Core Concepts

- **Strong Consistency (Blue-Green)**: Two full environments. Cut traffic atomically from blue to green. Old environment receives zero traffic. New environment has fully warmed caches. Cost: 2x infrastructure.
- **Eventual Consistency (Rolling)**: Workers restart one by one. During rollout, some workers serve old code, some serve new. Code must be backward-compatible. Cost: no extra infrastructure.
- **OpCache Consistency**: With validate_timestamps=0, OpCache is per-worker-memory. Each worker must independently invalidate. No shared OpCache knowledge across workers.
- **Database Schema Consistency**: Code and schema changes must be backward-compatible during rolling deployments. Old workers must work with new schema. Apply schema changes before code deployments.

## When To Use

- **Strong consistency**: Critical services where mixed-version execution is unacceptable (payment processing, auth, data writing)
- **Eventual consistency**: Standard services where backward-compatible changes allow safe mixed-version operation
- **OpCache consistency**: All PHP deployments — understand that each worker independently manages its own cache

## When NOT To Use

- Strong consistency when infrastructure budget is limited (2x cost)
- Eventual consistency when mixed-version execution causes data corruption
- Any approach without backward-compatible schema changes

## Best Practices

- **Prefer strong consistency for write-heavy endpoints**: Mixed versions can cause data inconsistencies if the write format changes between versions.
- **Eventual consistency is acceptable for read-heavy endpoints**: As long as the response format is backward-compatible, mixed versions have minimal impact.
- **Always apply schema changes before code changes**: Database must be compatible with old code first. Old workers continue during rolling deployment.
- **Use sticky sessions with eventual consistency**: Ensures a user session stays on the same version throughout their interaction.
- **Document the consistency model**: The deployment strategy should explicitly state whether it provides strong or eventual consistency. Operations teams must understand the implications.

## Architecture Guidelines

- **Strong Consistency Stack**: Blue-green environments + load balancer atomic cutover + fully warmed caches. No mixed versions at any point. Maximum infrastructure cost.
- **Eventual Consistency Stack**: Rolling deployment + backward-compatible code + per-worker cache invalidation. Mixed versions during transition. Lower infrastructure cost.
- **Consistency Spectrum**: Blue-green (strongest) → canary (mostly strong) → rolling (eventual) → per-worker restart (most eventual). Choose based on tolerance.
- **Cache Invalidation Impact**: With eventual consistency, OpCache is invalidated per-worker as they restart. Workers that haven't restarted still have old OpCache. The invalidation is eventually consistent.

## Performance Considerations

- Strong consistency: no performance degradation during deployment (fully warmed new environment)
- Eventual consistency: brief performance impact per worker during warm-up
- Strong consistency: 2x resource usage during deployment (both environments running)
- Eventual consistency: no additional resources needed

## Security Considerations

- Mixed-version execution can expose inconsistent data. For security-sensitive operations, prefer strong consistency.
- Strong consistency with blue-green provides a clean rollback path — blue's caches are still warm.
- Eventual consistency must be evaluated for security boundary changes. Authentication changes between versions can cause access issues.
- Database schema changes must be reviewed for security implications with old code accessing new schema.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not understanding the consistency model | Deploying without planning | Mixed-version issues in production | Document the chosen consistency model |
| Applying schema changes after code deploy | Wrong order in pipeline | Old workers fail with new schema | Apply backward-compatible schema changes first |
| No sticky sessions with eventual consistency | Not configuring load balancer | User bounces between old and new instances | Enable session affinity |
| Assuming all deployments need strong consistency | Over-engineering | Unnecessary 2x infrastructure cost | Match consistency model to service criticality |

## Anti-Patterns

- **Deploying schema changes atomically with code changes**: Schema must be applied first, tested, then code deployed. Atomic schema+code changes are dangerous.
- **Not testing mixed-version operation**: If you use eventual consistency, test that old and new code work together. Don't assume backward compatibility.
- **Ignoring consistency in deployment automation**: If the automation doesn't enforce the consistency model, it will drift toward eventual consistency by default.
- **Strong consistency without rollback plan**: The old environment is your rollback. If you decommission it immediately, you lose the rollback capability.

## Examples

```
Consistency Model Decision Guide:
- Payment processing → Strong consistency (blue-green)
- User profile API → Eventual consistency (rolling)
- Admin dashboard → Eventual consistency (rolling)
- Database migrations → Strong consistency (separate deployment)
```

## Related Topics

- Blue-Green Deployment OpCache
- Zero-Downtime Deployment OpCache
- Multi-Instance Cache Coordination
- Deployment Cache Invalidation

## AI Agent Notes

- Strong consistency = blue-green, atomic cutover, 2x cost. Eventual consistency = rolling, per-worker, backward-compatible code.
- Schema changes must ALWAYS precede code changes. Old code must work with new schema.
- OpCache invalidation is inherently eventual in multi-instance deployments — each instance invalidates independently.
- Match the consistency model to the service criticality. Not all services need strong consistency.

## Verification

- [ ] Consistency model chosen and documented for each service
- [ ] Schema changes applied before code changes
- [ ] Backward-compatible code for rolling deployments
- [ ] Sticky sessions configured for eventual consistency
- [ ] Mixed-version operation tested in staging
- [ ] Rollback plan aligned with consistency model
- [ ] Deployment automation enforces the chosen model
