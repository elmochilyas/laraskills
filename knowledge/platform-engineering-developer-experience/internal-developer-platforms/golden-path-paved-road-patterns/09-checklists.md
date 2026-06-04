# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 01InternalDeveloperPlatforms
**Knowledge Unit:** GoldenPathPavedRoadPatterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Paths cover 80% of use cases with documented escape hatches for the remaining 20%
- [ ] Full automation from start to finish (no "then deploy manually" gaps)
- [ ] Escape hatches documented for every decision point with tradeoffs
- [ ] Path execution from selection to working environment: under 5 minutes
- [ ] CI validates each path on a schedule; broken paths are detected immediately
- [ ] Adoption rate measured; feedback loop established

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Path Definition:** Each golden path combines: template/project skeleton, CI pipeline configur...
- [ ] Architecture guideline: - **Path Discovery:** Expose paths through multiple channels: developer portal (Backstage scaffol...
- [ ] Architecture guideline: - **Path Execution:** Automate the full sequence: scaffold project â†’ configure services â†’ set...
- [ ] Architecture guideline: - **Path Feedback Loop:** Monitor path usage (adoption rate, completion time, deviation frequency...
- [ ] Architecture guideline: - **Path Versioning:** Version golden paths alongside the tools they integrate. A Laravel 11 path...
- [ ] Architecture guideline: - **Path Deprecation:** When deprecating a path, notify existing users with migration guidance an...
- [ ] Decision: Should We Invest in Golden Paths? - ensure correct choice is made
- [ ] Decision: Which Workflows to Path First? - ensure correct choice is made
- [ ] Decision: Level of Opinionation? - ensure correct choice is made
- [ ] Decision: Enforcement vs Attraction? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Design Golden Paths for Laravel Development Workflows
- [ ] Skill applied: Manage Golden Path Lifecycle and Adoption

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
- [ ] Paths cover 80% of use cases with documented escape hatches for the remaining 20%
- [ ] Full automation from start to finish (no "then deploy manually" gaps)
- [ ] Escape hatches documented for every decision point with tradeoffs
- [ ] Path execution from selection to working environment: under 5 minutes
- [ ] CI validates each path on a schedule; broken paths are detected immediately
- [ ] Adoption rate measured; feedback loop established

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Toll Road -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Dead End -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Bicycle Path -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Rat's Nest -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Hidden Path -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Enforcing Without Understanding Developer Needs
- [ ] Avoid mistake: Too Many Paths Too Quickly
- [ ] Avoid mistake: Paths Without Escape Hatches
- [ ] Avoid mistake: Neglecting Path Maintenance

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
- Design Golden Paths for Laravel Development Workflows
- Manage Golden Path Lifecycle and Adoption
### Decision Trees (from 07)
- Should We Invest in Golden Paths?
- Which Workflows to Path First?
- Level of Opinionation?
- Enforcement vs Attraction?
### Anti-Patterns (from 08)
- The Toll Road
- The Dead End
- The Bicycle Path
- The Rat's Nest
- The Hidden Path
### Common Mistakes (from 04)
- Enforcing Without Understanding Developer Needs
- Too Many Paths Too Quickly
- Paths Without Escape Hatches
- Neglecting Path Maintenance
### Related Skills (from 06 skills)
- Architect IDP Patterns for Laravel Teams
- Build Internal Template Registries for Laravel
- Implement Self-Service Environment Provisioning

