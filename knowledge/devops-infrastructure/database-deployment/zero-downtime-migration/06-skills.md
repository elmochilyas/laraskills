# Skills: Zero-Downtime Migration

## Skill: online-schema-change-migration
**Purpose:** Perform zero-downtime schema change using pt-osc or gh-ost
**Trigger:** When modifying schema on large production table
**Workflow:**
1. Identify migration requiring zero-downtime approach
2. Choose tool (pt-osc for MySQL, gh-ost for RDS/Aurora)
3. Test on staging with production-sized data
4. Configure throttling thresholds
5. Monitor replication lag during migration
6. Verify shadow table swap completes
7. Remove old table after rollback window
**Output:** Zero-downtime schema change execution with monitoring
