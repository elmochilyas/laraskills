# Skills: Blue-Green Deployment

## Skill: blue-green-pipeline-setup
**Purpose:** Design and implement a blue-green deployment pipeline
**Trigger:** When implementing zero-downtime deployments with dual production environments
**Workflow:**
1. Provision two identical production environments (blue/green)
2. Configure load balancer with upstream groups for each environment
3. Design health check endpoint with comprehensive validation
4. Implement expand-migrate-contract database migration strategy
5. Configure shared storage accessible from both environments
6. Automate traffic switch based on health check success
7. Schedule idle environment cleanup after rollback window
**Output:** Automated blue-green deployment pipeline with health check gating

## Skill: database-migration-compatibility-check
**Purpose:** Verify database migrations are safe for blue-green deployment
**Trigger:** Before deploying migrations in a blue-green environment
**Workflow:**
1. Review each migration for backward compatibility
2. Identify destructive changes (DROP, RENAME, ALTER that break old code)
3. Split destructive changes into expand (add new) and contract (remove old) phases
4. Verify new code handles both old and new schema
5. Document rollback migration steps
**Output:** Migration compatibility report with phased deployment plan
