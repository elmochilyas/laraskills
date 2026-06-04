# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** PrTemplatePatterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] PR template under 30 lines with clear headers
- [ ] CI enforcement checklist included (Pint, PHPStan, Tests)
- [ ] Deployment Notes section present
- [ ] "Require template" setting enabled
- [ ] Single template for most teams (multiple for diverse PR types)
- [ ] Template reviewed and updated quarterly
- [ ] Template stored in `.github/PULL_REQUEST_TEMPLATE.md`

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Standard Laravel PR Template Pattern:** Description, ticket reference, type of change, testin...
- [ ] Architecture guideline: - **Multiple Template Pattern:** Directory-based templates for different PR types: default.md, bu...
- [ ] Architecture guideline: - **Bug Fix Template Pattern:** Bug description, steps to reproduce, expected behavior, root caus...
- [ ] Architecture guideline: - **Feature Template Pattern:** Feature description, how to test, API changes (if applicable), do...
- [ ] Architecture guideline: - **Hotfix Template Pattern:** Urgency justification, impact if not deployed, risk assessment, ve...
- [ ] Architecture guideline: - **Checklist Design:** Include both automated checks (Pint, PHPStan, tests) for CI verification ...
- [ ] Architecture guideline: - **Template Count:** Single template for most teams; multiple templates for projects with divers...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create PR Template Patterns

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
- [ ] PR template under 30 lines with clear headers
- [ ] CI enforcement checklist included (Pint, PHPStan, Tests)
- [ ] Deployment Notes section present
- [ ] "Require template" setting enabled
- [ ] Single template for most teams (multiple for diverse PR types)
- [ ] Template reviewed and updated quarterly
- [ ] Template stored in `.github/PULL_REQUEST_TEMPLATE.md`

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Checklist as quality gate enforcement -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Template as substitute for documentation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: One-size-fits-all for every PR type -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Template bypass allowed -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring template feedback -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern

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
- Create PR Template Patterns
### Anti-Patterns (from 08)
- Checklist as quality gate enforcement
- Template as substitute for documentation
- One-size-fits-all for every PR type
- Template bypass allowed
- Ignoring template feedback
### Related Rules (from 06 skills)
- PRTEMP-RULE-001: Keep template under 30 lines
- PRTEMP-RULE-002: Include checklist items CI enforces
- PRTEMP-RULE-003: Include "Deployment Notes" section
- PRTEMP-RULE-004: Single template for most teams
- PRTEMP-RULE-005: Store in `.github/PULL_REQUEST_TEMPLATE.md`
### Related Skills (from 06 skills)
- Establish Code Review Standards
- Set Up Automated Testing in CI
- Configure Dependency Update Automation

