# Knowledge Unit: Typesense Vector Search

## Metadata

- **ID:** K036
- **Subdomain:** Vector Similarity Search
- **Source:** Typesense Docs
- **Maturity:** Stable
- **Laravel Relevance:** Embedding storage + ANN search

## Executive Summary

Typesense supports vector search as a built-in feature, storing embedding vectors alongside other fields in collections and performing ANN search using HNSW. This enables semantic search within Typesense without requiring a separate vector database. Typesense uses cosine distance by default and supports automatic embedding generation via API integration.

## Core Concepts

- **Vector Field Type**: Define a field with `type: "float[]"` and `num_dim` in the collection schema.
- **HNSW Index**: Typesense automatically builds an HNSW index on vector fields for ANN search.
- **Cosine Distance**: Default distance metric. Configurable via the `distance` parameter.
- **Hybrid Search**: Combine vector search with keyword search using Typesense's built-in hybrid support.
- **Auto-Embeddings**: Typesense can call an embedding API to generate vectors at index time.

## Internal Mechanics

Typesense stores vectors in its in-memory columnar storage. The HNSW index is built during document indexing. At query time, Typesense converts the search query to an embedding (via auto-embedding or user-provided vector), performs ANN search, and optionally fuses results with keyword search. The entire operation happens within Typesense's process.

## Patterns

- **Semantic search without separate DB**: Use Typesense as both keyword and vector store.
- **Auto-embedding integration**: Configure OpenAI or custom embedding API in Typesense settings.
- **Multi-vector search**: Search across multiple vector fields with different weights.
- **Vector + filter**: Combine vector search with Typesense's filter_by for scoped semantic search.

## Architectural Decisions

Typesense added vector search as a native feature (rather than requiring a separate system) to simplify the stack. The in-memory storage provides fast vector search but limits dataset size to available RAM.

## Tradeoffs

| Factor | Typesense Vector | pgvector | Qdrant |
|---|---|---|---|
| Infrastructure | Same as Typesense server | Existing PostgreSQL | Separate server |
| Dataset limit | Must fit in RAM | Disk-based | mmap or RAM |
| Query latency | Sub-10ms | 2-10ms | 1-5ms |
| PHP integration | Official PHP SDK | Raw SQL | Community SDK |
| Scout support | Yes (via Typesense driver) | No (custom) | No (custom) |

## Performance Considerations

- Vector search adds to Typesense's RAM requirements — consider the total vector storage.
- HNSW index building is automatic but may slow indexing throughput.
- Query latency increase is minimal (vector + keyword often still under 20ms).
- RAM planning: 1M 1536-dim vectors = ~6GB of vector data + index overhead.

## Production Considerations

- **Ensure dataset fits in RAM** — vector indexes must be in memory for performance.
- **Configure auto-embedding provider** — API key management for OpenAI/other providers.
- **Test latency impact** — vector search is slightly slower than pure keyword.
- **Monitor memory usage** — vector indexes increase Typesense's memory footprint significantly.

## Common Mistakes

- Not accounting for vector storage in RAM planning — Typesense may run out of memory.
- Using auto-embeddings without API rate limit considerations.
- Expecting Scout to abstract vector search — Scout's Typesense driver covers basic search, but vector-specific features require the callback API.
- Not normalizing vectors if using a model that requires it.

## Failure Modes

- **OOM crash**: Vector storage exceeds available RAM. Typesense crashes.
- **Auto-embedding failure**: If the embedding API is unavailable, vector indexing fails.
- **Dimension mismatch**: Query embedding dimension must match the indexed embeddings.

## Ecosystem Usage

Used by Typesense users who want vector search without managing a separate vector database. Typesense Cloud supports vector search natively. The Scout Typesense driver provides basic integration.

## Related Knowledge Units

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K035 (Typesense dynamic search parameters)
- K028 (Meilisearch hybrid search)

## Research Notes

Sources: Typesense docs, Laravel Scout Typesense docs. Typesense vector search was released in 2024, making it a relatively recent addition. The auto-embedding support differentiates it from Meilisearch's vector approach.


## Mental Models

- **Lightning Rod**: Typesense is designed for sub-50ms responses. Every architectural decision prioritizes speed, like a lightning rod channeling energy with minimal resistance.
- **Schema-on-Write**: Unlike schema-on-read databases, Typesense enforces structure at write time, like pre-sorting mail before delivery rather than sorting at the mailbox.

