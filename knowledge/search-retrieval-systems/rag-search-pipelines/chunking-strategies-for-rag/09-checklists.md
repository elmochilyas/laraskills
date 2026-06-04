# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 14-rag-search-pipelines
**Knowledge Unit:** Chunking Strategies For Rag
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Chunking Strategies For Rag implementation follows 14-rag-search-pipelines patterns
- [ ] All edge cases handled for Chunking Strategies For Rag
- [ ] Full test coverage for Chunking Strategies For Rag
- [ ] Security review completed for Chunking Strategies For Rag
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Chunking Strategies For Rag
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Chunking is a design-time decision affecting the entire pipeline â€” changes require re-embedding
- [ ] Use token-aware splitting for compatibility with LLM context limits
- [ ] Implement overlap to reduce information loss at boundaries
- [ ] Choose strategy based on document type: structured (recursive), unstructured (semantic)
- [ ] Evaluate: RAG Pipeline Architecture Selection
- [ ] Evaluate: Chunking Strategy Selection
- [ ] Evaluate: Embedding Model Selection for RAG

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Chunking Strategies For Rag following 14-rag-search-pipelines patterns
- [ ] Configure all required settings for Chunking Strategies For Rag
- [ ] Register route/middleware/service for Chunking Strategies For Rag
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Smaller chunks (~256 tokens) retrieve more specific context but may miss broader context
- [ ] Larger chunks (~1024 tokens) provide more context per retrieval but reduce retrievable chunks
- [ ] Overlap (10-20%) reduces boundary information loss
- [ ] More chunks = more vectors = larger index and slower search

---

# Security Checklist

- [ ] Chunks inherit document-level access controls
- [ ] Ensure chunk metadata doesn't leak sensitive document information
- [ ] Implement chunk-level access gating for multi-tenant systems

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Chunking Strategies For Rag
- [ ] Write feature tests for validation failure of Chunking Strategies For Rag
- [ ] Write feature tests for authentication failure of Chunking Strategies For Rag
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

- [ ] Avoid: 1 | One-Chunk-Fits-All | Architecture
- [ ] Avoid: 2 | No Overlap | Quality
- [ ] Avoid: 3 | Over-Chunking | Performance
- [ ] Avoid: 4 | Ignoring Document Structure | Quality
- [ ] Avoid: Universal Chunk Fallacy
- [ ] Avoid: Boundary Information Loss
- [ ] Avoid: Structure Stripping

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
- 1 | One-Chunk-Fits-All | Architecture
- 2 | No Overlap | Quality
- 3 | Over-Chunking | Performance
- 4 | Ignoring Document Structure | Quality
- Universal Chunk Fallacy
- Boundary Information Loss
- Structure Stripping

## Related Knowledge
- K067 (Embedding generation strategies)
- K069 (RAG pipeline architecture)
- K029 (Meilisearch RAG)



