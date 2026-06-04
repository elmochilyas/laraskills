# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 02-database-fulltext-search
**Knowledge Unit:** Sqlite Fts5
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Sqlite Fts5 implementation follows 02-database-fulltext-search patterns
- [ ] All edge cases handled for Sqlite Fts5
- [ ] Full test coverage for Sqlite Fts5
- [ ] Security review completed for Sqlite Fts5
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Sqlite Fts5

---

# Architecture Checklist

- [ ] FTS5 tables live alongside application tables in same SQLite database
- [ ] External content tables: CREATE VIRTUAL TABLE posts_fts USING fts5(content=posts, title, body)
- [ ] Triggers keep FTS in sync with source data
- [ ] Not applicable for Scout's database engine (MySQL/PostgreSQL only)
- [ ] Evaluate: Database Engine vs Dedicated Search Engine
- [ ] Evaluate: Full-Text vs LIKE/Prefix Search
- [ ] Evaluate: Scout Database vs Collection Engine Selection

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Sqlite Fts5 following 02-database-fulltext-search patterns
- [ ] Configure all required settings for Sqlite Fts5
- [ ] Register route/middleware/service for Sqlite Fts5
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] FTS5 performs well up to ~100K documents
- [ ] Index build time is linear with document count
- [ ] BM25 ranking is computed at query time
- [ ] Prefix indexes add to index size but speed prefix queries
- [ ] Memory usage scales with index size

---

# Security Checklist

- [ ] FTS5 is not directly exposed to user input if using parameterized queries
- [ ] MATCH expressions can be expensive on large datasets
- [ ] SQLite databases with FTS5 tables require additional backup consideration

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] FTS5 virtual table created
- [ ] External content table configured
- [ ] Sync triggers set up (INSERT/UPDATE/DELETE)
- [ ] Search with BM25 ranking works
- [ ] Tokenizer configured for content language
- [ ] Performance tested with expected dataset size
- [ ] Write feature tests for happy path of Sqlite Fts5
- [ ] Write feature tests for validation failure of Sqlite Fts5
- [ ] Write feature tests for authentication failure of Sqlite Fts5
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
- Use External Content Tables for FTS5 Sync
- Add Sync Triggers for FTS5 Content Tables
- Use SQLite FTS5 Only for Development or Embedded Apps

### Decisions
- Database Engine vs Dedicated Search Engine
- Full-Text vs LIKE/Prefix Search
- Scout Database vs Collection Engine Selection

## Related Knowledge
- K002 (Scout database engine)
- K015 (SearchUsingFullText attribute)



