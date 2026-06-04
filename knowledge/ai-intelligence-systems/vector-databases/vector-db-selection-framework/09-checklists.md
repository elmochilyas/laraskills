# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** vector-databases
**Knowledge Unit:** vector-db-selection-framework
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Cost-aware selection
- [ ] Driver abstraction
- [ ] Multi-driver development
- [ ] pgvector first, migrate if needed
- [ ] The 95% rule
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Build a Driver Abstraction Layer from Day One
- [ ] Start with pgvector by Default
- [ ] Data sovereignty requirements met by chosen solution
- [ ] Driver abstraction layer in place for migration flexibility
- [ ] Infrastructure cost calculated (self-hosted free vs managed $70+/month)
- [ ] Data sovereignty requirements satisfied
- [ ] Driver abstraction enables migration without application code changes
- [ ] Scale triggers documented for when to re-evaluate

---

# Architecture Checklist

- [ ] Driver abstraction needed? â†’ Yes for teams that may migrate. No for teams committed to pgvector
- [ ] Single vector DB vs. polyglot â†’ Start with one (pgvector). Only add a second if requirements diverge (e.g., pgvector for RAG, Qdrant for real
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

- [ ] Cost-aware selection
- [ ] Driver abstraction
- [ ] Multi-driver development
- [ ] pgvector first, migrate if needed
- [ ] The 95% rule
- [ ] Tiered recommendation engine
- [ ] Build a Driver Abstraction Layer from Day One
- [ ] Start with pgvector by Default
- [ ] Feature requirements
- [ ] Scale tier
- [ ] Self-hosted vs managed

---

# Performance Checklist

- [ ] At <100K vectors: all options perform similarly (~5ms queries)
- [ ] At >50M vectors: Pinecone's distributed architecture becomes competitive
- [ ] At 10M-50M vectors: Qdrant edges ahead (~6ms vs ~12ms pgvector) due to Rust optimization
- [ ] At 1M-10M vectors: pgvector HNSW and Qdrant are comparable (~8-10ms)
- [ ] The cost of switching outweighs performance differences at most scales
- [ ] Pinecone: managed, serverless; auto-scaling but higher cost
- [ ] Qdrant: Rust-based, fast; horizontal scaling for >50M vectors

---

# Security Checklist

- [ ] Build a driver abstraction layer from day one if migration is possible
- [ ] Consider data residency requirements â€” self-hosted options give full control
- [ ] Factor in team expertise â€” your team's PostgreSQL knowledge is a hidden advantage for pgvector
- [ ] Make the vector DB decision early â€” migration costs are high (re-embedding all data)
- [ ] Monitor storage growth and query latency â€” leading indicators for migration need
- [ ] Test your workload on both pgvector and Qdrant before committing
- [ ] Encrypt vector data at rest and in transit regardless of choice

---

# Reliability Checklist

- [ ] Assuming managed = better â€” pgvector on managed PostgreSQL (RDS, Cloud SQL) is also managed
- [ ] Building without driver abstraction â€” locked into one vendor with no migration path
- [ ] Choosing Pinecone as default without evaluating pgvector (cost and complexity)
- [ ] Ignoring operational cost of separate vector DB â€” monitoring, backups, upgrades
- [ ] Not testing recall requirements â€” different vector DBs have different recall characteristics
- [ ] Scaling prematurely â€” pgvector handles 50M vectors fine; most Laravel apps are below 1M

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Data sovereignty requirements met by chosen solution
- [ ] Data sovereignty requirements satisfied
- [ ] Driver abstraction enables migration without application code changes
- [ ] Driver abstraction layer in place for migration flexibility
- [ ] Infrastructure cost calculated (self-hosted free vs managed $70+/month)
- [ ] Migration cost understood (re-embedding all data on switch)
- [ ] Performance implications are accounted for in the design.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Choosing Vector DB Without Scale Considerations]
- [ ] [pgvector for Sub-Millisecond Latency Requirements]
- [ ] [Dedicated Vector DB for <10K Vectors]
- [ ] [No Hybrid Search Support Requirements Check]
- [ ] [Choosing Based on Hype Not Workload]
- [ ] Budget overrun
- [ ] Feature gap
- [ ] Scale cliff
- [ ] Team skills gap
- [ ] Vendor bankruptcy

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


