# Knowledge Unit: Vector Database Fundamentals

## Metadata

- **ID:** ku-01
- **Subdomain:** Vector Databases
- **Slug:** vector-database-fundamentals
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

A vector database stores and indexes high-dimensional vector embeddings for fast similarity search. Unlike traditional databases (which index exact values), vector databases use Approximate Nearest Neighbor (ANN) algorithms to find vectors closest to a query vector. They are the storage backend for RAG systems, semantic memory, recommendation engines, and any application that needs similarity-based retrieval. In the Laravel AI ecosystem, vector databases are accessed through provider-specific clients (pgvector, Qdrant, Milvus, Pinecone) with a common abstraction layer.

## Core Concepts

- **Vector Embedding:** A dense array of floating-point numbers representing the semantic meaning of text, image, or other data.
- **ANN (Approximate Nearest Neighbor):** Search algorithm that finds approximate nearest neighbors faster than exact search, with configurable recall/accuracy tradeoff.
- **Distance Metric:** The measure of similarity between vectors â€” cosine similarity (most common for normalized embeddings), Euclidean distance (L2), dot product.
- **Index Type:** The data structure used for ANN search â€” HNSW (Hierarchical Navigable Small World), IVF (Inverted File), PQ (Product Quantization).
- **Collection/Index:** A named container of vectors with a defined schema (vector dimensions, distance metric, metadata fields).
- **Metadata Filtering:** Applying structured filters (key-value conditions) alongside vector search â€” "find similar to X where category = 'docs'".
- **Persistence & Durability:** Whether the vector database stores data on disk (durable) or in memory only (ephemeral).
- **CRUD Operations:** Create, Read, Update, Delete vectors. Essential for keeping the index in sync with the source documents.

## Mental Models

- **Vector Embedding:** A dense array of floating-point numbers representing the semantic meaning of text, image, or other data.
- **ANN (Approximate Nearest Neighbor):** Search algorithm that finds approximate nearest neighbors faster than exact search, with configurable recall/accuracy tradeoff.
- **Distance Metric:** The measure of similarity between vectors â€” cosine similarity (most common for normalized embeddings), Euclidean distance (L2), dot product.


## Internal Mechanics

The internal mechanics of Vector Database Fundamentals follow established patterns within the Vector Databases domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Choose the right distance metric.** Cosine similarity for normalized embeddings (most common). Dot product for unnormalized. L2 for magnitude-sensitive.
- **Set vector dimensions correctly.** Must match the embedding model's output dimensions. Mismatch causes silent errors or incorrect results.
- **Define a metadata schema.** Store source document ID, chunk position, content type, and access control labels as metadata for filtering.
- **Create an index before inserting data.** Adding vectors to an unindexed collection degrades performance (brute force search).
- **Benchmark search speed.** ANN parameters (efConstruction, M, nlist) significantly impact recall and latency. Tune for your use case.
- **Monitor index quality.** Track recall@10 (percentage of true nearest neighbors found) to detect index degradation.

## Patterns

- **Choose the right distance metric.** Cosine similarity for normalized embeddings (most common). Dot product for unnormalized. L2 for magnitude-sensitive.
- **Set vector dimensions correctly.** Must match the embedding model's output dimensions. Mismatch causes silent errors or incorrect results.
- **Define a metadata schema.** Store source document ID, chunk position, content type, and access control labels as metadata for filtering.
- **Create an index before inserting data.** Adding vectors to an unindexed collection degrades performance (brute force search).
- **Benchmark search speed.** ANN parameters (efConstruction, M, nlist) significantly impact recall and latency. Tune for your use case.
- **Monitor index quality.** Track recall@10 (percentage of true nearest neighbors found) to detect index degradation.

## Architectural Decisions

- Implement a **vector store interface** (`VectorStore`) with methods: `search()`, `insert()`, `delete()`, `update()`.
- Use a **repository pattern** â€” the application talks to a `VectorRepository` interface, not the vector database directly.
- Separate **index management** (creating/deleting collections, configuring indexes) from **data operations** (search, insert, delete).
- For Laravel, use **config for connection settings** (Qdrant host, Pinecone API key, pgvector DSN) with environment overrides.
- Implement **health checks** for the vector database â€” ping the service, verify index status.
- Use **transactions or batch operations** for bulk inserts â€” inserting vectors one at a time is slow.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- ANN search latency: 5-50ms for HNSW (10K-1M vectors), 50-200ms for IVF (1M-10M vectors).
- Brute force (exact) search: 100ms for 10K vectors, 10s for 1M vectors. Not suitable for production.
- Insert throughput: 100-1000 vectors/second per index (depends on index type and hardware).
- Storage: 1536-dim vector at 4-byte float = ~6KB per vector + metadata. 1M vectors = ~6GB + metadata.
- Memory vs. Disk: HNSW in memory is 10x faster than on disk. Qdrant and Milvus support memory-mapped storage.

## Production Considerations

- **Network isolation:** Vector databases should not be publicly accessible. Use private network (VPC) or SSH tunneling.
- **Authentication:** Configure API keys or TLS client certificates for database access.
- **Data encryption:** Ensure the vector database supports encryption at rest (if storing sensitive vectors).
- **Access control:** Implement metadata-based access control â€” filter search results based on user permissions.
- **Backup security:** Vector database backups contain embeddings of all documents. Encrypt backups.
- **Input validation:** Validate query vectors (correct dimensions, finite values) before sending to the database.

## Common Mistakes

- Not creating an ANN index â€” searching against unindexed vectors performs brute force search (slow).
- Using the wrong distance metric â€” cosine vs. dot product confusion leads to incorrect similarity rankings.
- Mismatched vector dimensions â€” embedding model produces 1536-dim vectors but the index expects 768-dim.
- Not normalizing embeddings â€” cosine similarity on non-normalized vectors gives incorrect results.
- Storing vectors without metadata â€” impossible to filter or trace back to source documents.
- Not monitoring index recall â€” index quality degrades over time as vectors are added.

## Failure Modes

- **Vector Database as Primary Database:** Using a vector database as the source of truth for document storage. Store source documents in a primary database, vectors in the vector DB.
- **Index Everything:** Creating a single index for all vectors without considering isolation (multi-tenant, different content types).
- **No Index Maintenance:** Adding vectors indefinitely without optimizing the index. Periodically rebuild or optimize indexes.
- **One-Size-Fits-All Index:** Using the same index type for all workloads. HNSW for low-latency, IVF for high-recall, PQ for memory-constrained.
- **Ignoring Vector DB Vendor Lock-In:** Using proprietary features that make it impossible to switch vector databases.

## Ecosystem Usage

### Vector Store Interface
```php
interface VectorStore {
    public function search(VectorQuery $query): SearchResult;
    public function insert(string $collection, array $vectors, array $metadata = []): void;
    public function delete(string $collection, array $ids): void;
    public function createCollection(string $name, int $dimensions, string $metric = 'cosine'): void;
    public function deleteCollection(string $name): void;
}

class VectorQuery {
    public function __construct(
        public readonly array $vector,       // float[]
        public readonly int $topK = 10,
        public readonly array $filters = [], // metadata filters
        public readonly float $minScore = 0.0,
    ) {}
}
```

### Vector Store Configuration
```php
// config/vector.php
return [
    'default' => env('VECTOR_DB', 'qdrant'),

    'stores' => [
        'qdrant' => [
            'host' => env('QDRANT_HOST', '127.0.0.1'),
            'port' => env('QDRANT_PORT', 6333),
            'api_key' => env('QDRANT_API_KEY'),
            'tls' => env('QDRANT_TLS', false),
        ],
        'pgvector' => [
            'connection' => env('PGVECTOR_CONNECTION', 'pgsql'),
        ],
        'pinecone' => [
            'api_key' => env('PINECONE_API_KEY'),
            'environment' => env('PINECONE_ENVIRONMENT'),
        ],
    ],
];
```

## Related Knowledge Units

- ku-02 (Indexing Strategies): Creating and optimizing vector indexes.
- ku-03 (Query Patterns & Filtering): Effective search queries.
- ku-04 (Data Synchronization): Keeping vector DB in sync with source data.
- ku-05 (Performance & Scaling): Scaling vector databases.
- retrieval-augmented-generation/ku-01: RAG uses vector DB for retrieval.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

