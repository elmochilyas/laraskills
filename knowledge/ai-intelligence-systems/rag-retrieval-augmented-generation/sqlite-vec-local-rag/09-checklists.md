# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** sqlite-vec-local-rag
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] CI vector tests
- [ ] Dev/prod parity
- [ ] Dev-only vector store
- [ ] Driver abstraction
- [ ] SQLite for AI dev
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Use SQLite-vec for Development Only
- [ ] Write Vector Search Code Against a Driver Abstraction
- [ ] Embedding provider env-switched (Ollama for dev, production provider for production)
- [ ] Full re-indexing procedure documented for production switch
- [ ] Local RAG queries return results with correct similarity scoring
- [ ] CI tests run with SQLite-vec, no pgvector dependency
- [ ] Local development requires zero external vector database infrastructure
- [ ] Production switch procedure documented with full re-indexing

---

# Architecture Checklist

- [ ] Driver
- [ ] SQLite
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

- [ ] CI vector tests
- [ ] Dev/prod parity
- [ ] Dev-only vector store
- [ ] Driver abstraction
- [ ] SQLite for AI dev
- [ ] Use SQLite-vec for Development Only
- [ ] Write Vector Search Code Against a Driver Abstraction
- [ ] Local vs API embeddings
- [ ] sqlite-vec vs pgvector in dev

---

# Performance Checklist

- [ ] At 1M vectors: ~500ms+ per query â€” too slow for interactive use
- [ ] Brute-force search: O(n*d) â€” 100K vectors at 1536d â‰ˆ 50ms per query
- [ ] No index options â€” cannot improve beyond brute-force
- [ ] Storage: vectors stored as BLOBs â€” less efficient than pgvector's native type

---

# Security Checklist

- [ ] Don't rely on SQLite-vec performance metrics for production capacity planning
- [ ] Ensure your SQLite-vec tests are representative â€” production pgvector behavior differs subtly
- [ ] Monitor SQLite database file size â€” vector storage increases file size significantly
- [ ] Only use SQLite-vec for development and testing
- [ ] Switch to pgvector driver in production via config

---

# Reliability Checklist

- [ ] Assuming SQLite-vec query performance scales linearly â€” it degrades quadratically with vector count
- [ ] Mixing SQLite-vec and pgvector drivers in same codebase without proper config scoping
- [ ] Not testing with pgvector before production deployment â€” edge cases differ
- [ ] Relying on SQLite for concurrent AI workloads â€” write contention issues
- [ ] Using SQLite-vec in production (performance and reliability issues)

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] CI tests run with SQLite-vec, no pgvector dependency
- [ ] Core concepts are understood and applied correctly.
- [ ] Embedding provider env-switched (Ollama for dev, production provider for production)
- [ ] Full re-indexing procedure documented for production switch
- [ ] Local development requires zero external vector database infrastructure
- [ ] Local RAG queries return results with correct similarity scoring
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Using SQLite Vec for Production-Scale RAG (>100K Documents)]
- [ ] [No Embedding Cache â€” Regenerating on Every Query]
- [ ] [SQLite Vec Without Proper Index â€” Full Scan on Every Query]
- [ ] [Mixing SQLite Vec with pgvector in Same Pipeline]
- [ ] [Not Testing SQLite Vec Performance Before Production]
- [ ] Concurrency
- [ ] Corruption
- [ ] Dimension mismatch
- [ ] Memory pressure
- [ ] Query timeout

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


