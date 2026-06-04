# Skills: GitHub Actions CI/CD

## Skill: gha-laravel-pipeline
**Purpose:** Create a GitHub Actions CI/CD workflow for Laravel
**Trigger:** When setting up CI/CD for a GitHub-hosted Laravel project
**Workflow:**
1. Create `.github/workflows/laravel.yml`
2. Configure triggers (push, pull_request to main)
3. Set up matrix testing (PHP 8.2, 8.3, 8.4)
4. Add lint job (Pint/PHP-CS-Fixer)
5. Add static analysis job (PHPStan level 5+)
6. Add test job with service containers (MySQL, Redis)
7. Configure caching for Composer and npm
8. Add deploy job with Forge API or Envoyer integration
**Output:** Laravel CI/CD workflow with matrix testing and automated deployment

## Skill: gha-deploy-integration
**Purpose:** Integrate deployment with GitHub Actions
**Trigger:** When adding automated deployment to Laravel CI/CD
**Workflow:**
1. Store deployment secrets in GitHub Secrets
2. Configure OIDC for cloud provider authentication
3. Add deploy job with environment-specific configuration
4. Set up deployment protection rules for production
5. Configure deployment status checks
6. Implement rollback workflow
**Output:** Automated deployment from GitHub Actions with security controls
