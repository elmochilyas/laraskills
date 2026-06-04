# Skill: Choose and Migrate Between Vector Database Providers

## Purpose
Select the right vector database provider for your workload by evaluating options against real data, and execute a zero-downtime migration using dual-write patterns and tested rollback procedures when switching providers.

## When To Use
- Selecting the initial vector database provider for a new RAG system
- Current provider costs exceed budget or performance no longer meets SLAs
- Current provider lacks required features (hybrid search, geo-distribution, compliance certifications)
- Compliance or data residency requirements change (self-hosting needed, data must stay in specific regions)
- Consolidating infrastructure (e.g., adopting pgvector to eliminate a separate service)

## When NOT To Use
- Current provider meets all requirements and migration risk isn't justified
- Small-scale deployments where provider differences are negligible
- Team cannot tolerate any migration downtime and dual-write pattern is not feasible
- Prototypes where provider choice is not yet critical

## Prerequisites
- KU-01 (Vector Database Fundamentals) — understanding of provider-agnostic interfaces
- KU-02 (Indexing Strategies) — index type differences across providers
- KU-03 (Query Patterns & Filtering) — query API differences across providers
- KU-05 (Performance & Scaling) — performance comparison methodology
- Provider-agnostic `VectorStore` interface implemented
- Access to test accounts or infrastructure for candidate providers

## Inputs
- Current provider details (name, configuration, cost, vector count, dimensions)
- Requirements: latency targets, QPS needs, feature requirements, budget, hosting preference (managed vs. self-hosted)
- Compliance requirements (data residency, certifications, encryption)
- Growth projections (vector count 6-12 months)
- Provider benchmark results from evaluation test suite

## Workflow
1. **Define requirements**: Document latency targets, QPS, budget, feature requirements (hybrid search, multi-vector, geo-filtering), hosting preference (managed vs. self-hosted), and compliance needs.
2. **Build candidate shortlist**: Based on requirements, select 2-4 candidate providers. Include pgvector as a baseline (runs inside PostgreSQL). Consider: pgvector, Qdrant (self-hosted or cloud), Pinecone (managed), Milvus (self-hosted).
3. **Evaluate with your data**: Benchmark each provider using your actual vector dimensions, dataset size (or scaled test), and query patterns. Measure p50/p95 latency, QPS, recall@10, and cost at projected scale.
4. **Select provider**: Choose the provider that best meets requirements across performance, cost, features, and operational complexity. Document the decision rationale.
5. **Prepare migration (if switching)**: Ensure the `VectorStore` interface fully abstracts both old and new provider. Implement the new provider adapter if not already available.
6. **Export data**: Export vectors and metadata from the current provider in a standard portable format (JSONL, Parquet). Include embedding model version metadata.
7. **Bulk import**: Use the new provider's bulk import API to load exported vectors. Transform dimensions or metadata format if needed. Validate import completeness.
8. **Initiate dual-write**: Configure the application to write to both old and new providers for all insert, update, and delete operations. Monitor secondary writes for errors.
9. **Validate secondary**: Run validation queries against both providers comparing result sets. Ensure recall, latency, and feature compatibility meet requirements. Maintain dual-write for an observation period (1-7 days).
10. **Cutover reads**: Switch read queries to the new provider while maintaining dual-write. Monitor for issues during a burn-in period (24-72 hours).
11. **Decommission old provider**: After burn-in period confirms stability, stop writes to the old provider. Retain old provider data for 30 days as backup before decommissioning.

## Validation Checklist
- [ ] Vector store operations are abstracted behind a VectorStore interface (provider-agnostic)
- [ ] Provider comparison evaluation is documented with actual test results (not just vendor benchmarks)
- [ ] Migration process is documented and tested with a dry run on non-production data
- [ ] Dual-write pattern is implemented for zero-downtime migration
- [ ] Rollback plan exists with tested procedure
- [ ] Data export format is standard (JSONL, Parquet) for portability
- [ ] Provider-specific features are accessed through the abstraction (not direct API calls)

## Common Failures
- **Feature incompatibility discovered mid-migration**: New provider doesn't support a critical filtering capability. Fix by evaluating all required features before starting migration.
- **Dimension mismatch**: Old provider supports dimensions up to 1536, new provider has a different limit. Fix by verifying dimension compatibility during evaluation.
- **Dual-write failures not detected**: Secondary writes fail silently, causing data loss on cutover. Fix by monitoring dual-write error rates and setting alerts.
- **Performance regression after migration**: New provider has higher latency than old for the specific workload. Fix by benchmarking with your actual data before committing.
- **Cost overrun**: New provider's pricing model (per-vector vs. per-hour) proves more expensive at scale. Fix by modeling total cost of ownership at projected vector count.

## Decision Points
- **Managed vs. self-hosted**: Choose managed (Pinecone, Qdrant Cloud) for zero ops and auto-scaling. Choose self-hosted (Qdrant, Milvus, pgvector) for cost control, data residency, and no vendor lock-in.
- **pgvector vs. dedicated vector DB**: Choose pgvector for simplicity (runs in PostgreSQL, no extra infra, strong consistency). Switch to dedicated vector DB when exceeding pgvector's QPS limits (~50 QPS at 1M/1536d) or needing multi-region replication.
- **Dual-write duration**: Longer dual-write (7 days) for production-critical systems with large datasets. Shorter (24 hours) for smaller systems with complete re-index capability.

## Performance Considerations
- Export speed: 10K-100K vectors/minute from most providers (depends on API rate limits)
- Bulk import speed: 50K-500K vectors/minute on new provider (use bulk APIs)
- Dual-write overhead: each write operation latency increases by ~10-50ms for the secondary write
- Validation queries: run 100-1000 sample queries comparing result sets between providers
- Total migration time for 1M vectors: 1-3 days including dual-write observation period

## Security Considerations
- Encrypt vector export files — embeddings can be partially reversed to reveal information
- Store credentials for all providers in a secrets manager (never in code or config files)
- Ensure data doesn't cross regions or jurisdictions during migration (data residency compliance)
- Propagate ACL metadata correctly to the new provider
- Implement rollback plan that restores service quickly if migration fails
- Audit log all migration operations

## Related Rules
- Abstract Provider-Specific Code Behind an Interface
- Evaluate Providers with Your Data
- Use Dual-Write Pattern for Migration
- Plan a Tested Rollback Procedure
- Track Embedding Model Version
- Don't Dismiss pgvector Prematurely

## Related Skills
- Skill: Set Up and Query a Vector Database (ku-01)
- Skill: Configure and Tune Vector Database Indexes (ku-02)
- Skill: Implement Vector Search with Filtering (ku-03)
- Skill: Scale Vector Database Performance (ku-05)

## Success Criteria
- Provider evaluation documented with benchmarking results from actual data and queries
- Provider-agnostic VectorStore interface covers all required operations for both old and new provider
- Migration completes with zero application downtime
- Dual-write runs without errors during observation period
- Rollback procedure tested and works (restores old provider within minutes)
- New provider meets all latency, recall, and cost targets at projected scale
- Old provider data retained for 30 days post-migration as backup