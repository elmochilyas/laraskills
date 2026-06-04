# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** CI/CD Pipeline
**Knowledge Unit:** Zero-Downtime Deployment
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use Expand-Contract Pattern for Database Migrations
- [ ] Apply rule: Pre-Warm Caches Before Symlink Swap
- [ ] Apply rule: Test Rollback Procedure Quarterly
- [ ] Apply rule: Handle Queue Jobs Gracefully During Deployment
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Deployer or Forge zero-downtime strategy is configured
- [ ] Database migrations use expand-contract pattern (no destructive changes in same deploy)
- [ ] Config/route/view caches are pre-warmed before symlink swap
- [ ] Queue workers are gracefully restarted after deployment
- [ ] Rollback procedure is tested in staging before production
- [ ] Avoid: Mistake
- [ ] Avoid: Running destructive migrations during deploy
- [ ] Avoid: Not testing rollback

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Deployer vs Forge**: Deployer for complex multi-server deployments with custom hooks. Forge for single-server or simple deployments.
- **Migration timing**: Run migrations before symlink swap (new code reads new schema) â€” requires backward-compatible schema changes.
- **Shared filesystem vs artifacts**: Deployer's shared folder approach works for single server or NFS. For multi-server, consider Docker images with code baked in.
- **Session storage**: Use Redis for session storage. File-based sessions fail with multi-server deployments. Avoid shared filesystem dependency.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use Expand-Contract Pattern for Database Migrations
- [ ] Follow rule: Pre-Warm Caches Before Symlink Swap
- [ ] Follow rule: Test Rollback Procedure Quarterly
- [ ] Follow rule: Handle Queue Jobs Gracefully During Deployment
- [ ] Follow rule: Keep Last 3-5 Releases for Rollback
- [ ] Follow rule: Use Redis for Session Storage in Multi-Server Deployments
- [ ] - [ ] Deployer or Forge zero-downtime strategy is configured
- [ ] - [ ] Database migrations use expand-contract pattern (no destructive changes in same deploy)
- [ ] - [ ] Config/route/view caches are pre-warmed before symlink swap
- [ ] - [ ] Queue workers are gracefully restarted after deployment

# Performance Checklist
- Symlink swap: <1ms. Instantaneous.
- Cache warm-up: 10-30 seconds (config cache, route cache, view cache). Pre-warm before swap.
- Migration time: 1 second to 30 minutes depending on data volume. Large migrations should use chunked processing.
- Queue restart: Workers finish current job (up to job timeout duration). Queue drain may take minutes.

# Security Checklist
- Never store secrets in release folders. Use shared `.env` or environment variables.
- Old releases may contain sensitive data. Ensure rollback cleanup includes secure deletion.
- Deployment scripts should run with minimal necessary permissions (principle of least privilege).
- SSH keys used for deployment should be restricted to deployment-only access.

# Reliability Checklist
- [ ] Ensure: Zero-downtime deployment for Laravel applications updates production code withou...
- [ ] Verify: Use Expand-Contract Pattern for Database Migrations
- [ ] Verify: Pre-Warm Caches Before Symlink Swap
- [ ] Verify: Test Rollback Procedure Quarterly
- [ ] Verify: Handle Queue Jobs Gracefully During Deployment

# Testing Checklist
- [ ] Deployer or Forge zero-downtime strategy is configured
- [ ] Database migrations use expand-contract pattern (no destructive changes in same deploy)
- [ ] Config/route/view caches are pre-warmed before symlink swap
- [ ] Queue workers are gracefully restarted after deployment
- [ ] Rollback procedure is tested in staging before production
- [ ] Last 3-5 releases are retained for rollback
- [ ] Avoid: Mistake
- [ ] Avoid: Running destructive migrations during deploy
- [ ] Avoid: Not testing rollback

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use Expand-Contract Pattern for Database Migrations
- [ ] Apply: Pre-Warm Caches Before Symlink Swap
- [ ] Apply: Test Rollback Procedure Quarterly
- [ ] Apply: Handle Queue Jobs Gracefully During Deployment

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Running destructive migrations during deploy
- [ ] Avoid mistake: Not testing rollback
- [ ] Avoid mistake: Cache not pre-warmed
- [ ] Avoid mistake: Ignoring queue job compatibility

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
- Use Expand-Contract Pattern for Database Migrations
- Pre-Warm Caches Before Symlink Swap
- Test Rollback Procedure Quarterly
- Handle Queue Jobs Gracefully During Deployment
- Keep Last 3-5 Releases for Rollback
- Use Redis for Session Storage in Multi-Server Deployments
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Implement Zero-Downtime Deployment


