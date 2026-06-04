# Knowledge Unit: Provider Comparison & Migration

## Metadata

- **ID:** ku-06
- **Subdomain:** Vector Databases
- **Slug:** provider-comparison---migration
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Choosing and migrating between vector database providers is a significant architectural decision. Different providers offer different tradeoffs in performance, cost, scalability, managed vs. self-hosted, consistency guarantees, and feature sets. As requirements evolve (scale, latency, budget, compliance), teams may need to migrate from one provider to another. This KU covers the evaluation criteria for selecting a vector database and the migration patterns for moving data between providers with minimal downtime.

## Core Concepts

- **Provider Categories:** Managed cloud (Pinecone, Qdrant Cloud, Weaviate Cloud), self-hosted open source (Qdrant, Milvus, Weaviate), database extension (pgvector, Elasticsearch).
- **Managed vs. Self-Hosted:** Managed = zero ops, higher cost, vendor lock-in. Self-hosted = full control, operational overhead.
- **pgvector Advantage:** Runs inside PostgreSQL â€” no additional infrastructure, transactional consistency, SQL integration.
- **Consistency Model:** Strong consistency (pgvector, Qdrant) vs. eventual consistency (Pinecone). Affects when inserted vectors are queryable.
- **Pricing Model:** Per-vector pricing (Pinecone), per-hour instance pricing (Qdrant Cloud), self-hosted infrastructure costs.
- **Feature Parity:** Not all providers support the same features (hybrid search, multi-vector, geo-filtering, group-by).
- **Migration Strategy:** The process of exporting vectors from one provider and importing to another, with minimal application downtime.
- **Dual-Write Pattern:** Writing to both old and new providers during migration for zero data loss.

## Mental Models

- **Provider Categories:** Managed cloud (Pinecone, Qdrant Cloud, Weaviate Cloud), self-hosted open source (Qdrant, Milvus, Weaviate), database extension (pgvector, Elasticsearch).
- **Managed vs. Self-Hosted:** Managed = zero ops, higher cost, vendor lock-in. Self-hosted = full control, operational overhead.
- **pgvector Advantage:** Runs inside PostgreSQL â€” no additional infrastructure, transactional consistency, SQL integration.


## Internal Mechanics

The internal mechanics of Provider Comparison & Migration follow established patterns within the Vector Databases domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Abstract provider-specific code.** Use a `VectorStore` interface (ku-01) so switching providers doesn't require application code changes.
- **Evaluate with your data and queries.** Don't rely on vendor benchmarks. Test with your vector dimensions, dataset size, and query patterns.
- **Consider total cost of ownership (TCO).** Managed provider costs at scale (1M+ vectors) may exceed self-hosted infrastructure costs.
- **Test migration before committing.** Run a trial migration with a subset of data to validate the process and timing.
- **Plan for data export.** Ensure you can export vectors and metadata from the current provider in a standard format.
- **Use feature comparison matrix.** List required features and check each provider's support level before evaluating.

## Patterns

- **Abstract provider-specific code.** Use a `VectorStore` interface (ku-01) so switching providers doesn't require application code changes.
- **Evaluate with your data and queries.** Don't rely on vendor benchmarks. Test with your vector dimensions, dataset size, and query patterns.
- **Consider total cost of ownership (TCO).** Managed provider costs at scale (1M+ vectors) may exceed self-hosted infrastructure costs.
- **Test migration before committing.** Run a trial migration with a subset of data to validate the process and timing.
- **Plan for data export.** Ensure you can export vectors and metadata from the current provider in a standard format.
- **Use feature comparison matrix.** List required features and check each provider's support level before evaluating.

## Architectural Decisions

- Implement the `VectorStore` interface for all providers (ku-01). Always code to the interface, not the concrete provider.
- For migration, use a **dual-write pattern**: write to both old and new provider during the migration window.
- Use a **migration coordinator** service that handles the export, transformation, and import pipeline.
- Store vector data in an **intermediate format** (Parquet, JSONL) for portability between providers.
- For pgvector, use the **same PostgreSQL connection** â€” no additional network dependency for vector operations.
- For managed providers, use their **bulk import API** for initial migration and REST API for ongoing dual-writes.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations



## Production Considerations

- **Data export security:** Vector exports may contain sensitive information (embeddings can be partially reversed). Encrypt export files.
- **Migration downtime:** Plan for read-only mode or degraded search during cutover.
- **Credential management:** Each provider has different authentication. Store credentials in secrets manager.
- **Data residency during migration:** Ensure data doesn't cross regions or jurisdictions during migration.
- **Access control propagation:** Ensure ACL metadata is preserved and correctly applied in the new provider.
- **Rollback plan:** If the migration fails, the rollback process must restore the previous provider's index.

## Common Mistakes

- Choosing a provider based on benchmarks alone â€” real-world performance depends on specific use case.
- Not abstracting the provider interface â€” switching providers requires rewriting application code.
- Underestimating migration complexity â€” exporting millions of vectors, transforming formats, and re-indexing takes days.
- Ignoring consistency guarantees â€” Pinecone's eventual consistency may not suit applications needing immediate read-after-write.
- Not testing the migration process â€” the first migration attempt should never be in production.
- Budgeting only for vector DB costs â€” also account for embedding costs (re-embedding data during migration).

## Failure Modes

- **Provider Lock-In Scofflaw:** Claiming to be provider-agnostic but using provider-specific features everywhere in the codebase.
- **Migration Without Dual-Write:** Cutting over in one step â€” any issue causes extended downtime.
- **No Rollback Plan:** Migrating without a tested rollback procedure. If the new provider fails, the system is down.
- **Feature Incompatibility Discovery:** Discovering during migration that the new provider doesn't support a critical feature.
- **Perpetual Evaluation:** Never committing to a provider because "we might switch later." Pick a provider and abstract the interface.
- **Ignoring pgvector:** Dismissing pgvector because it's "just a Postgres extension." It's the simplest and most reliable option for many deployments.

## Ecosystem Usage

Laravel AI SDK and community packages provide implementations.

## Related Knowledge Units

- ku-01 (Vector Database Fundamentals): Provider-agnostic interface.
- ku-02 (Indexing Strategies): Index differences across providers.
- ku-03 (Query Patterns & Filtering): Query API differences.
- ku-05 (Performance & Scaling): Performance comparison across providers.
- retrieval-augmented-generation/ku-01: RAG architecture with different vector DBs.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

