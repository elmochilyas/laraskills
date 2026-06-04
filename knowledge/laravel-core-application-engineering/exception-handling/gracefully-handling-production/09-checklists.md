# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Gracefully Handling Production Errors
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Create a Minimal, Dependency-Free 500 Error Page
- [ ] Enforce: Use Maintenance Mode Only as a Last Resort
- [ ] Enforce: Implement Health Check Endpoints
- [ ] Enforce: Configure Production Error Monitoring from Day One
- [ ] Failsafe 500 page exists with inline CSS, no dependencies
- [ ] `/health` and `/health/db` endpoints exist
- [ ] Maintenance mode procedure is documented with retry and secret
- [ ] Error monitoring (Sentry/Flare/Bugsnag) is configured
- [ ] Alerting is configured for CRITICAL exception types
- [ ] Degraded operation strategies exist for critical features
- [ ] Failsafe page has been tested by forcing handler failure
- [ ] Health check endpoints are rate limited

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Architecture guideline: Minimal, self-contained 500 error page
- [ ] Architecture guideline: `/health` and `/health/db` endpoints
- [ ] Architecture guideline: Error monitoring from day one
- [ ] Architecture guideline: Maintenance mode with retry and secret
- [ ] Architecture guideline: Degraded operation for partial failures

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] No hardcoded values — configuration is externalized
- [ ] Apply rule: Minimal, Dependency-Free 500 Page
- [ ] Apply rule: Maintenance Mode Only as Last Resort
- [ ] Apply rule: Implement Health Check Endpoints
- [ ] Apply rule: Production Error Monitoring from Day One
- [ ] Skill applied: Implement Production Error Handling
- [ ] Skill applied: Design Degraded Operation Strategies

# Performance Checklist (from 04/06)
- [ ] Health check endpoints are lightweight (no framework bootstrap)
- [ ] `/health/db` uses `SELECT 1`, not a full query

# Security Checklist (from 04/06)
- [ ] Health check endpoints don't expose internal details
- [ ] Maintenance mode bypass secret is rotated regularly
- [ ] Health check responses don't reveal database schema or version
- [ ] Health check endpoints are not publicly accessible

# Production Readiness Checklist
- [ ] Failsafe error page works when all else fails
- [ ] Health checks accurately reflect application health
- [ ] Error monitoring captures production errors
- [ ] Alerting notifies the right team for critical errors
- [ ] Degraded operation paths are tested
- [ ] Maintenance mode procedure is documented
- [ ] Rollback strategy is defined for deployments

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Rules (from 05)
- Create a Minimal, Dependency-Free 500 Error Page
- Use Maintenance Mode Only as a Last Resort
- Implement Health Check Endpoints
- Configure Production Error Monitoring from Day One
### Skills (from 06)
- Implement Production Error Handling
- Design Degraded Operation Strategies
