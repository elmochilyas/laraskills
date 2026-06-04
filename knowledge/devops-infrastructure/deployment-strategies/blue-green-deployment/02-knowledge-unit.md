# Blue-Green Deployment

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Deployment Strategies
- **Knowledge Unit:** Blue-Green Deployment
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Blue-green deployment maintains two identical production environments ("blue" and "green") where only one serves live traffic at a time. It eliminates deployment downtime entirely and provides instant rollback by switching traffic back to the previous environment, making it ideal for high-traffic applications where deployment failures impact revenue.

---

## Core Concepts

- **Blue Environment** — Currently active production environment serving live traffic
- **Green Environment** — Idle environment where new releases are deployed and validated
- **Traffic Switch** — Atomic transfer of user traffic from blue to green via load balancer update, DNS change, or symlink swap
- **Health Check Gate** — Automated verification that the new environment is healthy before accepting traffic
- **Rollback** — Immediate reversion by switching traffic back to blue (still running the previous release)

---

## Mental Models

- **Parallel Runways** — Two fully-equipped runways; land all planes on one while maintaining the other, then instantly switch when the new runway is certified
- **Expand-Migrate-Contract** — Database changes must work with both old and new code simultaneously. Add new columns first (both work), deploy new code, remove old columns after switch
- **Instant Rollback Insurance** — The previous environment is your insurance policy; it costs money to maintain but gives you instant recovery with zero downtime

---

## Internal Mechanics

The blue-green deployment lifecycle begins with both environments fully provisioned and running identical stacks. The idle environment receives the new release: code is deployed, dependencies installed, and migrations run. After deployment, health checks verify the idle environment. If healthy, the load balancer or router atomically switches traffic from blue to green. The previously active environment (now idle) remains ready for immediate rollback. After a grace period (typically 24-72 hours), the idle environment is torn down or recycled. During the entire process, database and shared storage must be accessible to both environments simultaneously.

---

## Patterns

- **Expand-Migrate-Contract Pattern** — Three-phase database change: add new columns as nullable (old code ignores them), deploy new code (uses new columns), remove old columns after rollback window closes
- **Health Check Gate Pattern** — Comprehensive health checks beyond HTTP 200 that verify database connectivity, queue worker status, and API dependencies before allowing the switch
- **Automated Switch with Manual Confirmation** — Automate the traffic switch based on health check success, but gate with manual confirmation for critical production deployments

---

## Architectural Decisions

- **Blue-Green vs. Rolling Update** — Choose blue-green when instant rollback and full validation in production are critical; choose rolling updates when double infrastructure cost is prohibitive
- **Blue-Green vs. Canary** — Choose blue-green when you need full traffic switched at once (no gradual rollout); choose canary when you want to validate with a subset of users first
- **Shared Database** — Both environments must connect to the same database; this is the primary architectural constraint of blue-green deployments

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero-downtime deployments | Double infrastructure cost | For large deployments, this doubles compute cost |
| Instant rollback | Idle environment attack surface | Unpatched idle environments create undetected vulnerabilities |
| Full validation in production | Database schema must be backward-compatible | Adds complexity to migration planning |
| Atomic traffic switch | Requires load balancer that supports upstream switching | Additional infrastructure configuration |

---

## Performance Considerations

Double infrastructure cost is the primary concern — running two full production stacks doubles compute cost for the duration of the overlap. The idle environment is fully provisioned and warmed, providing zero cold-start latency on switchover (unlike canary deployments where new instances start gradually). Health check false negatives can reject a healthy release due to transient issues — use multiple health check attempts with backoff before declaring failure.

---

## Production Considerations

Shared storage architecture (S3, EFS, NFS) is required because local storage on one environment is invisible to the other after switch. Database layer must be shared with backward-compatible schema changes. Health check endpoints must not expose internal configuration details. Switch automation must be secured to prevent malicious triggering. Clean up idle environments after the rollback grace period to prevent cost accumulation and configuration drift.

---

## Common Mistakes

- **Database Schema Backward Compatibility Failure** — The most common blue-green failure. A migration renames a column that the previous code references. When rolling back, old code fails against the new schema. Always use expand-migrate-contract for destructive changes.
- **Incomplete Health Checks** — Health checks that only verify HTTP 200 but not database, queue, or API dependencies. The switch succeeds but the application is broken.
- **Orphaned Resources** — Forgetting to tear down the previous idle environment. Resources accumulate, costs increase, and configuration drift grows between environments.
- **Stateful Sessions** — Storing user sessions in application server filesystem. Users are logged out on switchover. Use Redis or database-backed sessions.

---

## Failure Modes

- **Switch Failure** — Load balancer fails to update upstream configuration. Detection: traffic continues to old environment, health checks on new environment pass but no traffic arrives. Mitigation: implement switch verification, monitor traffic distribution metrics.
- **Rollback Failure** — Previous environment has been modified or torn down during the grace period. Detection: rollback command fails or serves broken application. Mitigation: prevent modifications to idle environment, enforce grace period duration.
- **Schema Incompatibility** — Migration applied to shared database breaks old code. Detection: rollback to blue results in 500 errors. Mitigation: always use expand-migrate-contract pattern, test rollback in staging.

---

## Ecosystem Usage

Envoyer uses a symlink-swap pattern that is conceptually similar to blue-green but at the application directory level rather than full environment level. Forge (2025+) includes built-in zero-downtime deployments for new sites. Kubernetes natively supports blue-green deployments through Service selector updates. Nginx upstreams, AWS ALB target groups, and HAProxy backends all support the upstream switching required for blue-green.

---

## Related Knowledge Units

### Prerequisites
- Load balancer concepts, basic deployment workflows

### Related Topics
- Canary Deployment (gradual traffic shift alternative)
- Zero-Downtime Deployment
- Envoyer Zero-Downtime Deployments

### Advanced Follow-up Topics
- Kubernetes Deployments (native blue-green via Service selectors)
- Spinnaker/GitOps
- Database Migration Strategies

---

## Research Notes

Blue-green forces backward-compatible migrations — always generate migrations that work with both old and new code simultaneously. The double infrastructure cost is the primary objection; calculate cost-benefit and suggest alternatives (rolling updates, canary) when cost-constrained. Recommend shared storage architecture (S3/EFS) when blue-green is used, not local filesystem storage.
