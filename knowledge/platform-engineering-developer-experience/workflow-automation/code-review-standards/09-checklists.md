# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** CodeReviewStandards
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Review depth levels defined (Light, Standard, Deep)
- [ ] Style and type checks automated in CI
- [ ] PR size limit enforced (400 lines)
- [ ] Review turnaround target set (< 4 hours)
- [ ] 1-2 reviewers assigned per PR
- [ ] CODEOWNERS configured for auto-assignment
- [ ] Approval policy documented

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Review Checklist Pattern:** Structured markdown checklist covering N+1 queries, authorization...
- [ ] Architecture guideline: - **Review Comment Framing Pattern:** Issue + Suggestion + Why format maximizes learning and redu...
- [ ] Architecture guideline: - **Level-Based Review Depth Pattern:** Bug fix (Light, 5-10 min), Feature addition (Standard, 20...
- [ ] Architecture guideline: - **CODEOWNERS Pattern:** Automatically assigns reviewers based on file paths; ensures domain exp...
- [ ] Architecture guideline: - **Review SLA Pattern:** Standard PRs reviewed within 4 hours; urgent hotfixes within 1 hour; la...
- [ ] Architecture guideline: - **Review Requirement:** 1 approval for standard PRs; 2 for architectural changes and production...
- [ ] Architecture guideline: - **Reviewer Assignment:** Automatic CODEOWNERS for standard reviews; manual request for specific...
- [ ] Architecture guideline: - **Merge Strategy:** Squash merge for clean main branch history (one commit per PR)

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Establish Code Review Standards for Laravel

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
- [ ] Review depth levels defined (Light, Standard, Deep)
- [ ] Style and type checks automated in CI
- [ ] PR size limit enforced (400 lines)
- [ ] Review turnaround target set (< 4 hours)
- [ ] 1-2 reviewers assigned per PR
- [ ] CODEOWNERS configured for auto-assignment
- [ ] Approval policy documented

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Gatekeeping culture -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Style debates in review -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Request changes without explanation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: One-person review bottleneck -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Checklist fatigue -- apply preferred alternative
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
- Establish Code Review Standards for Laravel
### Anti-Patterns (from 08)
- Gatekeeping culture
- Style debates in review
- Request changes without explanation
- One-person review bottleneck
- Checklist fatigue
### Related Rules (from 06 skills)
- CR-RULE-001: Focus human review on logic, architecture, correctness
- CR-RULE-002: Use Issue + Suggestion + Why format
- CR-RULE-003: Enforce PR size limit (400 lines)
- CR-RULE-004: Target < 4 hour review turnaround
- CR-RULE-005: Prefix non-blocking nits with "nit:"
### Related Skills (from 06 skills)
- Create PR Template Patterns
- Set Up Automated Testing in CI
- Run Pint in CI

