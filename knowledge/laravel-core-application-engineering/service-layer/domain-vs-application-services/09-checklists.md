# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Domain vs Application Services
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Keep Application Services Thin
- [ ] Verify: Keep Domain Services Pure
- [ ] Verify: Test Domain Services Without Framework
- [ ] Domain services have NO infrastructure dependencies (no DB, Cache, Mail, Queue, Request)
- [ ] Application services contain NO business rules, calculations, or domain validation
- [ ] Domain services accept and return only domain types (entities, value objects, domain primitives)
- [ ] Application services orchestrate: call domain services, manage transactions, coordinate infrastructure
- [ ] Dependency direction is always Controller â†’ Application Service â†’ Domain Service
- [ ] Domain services are testable with `new` keyword â€” no framework boot required
- [ ] Application services may require framework boot or mocked dependencies for testing

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Application Service
- [ ] Architecture guideline: class PlaceOrderService  // Application service
- [ ] Architecture guideline: public function __construct(
- [ ] Architecture guideline: private PricingService $pricing,       // Domain service
- [ ] Architecture guideline: private OrderRepository $orders,       // Infrastructure
- [ ] Architecture guideline: private InventoryService $inventory,   // Application service
- [ ] Architecture guideline: public function execute(Cart $cart): Order
- [ ] Architecture guideline: DB::beginTransaction();
- [ ] Architecture guideline: $total = $this->pricing->calculateTotal($cart);   // Domain logic
- [ ] Architecture guideline: $order = $this->orders->create($cart, $total);    // Persistence
- [ ] Architecture guideline: $this->inventory->reserve($cart->items);          // Coordination
- [ ] Architecture guideline: ### Domain Service

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Keep Application Services Thin
- [ ] Best practice: Keep Domain Services Pure
- [ ] Best practice: Test Domain Services Without Framework
- [ ] Skill applied: Classify Service as Application or Domain Service

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
- [ ] Domain services have NO infrastructure dependencies (no DB, Cache, Mail, Queue, Request)
- [ ] Application services contain NO business rules, calculations, or domain validation
- [ ] Domain services accept and return only domain types (entities, value objects, domain primitives)
- [ ] Application services orchestrate: call domain services, manage transactions, coordinate infrastructure
- [ ] Dependency direction is always Controller â†’ Application Service â†’ Domain Service
- [ ] Domain services are testable with `new` keyword â€” no framework boot required
- [ ] Application services may require framework boot or mocked dependencies for testing

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
- Classify Service as Application or Domain Service
### Decision Trees (from 07)
- Domain Service vs Application Service Classification
- Infrastructure-Free Domain Services vs Framework-Coupled Domain Logic
- Framework-Free Testing for Domain Services vs Laravel-Bootstrapped Testing
- Pure Domain Logic on Entities vs Domain Service Extraction
### Related Rules (from 06 skills)
- **Rule 1**: Distinguish Service Type by Role â€” every service must be explicitly categorized
- **Rule 2**: Application Services Must Not Contain Domain Logic
- **Rule 3**: Domain Services Must Not Depend on Infrastructure
- **Rule 4**: Domain Services Must Be Testable Without Framework Boot
- **Rule 5**: Domain Services Must Operate on Domain Objects
- **Rule 6**: Do Not Create Domain Services for CRUD Pass-Through
- **Rule 7**: Application Services Coordinate Infrastructure
- **Rule 8**: Application Services Must Not Be Injected into Domain Services
- **Rule 9**: Domain Services Should Be Stateless and Side-Effect-Free
### Related Skills (from 06 skills)
- Design Stateless Domain Service
- Refactor Mixed-Responsibility Service

