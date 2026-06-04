# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 16-search-system-decision-guides
**Knowledge Unit:** Search Appliance Comparison
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Search Appliance Comparison implementation follows 16-search-system-decision-guides patterns
- [ ] All edge cases handled for Search Appliance Comparison
- [ ] Full test coverage for Search Appliance Comparison
- [ ] Security review completed for Search Appliance Comparison
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Search Appliance Comparison
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Decision factors: dataset size, HA needs, team ops capability, budget, latency requirements
- [ ] For <50K records: Consider Scout database engine first (zero infrastructure)
- [ ] For 50K-1M records: Meilisearch or Typesense self-hosted
- [ ] For 1M+ records: Algolia or Typesense Cloud (managed)
- [ ] Evaluate using production-representative data and query patterns
- [ ] Evaluate: Search Appliance Comparison Strategy
- [ ] Evaluate: Single vs Multi-Engine Architecture
- [ ] Evaluate: Full-Text vs Vector vs Hybrid Search Decision

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Search Appliance Comparison following 16-search-system-decision-guides patterns
- [ ] Configure all required settings for Search Appliance Comparison
- [ ] Register route/middleware/service for Search Appliance Comparison
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Measure response time before and after implementation
- [ ] Add query count monitoring - N+1 detection
- [ ] Use eager loading for all relationships
- [ ] Add caching where appropriate for read-heavy endpoints
- [ ] Profile memory usage for large payloads

---

# Security Checklist

- [ ] Self-hosted: You own security (network, encryption, access control)
- [ ] Algolia: Provider-managed security with API key controls
- [ ] All: Use search-only keys for frontend, admin keys server-side
- [ ] Self-hosted: Enable TLS, configure firewalls, regular security updates

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Dataset size and growth rate estimated
- [ ] HA and latency requirements documented
- [ ] Team ops capability assessed
- [ ] Budget for search infrastructure determined
- [ ] At least two engines benchmarked with real data
- [ ] Migration path documented (how to switch engines)
- [ ] Write feature tests for happy path of Search Appliance Comparison
- [ ] Write feature tests for validation failure of Search Appliance Comparison
- [ ] Write feature tests for authentication failure of Search Appliance Comparison
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid: 1 | Switching Engines as First Optimization | Architecture
- [ ] Avoid: 2 | Running Multiple Engines Without Clear Need | Architecture
- [ ] Avoid: 3 | Ignoring Scout's Database Engine Capability | Architecture
- [ ] Avoid: 4 | Assuming Cloud Is Always Better | Cost
- [ ] Avoid: Engine-Swap Quick Fix
- [ ] Avoid: Engine Proliferation
- [ ] Avoid: Over-Engineering Complexity

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Rule Name

### Decisions
- Search Appliance Comparison Strategy
- Single vs Multi-Engine Architecture
- Full-Text vs Vector vs Hybrid Search Decision

### Anti-Patterns
- 1 | Switching Engines as First Optimization | Architecture
- 2 | Running Multiple Engines Without Clear Need | Architecture
- 3 | Ignoring Scout's Database Engine Capability | Architecture
- 4 | Assuming Cloud Is Always Better | Cost
- Engine-Swap Quick Fix
- Engine Proliferation
- Over-Engineering Complexity

## Related Knowledge
- K002 (Scout database engine)
- K014 (Custom engine development)
- K018 (Algolia driver setup)
- K023 (Meilisearch driver setup)
- K033 (Typesense driver setup)



