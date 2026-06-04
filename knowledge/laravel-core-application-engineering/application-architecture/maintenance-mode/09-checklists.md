# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Maintenance Mode
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Queue workers are paused before enabling maintenance mode
- [ ] `php artisan down` includes `--secret` with a unique value
- [ ] Monitoring IPs are included in `--allow` to prevent false alerts
- [ ] `composer install` runs with `--no-dev --optimize-autoloader`
- [ ] `php artisan migrate --force` succeeds
- [ ] All caches are rebuilt after deployment
- [ ] `php artisan up` is the last step (with fallback in failure path)
- [ ] Queue workers are resumed after bringing the app online
- [ ] Bypass URL is shared with the team for deployment verification
- [ ] Deployment script includes error handling (always calls `php artisan up` on failure)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### File-Based vs Database-Based Maintenance Mode
- [ ] Architecture guideline: Laravel's file-based approach is intentionally simple â€” it avoids the circular dependency of re...
- [ ] Architecture guideline: ### Secret URL vs IP Allowlist
- [ ] Architecture guideline: ### Pre-Deploy Checklist
- [ ] Architecture guideline: # 1. Pause queue workers
- [ ] Architecture guideline: php artisan horizon:pause
- [ ] Architecture guideline: # 2. Enable maintenance mode
- [ ] Architecture guideline: php artisan down --retry=60 --secret="deploy-$(date +%s)"
- [ ] Architecture guideline: git pull origin main
- [ ] Architecture guideline: composer install --no-dev
- [ ] Architecture guideline: # 4. Run migrations
- [ ] Architecture guideline: php artisan migrate --force

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Execute Maintenance Mode Deployment

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] Queue workers are paused before enabling maintenance mode
- [ ] `php artisan down` includes `--secret` with a unique value
- [ ] Monitoring IPs are included in `--allow` to prevent false alerts
- [ ] `composer install` runs with `--no-dev --optimize-autoloader`
- [ ] `php artisan migrate --force` succeeds
- [ ] All caches are rebuilt after deployment
- [ ] `php artisan up` is the last step (with fallback in failure path)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Forgetting `php artisan up` -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Manual Maintenance Mode (SSH-Only) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: No Bypass Secret for Deployment Verification -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Deploying Without Queue Worker Coordination -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Skills (from 06)
- Execute Maintenance Mode Deployment
### Decision Trees (from 07)
- Maintenance Mode vs Zero-Downtime Deployments
- Secret URL Bypass vs IP Allowlist Bypass
- File-Based Maintenance vs Database-Based Maintenance Checks
- Automated Deployment Scripts vs Manual Maintenance Mode Management
### Anti-Patterns (from 08)
- Forgetting `php artisan up`
- Manual Maintenance Mode (SSH-Only)
- No Bypass Secret for Deployment Verification
- Deploying Without Queue Worker Coordination
### Related Rules (from 06 skills)
- Always Use --secret for Deployment Bypass (05-rules.md)
- Automate php artisan up in Deployment Scripts (05-rules.md)
- Add Monitoring IPs to --allow (05-rules.md)
- Coordinate Maintenance Mode with Queue Drain (05-rules.md)
- Customize the Maintenance View (05-rules.md)
- Never Use Maintenance Mode for Partial or Static Updates (05-rules.md)
- Use Orchestration for Multi-Server Deployments (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Configure Deployment Pipeline
- Skill: Configure Middleware Pipeline via Kernel

