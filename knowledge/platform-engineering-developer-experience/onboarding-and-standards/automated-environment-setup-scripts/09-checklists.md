# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 09OnboardingAndStandards
**Knowledge Unit:** AutomatedEnvironmentSetupScripts
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Script can be run twice without errors (idempotent)
- [ ] Prerequisites checked before any destructive operations
- [ ] Clear progress output with section headers and timing
- [ ] Validation step confirms the app is actually working
- [ ] Platform-specific installation instructions for missing prerequisites
- [ ] `.env.example` has placeholder values (no real secrets)
- [ ] CI pipeline runs the same setup script on fresh checkout

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Script Language:** Bash (universal in WSL2/macOS/Linux). Makefile as wrapper for dependency-o...
- [ ] Architecture guideline: - **Containerization:** Sail for most teams (Docker-based consistency). Devcontainer for VS Code ...
- [ ] Architecture guideline: - **Database Seeding:** Default: migrate only (no seed) with `--seed` option. Let developers choo...
- [ ] Architecture guideline: - **Secret Management:** .env.example with placeholder values. Prompt for production-like secrets...
- [ ] Architecture guideline: - **Structure:** check-deps â†’ env-setup â†’ deps-install â†’ containers-up â†’ db-setup â†’ val...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create Automated Environment Setup Scripts

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
- [ ] Script can be run twice without errors (idempotent)
- [ ] Prerequisites checked before any destructive operations
- [ ] Clear progress output with section headers and timing
- [ ] Validation step confirms the app is actually working
- [ ] Platform-specific installation instructions for missing prerequisites
- [ ] `.env.example` has placeholder values (no real secrets)
- [ ] CI pipeline runs the same setup script on fresh checkout

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Silent Script -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Fragile Script -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Monolith Script -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Untested Script -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Manual-Equivalent Script -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Non-Idempotent Operations
- [ ] Avoid mistake: Hardcoded Paths
- [ ] Avoid mistake: Missing Error Handling
- [ ] Avoid mistake: No Validation Step

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
- Create Automated Environment Setup Scripts
### Anti-Patterns (from 08)
- The Silent Script
- The Fragile Script
- The Monolith Script
- The Untested Script
- The Manual-Equivalent Script
### Common Mistakes (from 04)
- Non-Idempotent Operations
- Hardcoded Paths
- Missing Error Handling
- No Validation Step
### Related Rules (from 06 skills)
- AUTOSETUP-RULE-001 through AUTOSETUP-RULE-012
### Related Skills (from 06 skills)
- Document Local Environment Setup
- Set Up Developer Onboarding Checklists
- Configure Devcontainer
- Set Up Laravel Sail

