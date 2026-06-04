# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 09OnboardingAndStandards
**Knowledge Unit:** DevelopmentWorkflowDocumentation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Branching strategy is clearly defined with naming conventions
- [ ] Quality gates listed with: blocking vs advisory, automated vs manual, responsible party
- [ ] Feature lifecycle documents every stage from ticket to production
- [ ] Rollback procedure is as detailed as deployment procedure
- [ ] Deployment windows documented with hotfix exception process
- [ ] Environment variable change process documented
- [ ] Merge strategy specified (squash merge recommended for main)
- [ ] Reviewer requirements documented (1 for standard, 2 for architectural)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Git Workflow:** GitHub Flow (simple, one main branch) for most teams. Git Flow for release-ve...
- [ ] Architecture guideline: - **PR Merge Strategy:** Squash merge for main (clean history, one commit per PR). Merge commits ...
- [ ] Architecture guideline: - **Deployment Frequency:** Continuous to staging (auto-deploy on merge to main). Daily to produc...
- [ ] Architecture guideline: - **Code Review Requirement:** 1 reviewer for standard work. 2 reviewers for architectural change...
- [ ] Architecture guideline: - **Quality Gates:** Hard gates (CI blocks merge) for standard development. Soft gates for emerge...
- [ ] Architecture guideline: - **Rollback Strategy:** Automated rollback script. Tested quarterly. Clear single-command rollba...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Document Development Workflow

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
- [ ] Branching strategy is clearly defined with naming conventions
- [ ] Quality gates listed with: blocking vs advisory, automated vs manual, responsible party
- [ ] Feature lifecycle documents every stage from ticket to production
- [ ] Rollback procedure is as detailed as deployment procedure
- [ ] Deployment windows documented with hotfix exception process
- [ ] Environment variable change process documented
- [ ] Merge strategy specified (squash merge recommended for main)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Free-for-All -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Ticket-Before-Deployment -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Manual Deployment Playbook -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The QA-Bottleneck -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: No Documented Rollback
- [ ] Avoid mistake: Skipping Quality Gates for Hotfixes
- [ ] Avoid mistake: Inconsistent Deployment Process
- [ ] Avoid mistake: No Deployment Freeze Policy

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
- Document Development Workflow
### Anti-Patterns (from 08)
- The Free-for-All
- The Ticket-Before-Deployment
- The Manual Deployment Playbook
- The QA-Bottleneck
### Common Mistakes (from 04)
- No Documented Rollback
- Skipping Quality Gates for Hotfixes
- Inconsistent Deployment Process
- No Deployment Freeze Policy
### Related Rules (from 06 skills)
- WORKFLOW-RULE-001 through WORKFLOW-RULE-011
### Related Skills (from 06 skills)
- Create CONTRIBUTING.md
- Set Up Automated Deployment Pipelines
- Set Up Automated Testing in CI
- Set Up GitHub Actions for Laravel
- Write Architecture Decision Records

