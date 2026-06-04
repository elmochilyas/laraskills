# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Ports and Adapters
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Interface dispatch adds a negligible virtual method call
- [ ] Performance: - In-memory adapters for testing are significantly faster than database-backe...
- [ ] Performance: - Hex arch doesn't inherently affect query performance â€” that depends on ad...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Ports in `Domain\Contracts\` â€” interfaces only, no implementation
- [ ] Architecture guideline: - Adapters in `Infrastructure\*` â€” concrete implementations using framework tools
- [ ] Architecture guideline: - Service providers bind port â†’ adapter
- [ ] Architecture guideline: - Controllers, CLI commands, and queue jobs are driver adapters (outer layer)
- [ ] Architecture guideline: - Static analysis enforces: Domain depends on nothing; Infrastructure depends on Domain
- [ ] Decision: Hexagonal Architecture vs Simple MVC - ensure correct choice is made
- [ ] Decision: Port Design â€” Domain Concepts vs Adapter Capabilities - ensure correct choice is made
- [ ] Decision: One Port per Aggregate Root vs Per Entity - ensure correct choice is made
- [ ] Decision: Single Service Provider vs Scattered Bindings - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Interface dispatch adds a negligible virtual method call
- [ ] - In-memory adapters for testing are significantly faster than database-backed tests
- [ ] - Hex arch doesn't inherently affect query performance â€” that depends on adapter implementation

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Input sanitization and validation happen in driver adapters before reaching the domain
- [ ] - Domain code never accesses raw HTTP input, preventing injection through that path
- [ ] - Driven adapters (repositories) enforce data-level security (soft deletes, tenant scoping)

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

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Port Explosion -- apply preferred alternative
    - [ ] Port exists for every database table, not just aggregate roots
    - [ ] Child entities have independent repository ports with write methods
    - [ ] Team cannot articulate which entities are aggregate roots
- [ ] Prevent: Leaky Port (SQL-Like Interface) -- apply preferred alternative
    - [ ] Port has `findWhere`, `findBy`, `search`, or `query` methods
    - [ ] Port methods accept `array $criteria` as a parameter
    - [ ] In-memory test adapter is complex (50+ lines per method)
- [ ] Prevent: No Contract Tests for Ports -- apply preferred alternative
    - [ ] Port has multiple adapters but no shared contract test
    - [ ] In-memory adapter tests are not run against Eloquent adapter
    - [ ] Production adapter uses features (database constraints, transactions) not tested in-memory
- [ ] Prevent: Anemic Domain (Ports Without Logic) -- apply preferred alternative
    - [ ] Domain models have no business methods â€” only getters/setters
    - [ ] All business logic lives in controllers or application services
    - [ ] Port count significantly exceeds domain model count
- [ ] Prevent: Mixed Driver/Driven Adapters -- apply preferred alternative
    - [ ] Single `Adapters/` or `Infrastructure/` directory contains both inbound and outbound adapters
    - [ ] Controllers and repositories exist in the same directory namespace
    - [ ] No `Drivers/` or `Driven/` subdirectories exist

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
### Decision Trees (from 07)
- Hexagonal Architecture vs Simple MVC
- Port Design â€” Domain Concepts vs Adapter Capabilities
- One Port per Aggregate Root vs Per Entity
- Single Service Provider vs Scattered Bindings
### Anti-Patterns (from 08)
- Port Explosion
- Leaky Port (SQL-Like Interface)
- No Contract Tests for Ports
- Anemic Domain (Ports Without Logic)
- Mixed Driver/Driven Adapters

