# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** CI/CD Pipeline
**Knowledge Unit:** GitHub Actions CI/CD for Laravel
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Cache Composer Dependencies
- [ ] Apply rule: Use Service Containers for Production-Equivalent Databases
- [ ] Apply rule: Run Minimal Matrix on PRs, Full Matrix on Main Branch
- [ ] Apply rule: Set Up Quality Gates Sequentially
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] CI runs on push to main and on PRs to main
- [ ] PHP is set up with required extensions (bcmath, pdo_mysql, etc.)
- [ ] Database service containers use pinned versions matching production
- [ ] Composer dependencies are cached for fast installs
- [ ] Tests pass and coverage threshold is enforced
- [ ] Avoid: Mistake
- [ ] Avoid: Not caching Composer dependencies
- [ ] Avoid: Running full matrix on every PR

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Single workflow vs multiple**: Single workflow for most projects. Multiple workflows for monorepos or when deploy needs separate approval (e.g., `ci.yml` + `deploy.yml`).
- **Self-hosted vs GitHub-hosted runners**: GitHub-hosted for standard projects. Self-hosted for large monorepos, slow test suites, or compliance requirements.
- **Deployment strategy**: Deployer for zero-downtime or Laravel Forge hooks for simpler projects. Deploy only from main/default branch after successful CI.
- **Secret management**: Store `APP_KEY`, `DB_PASSWORD`, deploy SSH keys, and API tokens in GitHub Actions secrets.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Cache Composer Dependencies
- [ ] Follow rule: Use Service Containers for Production-Equivalent Databases
- [ ] Follow rule: Run Minimal Matrix on PRs, Full Matrix on Main Branch
- [ ] Follow rule: Set Up Quality Gates Sequentially
- [ ] Follow rule: Store CI Artifacts for Debugging
- [ ] Follow rule: Store All Secrets in GitHub Actions Secrets
- [ ] - [ ] CI runs on push to main and on PRs to main
- [ ] - [ ] PHP is set up with required extensions (bcmath, pdo_mysql, etc.)
- [ ] - [ ] Database service containers use pinned versions matching production
- [ ] - [ ] Composer dependencies are cached for fast installs

# Performance Checklist
- Dependency installation: 30-60s without cache, 5-10s with cache.
- Test execution: 100 Pest tests with parallel: 1-3 minutes. 1000 tests: 5-15 minutes.
- Static analysis (PHPStan level max): 2-5 minutes for medium codebase.
- Pint linting: 2-10 seconds. Fastest stage.
- Full pipeline (cached, parallel tests): 5-10 minutes typical. 15-30 minutes for large codebases.

# Security Checklist
- Store all secrets in GitHub Actions secrets, never in repository files or workflow YAML.
- Use `environment: production` with required reviewers for production deployments.
- Never commit `.env` files or service credentials to the repository.
- Use `GITHUB_TOKEN` with minimal permissions (principle of least privilege).
- Regularly rotate deploy keys and API tokens stored as secrets.

# Reliability Checklist
- [ ] Ensure: GitHub Actions is the standard CI/CD platform for Laravel projects in 2026, prov...
- [ ] Verify: Always Cache Composer Dependencies
- [ ] Verify: Use Service Containers for Production-Equivalent Databases
- [ ] Verify: Run Minimal Matrix on PRs, Full Matrix on Main Branch
- [ ] Verify: Set Up Quality Gates Sequentially

# Testing Checklist
- [ ] CI runs on push to main and on PRs to main
- [ ] PHP is set up with required extensions (bcmath, pdo_mysql, etc.)
- [ ] Database service containers use pinned versions matching production
- [ ] Composer dependencies are cached for fast installs
- [ ] Tests pass and coverage threshold is enforced
- [ ] Linting and static analysis jobs run in parallel
- [ ] Avoid: Mistake
- [ ] Avoid: Not caching Composer dependencies
- [ ] Avoid: Running full matrix on every PR

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Cache Composer Dependencies
- [ ] Apply: Use Service Containers for Production-Equivalent Databases
- [ ] Apply: Run Minimal Matrix on PRs, Full Matrix on Main Branch
- [ ] Apply: Set Up Quality Gates Sequentially

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not caching Composer dependencies
- [ ] Avoid mistake: Running full matrix on every PR
- [ ] Avoid mistake: Not using service containers for databases
- [ ] Avoid mistake: Hardcoding PHP version in setup-php

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Always Cache Composer Dependencies
- Use Service Containers for Production-Equivalent Databases
- Run Minimal Matrix on PRs, Full Matrix on Main Branch
- Set Up Quality Gates Sequentially
- Store CI Artifacts for Debugging
- Store All Secrets in GitHub Actions Secrets
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Configure GitHub Actions CI for Laravel


