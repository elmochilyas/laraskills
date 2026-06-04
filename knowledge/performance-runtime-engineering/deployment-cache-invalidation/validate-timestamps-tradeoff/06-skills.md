# Skill: Configure opcache.validate_timestamps=0 in Production with Automated Invalidation

## Purpose
Set `opcache.validate_timestamps=0` in production php.ini to eliminate stat() syscall overhead (saving 1-2.5ms per request or 0.5-1% CPU), maintain `validate_timestamps=1` with `revalidate_freq=0` in development for immediate code visibility, integrate explicit OpCache invalidation into the deployment pipeline, and use environment-specific php.ini files to prevent cross-environment misconfiguration — achieving the single highest-ROI OpCache tuning change.

## When To Use
- All production environments (highest ROI single performance setting)
- Deployments with automated cache invalidation in CI/CD pipeline
- Systems with controlled deployment processes

## When NOT To Use
- Development environments (code changes must appear immediately)
- Shared hosting without control over deployment automation
- Systems without deployment pipeline for explicit invalidation

## Prerequisites
- Deployment pipeline with explicit cache invalidation step
- cachetool or opcache_reset() call in deployment script
- Environment-specific php.ini management
- Team understanding that code changes require explicit invalidation

## Inputs
- Production php.ini template (validate_timestamps=0)
- Development php.ini template (validate_timestamps=1, revalidate_freq=0)
- Deployment script with invalidation step

## Workflow

### 1. Set validate_timestamps=0 in Production php.ini
- `opcache.validate_timestamps=0` in production configuration
- This eliminates stat() syscall per cached file per request
- A 500-file request saves 1-2.5ms; at 1000 RPS, eliminates 500,000 stat() calls/second
- Also disable `revalidate_freq` and `revalidate_path` — they are irrelevant when validate_timestamps=0

### 2. Keep validate_timestamps=1 in Development
- `opcache.validate_timestamps=1` with `opcache.revalidate_freq=0`
- Code changes appear immediately without manual cache invalidation
- Never use validate_timestamps=0 in development — changes become invisible

### 3. Integrate Explicit Invalidation in Deployment Pipeline
- With validate_timestamps=0, code changes NEVER take effect automatically
- Deployment MUST include explicit invalidation: `cachetool opcache:reset --all`
- Verify invalidation: check `opcache_get_status()['hit_rate']` dropped to 0, then warms back up
- Without this step, deployments silently serve stale code

### 4. Use Environment-Specific php.ini Files
- Maintain separate php.ini files for development and production
- Deployment pipeline applies the correct file based on target environment
- Prevent production performance loss from validate_timestamps=1
- Prevent development confusion from validate_timestamps=0

### 5. Document the Tradeoff for the Team
- All developers must understand: validate_timestamps=0 means code changes require explicit invalidation
- Add comments in deployment scripts explaining the mechanism
- Include in onboarding documentation
- Prevent wasted debugging time from "deployed but nothing changed"

## Validation Checklist
- [ ] Production php.ini has `opcache.validate_timestamps=0`
- [ ] Development php.ini has `opcache.validate_timestamps=1`
- [ ] Deployment pipeline includes explicit OpCache invalidation step
- [ ] Invalidation verified (hit rate confirmed 0 after reset, >99% after warm-up)
- [ ] Environment-specific php.ini files separated by deployment
- [ ] Team understands the invalidation requirement (documentation exists)

## Related Rules
- Always 0 in production (`05-rules.md:5`)
- Keep 1 in development (`05-rules.md:32`)
- Explicit invalidation in deployment pipeline (`05-rules.md:59`)
- Never toggle for individual deployments (`05-rules.md:90`)
- Document the invalidation requirement (`05-rules.md:124`)
- Environment-specific php.ini (`05-rules.md:154`)

## Related Skills
- OpCache Reset Strategies
- Deployment Cache Invalidation
- CI/CD Cache Invalidation Steps
- OpCache Production Hardening

## Success Criteria
- validate_timestamps=0 in all production environments (stat() overhead eliminated)
- validate_timestamps=1 in all development environments (immediate code visibility)
- Deployment pipeline invalidates OpCache explicitly on every deploy
- Environment-specific php.ini prevents cross-environment misconfiguration
- Team understands and documents the invalidation requirement
- 0.5-1% CPU saved from eliminated stat() syscalls
