# Skill: Select Vector Database Using Decision Framework
## Purpose
Evaluate and select the optimal vector database (pgvector, Qdrant, Pinecone) based on scale, infrastructure, team expertise, and data sovereignty requirements.
## When To Use
- Starting a new project with vector search requirements
- Re-evaluating vector database choice as scale grows
- Migrating between vector database solutions
## When NOT To Use
- Prototypes where any vector store suffices
- When PostgreSQL is already the primary database — default to pgvector
## Prerequisites
- Understanding of vector search requirements (scale, latency, features)
- Knowledge of available infrastructure (PostgreSQL, Docker, cloud services)
- Data sovereignty and compliance requirements
## Inputs
- Dataset size (number of vectors)
- Query latency requirements
- Infrastructure preferences (self-hosted vs managed)
- Feature requirements (hybrid search, payload filtering, ACID)
- Budget constraints
- Team expertise
## Workflow (numbered)
1. Default to pgvector for new projects with PostgreSQL in the stack
2. Evaluate scale: pgvector handles up to 50M vectors efficiently
3. If PostgreSQL not available: consider Qdrant (self-hosted) or Pinecone (managed)
4. If scale exceeds 50M vectors: evaluate Qdrant or Pinecone
5. If data sovereignty requires self-hosting: pgvector or Qdrant
6. If managed serverless is required without existing PostgreSQL: Pinecone
7. Build driver abstraction layer from day one to enable future migration
8. Document vector database choice with rationale and scale triggers for re-evaluation
## Validation Checklist
- [ ] pgvector selected as default when PostgreSQL is available
- [ ] Scale triggers documented for re-evaluation (vector count, latency degradation)
- [ ] Driver abstraction layer in place for migration flexibility
- [ ] Infrastructure cost calculated (self-hosted free vs managed $70+/month)
- [ ] Data sovereignty requirements met by chosen solution
- [ ] Migration cost understood (re-embedding all data on switch)
## Common Failures
- Choosing Pinecone without evaluating pgvector first — unnecessary $70+/month cost
- Not building driver abstraction — locked into one vector DB, costly migration
- Underestimating scale — pgvector chosen for >50M vectors without evaluation
- Ignoring data sovereignty — sending sensitive vectors to third-party service
## Decision Points
- **Scale tier**: <1M (all options work), 1M-50M (pgvector sweet spot), 50M+ (evaluate Qdrant/Pinecone)
- **Self-hosted vs managed**: Self-hosted for cost and data control; managed for reduced ops burden
- **Feature requirements**: pgvector for ACID + hybrid search; Qdrant for payload filtering at scale; Pinecone for serverless simplicity
## Performance Considerations
- pgvector: sub-10ms at 1M+ vectors with HNSW; up to 50M vectors on single instance
- Qdrant: Rust-based, fast; horizontal scaling for >50M vectors
- Pinecone: managed, serverless; auto-scaling but higher cost
- Migration cost: re-embedding all data = provider API costs + time
## Security Considerations
- Self-hosted (pgvector, Qdrant): data stays in your network
- Cloud-managed (Pinecone, Qdrant Cloud): data leaves your network — verify data processing agreements
- Encrypt vector data at rest and in transit regardless of choice
- Apply tenant isolation at application layer regardless of vector DB chosen
## Related Rules (from 05-rules.md)
- Start with pgvector by Default
- Build a Driver Abstraction Layer from Day One
## Related Skills
- Configure and Tune Vector Search Indexes
- Implement Multi-Tenant Vector Isolation
- Implement Hybrid Search with RRF Fusion
## Success Criteria
- Vector database choice justified by documented decision criteria
- Driver abstraction enables migration without application code changes
- Scale triggers documented for when to re-evaluate
- Data sovereignty requirements satisfied
