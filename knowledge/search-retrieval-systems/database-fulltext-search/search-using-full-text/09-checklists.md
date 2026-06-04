# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 02-database-fulltext-search
**Knowledge Unit:** Search Using Full Text
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Search Using Full Text implementation follows 02-database-fulltext-search patterns
- [ ] All edge cases handled for Search Using Full Text
- [ ] Full test coverage for Search Using Full Text
- [ ] Security review completed for Search Using Full Text
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Search Using Full Text

---

# Architecture Checklist

- [ ] Add the attribute to the model class: `#[SearchUsingFullText(['title', 'body', 'description'])]`.
- [ ] Create the FULLTEXT index in a migration: `$table->fullText(['title', 'body'])`.
- [ ] For PostgreSQL, create a generated `tsvector` column with a GIN index.
- [ ] The attribute can be combined with other Scout attributes on the same model.
- [ ] Evaluate: Database Engine vs Dedicated Search Engine
- [ ] Evaluate: Full-Text vs LIKE/Prefix Search
- [ ] Evaluate: Scout Database vs Collection Engine Selection

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Search Using Full Text following 02-database-fulltext-search patterns
- [ ] Configure all required settings for Search Using Full Text
- [ ] Register route/middleware/service for Search Using Full Text
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] FULLTEXT with `SearchUsingFullText` is 10-100x faster than `LIKE` queries on large tables.
- [ ] FULLTEXT indexes add 30-50% insert/update overhead.
- [ ] The attribute itself adds no overhead â€” it only changes query construction.
- [ ] Without the index matching the attribute's columns, performance degrades to `LIKE` scans.

---

# Security Checklist

- [ ] Validate all input - never trust client data
- [ ] Apply authorization checks for every operation
- [ ] Sanitize output to prevent injection attacks
- [ ] Rate limit exposed endpoints
- [ ] Log security-relevant events

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] FULLTEXT index created matching attribute columns
- [ ] SearchUsingFullText attribute applied to model
- [ ] Queries use MATCH...AGAINST (verify in query log)
- [ ] Performance gain confirmed (vs LIKE baseline)
- [ ] Write feature tests for happy path of Search Using Full Text
- [ ] Write feature tests for validation failure of Search Using Full Text
- [ ] Write feature tests for authentication failure of Search Using Full Text
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
- Create FULLTEXT Index Before Applying the Attribute
- List Only Indexed Columns in the Attribute
- Combine with SearchUsingPrefix for Identifier Fields

### Decisions
- Database Engine vs Dedicated Search Engine
- Full-Text vs LIKE/Prefix Search
- Scout Database vs Collection Engine Selection

## Related Knowledge
- K002 (Scout database engine)
- K016 (SearchUsingPrefix attribute)
- K041 (pgvector extension)



