# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 02-database-fulltext-search
**Knowledge Unit:** Database Full Text Vs Dedicated
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Database Full Text Vs Dedicated implementation follows 02-database-fulltext-search patterns
- [ ] All edge cases handled for Database Full Text Vs Dedicated
- [ ] Full test coverage for Database Full Text Vs Dedicated
- [ ] Security review completed for Database Full Text Vs Dedicated
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Database Full Text Vs Dedicated

---

# Architecture Checklist

- [ ] Evaluate: Database Engine vs Dedicated Search Engine
- [ ] Evaluate: Full-Text vs LIKE/Prefix Search
- [ ] Evaluate: Scout Database vs Collection Engine Selection

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Database Full Text Vs Dedicated following 02-database-fulltext-search patterns
- [ ] Configure all required settings for Database Full Text Vs Dedicated
- [ ] Register route/middleware/service for Database Full Text Vs Dedicated
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Database engine: 10-100ms on indexed columns at 1M rows, competes with OLTP
- [ ] Collection engine: O(n) — 2-10 seconds on 50K records, memory intensive
- [ ] Dedicated engines: Sub-50ms at any scale, isolated infrastructure
- [ ] Database engine writes are slowed by FULLTEXT/GIN index maintenance

---

# Security Checklist

- [ ] Database engine: Search queries add load to main database (DoS risk)
- [ ] Dedicated engine: API key management, network-level access control
- [ ] Collection engine: Not applicable (dev only)
- [ ] All engines: Validate and sanitize user search input

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Current dataset size and growth rate measured
- [ ] Database engine tested with SearchUsingFullText/prefix
- [ ] Decision documented: why this engine choice
- [ ] Migration path documented if using database engine
- [ ] SCOUT_DRIVER correctly set per environment
- [ ] Collection engine not used in production
- [ ] Write feature tests for happy path of Database Full Text Vs Dedicated
- [ ] Write feature tests for validation failure of Database Full Text Vs Dedicated
- [ ] Write feature tests for authentication failure of Database Full Text Vs Dedicated
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

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

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
- Start with Database Engine for New Projects
- Never Use Collection Engine in Production
- Plan Migration Path From Database to Dedicated Engine

### Decisions
- Database Engine vs Dedicated Search Engine
- Full-Text vs LIKE/Prefix Search
- Scout Database vs Collection Engine Selection

## Related Knowledge
- K002 (Scout database engine)
- K003 (Scout collection engine)
- K023 (Meilisearch driver setup)
- K033 (Typesense driver setup)
- K018 (Algolia driver setup)



