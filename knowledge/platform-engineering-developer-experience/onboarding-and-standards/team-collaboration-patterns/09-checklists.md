# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 09OnboardingAndStandards
**Knowledge Unit:** TeamCollaborationPatterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Async communication is the default (sync reserved for complex discussions)
- [ ] Code review framed as teaching, not gatekeeping
- [ ] "nit:" prefix used for non-blocking style suggestions
- [ ] Meeting total is under 4 hours/week
- [ ] Code review SLA is 4 hours during working hours
- [ ] Decision-making responsibility is clearly defined
- [ ] Incident communication process documented
- [ ] All significant decisions documented (ADRs or equivalent)
- [ ] Meeting attendance audited quarterly

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Standup Format:** Async for distributed teams (Slack thread). Sync for co-located (15 min sta...
- [ ] Architecture guideline: - **Code Review SLA:** Review within 4 hours of assignment during working hours. Focus on correct...
- [ ] Architecture guideline: - **Communication Channels:** Topic channels (#general, #dev, #deployments, #random) to reduce no...
- [ ] Architecture guideline: - **Pair Programming:** Scheduled slots (Tue/Thu 2-4 PM optional). Partners rotate weekly. Driver...
- [ ] Architecture guideline: - **Decision Matrix:** Simple decisions (majority), technical decisions (ADR with rationale), str...
- [ ] Architecture guideline: - **Incident Communication:** #incidents channel â†’ incident lead â†’ status updates every 15 mi...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Establish Team Collaboration Patterns

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
- [ ] Async communication is the default (sync reserved for complex discussions)
- [ ] Code review framed as teaching, not gatekeeping
- [ ] "nit:" prefix used for non-blocking style suggestions
- [ ] Meeting total is under 4 hours/week
- [ ] Code review SLA is 4 hours during working hours
- [ ] Decision-making responsibility is clearly defined
- [ ] Incident communication process documented

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Meeting Factory -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Blame Culture -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Communication Silo -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Decision Black Hole -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Notification Firehose -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Over-Meeting
- [ ] Avoid mistake: Code Review as Gatekeeping
- [ ] Avoid mistake: Slack Overload
- [ ] Avoid mistake: No Documentation Culture

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
- Establish Team Collaboration Patterns
### Anti-Patterns (from 08)
- The Meeting Factory
- The Blame Culture
- The Communication Silo
- The Decision Black Hole
- The Notification Firehose
### Common Mistakes (from 04)
- Over-Meeting
- Code Review as Gatekeeping
- Slack Overload
- No Documentation Culture
### Related Rules (from 06 skills)
- COLLAB-RULE-001 through COLLAB-RULE-011
### Related Skills (from 06 skills)
- Define Code Review Standards
- Document Development Workflow
- Create CONTRIBUTING.md
- Write Architecture Decision Records
- Set Up Automated Testing in CI

