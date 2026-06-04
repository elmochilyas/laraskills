# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Directory Conventions
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Start with Default, Evolve When Needed
- [ ] Verify: Maintain Case Consistency
- [ ] Verify: Choose One Strategy
- [ ] Verify: Avoid Excessive Nesting
- [ ] Single organizational pattern is chosen and documented
- [ ] No empty top-level directories exist without files
- [ ] Every namespace segment matches its directory casing exactly
- [ ] Maximum directory depth under `app/` is 3 levels (4 for modular)
- [ ] No role-based directories (`Admin/`, `Frontend/`, `Backend/`) as top-level units
- [ ] No mixing of patterns (no both `app/Services/` and `app/Domain/*/Services/`)
- [ ] Shared infrastructure is clearly separated from domain code
- [ ] `composer dump-autoload` succeeds after any directory changes
- [ ] CI check exists for case-consistency and pattern enforcement (optional but recommended)
- [ ] Performance: ### Autoloader Performance
- [ ] Performance: PSR-4 is marginally slower than classmap but negligible. `composer dump-autol...
- [ ] Performance: ### Directory Depth Impact

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Organization Patterns
- [ ] Architecture guideline: **Technical Layer** (Default): Files organized by type â€” all controllers together, all models t...
- [ ] Architecture guideline: **Domain Organization**: Files organized by business domain with technical subdirectories within ...
- [ ] Architecture guideline: **Modular**: Each module is independent with its own technical structure. Best for multi-team app...
- [ ] Architecture guideline: **Hybrid** (Recommended): Technical layer at top level, domain subdirectories within each layer. ...
- [ ] Architecture guideline: ### PSR-4 Autoloader Resolution
- [ ] Architecture guideline: Composer strips the registered prefix, converts namespace separators to directory separators, app...
- [ ] Decision: When to Create New Top-Level Directories - ensure correct choice is made
- [ ] Decision: Directory Depth Management - ensure correct choice is made
- [ ] Decision: Organizational Strategy Selection - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Start with Default, Evolve When Needed
- [ ] Best practice: Maintain Case Consistency
- [ ] Best practice: Choose One Strategy
- [ ] Best practice: Avoid Excessive Nesting
- [ ] Skill applied: Establish Directory Conventions

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] ### Autoloader Performance
- [ ] PSR-4 is marginally slower than classmap but negligible. `composer dump-autoload --optimize` generates a classmap for...
- [ ] ### Directory Depth Impact
- [ ] No measurable performance impact â€” autoloader is O(1) per class reference regardless of depth.
- [ ] ### IDE Performance
- [ ] 500+ directories across 10+ levels shows measurable lag in file tree rendering. Keep depth manageable.

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Directory Permissions
- [ ] - `storage/` â€” must be writable by web server user
- [ ] - `bootstrap/cache/` â€” must be writable
- [ ] - Everything else â€” read-only
- [ ] ### Vendor Directory Integrity
- [ ] If `vendor/` is compromised, autoloading can be hijacked. Protect with filesystem permissions and integrity checking.

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
- [ ] Single organizational pattern is chosen and documented
- [ ] No empty top-level directories exist without files
- [ ] Every namespace segment matches its directory casing exactly
- [ ] Maximum directory depth under `app/` is 3 levels (4 for modular)
- [ ] No role-based directories (`Admin/`, `Frontend/`, `Backend/`) as top-level units
- [ ] No mixing of patterns (no both `app/Services/` and `app/Domain/*/Services/`)
- [ ] Shared infrastructure is clearly separated from domain code

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Premature Top-Level Directory Creation -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Mixed Organizational Strategies -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Case-Sensitivity Mismatch -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Organization by Developer Role -- apply preferred alternative
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
- Establish Directory Conventions
### Decision Trees (from 07)
- When to Create New Top-Level Directories
- Directory Depth Management
- Organizational Strategy Selection
### Anti-Patterns (from 08)
- Premature Top-Level Directory Creation
- Mixed Organizational Strategies
- Case-Sensitivity Mismatch
- Organization by Developer Role
### Related Rules (from 06 skills)
- Start with Default Laravel Directory Structure (05-rules.md)
- Maintain Case Consistency Between Namespace and Directory (05-rules.md)
- Never Mix Organizational Strategies (05-rules.md)
- Keep Directory Depth at Maximum 3 Levels (05-rules.md)
- Prevent Premature Top-Level Directory Creation (05-rules.md)
- Do Not Organize by Developer Role (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Select and Document Organizational Pattern
- Skill: Migrate Application Between Organizational Patterns

