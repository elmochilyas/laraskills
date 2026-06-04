# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 03-ci-cd-pipelines
**Knowledge Unit:** deployment-automation
**Difficulty:** Intermediate
**Category:** CI/CD Pipelines
**Last Updated:** 2026-06-03

# Overview

Deployment automation is the practice of automatically deploying application changes to production environments through a CI/CD pipeline, triggered by Git events (usually a merge to the default branch). The pipeline runs tests, builds artifacts, and deploys to infrastructure using tools like Forge API, Envoyer, Vapor CLI, Deployer, or SSH scripts.

Deployment automation exists because manual deployments are error-prone, slow, and not repeatable. The engineering value is consistent, auditable, fast deployments that free developers from repetitive manual processes.

# Core Concepts

- **Trigger** — Git event that starts the deployment pipeline (push, merge, tag)
- **Build Stage** — Compile assets, install dependencies, create deployable artifacts
- **Test Stage** — Run automated tests to verify code quality before deployment
- **Deploy Stage** — Push code to production/staging environments
- **Artifact** — The deployable output (compiled code, Docker image, ZIP archive)
- **Environment Promotion** — Movement of artifacts through dev → staging → production

# When To Use

- Any production application with regular changes
- Teams practicing continuous delivery
- Multi-environment workflows (dev, staging, production)
- Compliance-required audit trails for deployments

# When NOT To Use

- Personal projects with infrequent changes
- Prototypes where deployment pipeline overhead is not justified
- Applications requiring manual release approval for regulatory reasons

# Best Practices

**Idempotent Pipelines.** Running the same pipeline against the same commit should produce the same result every time. Avoid environment-specific build steps.

**Fast Feedback.** The pipeline should provide deployment status within minutes. Long pipelines discourage frequent deployments.

**Immutable Artifacts.** Build once, deploy everywhere. The artifact tested in staging must be the exact artifact deployed to production.

**Environment Parity.** Staging and production deployment pipelines should differ only in target environment configuration.

# Architecture Guidelines

Deployment automation sits between CI (testing) and CD (deployment). CI verifies code quality; CD deploys verified code to environments.

The deployment tool (Envoyer, Deployer, Vapor CLI) integrates with the CI/CD platform (GitHub Actions, GitLab CI) through API calls or CLI commands.

Secrets required for deployment (SSH keys, API tokens) must be stored in the CI/CD platform's secret management, never in the repository.

# Common Mistakes

**Building in Production.** Running build steps on production servers. This couples deployment to build toolchain availability on production and increases deployment time.

**Missing Rollback Trigger.** No mechanism in the pipeline to trigger a rollback. When a bad deployment is detected, teams scramble to run manual rollback commands.

**Environment Leakage.** Using production credentials in staging deployment or vice versa. A configuration error deploys to the wrong environment.

# Related Topics

**Prerequisites:** Version control, CI/CD concepts
**Closely Related:** GitHub Actions CI/CD, GitLab CI, Pipeline Structure
**Advanced Follow-Ups:** GitOps (ArgoCD, Flux), Infrastructure as Code
**Cross-Domain Connections:** Database Migration in CI, Environment Management
