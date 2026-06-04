# Knowledge Unit: Qdrant Edge (Embedded Vector Search)

## Metadata

- **ID:** K055
- **Subdomain:** Vector Similarity Search
- **Source:** Qdrant Docs
- **Maturity:** New
- **Laravel Relevance:** On-device, offline

## Executive Summary

Qdrant Edge is a lightweight, embedded version of Qdrant designed for edge devices, mobile, and offline environments. It runs as a library (not a server) within the application process, with no network dependency. Qdrant Edge supports the same vector search capabilities as the full Qdrant server — HNSW indexing, payload filtering, and quantization — but optimized for constrained environments.

## Core Concepts

- **Embedded Runtime**: Runs in-process as a library. No separate server process.
- **No Network Dependency**: All operations are local. No gRPC/REST calls.
- **Same API**: Compatible with Qdrant's client API, making migration straightforward.
- **Optimized for Constraints**: Lower memory footprint, simpler persistence, no clustering.

## Internal Mechanics

Qdrant Edge is compiled as a shared library that links directly into the application process. Vector indexes are stored in local files. Search operations use the same HNSW algorithm as full Qdrant but without the network layer, cluster coordination, or segment optimization pipeline. The entire index lives in the application's memory space.

## Patterns

- **Offline search**: Mobile apps, IoT devices, or air-gapped deployments where no network is available.
- **Client-side RAG**: Embedding generation + vector search on the device, LLM response on the server.
- **Development/testing**: Use Qdrant Edge in CI/tests instead of spinning up a full Qdrant server.
- **Caching layer**: Small, frequently searched indexes locally with the full index on the server.

## Architectural Decisions

Qdrant Edge's embedded architecture follows the trend of moving ML inference closer to the data source. The tradeoff is simplicity (no server to manage) vs capacity (limited to single-node, application's memory).

## Tradeoffs

| Factor | Qdrant (Server) | Qdrant Edge |
|---|---|---|
| Architecture | Separate server process | In-process library |
| Network | gRPC/REST required | No network needed |
| Scalability | Horizontal (Raft cluster) | Single process |
| Memory | Independent | Shares app memory |
| Index size | Unlimited (mmap) | App memory bound |
| HA | Yes (multi-node) | No |

## Performance Considerations

- No network overhead — search latency is purely computation time.
- Index size is limited by the application's available memory.
- Persistence is file-based, suitable for mobile and edge storage constraints.
- No segment optimization — index is built in a single pass.

## Production Considerations

- **Use for single-user or low-concurrency scenarios**: Edge is not designed for high-throughput server workloads.
- **Plan for index persistence**: Ensure local file storage is durable (mobile devices may lose data on app reset).
- **Synchronize with server index**: If using Edge as a cache, implement a sync strategy for index updates.
- **Monitor memory usage**: Edge shares the application's memory — large indexes may impact app performance.

## Common Mistakes

- Using Edge for multi-user server workloads — it's not designed for concurrent access patterns.
- Expecting server-grade HA and persistence — Edge is ephemeral by design.
- Not implementing a sync strategy — if the edge device loses the index, it must be rebuilt.

## Failure Modes

- **OOM crash**: Index exceeds available application memory.
- **File corruption**: Improper shutdown may corrupt the local index file.
- **Stale index**: If used as a cache, the local index may contain outdated vectors.

## Ecosystem Usage

Emerging use case for Qdrant Edge in mobile apps, IoT devices, and offline-capable applications. Less common in the Laravel ecosystem (which is server-based) but relevant for Laravel-powered mobile APIs that serve search data to offline-capable clients.

## Related Knowledge Units

- K048 (Qdrant vector search)
- K053 (Qdrant FastEmbed)

## Research Notes

Source: Qdrant docs. Qdrant Edge is a relatively new offering (2024-2025) that positions Qdrant for edge computing use cases. The in-process library approach is similar to SQLite for vector search.


## Mental Models

- **Translator**: An embedding model is like a translator who converts text into a language of pure meaning (vectors). Different translators (models) have different vocabularies and dialects.
- **Map Coordinates**: Embeddings are like GPS coordinates in a meaning-space. Similar concepts cluster together geographically; distance maps to semantic similarity.
- **Fingerprint**: Each document gets a unique vector fingerprint. The goal is high sensitivity (different docs → different vectors) and robustness (same meaning → similar vectors).

