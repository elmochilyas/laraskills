# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** vector-databases
**Knowledge Unit:** qdrant-integration
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Collection per tenant
- [ ] Dedicated vector infrastructure
- [ ] Payload-heavy search
- [ ] PostgreSQL for vectors only
- [ ] WAL snapshot backup
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Batch Upsert Points (100-500 per Request)
- [ ] Configure HNSW Index Parameters for Your Data
- [ ] Use Qdrant Only When pgvector is Insufficient
- [ ] Batch upsert implemented (100-500 points per request)
- [ ] Collection created with correct dimensions and distance metric
- [ ] Collection size and performance monitored
- [ ] Batch ingestion processes vectors efficiently
- [ ] Client handles connection failures gracefully with retry
- [ ] Payload filtering enforces tenant isolation

---

# Architecture Checklist

- [ ] Qdrant Cloud vs. self
- [ ] Qdrant vs. pgvector â†’ pgvector for PostgreSQL
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization

---

# Implementation Checklist

- [ ] Collection per tenant
- [ ] Dedicated vector infrastructure
- [ ] Payload-heavy search
- [ ] PostgreSQL for vectors only
- [ ] WAL snapshot backup
- [ ] Write-optimized ingestion
- [ ] Batch Upsert Points (100-500 per Request)
- [ ] Configure HNSW Index Parameters for Your Data
- [ ] Use Qdrant Only When pgvector is Insufficient
- [ ] gRPC vs REST API
- [ ] Self-hosted vs Qdrant Cloud

---

# Performance Checklist

- [ ] Batch upsets: 100-500 points per batch for optimal throughput
- [ ] gRPC is significantly faster than REST for bulk operations
- [ ] Qdrant's Rust implementation gives ~6ms p50 latency for 1M vectors â€” slightly faster than pgvector's ~8ms
- [ ] Quantization reduces memory 2-4x with 1-3% recall loss
- [ ] Self-hosted Qdrant: configure RAM allocation for vector storage (all vectors should fit in RAM for best performance)
- [ ] Batch upsert 100-500 points per request for optimal throughput
- [ ] Horizontal scaling for >50M vectors
- [ ] Payload filtering for tenant isolation â€” enforce at query level

---

# Security Checklist

- [ ] Configure WAL and snapshot backup strategy â€” Qdrant writes to disk, but RAM state needs snapshotting
- [ ] Implement retry logic in PHP client â€” Qdrant can return 429 under load
- [ ] Monitor collection size â€” Qdrant performance degrades if vectors exceed allocated memory
- [ ] Set resource limits on Docker containers â€” Qdrant can consume all available memory without limits
- [ ] Use dedicated networking â€” Qdrant client-server latency directly affects search performance
- [ ] Version collection schema â€” changing dimensions requires new collection and data migration
- [ ] Encrypt Qdrant client communication with TLS
- [ ] Payload filtering for tenant isolation â€” enforce at query level

---

# Reliability Checklist

- [ ] Forgetting to configure HNSW index parameters (defaults may not suit your data)
- [ ] Ignoring payload index â€” Qdrant recommends indexing filterable payload fields
- [ ] Mixing dimensions (different embedding models) in same collection
- [ ] Not batching point upserts (individual HTTP calls are 100x slower)
- [ ] Running Qdrant without persistent storage â€” data lost on container restart
- [ ] Using Qdrant when pgvector suffices (unnecessary infrastructure complexity)

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Batch ingestion processes vectors efficiently
- [ ] Batch upsert implemented (100-500 points per request)
- [ ] Best practices from the patterns section are followed.
- [ ] Client handles connection failures gracefully with retry
- [ ] Collection created with correct dimensions and distance metric
- [ ] Collection size and performance monitored
- [ ] Core concepts are understood and applied correctly.
- [ ] Payload filtering applied on search queries
- [ ] Payload filtering enforces tenant isolation

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Dedicated vector infrastructure

---

# Anti-Pattern Prevention Checklist

- [ ] [No Payload Indexing â€” Full Scan on Metadata Filters]
- [ ] [One Collection Per Vector Dimension â€” Management Overhead]
- [ ] [Default Segment Configuration for All Workloads]
- [ ] [No HNSW Tuning for Qdrant-Specific Parameters]
- [ ] [Not Using Quantization for Large Collections]
- [ ] Client timeout
- [ ] Network partition
- [ ] Out of memory
- [ ] Storage corruption
- [ ] Version mismatch

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


