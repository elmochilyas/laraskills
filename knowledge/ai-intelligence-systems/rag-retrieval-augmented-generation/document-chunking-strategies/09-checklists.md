# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** document-chunking-strategies
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Chunk size sweet spot
- [ ] Chunk type tagging
- [ ] Indexing strategy for search
- [ ] Information density
- [ ] Metadata propagation
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Keep Structural Elements (Tables, Code Blocks) Intact
- [ ] Never Change Chunking Strategy for a Populated Index
- [ ] Start with Recursive Chunking, Iterate
- [ ] Chunk size optimized for content type (not one-size-fits-all)
- [ ] Chunking strategy versioned and stored with each chunk
- [ ] Chunks tagged by type for strategy-specific retrieval
- [ ] Chunking strategy versioned and documented
- [ ] Retrieval quality improved 20-40% over naive fixed-size chunking
- [ ] Strategy changes trigger full re-indexing with documented migration

---

# Architecture Checklist

- [ ] Application
- [ ] Fixed
- [ ] Single chunking strategy vs. multi
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] Chunk size sweet spot
- [ ] Chunk type tagging
- [ ] Indexing strategy for search
- [ ] Information density
- [ ] Metadata propagation
- [ ] Modularization
- [ ] Overlap pattern
- [ ] Structural boundaries
- [ ] Keep Structural Elements (Tables, Code Blocks) Intact
- [ ] Never Change Chunking Strategy for a Populated Index
- [ ] Start with Recursive Chunking, Iterate
- [ ] Chunk size

---

# Performance Checklist

- [ ] Chunking happens during ingestion â€” not on the query path â€” so complexity is acceptable
- [ ] Fixed-size: ~1M tokens/second throughput
- [ ] Semantic chunking requires embedding model calls during ingestion â€” significantly slower than rule-based
- [ ] Semantic: ~100K tokens/second (depends on embedding model latency)
- [ ] Storage: more chunks = more rows, but pgvector handles millions easily
- [ ] Fixed-size: ~1M tokens/second throughput
- [ ] Implement chunk-level caching â€” re-chunk only changed source documents
- [ ] Semantic: ~100K tokens/second (depends on embedding model latency)

---

# Security Checklist

- [ ] Implement chunk-level caching â€” re-chunk only changed source documents
- [ ] Log chunk metrics: average size, overlap %, boundary violations (tables split, code broken)
- [ ] Monitor chunk size distribution â€” unexpectedly large/small chunks indicate parsing issues
- [ ] Never change chunking strategy for a populated index â€” chunks from different strategies are semantically incompatible
- [ ] Test chunk quality with representative queries before full ingestion
- [ ] Version your chunking strategy â€” store strategy identifier per chunk for debugging
- [ ] Fixed-size: ~1M tokens/second throughput
- [ ] Semantic: ~100K tokens/second (depends on embedding model latency)

---

# Reliability Checklist

- [ ] Chunking all content types identically â€” code, tables, and prose need different strategies
- [ ] Fixed-size chunking without overlap â€” context lost at boundaries, retrieval misses relevant content
- [ ] Not capturing chunk metadata â€” can't cite sources or filter by document section
- [ ] Over-chunking (too small) â€” loses surrounding context, increases retrieval noise
- [ ] Splitting tables or code blocks across chunks â€” both halves are useless for retrieval
- [ ] Under-chunking (too large) â€” retrieves irrelevant content within large chunk
- [ ] Never Change Chunking Strategy for a Populated Index

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Chunk size optimized for content type (not one-size-fits-all)
- [ ] Chunking strategy versioned and documented
- [ ] Chunking strategy versioned and stored with each chunk
- [ ] Chunks tagged by type for strategy-specific retrieval
- [ ] Core concepts are understood and applied correctly.
- [ ] Each chunk carries source metadata for citation and filtering
- [ ] Overlap prevents context loss at chunk boundaries
- [ ] Performance implications are accounted for in the design.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Overlap pattern

---

# Anti-Pattern Prevention Checklist

- [ ] [Fixed-Size Chunking for All Content Types]
- [ ] [No Chunk Overlap â€” Context Lost at Boundaries]
- [ ] [Chunks Too Large (>1000 tokens) â€” Poor Retrieval Precision]
- [ ] [Chunks Too Small (<100 tokens) â€” Missing Context]
- [ ] [No Structural Awareness â€” Splitting Tables or Code Blocks]
- [ ] Boundary context loss
- [ ] Chunk size explosion
- [ ] Format parsing failure
- [ ] Metadata misalignment
- [ ] Semantic chunk false positive

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor chunk size distribution â€” unexpected sizes indicate parsing issues

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


