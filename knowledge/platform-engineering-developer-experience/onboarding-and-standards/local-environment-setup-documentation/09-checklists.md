# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 09OnboardingAndStandards
**Knowledge Unit:** LocalEnvironmentSetupDocumentation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Quick Start section is 5-10 lines
- [ ] All major platforms covered (macOS, WSL2, Linux)
- [ ] Each major step has a verification command
- [ ] Troubleshooting section addresses 5+ common issues
- [ ] Setup instructions CI-verified on every release
- [ ] Automated script referenced alongside manual steps
- [ ] No screenshots used
- [ ] `.env.example` has placeholder values documented
- [ ] Structure: Prerequisites â†’ Quick Start â†’ Platform-Specific â†’ Verification â†’ Troubleshooting

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Location:** README.md (setup section) for small projects; SETUP.md for detailed multi-platfor...
- [ ] Architecture guideline: - **Automation Level:** Automated script (`make setup`) as source of truth; manual steps as annot...
- [ ] Architecture guideline: - **Platform Coverage:** macOS + WSL2 (covers 95% of Laravel developers). Linux as bonus.
- [ ] Architecture guideline: - **Verification:** Manual check for immediate feedback; automated CI test for doc freshness.
- [ ] Architecture guideline: - **Structure:** Prerequisites â†’ Quick Start â†’ Platform-Specific â†’ Verification â†’ Trouble...
- [ ] Architecture guideline: - **Quick Start:** Minimal 5-10 line guide. Detailed instructions can be in collapsible sections ...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Document Local Environment Setup

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
- [ ] Quick Start section is 5-10 lines
- [ ] All major platforms covered (macOS, WSL2, Linux)
- [ ] Each major step has a verification command
- [ ] Troubleshooting section addresses 5+ common issues
- [ ] Setup instructions CI-verified on every release
- [ ] Automated script referenced alongside manual steps
- [ ] No screenshots used

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The One-Paragraph Setup -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Mac-Only Guide -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Outdated Screenshot Guide -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Untested Setup Guide -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: "It Works on My Machine"
- [ ] Avoid mistake: Missing Verification Steps
- [ ] Avoid mistake: Hardcoded Credentials in .env.example
- [ ] Avoid mistake: Outdated PHP Version References

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
- Document Local Environment Setup
### Anti-Patterns (from 08)
- The One-Paragraph Setup
- The Mac-Only Guide
- The Outdated Screenshot Guide
- The Untested Setup Guide
### Common Mistakes (from 04)
- "It Works on My Machine"
- Missing Verification Steps
- Hardcoded Credentials in .env.example
- Outdated PHP Version References
### Related Rules (from 06 skills)
- SETUPDOC-RULE-001 through SETUPDOC-RULE-011
### Related Skills (from 06 skills)
- Create Automated Environment Setup Scripts
- Set Up Developer Onboarding Checklists
- Manage Environment Files
- Set Up Laravel Sail

