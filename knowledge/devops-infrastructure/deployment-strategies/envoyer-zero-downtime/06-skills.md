# Skills: Envoyer Zero-Downtime Deployments

## Skill: envoyer-project-setup
**Purpose:** Configure Envoyer project for Laravel zero-downtime deployment
**Trigger:** When setting up a new Laravel deployment pipeline with Envoyer
**Workflow:**
1. Create Envoyer project connected to Git repository
2. Add servers with SSH key authentication
3. Configure deployment hooks (clone, install, build, migrate, swap)
4. Implement health check endpoint with full stack validation
5. Set up Slack/email notifications for deployment results
6. Configure multi-server orchestration (sequential or parallel)
7. Test deployment on staging environment
**Output:** Envoyer project configured for zero-downtime Laravel deployment

## Skill: envoyer-rollback-procedure
**Purpose:** Test and document Envoyer rollback procedure
**Trigger:** Before production deployment go-live
**Workflow:**
1. Deploy intentionally faulty code to staging
2. Trigger rollback via Envoyer dashboard
3. Verify previous release serves traffic correctly
4. Test database migration reversal (if applicable)
5. Document rollback procedure in runbook
6. Train operations team on rollback execution
**Output:** Tested and documented rollback procedure
