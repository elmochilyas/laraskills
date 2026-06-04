# Skills: Deployment Automation

## Skill: deploy-pipeline-setup
**Purpose:** Design and implement automated deployment pipeline
**Trigger:** When establishing CI/CD deployment process for Laravel
**Workflow:**
1. Configure Git trigger (merge to main/production branch)
2. Set up build stage (Composer, npm, artifact creation)
3. Configure deploy stage tool (Envoyer API, Deployer, Vapor CLI)
4. Implement environment promotion (dev → staging → production)
5. Store deployment secrets in CI/CD platform
6. Configure deployment notifications (Slack, email)
7. Test pipeline end-to-end on staging
**Output:** Automated deployment pipeline with environment promotion

## Skill: rollback-pipeline-setup
**Purpose:** Configure automated rollback capability in deployment pipeline
**Trigger:** When establishing incident response procedures
**Workflow:**
1. Define rollback trigger mechanism (manual workflow, API endpoint)
2. Configure rollback to previous known-good artifact
3. Test rollback in staging environment
4. Document rollback procedure in runbook
5. Set up post-rollback notifications
**Output:** Automated rollback pipeline with tested procedure
