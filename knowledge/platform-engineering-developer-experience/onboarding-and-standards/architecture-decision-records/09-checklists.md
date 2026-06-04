# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 09OnboardingAndStandards
**Knowledge Unit:** ArchitectureDecisionRecords
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] ADR follows Nygard format (Title, Status, Context, Decision, Consequences)
- [ ] Alternatives section documents what was considered and why rejected
- [ ] ADR is 1-2 pages maximum
- [ ] Sequential numbering is used (no gaps for accepted ADRs)
- [ ] PR has at least 1-2 reviewers within 24-hour SLA
- [ ] Superseded ADRs have their status updated and reference the new ADR

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Storage:** Repository directory `docs/adrs/`. Versioned, reviewed via PRs, co-located with co...
- [ ] Architecture guideline: - **Template:** Nygard format (most widely adopted, enough structure without over-engineering).
- [ ] Architecture guideline: - **Numbering:** Sequential (0001, 0002). Gaps indicate superseded or rejected ADRs.
- [ ] Architecture guideline: - **Review Process:** PR-based with 1-2 reviewers. 24-hour SLA for ADR reviews. Async, documented...
- [ ] Architecture guideline: - **ADR Index:** README.md in `docs/adrs/` directory listing all ADRs with titles, statuses, and ...
- [ ] Architecture guideline: - **Supersession:** Old ADR links to new ADR; new ADR references old ADR. Both remain in the repo...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Write and Maintain Architecture Decision Records

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
- [ ] ADR follows Nygard format (Title, Status, Context, Decision, Consequences)
- [ ] Alternatives section documents what was considered and why rejected
- [ ] ADR is 1-2 pages maximum
- [ ] Sequential numbering is used (no gaps for accepted ADRs)
- [ ] PR has at least 1-2 reviewers within 24-hour SLA
- [ ] Superseded ADRs have their status updated and reference the new ADR

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The ADR Graveyard -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The 10-Page ADR -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Wiki ADR -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Secret Decision -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Over-Documenting Trivia
- [ ] Avoid mistake: Skipping Alternatives
- [ ] Avoid mistake: Not Updating Status
- [ ] Avoid mistake: Too Much Detail

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
- Write and Maintain Architecture Decision Records
### Anti-Patterns (from 08)
- The ADR Graveyard
- The 10-Page ADR
- The Wiki ADR
- The Secret Decision
### Common Mistakes (from 04)
- Over-Documenting Trivia
- Skipping Alternatives
- Not Updating Status
- Too Much Detail
### Related Rules (from 06 skills)
- ADR-RULE-001 through ADR-RULE-012
### Related Skills (from 06 skills)
- Contribute to Projects via CONTRIBUTING.md
- Document Development Workflow
- Set Up Coding Standards Documentation
- Collaborate via Team Patterns

