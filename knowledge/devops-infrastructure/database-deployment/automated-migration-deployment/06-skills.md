# Skills: Automated Migration Deployment

## Skill: ci-migration-pipeline
**Purpose:** Integrate database migrations into CI/CD pipeline
**Trigger:** When setting up automated deployment with database changes
**Workflow:**
1. Configure migration step in deploy pipeline
2. Add `--force` flag for production
3. Set migration order relative to symlink swap (before for zero-downtime)
4. Test migrations in CI with service container database
5. Implement migration monitoring (success/failure notification)
6. Document rollback migrations
**Output:** CI/CD pipeline with automated migration execution
