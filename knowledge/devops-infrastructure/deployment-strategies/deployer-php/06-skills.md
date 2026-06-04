# Skills: Deployer PHP

## Skill: deployer-recipe-setup
**Purpose:** Create and configure a Deployer recipe for Laravel deployment
**Trigger:** When setting up Deployer for a new Laravel project
**Workflow:**
1. Install Deployer via Composer (`composer require deployer/deployer`)
2. Include Laravel recipe (`recipe/laravel.php`)
3. Configure hosts with SSH parameters and deploy path
4. Set shared files and directories (`.env`, `storage/`)
5. Configure writable directories for Laravel
6. Order deployment hooks (migrate before symlink swap)
7. Add OPcache reset and queue restart tasks
8. Enable deployment lock
**Output:** `deploy.php` recipe configured for Laravel zero-downtime deployment

## Skill: deployer-ci-integration
**Purpose:** Integrate Deployer PHP with CI/CD pipeline
**Trigger:** When automating deployments from GitHub Actions, GitLab CI, or Jenkins
**Workflow:**
1. Store SSH private key as CI/CD secret
2. Configure CI/CD job to run `dep deploy production`
3. Set up deployment notifications (Slack webhook via Deployer)
4. Test CI/CD triggered deployment on staging
5. Configure deploy branch trigger (main/production branch push)
6. Document deployment runbook with common commands
**Output:** CI/CD pipeline with automated Deployer deployment
