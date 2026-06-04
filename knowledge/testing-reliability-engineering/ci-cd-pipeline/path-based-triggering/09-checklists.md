# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** CI/CD Pipeline
**Knowledge Unit:** Path-Based CI Triggering
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Run Full CI on Merge to Main â€” Never Apply Path Filters to Merges
- [ ] Apply rule: Use `paths-ignore` for Noise Reduction
- [ ] Apply rule: Be Explicit with Path Lists â€” Include All Code Directories
- [ ] Apply rule: Include Workflow Files in Path Filters
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Path filters are used on development branches but not on merge to main
- [ ] Nightly full CI run catches cross-boundary regressions
- [ ] Workflow file changes trigger CI
- [ ] Deployment workflow has path filters to avoid unnecessary deploys
- [ ] Path patterns are documented and reviewed quarterly
- [ ] Avoid: Mistake
- [ ] Avoid: Overly narrow path filters
- [ ] Avoid: Path filters on merge to main

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Workflow-level vs job-level filtering**: Workflow-level for coarse filtering (entire CI irrelevant). Job-level for fine-grained control (skip deployment if no app code changed).
- **Path-ignore vs inverse path matching**: Path-ignore for well-known non-code locations. Inverse matching (listing all code locations) is more explicit but requires maintenance.
- **Monorepo vs multi-repo**: Path-based triggering makes monorepos practical. Without it, monorepo triggers full suite on every change.
- **Glob pattern testing**: Use `actions/path-filter` output to preview which files match patterns. Test patterns before relying on them for CI gating.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Run Full CI on Merge to Main â€” Never Apply Path Filters to Merges
- [ ] Follow rule: Use `paths-ignore` for Noise Reduction
- [ ] Follow rule: Be Explicit with Path Lists â€” Include All Code Directories
- [ ] Follow rule: Include Workflow Files in Path Filters
- [ ] Follow rule: Run Full CI on a Nightly Schedule
- [ ] Follow rule: Use Job-Level Conditions for Deployment Workflows
- [ ] - [ ] Path filters are used on development branches but not on merge to main
- [ ] - [ ] Nightly full CI run catches cross-boundary regressions
- [ ] - [ ] Workflow file changes trigger CI
- [ ] - [ ] Deployment workflow has path filters to avoid unnecessary deploys

# Performance Checklist
- Path filter evaluation: GitHub evaluates server-side. Zero CI minute cost when workflow is skipped.
- Job-level `if` conditions: Workflow starts, job evaluates condition. If skipped, workflow setup minutes (~10-20s) are consumed.
- Monorepo with 10+ apps: Path-based triggering keeps each app's CI under 10 minutes. Without filtering, full suite could take 1+ hours.
- Merge queue: Always run full CI regardless of paths when merging to main.

# Security Checklist
- Path filters that skip CI for security-related files (`.env.example`, `config/auth.php` changes) may miss critical security validations.
- Workflow file changes should always trigger CI. A malicious workflow modification could bypass security checks without triggering CI.
- Consider adding a dedicated security workflow that always runs regardless of path changes.

# Reliability Checklist
- [ ] Ensure: Path-based triggering in GitHub Actions runs CI pipelines only when specific fil...
- [ ] Verify: Always Run Full CI on Merge to Main â€” Never Apply Path Filters to Merges
- [ ] Verify: Use `paths-ignore` for Noise Reduction
- [ ] Verify: Be Explicit with Path Lists â€” Include All Code Directories
- [ ] Verify: Include Workflow Files in Path Filters

# Testing Checklist
- [ ] Path filters are used on development branches but not on merge to main
- [ ] Nightly full CI run catches cross-boundary regressions
- [ ] Workflow file changes trigger CI
- [ ] Deployment workflow has path filters to avoid unnecessary deploys
- [ ] Path patterns are documented and reviewed quarterly
- [ ] Path-ignore covers documentation and non-code files
- [ ] Avoid: Mistake
- [ ] Avoid: Overly narrow path filters
- [ ] Avoid: Path filters on merge to main

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Run Full CI on Merge to Main â€” Never Apply Path Filters to Merges
- [ ] Apply: Use `paths-ignore` for Noise Reduction
- [ ] Apply: Be Explicit with Path Lists â€” Include All Code Directories
- [ ] Apply: Include Workflow Files in Path Filters

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Overly narrow path filters
- [ ] Avoid mistake: Path filters on merge to main
- [ ] Avoid mistake: Not filtering deployment workflows
- [ ] Avoid mistake: Assuming OR logic is AND logic

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
- Always Run Full CI on Merge to Main â€” Never Apply Path Filters to Merges
- Use `paths-ignore` for Noise Reduction
- Be Explicit with Path Lists â€” Include All Code Directories
- Include Workflow Files in Path Filters
- Run Full CI on a Nightly Schedule
- Use Job-Level Conditions for Deployment Workflows
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Configure Path-Based CI Triggers


