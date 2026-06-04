# Skills: GitLab CI

## Skill: gitlab-ci-laravel-pipeline
**Purpose:** Create GitLab CI pipeline for Laravel
**Trigger:** When setting up CI/CD for a GitLab-hosted Laravel project
**Workflow:**
1. Create `.gitlab-ci.yml` with stages (lint, test, build, deploy)
2. Configure Docker executor runner
3. Set up DIND service for Docker builds
4. Add lint job (Pint/PHP-CS-Fixer)
5. Add test job with MySQL/PostgreSQL service
6. Add build job with Docker build to GitLab Registry
7. Add deploy job with environment-specific variables
8. Configure caching for Composer and npm
**Output:** GitLab CI pipeline configured for Laravel deployment

## Skill: gitlab-docker-build
**Purpose:** Configure Docker image building in GitLab CI
**Trigger:** When building container images in GitLab pipeline
**Workflow:**
1. Configure DIND service in `.gitlab-ci.yml`
2. Set up Docker layer caching
3. Authenticate with GitLab Container Registry
4. Build multi-stage Dockerfile
5. Tag with commit SHA and branch name
6. Push to registry
**Output:** Automated Docker image build and push pipeline
