# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Environment Management
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `.env` is listed in `.gitignore` and has never been committed
- [ ] `.env.example` lists every environment variable with placeholder values and comments
- [ ] Every `env()` call in config files has a default value
- [ ] No `env()` calls exist outside config files (use `config()`)
- [ ] Required variables are validated in a service provider's `boot()` method
- [ ] Production uses server-level environment variables (preferred) or a secure `.env` file
- [ ] `config:cache` is run in production after any env change
- [ ] `.env.example` is updated whenever a new variable is added to the codebase
- [ ] CI/CD pipeline injects environment variables correctly

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### .env vs Server Environment Variables
- [ ] Architecture guideline: ### Single vs Multiple .env Files
- [ ] Architecture guideline: ### Override Priority Chain
- [ ] Architecture guideline: Server env variable (nginx FPM config, Docker, setenv)
- [ ] Architecture guideline: .env.{APP_ENV} file (e.g., .env.production)
- [ ] Architecture guideline: Default values in config/*.php
- [ ] Decision: `.env` File Structure (Single vs Multiple Files) - ensure correct choice is made
- [ ] Decision: Environment Variable Source (File vs Server) - ensure correct choice is made
- [ ] Decision: Required Variable Validation Strategy - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Manage Environment Variables

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
- [ ] `.env` is listed in `.gitignore` and has never been committed
- [ ] `.env.example` lists every environment variable with placeholder values and comments
- [ ] Every `env()` call in config files has a default value
- [ ] No `env()` calls exist outside config files (use `config()`)
- [ ] Required variables are validated in a service provider's `boot()` method
- [ ] Production uses server-level environment variables (preferred) or a secure `.env` file
- [ ] `config:cache` is run in production after any env change

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: `env()` as Application Configuration -- apply preferred alternative
    - [ ] Search `app/`, `routes/`, `resources/`, `database/` for `env(`
    - [ ] Check Blade template files
    - [ ] Add PHPStan/Psalm rule banning `env()` outside config
- [ ] Prevent: Committing `.env` to Version Control -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Production Without `config:cache` -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing env() Default Values -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
- Manage Environment Variables
### Decision Trees (from 07)
- `.env` File Structure (Single vs Multiple Files)
- Environment Variable Source (File vs Server)
- Required Variable Validation Strategy
### Anti-Patterns (from 08)
- `env()` as Application Configuration
- Committing `.env` to Version Control
- Production Without `config:cache`
- Missing env() Default Values
### Related Rules (from 06 skills)
- Use env() Only in Config Files (05-rules.md)
- Always Provide Default Values for env() Calls (05-rules.md)
- Never Commit .env to Version Control (05-rules.md)
- Run php artisan config:cache in Production (05-rules.md)
- Validate Required Environment Variables at Application Boot (05-rules.md)
- Use Server Environment Variables for Production Secrets (05-rules.md)
- Keep .env.example Comprehensive and Committed (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Audit and Fix env() Misuse
- Skill: Implement Config Caching in Deployment Pipeline
- Skill: Configure Deployment Pipeline

