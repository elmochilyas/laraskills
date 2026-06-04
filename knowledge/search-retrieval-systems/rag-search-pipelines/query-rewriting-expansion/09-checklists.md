# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 14-rag-search-pipelines
**Knowledge Unit:** Query Rewriting Expansion
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Query Rewriting Expansion implementation follows 14-rag-search-pipelines patterns
- [ ] All edge cases handled for Query Rewriting Expansion
- [ ] Full test coverage for Query Rewriting Expansion
- [ ] Security review completed for Query Rewriting Expansion
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Query Rewriting Expansion
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Pre-retrieval: Apply normalization → spelling correction → expansion → HyDE
- [ ] Post-retrieval: Query decomposition → retrieve per sub-query → merge results
- [ ] LLM-based rewriting: Use small/cheap LLM for rewriting, larger for generation
- [ ] Cache layer: Store rewritten queries for reuse
- [ ] Evaluate: RAG Pipeline Architecture Selection
- [ ] Evaluate: Chunking Strategy Selection
- [ ] Evaluate: Embedding Model Selection for RAG

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Query Rewriting Expansion following 14-rag-search-pipelines patterns
- [ ] Configure all required settings for Query Rewriting Expansion
- [ ] Register route/middleware/service for Query Rewriting Expansion
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Query rewriting adds 50-500ms depending on method (LLM-based is slowest)
- [ ] Spelling correction: <5ms using Levenshtein dictionaries
- [ ] HyDE: ~100-300ms (one embedding + generation)
- [ ] Query expansion: ~10-50ms (dictionary lookup or embedding similarity)
- [ ] Cache frequently rewritten queries to reduce overhead

---

# Security Checklist

- [ ] LLM-based rewriting may expose query intent to third-party API
- [ ] Expanded queries could inadvertently include sensitive terms
- [ ] Cache rewritten queries carefully (may contain PII)
- [ ] Validation: Ensure rewrites don't change query semantics to inappropriate content

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Spelling correction implemented and tested
- [ ] Query expansion tested (not degrading results)
- [ ] HyDE evaluated (improvement over baseline)
- [ ] Cache layer for rewritten queries
- [ ] Fallback to original query on rewriting failure
- [ ] Rewriting latency measured and acceptable
- [ ] Write feature tests for happy path of Query Rewriting Expansion
- [ ] Write feature tests for validation failure of Query Rewriting Expansion
- [ ] Write feature tests for authentication failure of Query Rewriting Expansion
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

- [ ] Avoid: 1 | Rewriting Before Baseline Validation | Architecture
- [ ] Avoid: 2 | Aggressive Expansion for Rare Terms | Quality
- [ ] Avoid: 3 | No Fallback to Original Query | Reliability
- [ ] Avoid: 4 | Expensive LLM Rewriting for All Queries | Performance
- [ ] Avoid: Premature Rewriting
- [ ] Avoid: Over-Expansion
- [ ] Avoid: Rewrite-and-Forget

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
- RAG Pipeline Architecture Selection
- Chunking Strategy Selection
- Embedding Model Selection for RAG

### Anti-Patterns
- 1 | Rewriting Before Baseline Validation | Architecture
- 2 | Aggressive Expansion for Rare Terms | Quality
- 3 | No Fallback to Original Query | Reliability
- 4 | Expensive LLM Rewriting for All Queries | Performance
- Premature Rewriting
- Over-Expansion
- Rewrite-and-Forget

## Related Knowledge
- K067 (Embedding generation strategies)
- K069 (RAG pipeline architecture)
- K061 (RRF - Reciprocal Rank Fusion)



