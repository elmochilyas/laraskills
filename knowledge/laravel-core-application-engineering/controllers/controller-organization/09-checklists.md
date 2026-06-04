# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Controller Organization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Group by Domain for Large Applications
- [ ] Verify: Use Api/ Prefix for API Controllers
- [ ] Verify: Keep Maximum Depth at 3 Levels
- [ ] Enforce: Group by Domain for Applications with 20+ Controllers
- [ ] Enforce: Limit Nesting to 3 Levels Maximum
- [ ] Enforce: Use Api/V{version}/ Prefix for API Controllers
- [ ] Enforce: Choose One Organization Strategy and Apply Consistently
- [ ] Enforce: Do Not Create Empty Subdirectories
- [ ] Enforce: Do Not Organize Controllers by User Role
- [ ] Enforce: Use Artisan with Subdirectory Paths
- [ ] A single organization strategy is chosen and applied consistently to all controllers
- [ ] No directory exceeds 3 levels of nesting from `app/Http/Controllers/`
- [ ] No empty subdirectories exist
- [ ] No controllers remain in the root directory that belong in a subdirectory
- [ ] All route registrations use the correct namespace
- [ ] `php artisan route:list` resolves every route without errors
- [ ] No dead use-imports reference old namespace paths
- [ ] `composer dump-autoload` completes without errors
- [ ] Performance: Directory organization has NO impact on runtime performance. Controller resol...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Flat Structure (Small Apps)
- [ ] Architecture guideline: app/Http/Controllers/
- [ ] Architecture guideline: â”œâ”€â”€ UserController.php
- [ ] Architecture guideline: â”œâ”€â”€ PostController.php
- [ ] Architecture guideline: â”œâ”€â”€ AuthController.php
- [ ] Architecture guideline: â””â”€â”€ DashboardController.php
- [ ] Architecture guideline: ### Domain Structure (Large Apps)
- [ ] Architecture guideline: app/Http/Controllers/
- [ ] Architecture guideline: â”œâ”€â”€ Sales/
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ OrderController.php
- [ ] Architecture guideline: â”‚   â””â”€â”€ ProductController.php
- [ ] Architecture guideline: â”œâ”€â”€ Billing/

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Group by Domain for Large Applications
- [ ] Best practice: Use Api/ Prefix for API Controllers
- [ ] Best practice: Keep Maximum Depth at 3 Levels
- [ ] Apply rule: Group by Domain for Applications with 20+ Controllers
- [ ] Apply rule: Limit Nesting to 3 Levels Maximum
- [ ] Apply rule: Use Api/V{version}/ Prefix for API Controllers
- [ ] Apply rule: Choose One Organization Strategy and Apply Consistently
- [ ] Apply rule: Do Not Create Empty Subdirectories
- [ ] Apply rule: Do Not Organize Controllers by User Role
- [ ] Apply rule: Use Artisan with Subdirectory Paths
- [ ] Skill applied: Organize Controllers into a Directory Structure
- [ ] Skill applied: Generate a Controller in a Subdirectory with Artisan

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Directory organization has NO impact on runtime performance. Controller resolution time is unaffected by namespace de...
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
- [ ] A single organization strategy is chosen and applied consistently to all controllers
- [ ] No directory exceeds 3 levels of nesting from `app/Http/Controllers/`
- [ ] No empty subdirectories exist
- [ ] No controllers remain in the root directory that belong in a subdirectory
- [ ] All route registrations use the correct namespace
- [ ] `php artisan route:list` resolves every route without errors
- [ ] No dead use-imports reference old namespace paths

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Over-Nesting (5+ Levels) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Mixing Flat and Domain Organization -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Structure by User Role -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Empty Subdirectories Created Preemptively -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Flat Directory with 30+ Controllers -- apply preferred alternative
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
### Rules (from 05)
- Group by Domain for Applications with 20+ Controllers
- Limit Nesting to 3 Levels Maximum
- Use Api/V{version}/ Prefix for API Controllers
- Choose One Organization Strategy and Apply Consistently
- Do Not Create Empty Subdirectories
- Do Not Organize Controllers by User Role
- Use Artisan with Subdirectory Paths
### Skills (from 06)
- Organize Controllers into a Directory Structure
- Generate a Controller in a Subdirectory with Artisan
### Decision Trees (from 07)
- Flat vs Subdirectory Organization
- Domain vs Feature vs API Version Organization Strategy
- Artisan Generation vs Manual File Creation
### Anti-Patterns (from 08)
- Over-Nesting (5+ Levels)
- Mixing Flat and Domain Organization
- Structure by User Role
- Empty Subdirectories Created Preemptively
- Flat Directory with 30+ Controllers
### Related Rules (from 06 skills)
- `05-rules.md` Rule: "Group by Domain for Applications with 20+ Controllers"
- `05-rules.md` Rule: "Limit Nesting to 3 Levels Maximum"
- `05-rules.md` Rule: "Use Api/V{version}/ Prefix for API Controllers"
- `05-rules.md` Rule: "Choose One Organization Strategy and Apply Consistently"
- `05-rules.md` Rule: "Do Not Create Empty Subdirectories"
- `05-rules.md` Rule: "Do Not Organize Controllers by User Role"
- `05-rules.md` Rule: "Use Artisan with Subdirectory Paths"
### Related Skills (from 06 skills)
- "Design and Implement Controller Architecture" â€” foundation for organization decisions
- "Create a Resource Controller for CRUD Operations" â€” generating controllers in subdirectories

