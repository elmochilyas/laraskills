# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Milvus Vector Database
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Milvus Vector Database implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Milvus Vector Database
- [ ] Full test coverage for Milvus Vector Database
- [ ] Security review completed for Milvus Vector Database
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Milvus Vector Database
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Deploy via Docker Compose for development, Helm chart for Kubernetes in production.
- [ ] Define collection schema with vector field, scalar fields, and index parameters.
- [ ] Use Milvus SDK or REST API from Laravel for data operations.
- [ ] Hybrid search: configure both BM25 and vector fields in the collection.
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Milvus Vector Database following 06-vector-search-systems patterns
- [ ] Configure all required settings for Milvus Vector Database
- [ ] Register route/middleware/service for Milvus Vector Database
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] GPU indexes provide 10-100x faster indexing than CPU-only.
- [ ] DiskANN enables >RAM datasets using SSDs with minimal performance impact.
- [ ] Query latency: 5-50ms depending on index type, dataset size, and hardware.
- [ ] Write throughput scales horizontally with cluster size.

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

- [ ] Milvus deployed (standalone or cluster)
- [ ] Collection created with correct schema
- [ ] Vectors indexable and searchable
- [ ] Distance metric matching embedding model
- [ ] Index type selected and built
- [ ] Backup/disaster recovery strategy in place
- [ ] Write feature tests for happy path of Milvus Vector Database
- [ ] Write feature tests for validation failure of Milvus Vector Database
- [ ] Write feature tests for authentication failure of Milvus Vector Database
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

- [ ] Avoid: 1 | Distributed Cluster for Development | Architecture
- [ ] Avoid: 2 | Wrong Index Type for Workload | Performance
- [ ] Avoid: 3 | Strong Consistency for All Workloads | Performance
- [ ] Avoid: 4 | Per-Tenant Collections Instead of Partition Keys | Architecture
- [ ] Avoid: 5 | Unmonitored Index Build Resource Usage | Reliability
- [ ] Avoid: Infrastructure Overhead
- [ ] Avoid: One-Index-Fits-All
- [ ] Avoid: Milvus-for-Everything

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
- Vector Database Selection Strategy
- Embedding Generation Approach
- ANN Index Type Selection (HNSW vs IVFFlat)

### Anti-Patterns
- 1 | Distributed Cluster for Development | Architecture
- 2 | Wrong Index Type for Workload | Performance
- 3 | Strong Consistency for All Workloads | Performance
- 4 | Per-Tenant Collections Instead of Partition Keys | Architecture
- 5 | Unmonitored Index Build Resource Usage | Reliability
- Infrastructure Overhead
- One-Index-Fits-All
- Milvus-for-Everything

## Related Knowledge
- K060 (Milvus hybrid search)
- K042 (pgvector HNSW / IVFFlat indexing)
- K048 (Qdrant vector search)
- K056 (Pinecone managed vector database)



