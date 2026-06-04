---
id: ku-06
title: "Provider Comparison & Migration"
subdomain: "vector-database-integration"
ku-type: "decision"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/vector-database-integration/ku-06/04-standardized-knowledge.md"
---

# Provider Comparison & Migration

## Overview

Choosing and migrating between vector database providers is a significant architectural decision. Different providers offer different tradeoffs in performance, cost, scalability, managed vs. self-hosted, consistency guarantees, and feature sets. As requirements evolve (scale, latency, budget, compliance), teams may need to migrate from one provider to another. This KU covers the evaluation criteria for selecting a vector database and the migration patterns for moving data between providers with minimal downtime.

## Core Concepts

- **Provider Categories:** Managed cloud (Pinecone, Qdrant Cloud, Weaviate Cloud), self-hosted open source (Qdrant, Milvus, Weaviate), database extension (pgvector, Elasticsearch).
- **Managed vs. Self-Hosted:** Managed = zero ops, higher cost, vendor lock-in. Self-hosted = full control, operational overhead.
- **pgvector Advantage:** Runs inside PostgreSQL — no additional infrastructure, transactional consistency, SQL integration.
- **Consistency Model:** Strong consistency (pgvector, Qdrant) vs. eventual consistency (Pinecone). Affects when inserted vectors are queryable.
- **Pricing Model:** Per-vector pricing (Pinecone), per-hour instance pricing (Qdrant Cloud), self-hosted infrastructure costs.
- **Feature Parity:** Not all providers support the same features (hybrid search, multi-vector, geo-filtering, group-by).
- **Migration Strategy:** The process of exporting vectors from one provider and importing to another, with minimal application downtime.
- **Dual-Write Pattern:** Writing to both old and new providers during migration for zero data loss.

## When To Use

- Initial provider selection — evaluating options before building the RAG system.
- When current provider costs are too high — migrating to a more cost-effective option.
- When current provider lacks required features (hybrid search, metadata filtering, geo-distribution).
- When current provider's performance doesn't meet SLAs.
- When compliance requirements change (data residency, self-hosting required).

## When NOT To Use

- When the current provider meets all requirements — migration risk may not be worth it.
- Small-scale deployments where provider differences are negligible.
- When the team cannot tolerate migration downtime.

## Best Practices

- **Abstract provider-specific code.** Use a `VectorStore` interface (ku-01) so switching providers doesn't require application code changes.
- **Evaluate with your data and queries.** Don't rely on vendor benchmarks. Test with your vector dimensions, dataset size, and query patterns.
- **Consider total cost of ownership (TCO).** Managed provider costs at scale (1M+ vectors) may exceed self-hosted infrastructure costs.
- **Test migration before committing.** Run a trial migration with a subset of data to validate the process and timing.
- **Plan for data export.** Ensure you can export vectors and metadata from the current provider in a standard format.
- **Use feature comparison matrix.** List required features and check each provider's support level before evaluating.

## Architecture Guidelines

- Implement the `VectorStore` interface for all providers (ku-01). Always code to the interface, not the concrete provider.
- For migration, use a **dual-write pattern**: write to both old and new provider during the migration window.
- Use a **migration coordinator** service that handles the export, transformation, and import pipeline.
- Store vector data in an **intermediate format** (Parquet, JSONL) for portability between providers.
- For pgvector, use the **same PostgreSQL connection** — no additional network dependency for vector operations.
- For managed providers, use their **bulk import API** for initial migration and REST API for ongoing dual-writes.

## Key Comparison Dimensions

| Feature | pgvector | Qdrant | Milvus | Pinecone |
|---------|----------|--------|--------|----------|
| Hosting | Self (in PG) | Self/Cloud | Self/Cloud | Cloud only |
| Index Types | IVFFlat, HNSW | HNSW | IVF, HNSW, PQ | HNSW, PQ |
| Max Dimensions | ~8000 | 65536 | 32768 | 20000 |
| Hybrid Search | Via PG FTS | Native | Native | Via Pinecone |
| Consistency | Strong | Strong | Tunable | Eventual |
| Free Tier | Free (in PG) | 1GB cloud | Standalone | Free tier |
| Pricing | Ops cost | Per GB | Per node | Per vector |
| QPS at 1M/1536d | ~50 | ~500 | ~1000 | ~1000 |

## Migration Process

```php
class VectorMigration {
    public function migrate(
        VectorStore $source,
        VectorStore $destination,
        callable $transform = null,
    ): void {
        // 1. Export all vectors from source
        $vectors = $source->exportAll(chunkSize: 1000);

        // 2. Transform if needed (dimension change, metadata remapping)
        if ($transform) {
            $vectors = array_map($transform, $vectors);
        }

        // 3. Bulk import to destination
        foreach ($vectors as $chunk) {
            $destination->insert($chunk['collection'], $chunk['vectors'], $chunk['metadata']);
        }
    }

    public function dualWrite(VectorStore $primary, VectorStore $secondary, array $data): void {
        // Write to primary (existing operating provider)
        $primary->insert($data['collection'], $data['vectors'], $data['metadata']);

        // Write to secondary (new provider during migration)
        try {
            $secondary->insert($data['collection'], $data['vectors'], $data['metadata']);
        } catch (\Exception $e) {
            Log::error('Dual write to secondary failed', [
                'error' => $e->getMessage(),
                'collection' => $data['collection'],
            ]);
            // Don't fail the primary write
        }
    }
}
```

## Security Considerations

- **Data export security:** Vector exports may contain sensitive information (embeddings can be partially reversed). Encrypt export files.
- **Migration downtime:** Plan for read-only mode or degraded search during cutover.
- **Credential management:** Each provider has different authentication. Store credentials in secrets manager.
- **Data residency during migration:** Ensure data doesn't cross regions or jurisdictions during migration.
- **Access control propagation:** Ensure ACL metadata is preserved and correctly applied in the new provider.
- **Rollback plan:** If the migration fails, the rollback process must restore the previous provider's index.

## Common Mistakes

- Choosing a provider based on benchmarks alone — real-world performance depends on specific use case.
- Not abstracting the provider interface — switching providers requires rewriting application code.
- Underestimating migration complexity — exporting millions of vectors, transforming formats, and re-indexing takes days.
- Ignoring consistency guarantees — Pinecone's eventual consistency may not suit applications needing immediate read-after-write.
- Not testing the migration process — the first migration attempt should never be in production.
- Budgeting only for vector DB costs — also account for embedding costs (re-embedding data during migration).

## Anti-Patterns

- **Provider Lock-In Scofflaw:** Claiming to be provider-agnostic but using provider-specific features everywhere in the codebase.
- **Migration Without Dual-Write:** Cutting over in one step — any issue causes extended downtime.
- **No Rollback Plan:** Migrating without a tested rollback procedure. If the new provider fails, the system is down.
- **Feature Incompatibility Discovery:** Discovering during migration that the new provider doesn't support a critical feature.
- **Perpetual Evaluation:** Never committing to a provider because "we might switch later." Pick a provider and abstract the interface.
- **Ignoring pgvector:** Dismissing pgvector because it's "just a Postgres extension." It's the simplest and most reliable option for many deployments.

## Related Topics

- ku-01 (Vector Database Fundamentals): Provider-agnostic interface.
- ku-02 (Indexing Strategies): Index differences across providers.
- ku-03 (Query Patterns & Filtering): Query API differences.
- ku-05 (Performance & Scaling): Performance comparison across providers.
- retrieval-augmented-generation/ku-01: RAG architecture with different vector DBs.

## AI Agent Notes

- When asked to choose a vector DB provider, first determine: hosting preferences (managed vs. self-hosted), dataset size, latency requirements, budget, and PostgreSQL usage.
- For migration issues, check: interface abstraction coverage, data export format, dimension compatibility, and dual-write status.
- Prefer reading the provider comparison matrix and the current provider adapter before making recommendations.
- When generating migration code, include: provider-agnostic interface, migration coordinator, dual-write pattern, and rollback plan.

## Verification

- [ ] Vector store operations are abstracted behind a `VectorStore` interface (provider-agnostic).
- [ ] Provider comparison evaluation is documented with actual test results (not just benchmarks).
- [ ] Migration process is documented and tested (not just planned).
- [ ] Dual-write pattern is implemented for zero-downtime migration.
- [ ] Rollback plan exists with tested procedure.
- [ ] Data export format is standard (JSONL, Parquet) for portability.
- [ ] Provider-specific features are accessed through the abstraction (not direct API calls).
