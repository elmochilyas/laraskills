# Skills: Zero-Downtime Deployment

## Skill: zdd-pipeline-design
**Purpose:** Design a zero-downtime deployment pipeline for Laravel
**Trigger:** When establishing production deployment process
**Workflow:**
1. Select ZDD strategy (symlink swap, blue-green, Octane reload)
2. Design deployment directory structure
3. Implement health check endpoint with full stack validation
4. Configure automated rollback procedure
5. Plan database migration strategy (expand-migrate-contract)
6. Test ZDD mechanism in staging environment
7. Document deployment runbook for operations team
**Output:** Zero-downtime deployment pipeline with tested rollback procedure

## Skill: release-retention-management
**Purpose:** Manage release retention for ZDD directory structure
**Trigger:** When configuring or auditing release storage
**Workflow:**
1. Calculate storage requirements per release
2. Set retention policy based on storage capacity and rollback window
3. Configure automated cleanup of oldest releases
4. Monitor storage usage trends
5. Test rollback from retained releases
**Output:** Release retention policy with automated cleanup
