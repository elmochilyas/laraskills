# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 02-database-fulltext-search
**Knowledge Unit:** Search Using Prefix
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Search Using Prefix implementation follows 02-database-fulltext-search patterns
- [ ] All edge cases handled for Search Using Prefix
- [ ] Full test coverage for Search Using Prefix
- [ ] Security review completed for Search Using Prefix
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Search Using Prefix

---

# Architecture Checklist

- [ ] Apply the attribute on the model: `#[SearchUsingPrefix(['email', 'username'])]`.
- [ ] Ensure B-tree indexes exist on prefixed columns (add via migration if needed).
- [ ] Combine with `#[SearchUsingFullText(['title', 'body'])]` for comprehensive search.
- [ ] The prefix search applies to the entire model's search query â€” not per-field.
- [ ] Evaluate: Database Engine vs Dedicated Search Engine
- [ ] Evaluate: Full-Text vs LIKE/Prefix Search
- [ ] Evaluate: Scout Database vs Collection Engine Selection

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Search Using Prefix following 02-database-fulltext-search patterns
- [ ] Configure all required settings for Search Using Prefix
- [ ] Register route/middleware/service for Search Using Prefix
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Prefix LIKE (`term%`) can use B-tree indexes â€” very fast on indexed columns.
- [ ] Without an index, prefix LIKE still performs a table scan, but faster than leading-wildcard LIKE.
- [ ] Leading wildcard LIKE (`%term%`) cannot use B-tree indexes and requires full table scan.
- [ ] The attribute only affects query construction â€” index management is separate.

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

- [ ] SearchUsingPrefix attribute applied to model
- [ ] B-tree index exists on prefixed columns
- [ ] Prefix search returns expected results
- [ ] Leading wildcard queries avoided
- [ ] Write feature tests for happy path of Search Using Prefix
- [ ] Write feature tests for validation failure of Search Using Prefix
- [ ] Write feature tests for authentication failure of Search Using Prefix
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
- Use SearchUsingPrefix for Identifiers Only
- Add B-Tree Indexes on Prefixed Columns
- Combine with SearchUsingFullText for Mixed Content

### Decisions
- Database Engine vs Dedicated Search Engine
- Full-Text vs LIKE/Prefix Search
- Scout Database vs Collection Engine Selection

## Related Knowledge
- K015 (SearchUsingFullText attribute)
- K002 (Scout database engine)
- K032 (Meilisearch search-as-you-type)



