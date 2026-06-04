# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 01InternalDeveloperPlatforms
**Knowledge Unit:** InternalTemplateRegistries
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] 3-5 templates maintained; no more
- [ ] Each template CI-tested on every change
- [ ] Templates parameterized with sensible defaults; no hardcoded values
- [ ] Template rendering completes in under 2 seconds
- [ ] Generated project includes README with setup instructions
- [ ] Template versioning in generated project metadata
- [ ] No secrets in templates; credentials via environment variables

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Template Format:** Use directory trees with placeholder files. Blade syntax for parameter sub...
- [ ] Architecture guideline: - **Distribution Method:** Composer packages for parameterized templates (supports post-generatio...
- [ ] Architecture guideline: - **Testing:** Each template has CI that: creates project from template â†’ runs composer install...
- [ ] Architecture guideline: - **Registry Structure:** Maintain a catalog file (template.yaml per template) declaring: name, d...
- [ ] Architecture guideline: - **Deprecation Policy:** When retiring a template, block new project generation from it, notify ...
- [ ] Decision: Should We Create Internal Project Templates? - ensure correct choice is made
- [ ] Decision: How Many Templates to Maintain? - ensure correct choice is made
- [ ] Decision: Distribution Method â€” Composer vs GitHub? - ensure correct choice is made
- [ ] Decision: Template Thickness â€” Minimal vs Opinionated? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Build Internal Template Registries for Laravel Projects
- [ ] Skill applied: Implement Template Registry Distribution and Governance

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
- [ ] 3-5 templates maintained; no more
- [ ] Each template CI-tested on every change
- [ ] Templates parameterized with sensible defaults; no hardcoded values
- [ ] Template rendering completes in under 2 seconds
- [ ] Generated project includes README with setup instructions
- [ ] Template versioning in generated project metadata
- [ ] No secrets in templates; credentials via environment variables

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Monolith Template -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Frozen Template -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Empty Template -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Over-Parameterized Template -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Too Many Templates
- [ ] Avoid mistake: Untested Templates
- [ ] Avoid mistake: Outdated Templates
- [ ] Avoid mistake: No Post-Generation Experience

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
- Build Internal Template Registries for Laravel Projects
- Implement Template Registry Distribution and Governance
### Decision Trees (from 07)
- Should We Create Internal Project Templates?
- How Many Templates to Maintain?
- Distribution Method â€” Composer vs GitHub?
- Template Thickness â€” Minimal vs Opinionated?
### Anti-Patterns (from 08)
- The Monolith Template
- The Frozen Template
- The Empty Template
- The Over-Parameterized Template
### Common Mistakes (from 04)
- Too Many Templates
- Untested Templates
- Outdated Templates
- No Post-Generation Experience
### Related Skills (from 06 skills)
- Design Golden Paths for Laravel Development
- Build a Forge-Based Self-Service Provisioning Platform
- Customize Laravel Stubs for Generated Code

