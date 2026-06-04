# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 01InternalDeveloperPlatforms
**Knowledge Unit:** SelfServiceEnvironmentProvisioning
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Local provisioning: app + DB in < 60 seconds; full-service in < 3 minutes
- [ ] Remote provisioning: staging in < 5 minutes; preview in < 10 minutes
- [ ] Destroy workflow exists for every create workflow
- [ ] TTL-based auto-cleanup configured
- [ ] Environment parity: same service versions across dev/staging/production
- [ ] Idempotent provisioning â€” re-running is safe
- [ ] Credentials generated per environment; destroyed with environment
- [ ] Network isolation from production

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Provisioning Target Selection:** Local Docker for development environments. Forge/VPS for sta...
- [ ] Architecture guideline: - **Template-Based Configuration:** Store environment templates as YAML files in version control ...
- [ ] Architecture guideline: - **Progressive Provisioning:** Start with minimal environment (app + DB only), add services on d...
- [ ] Architecture guideline: - **Data Seeding Profiles:** Support different strategies: schema only (CI), dummy data (developm...
- [ ] Architecture guideline: - **Health Verification:** Each provisioning step validates success. Final step pings application...
- [ ] Architecture guideline: - **Resource Quotas:** Enforce per-team and per-user limits on concurrent environments. Queue pro...
- [ ] Decision: Should We Implement Self-Service Provisioning? - ensure correct choice is made
- [ ] Decision: Local vs Remote Provisioning? - ensure correct choice is made
- [ ] Decision: Fresh Seeds vs Database Snapshots? - ensure correct choice is made
- [ ] Decision: TTL Policy for Environment Cleanup? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Self-Service Environment Provisioning for Laravel
- [ ] Skill applied: Set Up Preview Environments for Laravel PR Workflows

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
- [ ] Local provisioning: app + DB in < 60 seconds; full-service in < 3 minutes
- [ ] Remote provisioning: staging in < 5 minutes; preview in < 10 minutes
- [ ] Destroy workflow exists for every create workflow
- [ ] TTL-based auto-cleanup configured
- [ ] Environment parity: same service versions across dev/staging/production
- [ ] Idempotent provisioning â€” re-running is safe
- [ ] Credentials generated per environment; destroyed with environment

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Snowflake Server -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Click-Ops Interface -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Ticket-Backed Platform -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Stale Snapshot -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Incomplete Environment Parity
- [ ] Avoid mistake: No Automated Teardown
- [ ] Avoid mistake: Hardcoded Credentials in Templates
- [ ] Avoid mistake: One Template for Everything

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
- Implement Self-Service Environment Provisioning for Laravel
- Set Up Preview Environments for Laravel PR Workflows
### Decision Trees (from 07)
- Should We Implement Self-Service Provisioning?
- Local vs Remote Provisioning?
- Fresh Seeds vs Database Snapshots?
- TTL Policy for Environment Cleanup?
### Anti-Patterns (from 08)
- The Snowflake Server
- The Click-Ops Interface
- The Ticket-Backed Platform
- The Stale Snapshot
### Common Mistakes (from 04)
- Incomplete Environment Parity
- No Automated Teardown
- Hardcoded Credentials in Templates
- One Template for Everything
### Related Skills (from 06 skills)
- Build a Forge-Based Self-Service Provisioning Platform
- Configure Laravel Sail for Local Development
- Set Up GitHub Actions for Laravel CI/CD

