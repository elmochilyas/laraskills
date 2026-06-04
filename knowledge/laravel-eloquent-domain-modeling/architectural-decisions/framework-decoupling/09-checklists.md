# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Framework Decoupling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Interface dispatch adds one virtual method call â€” negligible overhead
- [ ] Performance: - The real cost is in the mapping layer between domain and infrastructure; be...
- [ ] Performance: - Domain tests run faster because they don't need Laravel's container (pure P...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Domain interfaces in `Domain\Contracts\*` â€” repository, mailer, clock, ID generator
- [ ] Architecture guideline: - Framework adapters in `Infrastructure\*` â€” Eloquent, Laravel Mail, SystemClock
- [ ] Architecture guideline: - Service providers bind ports to adapters: `$this->app->bind(ContractRepository::class, Eloquent...
- [ ] Architecture guideline: - Domain services use only domain-defined interfaces and native PHP types
- [ ] Architecture guideline: - Framework layer (controllers, commands, jobs) calls into domain services, never the reverse
- [ ] Decision: Decouple Domain from Framework vs Stay Coupled - ensure correct choice is made
- [ ] Decision: DateTimeImmutable vs Carbon in Domain Code - ensure correct choice is made
- [ ] Decision: Native PHP Arrays vs Eloquent Collection in Domain Returns - ensure correct choice is made
- [ ] Decision: Domain-Owned Port vs Infrastructure-Owned Interface - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Interface dispatch adds one virtual method call â€” negligible overhead
- [ ] - The real cost is in the mapping layer between domain and infrastructure; benchmark to ensure it's acceptable
- [ ] - Domain tests run faster because they don't need Laravel's container (pure PHP function calls)

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Domain models use `DateTimeImmutable` for all time values (prevents mutation-based attacks)
- [ ] - Domain code never accesses `Request`, `Input`, or `$_GET/$_POST` directly
- [ ] - All input validation happens in the framework adapter layer before reaching the domain

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
- [ ] Prevent: Pseudo-Decoupling -- apply preferred alternative
    - [ ] `Domain/` has `use Illuminate\*` imports
    - [ ] Domain code calls Facades or `app()` directly
    - [ ] Domain models use Carbon instead of DateTimeImmutable
- [ ] Prevent: Adapter Proliferation -- apply preferred alternative
    - [ ] Interface has exactly one implementation class
    - [ ] No in-memory or test adapter exists for the interface
    - [ ] Interface name mirrors implementation name (e.g., `XInterface`/`X`)
- [ ] Prevent: Mapping Hell -- apply preferred alternative
    - [ ] Total mapper code exceeds 1000 lines
    - [ ] Mapper tests exceed 500 lines
    - [ ] Mapping errors are tracked as recurring bug type
- [ ] Prevent: Domain-Resistant Architecture -- apply preferred alternative
    - [ ] Team velocity slowed after introducing hexagonal architecture
    - [ ] Code review conflicts about architecture violations
    - [ ] Developers express frustration about the architecture in retrospectives
- [ ] Prevent: Port Ownership Inversion -- apply preferred alternative
    - [ ] `Domain/` imports from `Infrastructure/` or `App/Contracts/`
    - [ ] Port interfaces live in infrastructure directory
    - [ ] Infrastructure package does not depend on domain package

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
- Decouple Domain from Framework vs Stay Coupled
- DateTimeImmutable vs Carbon in Domain Code
- Native PHP Arrays vs Eloquent Collection in Domain Returns
- Domain-Owned Port vs Infrastructure-Owned Interface
### Anti-Patterns (from 08)
- Pseudo-Decoupling
- Adapter Proliferation
- Mapping Hell
- Domain-Resistant Architecture
- Port Ownership Inversion

