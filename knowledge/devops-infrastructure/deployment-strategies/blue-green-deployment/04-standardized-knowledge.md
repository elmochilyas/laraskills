# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** blue-green-deployment
**Difficulty:** Intermediate
**Category:** Deployment Strategies
**Last Updated:** 2026-06-03

# Overview

Blue-green deployment is a zero-downtime deployment strategy where two identical production environments ("blue" and "green") are maintained. At any time, only one environment serves live traffic. A new version is deployed to the idle environment, tested via health checks, and then traffic is switched atomically by updating the load balancer or symlink.

The strategy exists to eliminate deployment downtime entirely. The engineering value is instant rollback (switch back to the previous environment) and the ability to fully validate a new release in the production environment before exposing it to users.

# Core Concepts

- **Blue Environment** — currently active production environment serving live traffic
- **Green Environment** — idle environment where new releases are deployed and validated
- **Traffic Switch** — atomic transfer of user traffic from blue to green (load balancer update, DNS change, or symlink swap)
- **Health Check Gate** — automated verification that the new environment is healthy before accepting traffic
- **Rollback** — immediate reversion by switching traffic back to blue (still running the previous release)

# When To Use

- Applications requiring zero-downtime deployments
- Teams running multi-server or load-balanced architectures
- High-traffic applications where deployment failures impact revenue
- Critical systems where rollback speed is paramount (instant vs. re-deploy previous version)
- Environments with sufficient resources to run two full production stacks

# When NOT To Use

- Single-server deployments where two environments exceed resource capacity
- Stateful applications that maintain session state on the application server
- Database schema changes that are not forward-compatible with both environments
- Teams without health check infrastructure to validate the idle environment
- Development and low-traffic staging where deployment pauses are acceptable

# Best Practices

**Database Schema Must Be Forward-Compatible.** Both blue and green environments run simultaneously during switchover. Schema changes must work with both old and new code. Use expand-migrate-contract pattern: add new columns first (both environments work), deploy new code, remove old columns after switch is complete.

**Health Check Must Be Comprehensive.** The health check should verify the application stack, database connectivity, queue worker status, and API dependency availability. A superficial 200-check misses critical failures.

**Automate the Switch.** Manual blue-green switches are error-prone and slow. Automate the traffic switch based on health check success. Manual confirmation can gate the automation.

**Clean Up Idle Environments.** After successful switch, the previous environment wastes resources. Schedule automated teardown of the idle environment after a grace period (for quick rollback).

# Architecture Guidelines

Blue-green requires the load balancer or reverse proxy to support upstream switching. Nginx upstreams, AWS ALB target groups, and HAProxy backends all support this pattern.

Database layer must be shared between environments. Each environment connects to the same database cluster. Schema changes must be backward-compatible.

File storage (uploads, logs) must be on shared storage accessible from both environments (S3, EFS, NFS). Local storage on one environment is invisible to the other after switch.

# Performance Considerations

**Double Infrastructure Cost.** Blue-green requires running two full production stacks. For large deployments, this doubles compute cost. Evaluate whether the zero-downtime benefit justifies the cost.

**Warm Environment Benefit.** The idle environment is fully provisioned and warmed. This means switchover has zero cold-start latency, unlike canary deployments where new instances start gradually.

**Health Check False Negatives.** Rapid health checks during switch can fail due to transient issues, rejecting a healthy release. Use multiple health check attempts with backoff before declaring failure.

# Security Considerations

**Idle Environment Attack Surface.** The idle environment runs the full stack but receives no traffic. It still requires the same security hardening as the active environment. Unpatched idle environments create undetected vulnerabilities.

**Health Check Exposure.** Health check endpoints must not expose internal application state or configuration. They should return simple pass/fail without detailed error messages.

**Switch Automation Security.** Automated traffic switches can be exploited if triggered maliciously. Secure webhook endpoints and require authentication for switch operations.

# Common Mistakes

**Database Schema Backward Compatibility.** The most common blue-green failure. A migration renames a column that the previous code version references. The idle environment deploys new code with the migration, but when switching back during rollback, old code fails against the new schema.

**Incomplete Health Checks.** Health checks that only verify HTTP 200 but not database connectivity, queue worker health, or external API dependencies. The switch happens successfully, but the application is broken.

**Orphaned Resources.** Forgetting to tear down the previous idle environment after successful switch. Resources accumulate, costs increase, and configuration drift between environments grows.

# Anti-Patterns

**Blue-Green with Stateful Sessions.** Storing user sessions in the application server filesystem while using blue-green. Users are logged out or lose state on switchover. Use Redis or database-backed sessions.

**Manual Blue-Green.** Running blue-green manually via SSH or cloud console. This introduces human error risk, slow response times, and no audit trail. Always automate.

# Examples

**Nginx Blue-Green Upstream:**
```
upstream app {
    server blue.internal:80 weight=100;  # active
    server green.internal:80 weight=0;   # idle
}
```
Switch: Change weights to 0/100, reload Nginx.

**Expand-Migrate-Contract Pattern:**
1. Deploy: Add new column `users.timezone`, make nullable (old code ignores it)
2. Switch: Blue-green switch to new code
3. Deploy: Remove old column, enforce NOT NULL on new column (after rollback window closes)

# Related Topics

**Prerequisites:** Load balancer concepts, basic deployment workflows
**Closely Related:** Canary Deployment (gradual traffic shift), Zero-Downtime Deployment, Envoyer
**Advanced Follow-Ups:** Kubernetes Deployments (native blue-green via Service selectors), Spinnaker/GitOps
**Cross-Domain Connections:** Database Migration Strategies, Environment & Secret Management

# AI Agent Notes

- Blue-green forces backward-compatible migrations. AI agents MUST generate migrations that work with both old and new code simultaneously.
- The double infrastructure cost is the primary objection. Agents should calculate cost-benefit and suggest alternatives (rolling updates, canary) when cost-constrained.
- Agents should recommend shared storage architecture (S3/EFS) when blue-green is used, not local filesystem storage.
