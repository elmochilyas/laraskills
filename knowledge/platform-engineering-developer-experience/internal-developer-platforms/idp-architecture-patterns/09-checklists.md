# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 01InternalDeveloperPlatforms
**Knowledge Unit:** IdpArchitecturePatterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Architecture follows 4-layer pattern with clear API boundaries
- [ ] Each layer uses composed existing tools, not custom build
- [ ] Golden paths cover 80% of use cases with documented escape hatches
- [ ] Every platform action is idempotent and observable
- [ ] Provisioning completes in under 5 minutes; CI in under 10 minutes
- [ ] Least-privilege integration and credential management implemented
- [ ] Developer adoption metrics defined and baseline measured

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Layered Architecture:** Infrastructure â†’ Orchestration â†’ Service Catalog â†’ Developer Po...
- [ ] Architecture guideline: - **Template-Driven Provisioning:** All infrastructure is created from version-controlled templat...
- [ ] Architecture guideline: - **API-First Design:** Every platform capability is exposed via API before any UI is built. The ...
- [ ] Architecture guideline: - **Idempotent Operations:** All provisioning and deployment operations are safe to re-run. Use c...
- [ ] Architecture guideline: - **Observability by Default:** Every platform action generates logs, metrics, and audit trails. ...
- [ ] Architecture guideline: - **Least Privilege Integration:** API tokens, secrets, and credentials follow least-privilege ac...
- [ ] Decision: Should We Build an IDP? - ensure correct choice is made
- [ ] Decision: Compose vs Build Platform Components? - ensure correct choice is made
- [ ] Decision: Portal vs CLI-First? - ensure correct choice is made
- [ ] Decision: Forge vs Kubernetes for Provisioning? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Design an IDP Architecture for Laravel Teams
- [ ] Skill applied: Implement Platform Observability and Governance

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
- [ ] Architecture follows 4-layer pattern with clear API boundaries
- [ ] Each layer uses composed existing tools, not custom build
- [ ] Golden paths cover 80% of use cases with documented escape hatches
- [ ] Every platform action is idempotent and observable
- [ ] Provisioning completes in under 5 minutes; CI in under 10 minutes
- [ ] Least-privilege integration and credential management implemented
- [ ] Developer adoption metrics defined and baseline measured

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Snowflake Platform -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Black Box Platform -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Kitchen Sink Platform -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Gatekeeper Platform -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Vendor Lock-In Platform -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Building Before Understanding Pain Points
- [ ] Avoid mistake: Over-Automating Unstable Processes
- [ ] Avoid mistake: Neglecting Platform Maintenance
- [ ] Avoid mistake: One-Size-Fits-All Golden Paths

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
- Design an IDP Architecture for Laravel Teams
- Implement Platform Observability and Governance
### Decision Trees (from 07)
- Should We Build an IDP?
- Compose vs Build Platform Components?
- Portal vs CLI-First?
- Forge vs Kubernetes for Provisioning?
### Anti-Patterns (from 08)
- The Snowflake Platform
- The Black Box Platform
- The Kitchen Sink Platform
- The Gatekeeper Platform
- The Vendor Lock-In Platform
### Common Mistakes (from 04)
- Building Before Understanding Pain Points
- Over-Automating Unstable Processes
- Neglecting Platform Maintenance
- One-Size-Fits-All Golden Paths
### Related Skills (from 06 skills)
- Design Golden Paths for Laravel Development
- Integrate Backstage as a Developer Portal
- Implement Self-Service Environment Provisioning

