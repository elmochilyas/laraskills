# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 03MonorepoManagement
**Knowledge Unit:** ComposerPathRepositoryUsage
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] No specific checklist items derived - consult source files

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Repository Definition:** In root `composer.json`: `"repositories": [{"type": "path", "url": "...
- [ ] Architecture guideline: - **Root Require Strategy:** Root `composer.json` requires all packages: `"require": {"my-org/pac...
- [ ] Architecture guideline: - **Replace Pattern:** Use `"replace"` in root to declare local packages replace remote equivalen...
- [ ] Architecture guideline: - **Symlink Configuration:** Default symlink behavior. For Windows without admin: `"prefer-stable...
- [ ] Architecture guideline: - **CI Resolution:** In CI, use path repos for speed. Add a separate CI job that tests remote res...
- [ ] Architecture guideline: - **Production Build:** Remove path repo configuration during production build. Run `composer ins...
- [ ] Decision: Path Repos vs Remote Resolution for Development? - ensure correct choice is made
- [ ] Decision: Single Root vs Per-Environment Config? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

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

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Production Path Repo -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Symlink Sprawl -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Ignored Lock File -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Frozen Dependency -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Committing Path Repository Lock File to Production
- [ ] Avoid mistake: Not Using Path Repositories in Development
- [ ] Avoid mistake: Version Constraint Mismatch
- [ ] Avoid mistake: Using Absolute Paths

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
### Decision Trees (from 07)
- Path Repos vs Remote Resolution for Development?
- Single Root vs Per-Environment Config?
### Anti-Patterns (from 08)
- The Production Path Repo
- The Symlink Sprawl
- The Ignored Lock File
- The Frozen Dependency
### Common Mistakes (from 04)
- Committing Path Repository Lock File to Production
- Not Using Path Repositories in Development
- Version Constraint Mismatch
- Using Absolute Paths

