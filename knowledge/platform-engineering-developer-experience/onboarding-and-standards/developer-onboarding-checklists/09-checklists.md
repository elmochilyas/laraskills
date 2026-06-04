# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 09OnboardingAndStandards
**Knowledge Unit:** DeveloperOnboardingChecklists
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] 20-30 items total across all segments (not overwhelming)
- [ ] Each item has a verification step to confirm completion
- [ ] Day 1 focuses on admin, introductions, and environment setup only
- [ ] First PR is explicitly targeted for week 1
- [ ] Human elements included (team lunches, 1:1s, informal chats)
- [ ] Feedback loop asks new developer to improve the checklist
- [ ] Checklist is version-controlled in the repository
- [ ] Buddy has structured time commitment documented

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Format:** Markdown in repository (`ONBOARDING.md` or `docs/onboarding/checklist.md`). Version...
- [ ] Architecture guideline: - **Structure:** Organized by time: Pre-arrival, Day 1, Week 1, Month 1. Each section has 5-8 hig...
- [ ] Architecture guideline: - **Verification:** Self-verify with buddy spot-check. Buddy signs off on Day 1 and End of Week 1...
- [ ] Architecture guideline: - **Duration:** 1-month structured checklist with a 3-month check-in for long-term integration.
- [ ] Architecture guideline: - **Buddy Allocation:** Formal allocation with time budget (1-2 hours/day week 1, 30 min/day week...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create Developer Onboarding Checklists

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
- [ ] 20-30 items total across all segments (not overwhelming)
- [ ] Each item has a verification step to confirm completion
- [ ] Day 1 focuses on admin, introductions, and environment setup only
- [ ] First PR is explicitly targeted for week 1
- [ ] Human elements included (team lunches, 1:1s, informal chats)
- [ ] Feedback loop asks new developer to improve the checklist
- [ ] Checklist is version-controlled in the repository

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Firehose Checklist -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The HR Checklist Only -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Read-Only Checklist -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Forgotten Checklist -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Assuming Prior Knowledge
- [ ] Avoid mistake: No Verification Step
- [ ] Avoid mistake: Stale Checklist
- [ ] Avoid mistake: Buddy Overload

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
- Create Developer Onboarding Checklists
### Anti-Patterns (from 08)
- The Firehose Checklist
- The HR Checklist Only
- The Read-Only Checklist
- The Forgotten Checklist
### Common Mistakes (from 04)
- Assuming Prior Knowledge
- No Verification Step
- Stale Checklist
- Buddy Overload
### Related Rules (from 06 skills)
- ONBOARD-RULE-001 through ONBOARD-RULE-012
### Related Skills (from 06 skills)
- Create Automated Environment Setup Scripts
- Document Local Environment Setup
- Create CONTRIBUTING.md
- Document Development Workflow
- Create Coding Standards Documentation

