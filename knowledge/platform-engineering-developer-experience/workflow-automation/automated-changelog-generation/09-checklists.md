# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** AutomatedChangelogGeneration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Changelog follows "Keep a Changelog" format
- [ ] Sections match: Breaking Changes, Added, Changed, Fixed, Security
- [ ] Breaking changes include migration instructions
- [ ] Changelog generated at release time, not per-commit
- [ ] Unreleased section maintained during development
- [ ] PR labels or conventional commits used consistently
- [ ] Changelog curated before publication

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Release Drafter Pattern (GitHub Actions):** Configure .github/release-drafter.yml with catego...
- [ ] Architecture guideline: - **Keep a Changelog + Conventional Commits Pattern:** Standard format with version headings and ...
- [ ] Architecture guideline: - **Automated Changelog GitHub Action Pattern:** Use actions to commit changelog and create GitHu...
- [ ] Architecture guideline: - **Conventional Commits Configuration Pattern:** Map commit types to changelog sections in .chan...
- [ ] Architecture guideline: - **Source of Truth:** PR labels (easier for non-committers) vs Conventional Commits (in git hist...
- [ ] Architecture guideline: - **Generation Timing:** On release (tag or workflow dispatch) rather than per-commit
- [ ] Architecture guideline: - **Changelog Location:** Both CHANGELOG.md in repository + GitHub Releases

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Generate Automated Changelogs

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
- [ ] Changelog follows "Keep a Changelog" format
- [ ] Sections match: Breaking Changes, Added, Changed, Fixed, Security
- [ ] Breaking changes include migration instructions
- [ ] Changelog generated at release time, not per-commit
- [ ] Unreleased section maintained during development
- [ ] PR labels or conventional commits used consistently
- [ ] Changelog curated before publication

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Changelog as git log dump -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No manual curation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Breaking changes hidden -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Changelog only at release -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Format inconsistency -- apply preferred alternative
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
- Generate Automated Changelogs
### Anti-Patterns (from 08)
- Changelog as git log dump
- No manual curation
- Breaking changes hidden
- Changelog only at release
- Format inconsistency
### Related Rules (from 06 skills)
- CHANGELOG-RULE-001: Use PR labels or Conventional Commits
- CHANGELOG-RULE-002: Generate at release time
- CHANGELOG-RULE-003: Maintain both CHANGELOG.md and GitHub Releases
- CHANGELOG-RULE-004: Use "Keep a Changelog" format
- CHANGELOG-RULE-005: Mark breaking changes with migration instructions
### Related Skills (from 06 skills)
- Set Up Automated Deployment Pipelines
- Create PR Template Patterns
- Configure Dependency Update Automation

