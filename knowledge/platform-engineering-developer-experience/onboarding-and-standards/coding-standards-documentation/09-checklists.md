# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 09OnboardingAndStandards
**Knowledge Unit:** CodingStandardsDocumentation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Document does not repeat Pint/PHPStan documentation
- [ ] Each standard includes a good example and a bad example
- [ ] Each standard includes rationale explaining the "why"
- [ ] Blocking vs advisory standards are clearly distinguished
- [ ] Document is 5-10 pages (longer docs are not read)
- [ ] CONTRIBUTING.md links to the standards document
- [ ] Team has reviewed and agreed to the standards
- [ ] CI enforces all blocking standards

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Document Location:** Dedicated file (`docs/standards.md`) rather than bloating CONTRIBUTING.m...
- [ ] Architecture guideline: - **Structure:** Organized by file type: Controllers (RESTful naming, method count, validation pl...
- [ ] Architecture guideline: - **Format:** Tabular format with clear examples of good and bad code. Include a Pint config refe...
- [ ] Architecture guideline: - **Enforcement Levels:** Blocking (CI fails) for automated rules. Advisory (review flags) for ar...
- [ ] Architecture guideline: - **Governance:** Team review of standard changes via PR. Single author for initial draft. Quarte...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Write and Maintain Coding Standards Documentation

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
- [ ] Document does not repeat Pint/PHPStan documentation
- [ ] Each standard includes a good example and a bad example
- [ ] Each standard includes rationale explaining the "why"
- [ ] Blocking vs advisory standards are clearly distinguished
- [ ] Document is 5-10 pages (longer docs are not read)
- [ ] CONTRIBUTING.md links to the standards document
- [ ] Team has reviewed and agreed to the standards

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Encyclopedia -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Style Guide Only -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Opinionated Gospel -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Frozen Document -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Repeating Pint Documentation
- [ ] Avoid mistake: No Examples
- [ ] Avoid mistake: Over-Specifying
- [ ] Avoid mistake: Stale Standards

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
- Write and Maintain Coding Standards Documentation
### Anti-Patterns (from 08)
- The Encyclopedia
- The Style Guide Only
- The Opinionated Gospel
- The Frozen Document
### Common Mistakes (from 04)
- Repeating Pint Documentation
- No Examples
- Over-Specifying
- Stale Standards
### Related Rules (from 06 skills)
- CSDOC-RULE-001 through CSDOC-RULE-012
### Related Skills (from 06 skills)
- Configure Laravel Pint
- Set Up Laravel PHPStan
- Contribute to Projects via CONTRIBUTING.md
- Define Code Review Standards
- Set Up Pre-commit Hooks

