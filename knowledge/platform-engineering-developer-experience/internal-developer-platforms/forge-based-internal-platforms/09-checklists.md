# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 01InternalDeveloperPlatforms
**Knowledge Unit:** ForgeBasedInternalPlatforms
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] All recipes are version-controlled and CI-tested
- [ ] Deployment scripts live in application repositories, not only in Forge UI
- [ ] Provisioning is fully automated from trigger to environment ready
- [ ] Zero-downtime deploy flow implemented
- [ ] API tokens use minimum required scopes; rotated quarterly
- [ ] No credentials in deployment scripts or recipes
- [ ] Servers can be deprovisioned automatically
- [ ] Provisioning completes within 5-15 minutes (near-instant with pre-warming)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Provisioning Flow:** Platform action â†’ Forge API (create server, install recipe, create sit...
- [ ] Architecture guideline: - **Environment Template Pattern:** Define reusable templates as Forge recipe + deployment script...
- [ ] Architecture guideline: - **Zero-Downtime Deploy:** Deployment script: maintenance mode on â†’ git pull â†’ composer inst...
- [ ] Architecture guideline: - **Recipe Versioning:** Tag and promote recipes through environments (dev â†’ staging â†’ prod)....
- [ ] Architecture guideline: - **Multi-Tenant Isolation:** Separate Forge servers per client or team. Isolated daemons and dat...
- [ ] Architecture guideline: - **Pre-Warm Server Pools:** For "instant" provisioning, maintain a pool of pre-configured Forge ...
- [ ] Decision: Should We Build a Forge-Based Self-Service Platform? - ensure correct choice is made
- [ ] Decision: Recipe Management â€” UI vs Version-Controlled? - ensure correct choice is made
- [ ] Decision: Provisioning Flow â€” Sync vs Async? - ensure correct choice is made
- [ ] Decision: Abstraction Layer â€” Thin Wrap vs Comprehensive? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Build a Forge-Based Self-Service Provisioning Platform
- [ ] Skill applied: Manage Forge Recipe Lifecycle and Testing

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
- [ ] All recipes are version-controlled and CI-tested
- [ ] Deployment scripts live in application repositories, not only in Forge UI
- [ ] Provisioning is fully automated from trigger to environment ready
- [ ] Zero-downtime deploy flow implemented
- [ ] API tokens use minimum required scopes; rotated quarterly
- [ ] No credentials in deployment scripts or recipes
- [ ] Servers can be deprovisioned automatically

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Forge-SSH Hybrid -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Manual Tweak -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Golden Recipe -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Abandoned Server -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The API Key on a Post-it -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Storing Deployment Scripts Only in Forge UI
- [ ] Avoid mistake: Hardcoding Environment Variables in Recipes
- [ ] Avoid mistake: Not Testing Recipes Before Production
- [ ] Avoid mistake: Over-Provisioning Daemons

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
- Build a Forge-Based Self-Service Provisioning Platform
- Manage Forge Recipe Lifecycle and Testing
### Decision Trees (from 07)
- Should We Build a Forge-Based Self-Service Platform?
- Recipe Management â€” UI vs Version-Controlled?
- Provisioning Flow â€” Sync vs Async?
- Abstraction Layer â€” Thin Wrap vs Comprehensive?
### Anti-Patterns (from 08)
- The Forge-SSH Hybrid
- The Manual Tweak
- The Golden Recipe
- The Abandoned Server
- The API Key on a Post-it
### Common Mistakes (from 04)
- Storing Deployment Scripts Only in Forge UI
- Hardcoding Environment Variables in Recipes
- Not Testing Recipes Before Production
- Over-Provisioning Daemons
### Related Skills (from 06 skills)
- Architect IDP Patterns for Laravel Teams
- Implement Self-Service Environment Provisioning
- Set Up Automated Deployment Pipelines

