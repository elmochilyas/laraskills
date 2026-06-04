# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Stateless Service Design
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Return Results, Don't Store Them
- [ ] Verify: Use readonly Class for Enforcement
- [ ] Verify: Never Use Properties as Scratch Space
- [ ] Verify: Accept Dependencies, Not Data, in Constructor
- [ ] Service is declared `final readonly class`
- [ ] All constructor parameters are stable, reusable dependencies â€” no per-request data
- [ ] No mutable properties exist on the class (compiler-enforced by `readonly`)
- [ ] No getter methods for execution results (`getResult()`, `getLastCreated()`)
- [ ] All operational data is passed as method parameters
- [ ] All results are returned as return values (or void for side-effect-only)
- [ ] No properties used as scratch space or accumulators during execution
- [ ] Method is safe to call multiple times â€” idempotent with respect to instance state
- [ ] Multi-value results use a result object/DTO, not stored properties

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Stateless Pattern
- [ ] Architecture guideline: final readonly class UserService
- [ ] Architecture guideline: public function __construct(
- [ ] Architecture guideline: private UserRepository $users,  // stable dependency
- [ ] Architecture guideline: public function register(string $name, string $email): User  // returns result
- [ ] Architecture guideline: return $this->users->create(['name' => $name, 'email' => $email]);
- [ ] Architecture guideline: ### Stateful Pattern (Avoid)
- [ ] Architecture guideline: class UserService
- [ ] Architecture guideline: private ?User $lastCreated = null;  // mutable state
- [ ] Architecture guideline: public function register(string $name, string $email): void
- [ ] Architecture guideline: $this->lastCreated = $this->users->create(['name' => $name, 'email' => $email]);
- [ ] Architecture guideline: public function getLastCreated(): ?User  // state retrieval

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Return Results, Don't Store Them
- [ ] Best practice: Use readonly Class for Enforcement
- [ ] Best practice: Never Use Properties as Scratch Space
- [ ] Best practice: Accept Dependencies, Not Data, in Constructor
- [ ] Skill applied: Design a Stateless Service

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
- [ ] Service is declared `final readonly class`
- [ ] All constructor parameters are stable, reusable dependencies â€” no per-request data
- [ ] No mutable properties exist on the class (compiler-enforced by `readonly`)
- [ ] No getter methods for execution results (`getResult()`, `getLastCreated()`)
- [ ] All operational data is passed as method parameters
- [ ] All results are returned as return values (or void for side-effect-only)
- [ ] No properties used as scratch space or accumulators during execution

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

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
- Design a Stateless Service
### Decision Trees (from 07)
- Stateless Services vs Stateful Services for Business Logic
- readonly Class Enforcement vs Discipline-Only Statelessness
- Constructor for Infrastructure vs Constructor for Operational Data
- Result Return Values vs Getter Methods for State Retrieval
### Related Rules (from 06 skills)
- **Rule 1**: Services Must Be Stateless
- **Rule 2**: Use `final readonly class` for Compiler Enforcement
- **Rule 3**: Never Use Class Properties as Scratch Space
- **Rule 4**: Return Results, Do Not Store Them
- **Rule 5**: Constructor Injection Is for Stable Dependencies Only
- **Rule 6**: Do Not Define Getter Methods for Execution Results
- **Rule 7**: Methods Must Be Safe to Call Multiple Times
### Related Skills (from 06 skills)
- Design a Service Class
- Refactor Stateful Service to Stateless

