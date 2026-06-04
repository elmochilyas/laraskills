# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** GitHooksCaptainhook
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] CaptainHook installed via Composer
- [ ] Pre-commit hook runs Pint + PHPStan on staged files
- [ ] Commit-msg hook enforces Conventional Commits
- [ ] Pre-push hook runs full test suite (if configured)
- [ ] Auto-installation via Composer scripts
- [ ] Skip policy documented (`--no-verify`)
- [ ] Hook installation excluded from CI

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Pre-Commit Pint + PHPStan Pattern:** Run Pint and PHPStan on staged files before every commit...
- [ ] Architecture guideline: - **Commit-Msg Conventional Commits Pattern:** Validate commit message format (feat:, fix:, chore...
- [ ] Architecture guideline: - **Pre-Push Test Suite Pattern:** Run full test suite before every git push; catches broken test...
- [ ] Architecture guideline: - **Changed-Files Only Pattern:** Use staged-files-only execution for pre-commit to minimize exec...
- [ ] Architecture guideline: - **Auto-Install via Composer Pattern:** Register post-install-cmd and post-update-cmd scripts fo...
- [ ] Architecture guideline: - **Hook Manager:** CaptainHook (PHP-native, Composer-integrated) over Husky (Node-dependent)
- [ ] Architecture guideline: - **Hook Scope:** Pre-commit for fast checks (<30s); pre-push for full test suite (slower)
- [ ] Architecture guideline: - **Skip Mechanism:** `--no-verify` for emergencies with documented policy

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Git Hooks with CaptainHook for Laravel

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
- [ ] CaptainHook installed via Composer
- [ ] Pre-commit hook runs Pint + PHPStan on staged files
- [ ] Commit-msg hook enforces Conventional Commits
- [ ] Pre-push hook runs full test suite (if configured)
- [ ] Auto-installation via Composer scripts
- [ ] Skip policy documented (`--no-verify`)
- [ ] Hook installation excluded from CI

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Husky in Laravel projects -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Full test suite in pre-commit -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No auto-installation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Hooks without CI fallback -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: All-files check in pre-commit -- apply preferred alternative
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
- Configure Git Hooks with CaptainHook for Laravel
### Anti-Patterns (from 08)
- Husky in Laravel projects
- Full test suite in pre-commit
- No auto-installation
- Hooks without CI fallback
- All-files check in pre-commit
### Related Rules (from 06 skills)
- CH-RULE-001: Use pre-commit hooks for fast checks only
- CH-RULE-002: Use staged-files-only execution
- CH-RULE-003: Add auto-installation via Composer scripts
- CH-RULE-004: Use CaptainHook over Husky for Laravel
- CH-RULE-005: Document the `--no-verify` skip policy
### Related Skills (from 06 skills)
- Establish Code Review Standards
- Set Up Automated Testing in CI
- Run Pint in CI

