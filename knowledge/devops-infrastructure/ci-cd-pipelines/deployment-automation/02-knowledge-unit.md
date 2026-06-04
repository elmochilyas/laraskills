# Deployment Automation

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** CI/CD Pipelines
- **Knowledge Unit:** Deployment Automation
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Deployment automation automatically deploys application changes to production environments through a CI/CD pipeline triggered by Git events. It provides consistent, auditable, fast deployments that free developers from repetitive manual processes and eliminate human error.

---

## Core Concepts

- **Trigger** — Git event that starts the deployment pipeline (push, merge, tag)
- **Build Stage** — Compile assets, install dependencies, create deployable artifacts
- **Test Stage** — Run automated tests to verify code quality before deployment
- **Deploy Stage** — Push code to production/staging environments
- **Artifact** — The deployable output (compiled code, Docker image, ZIP archive)
- **Environment Promotion** — Movement of artifacts through dev → staging → production

---

## Mental Models

- **Assembly Line** — Code commits are raw materials; each pipeline stage is a quality checkpoint; only verified artifacts reach the production floor
- **Build Once, Deploy Everywhere** — The artifact tested in staging must be the exact artifact deployed to production. Rebuilding for each environment invalidates the testing process.
- **Fast Feedback Loop** — The pipeline should provide deployment status within minutes. Long pipelines discourage frequent deployments and reduce the velocity of delivery.

---

## Internal Mechanics

A deployment automation pipeline is a sequence of stages defined in a CI/CD configuration file. The pipeline starts when a Git event occurs (usually a merge to the default branch). The build stage compiles assets and installs dependencies, producing an artifact. The test stage runs automated tests against the artifact. If tests pass, the deploy stage pushes the artifact to the target environment, often through an API call to a deployment tool (Envoyer, Forge API, Vapor CLI, Deployer). The pipeline concludes with a post-deploy stage that runs health checks and sends notifications.

---

## Patterns

- **Idempotent Pipelines** — Running the same pipeline against the same commit produces the same result every time regardless of environment state
- **Immutable Artifacts** — Build once, deploy everywhere. The artifact tested in staging is the exact artifact deployed to production.
- **Environment Parity** — Staging and production deployment pipelines differ only in target environment configuration, never in process

---

## Architectural Decisions

- **CI/CD Platform** — Choose GitHub Actions for GitHub-hosted code, GitLab CI for GitLab-hosted code, or self-hosted runners for air-gapped environments
- **Deployment Tool Integration** — The deployment tool (Envoyer, Deployer, Vapor CLI) integrates with the CI/CD platform through API calls or CLI commands
- **Rollback Automation** — Include a rollback trigger in the pipeline for automated recovery when a bad deployment is detected

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Consistent, repeatable deployments | Pipeline maintenance overhead | Pipeline configuration must be maintained alongside application code |
| Fast, automated releases | Secrets management complexity | API tokens, SSH keys must be stored in CI/CD secret store |
| Audit trail for every deployment | Build infrastructure costs | CI/CD runner time has associated costs |
| Reduced human error in deployment | Pipeline failure blocks all deployments | Single point of failure if pipeline infrastructure goes down |

---

## Performance Considerations

Pipeline execution time directly impacts deployment frequency. Target under 5 minutes for the full pipeline. Cache Composer and npm dependencies across pipeline runs. Parallelize independent stages (linting, static analysis, testing). Use build caching to avoid rebuilding unchanged dependencies. Artifact retention policies should balance storage costs against rollback needs.

---

## Production Considerations

Secrets required for deployment (SSH keys, API tokens) must be stored in the CI/CD platform's secret management, never in the repository. Implement environment-specific deployment branches (staging, production) with access controls. Configure deployment notifications to team communication channels. Include a rollback trigger mechanism in the pipeline. Monitor deployment frequency and success rate as key metrics.

---

## Common Mistakes

- **Building in Production** — Running build steps on production servers couples deployment to build toolchain availability and increases deployment time. Build artifacts in CI, deploy pre-built artifacts.
- **Missing Rollback Trigger** — No mechanism in the pipeline to trigger rollback. When a bad deployment is detected, teams scramble to run manual commands.
- **Environment Leakage** — Using production credentials in staging deployment or vice versa. A configuration error deploys to the wrong environment.
- **No Pipeline Status Notifications** — Teams don't know when deployments succeed or fail without checking the CI/CD dashboard manually.

---

## Failure Modes

- **Pipeline Infrastructure Outage** — CI/CD platform is unavailable. Detection: deployment trigger fails to start pipeline. Mitigation: implement fallback deployment procedure documented in runbooks.
- **Secret Expiry** — CI/CD secrets (API tokens, SSH keys) expire without being updated. Detection: deploy stage fails with authentication error. Mitigation: monitor secret expiry, automate rotation.
- **Test Flake** — Non-deterministic test failure blocks deployment of good code. Detection: pipeline fails on unrelated test. Mitigation: implement test retry, quarantine flaky tests.

---

## Ecosystem Usage

Laravel deployment automation typically uses GitHub Actions or GitLab CI as the pipeline platform, combined with Forge API, Envoyer, Vapor CLI, or Deployer as the deployment tool. Forge and Envoyer provide first-party API integration. Vapor provides a CLI for CI/CD integration. Deployer can be invoked directly from CI/CD scripts. All secrets for these integrations should be stored in the CI/CD platform's secret management.

---

## Related Knowledge Units

### Prerequisites
- Version control, CI/CD concepts

### Related Topics
- GitHub Actions CI/CD
- GitLab CI
- Pipeline Structure

### Advanced Follow-up Topics
- GitOps (ArgoCD, Flux)
- Infrastructure as Code
- Database Migration in CI

---

## Research Notes

Deployment automation sits between CI (testing) and CD (deployment). CI verifies code quality; CD deploys verified code to environments. The deployment tool integrates with the CI/CD platform through API calls or CLI commands. Secrets required for deployment must be stored in the CI/CD platform's secret management.
