# Skill: Deploy Blue-Green with OpCache Pre-Warming and Instant Rollback

## Purpose
Provision two independent PHP-FPM environments (blue/green) with separate OpCache shared memory and file cache directories, deploy to the inactive environment with full pre-warming of all critical endpoints to 100% OpCache hit rate, switch traffic atomically via load balancer API, and keep the old environment as an instant rollback target with zero warm-up time — eliminating cold-start latency and deployment-related performance degradation.

## When To Use
- Critical production services requiring instant rollback capability
- Applications where cold-start latency after deployment is unacceptable
- Teams with infrastructure budget to maintain duplicate environments
- High-traffic services where any deployment-related degradation is unacceptable

## When NOT To Use
- Single-server deployments (no capacity for duplicate environment)
- Cost-constrained environments (2x infrastructure cost)
- Small services where deployment cold-start is acceptable

## Prerequisites
- Two identical environments (blue/green) behind a load balancer
- Load balancer with traffic switching capability (weighted routing or target groups)
- Automated warm-up script covering all critical endpoints
- cachetool installed in both environments

## Inputs
- Blue environment target group ARN
- Green environment target group ARN
- List of critical endpoints for warm-up
- Health check endpoint URL

## Workflow

### 1. Provision Two Independent Environments
- Blue = current active, Green = inactive
- Each environment has its own PHP-FPM instances, own OpCache shared memory, own file cache directory
- Separate file cache paths: `opcache.file_cache=/var/opcache-cache/blue` and `/var/opcache-cache/green`
- Load balancer has separate target groups for blue and green

### 2. Deploy to Green (Inactive)
- Deploy new code to green environment
- Start green PHP-FPM — preloading executes automatically
- Verify green is running but not receiving traffic
- Green should be functional independently (own DB connections, etc.)

### 3. Warm Green Fully Before Switching
- Run comprehensive warm-up hitting all critical endpoints
- Verify OpCache hit rate reaches 100% via health check endpoint
- Verify all green health checks pass (DB connectivity, worker count, listen queue)
- Never switch traffic before green is fully warm

### 4. Switch Traffic Atomically
- Use load balancer API (no manual console switches)
- Automate cutover via AWS CLI, HAProxy API, or similar
- Monitor error rates and latency immediately after switch
- Verify green is serving correctly

### 5. Keep Blue for Rollback
- Never decommission blue immediately after switching
- Blue remains running in fully warmed state
- Instant rollback: switch load balancer back to blue — zero warm-up needed
- Decommission blue only when the next deployment cycle begins

### 6. Ensure Backward-Compatible Schema
- Schema changes must be additive (new columns/tables)
- Both blue and green must work with the same database schema
- Apply schema changes in a separate deployment cycle before the blue-green switch
- Never deploy destructive schema changes with blue-green

## Validation Checklist
- [ ] Two independent environments provisioned with separate OpCache
- [ ] File cache directories separate per environment
- [ ] Green warmed to 100% OpCache hit rate before switch
- [ ] Health checks pass on green before traffic switch
- [ ] Traffic switch automated via load balancer API
- [ ] Blue kept running after switch (instant rollback)
- [ ] Schema changes backward-compatible and applied before code
- [ ] Rollback procedure tested monthly

## Related Rules
- Warm green fully before switching (`05-rules.md:5`)
- Never decommission blue immediately (`05-rules.md:36`)
- Separate file cache per environment (`05-rules.md:66`)
- Automate traffic switch (`05-rules.md:94`)
- Backward-compatible schema (`05-rules.md:123`)
- Verify green independently (`05-rules.md:150`)
- Isolated DB connections for warm-up (`05-rules.md:180`)
- Test rollback path monthly (`05-rules.md:222`)

## Related Skills
- Zero-Downtime Deployment OpCache
- OpCache Reset Strategies
- Deployment Cache Invalidation
- Multi-Instance Cache Coordination

## Success Criteria
- Blue-green deployment completes without user-facing latency impact
- Green environment fully warmed before receiving traffic
- Rollback to blue is instant (seconds, not minutes)
- OpCache file cache never shared between environments
- Schema changes are backward-compatible
- Deployment pipeline fully automated with one-click switch
