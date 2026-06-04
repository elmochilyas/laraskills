# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 09OnboardingAndStandards
**Knowledge Unit:** ContributingDotMdPatterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] File is in project root for GitHub/GitLab auto-detection
- [ ] Exact test command is provided (`sail pest` or `vendor/bin/pest`)
- [ ] PR template mirrors the CONTRIBUTING.md requirements
- [ ] Each section has 5 bullet points or fewer
- [ ] File size is under 10KB
- [ ] Code of conduct is linked (not embedded)
- [ ] Coding standards are linked (not duplicated)
- [ ] Setup instructions are CI-verified on every release
- [ ] Branching convention is documented and consistent

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **File Location:** Root directory (GitHub/GitLab auto-detection). Additional templates in `.git...
- [ ] Architecture guideline: - **Tone:** Friendly but professional. Match the Laravel ecosystem's welcoming tone. Use "we" and...
- [ ] Architecture guideline: - **Detail Level:** Comprehensive for public repos (assume no prior knowledge). Minimal for inter...
- [ ] Architecture guideline: - **Structure:** Introduction + Code of Conduct â†’ Getting Started â†’ Development Workflow â†’ ...
- [ ] Architecture guideline: - **Branching Convention:** `feature/short-description` for features; `bugfix/issue-number` for f...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create and Maintain a CONTRIBUTING.md File

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
- [ ] File is in project root for GitHub/GitLab auto-detection
- [ ] Exact test command is provided (`sail pest` or `vendor/bin/pest`)
- [ ] PR template mirrors the CONTRIBUTING.md requirements
- [ ] Each section has 5 bullet points or fewer
- [ ] File size is under 10KB
- [ ] Code of conduct is linked (not embedded)
- [ ] Coding standards are linked (not duplicated)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Wall of Text -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Assumed Knowledge Document -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Outdated Guide -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Self-Referential Loop -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Assuming Docker/Sail
- [ ] Avoid mistake: No Test Command
- [ ] Avoid mistake: Outdated Setup Instructions
- [ ] Avoid mistake: No Code of Conduct

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
- Create and Maintain a CONTRIBUTING.md File
### Anti-Patterns (from 08)
- The Wall of Text
- The Assumed Knowledge Document
- The Outdated Guide
- The Self-Referential Loop
### Common Mistakes (from 04)
- Assuming Docker/Sail
- No Test Command
- Outdated Setup Instructions
- No Code of Conduct
### Related Rules (from 06 skills)
- CONTRIB-RULE-001 through CONTRIB-RULE-012
### Related Skills (from 06 skills)
- Set Up Coding Standards Documentation
- Define PR Template Patterns
- Set Up Developer Onboarding Checklists
- Document Development Workflow

