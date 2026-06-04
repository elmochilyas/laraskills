# Domain Analysis: Search & Retrieval Systems

## Domain Overview

Search & Retrieval Systems encompass the architectures, engines, strategies, and tooling used to index, store, and retrieve data efficiently in response to user queries. Within the Laravel ecosystem, this domain integrates full-text search engines, vector databases, hybrid search pipelines, and relevance ranking systems via Laravel Scout — an abstraction layer that synchronizes Eloquent models with search indexes. The domain spans from simple database-backed `LIKE` queries to sophisticated AI-powered semantic search with RAG (Retrieval-Augmented Generation) pipelines.

Modern search systems must balance recall (finding all relevant results), precision (returning only relevant results), latency (sub-50ms targets), and operational complexity. The Laravel ecosystem's approach centers on driver-based abstraction through Scout, supporting both self-hosted (Meilisearch, Typesense, pgvector) and cloud-managed (Algolia, Typesense Cloud, Meilisearch Cloud, Qdrant Cloud, Pinecone) backends.

---

## Domain Scope

### In-Scope
- Full-text search engines (MySQL, PostgreSQL native; Meilisearch; Algolia; Typesense)
- Vector similarity search (pgvector, Qdrant, Pinecone, Milvus)
- Hybrid search architectures (keyword + vector fusion)
- Laravel Scout integration patterns and custom engine development
- Search indexing strategies (batch, incremental, real-time, conditional)
- Relevance tuning and ranking algorithms
- Faceted search, filtering, and aggregation
- Typo tolerance and fuzzy matching
- Synonym management and custom tokenization
- Search analytics, A/B testing, and click-through tracking
- Search caching strategies (query-level, result-level, HTTP)
- Re-ranking pipelines (cross-encoders, learning-to-rank)
- RAG search pipelines (embedding generation, retrieval, LLM integration)
- Geo-search and spatial filtering

### Out-of-Scope (Phase 1)
- Full recommender system implementation (collaborative filtering is adjacent but included in vector search scope)
- Natural language processing model training
- Distributed search infrastructure operations (Kubernetes, sharding — but concepts are covered)
- Database administration for search-optimized configurations

---

## Major Subdomains

### 1. Full-Text Search Engines
Traditional keyword-based search using inverted indexes. Covers MySQL FULLTEXT indexes, PostgreSQL `tsvector`/`tsquery`, and dedicated search appliances.

**Key technologies:** MySQL FULLTEXT, PostgreSQL `tsvector`, Laravel Scout `database` engine, `SearchUsingFullText`/`SearchUsingPrefix` attributes.

### 2. Dedicated Search Appliances
Purpose-built search servers offering advanced relevance, typo tolerance, faceting, and fast indexing.

**Key technologies:** Meilisearch (self-hosted/cloud), Algolia (cloud), Typesense (self-hosted/cloud).

### 3. Vector Similarity Search
Semantic search using embedding vectors and distance metrics (cosine, L2, inner product). Powers "conceptual" matching beyond keyword overlap.

**Key technologies:** pgvector (PostgreSQL extension), Qdrant, Pinecone, Milvus, Typesense vector search.

### 4. Hybrid Search
Fusion of keyword (BM25) and vector (semantic) results. Uses fusion algorithms like Reciprocal Rank Fusion (RRF), weighted summation, or cross-encoder re-ranking.

**Key technologies:** pgvector + PostgreSQL FTS, Qdrant hybrid queries, Typesense hybrid search, Meilisearch hybrid search.

### 5. Relevance & Ranking
Systems and strategies to determine result ordering: ranking rules, learning-to-rank (LTR), re-ranking with cross-encoders, personalization signals.

**Key technologies:** Algolia ranking rules, Meilisearch ranking rules (7 defaults), Typesense ranking, cross-encoder re-rankers (Cohere, FastEmbed).

### 6. Search Indexing & Synchronization
Strategies for keeping search indexes consistent with source databases — batch imports, incremental updates, soft-delete handling, conditional indexing.

**Key technologies:** Laravel Scout `Searchable` trait, `scout:import`/`scout:flush`, `shouldBeSearchable`, `withoutSyncingToSearch`, queue-based sync.

### 7. Search UX & Analytics
Faceted navigation, search-as-you-type (instant search), analytics dashboards, A/B testing, click tracking.

**Key technologies:** Algolia analytics, Meilisearch analytics, Algolia A/B testing, instant search UIs.

### 8. RAG Search Pipelines
Search → Retrieve → Augment → Generate. Combines vector retrieval with LLM generation for conversational AI grounded in indexed data.

**Key technologies:** Meilisearch RAG, Qdrant + LLM, pgvector + LangChain/LlamaIndex, Typesense + LLM.

---

## Complete Knowledge Inventory

| # | Knowledge Item | Subdomain | Source | Maturity | Laravel Relevance |
|---|---|---|---|---|---|
| K001 | Laravel Scout Searchable trait | Indexing | Laravel docs | Stable | Core — every Laravel search starts here |
| K002 | Scout database engine (MySQL/PostgreSQL FTS) | Full-Text | Laravel docs/Scout | Stable | Low-complexity search, no external deps |
| K003 | Scout collection engine | Full-Text | Laravel docs/Scout | Stable | Dev-only, uses Str::is matching |
| K004 | Scout queue integration | Indexing | Laravel docs/Scout | Stable | Async indexing via Laravel queues |
| K005 | toSearchableArray customization | Indexing | Laravel docs/Scout | Stable | Shapes what data is indexed |
| K006 | searchableAs / index naming | Indexing | Laravel docs/Scout | Stable | Multi-index strategies |
| K007 | shouldBeSearchable conditional indexing | Indexing | Laravel docs/Scout | Stable | Publish/draft gating |
| K008 | withoutSyncingToSearch | Indexing | Laravel docs/Scout | Stable | Bulk operation optimization |
| K009 | scout:import / scout:flush | Indexing | Laravel docs/Scout | Stable | Batch operations |
| K010 | makeAllSearchableUsing / makeSearchableUsing | Indexing | Laravel docs/Scout | Stable | Eager load for imports |
| K011 | Scout where / whereIn / whereNotIn | Querying | Laravel docs/Scout | Stable | Basic filtering |
| K012 | Scout paginate | Querying | Laravel docs/Scout | Stable | Paginated search results |
| K013 | Customizing engine searches (closure API) | Querying | Laravel docs/Scout | Stable | Advanced engine-specific options |
| K014 | Custom engine development | Extensibility | Laravel docs/Scout | Stable | Extend Scout to any backend |
| K015 | SearchUsingFullText attribute | DB Engine | Laravel docs/Scout | Stable | MySQL/PostgreSQL FTS optimization |
| K016 | SearchUsingPrefix attribute | DB Engine | Laravel docs/Scout | Stable | Prefix search optimization |
| K017 | Soft delete handling in Scout | Indexing | Laravel docs/Scout | Stable | __soft_deleted attribute |
| K018 | Algolia driver setup & configuration | Search Appliance | Algolia docs | Stable | Production-ready cloud search |
| K019 | Algolia index settings via Scout config | Relevance | Algolia docs/Scout | Stable | searchableAttributes, faceting |
| K020 | Algolia analytics (SCOUT_IDENTIFY) | Analytics | Algolia docs/Scout | Stable | User-identified search analytics |
| K021 | Algolia geo-search | Querying | Algolia docs/Scout | Stable | Spatial filtering |
| K022 | Algolia A/B testing | Relevance | Algolia docs | Stable | Compare ranking strategies |
| K023 | Meilisearch driver setup | Search Appliance | Meilisearch docs | Stable | Open-source search server |
| K024 | Meilisearch filterable/sortable attributes | Relevance | Meilisearch docs/Scout | Stable | Pre-declare filter/sort fields |
| K025 | Meilisearch typo tolerance | Relevance | Meilisearch docs | Stable | Configurable typo rules (minWordSizeForTypos) |
| K026 | Meilisearch synonym management | Relevance | Meilisearch docs | Stable | Manual/API-based synonym configuration |
| K027 | Meilisearch faceted search | Querying | Meilisearch docs | Stable | Distribution facets |
| K028 | Meilisearch hybrid search (keyword + semantic) | Hybrid | Meilisearch docs | Stable | Auto-embeddings + keyword fusion |
| K029 | Meilisearch RAG / conversational search | RAG | Meilisearch docs | New | LLM-grounded answers |
| K030 | Meilisearch ranking rules (7 defaults) | Relevance | Meilisearch docs | Stable | words, typo, proximity, attribute, sort, position, exactness |
| K031 | Meilisearch custom ranking rules | Relevance | Meilisearch docs | Stable | Asc/desc attribute ranking |
| K032 | Meilisearch search-as-you-type (instant) | UX | Meilisearch docs | Stable | Real-time prefix search |
| K033 | Typesense driver setup | Search Appliance | Typesense docs | Stable | Open-source, high-performance |
| K034 | Typesense collection schemas | Indexing | Typesense docs/Scout | Stable | Schema definition in scout.php |
| K035 | Typesense dynamic search parameters | Querying | Typesense docs/Scout | Stable | query_by, query_by_weights, etc. |
| K036 | Typesense vector search | Vector | Typesense docs | Stable | Embedding storage + ANN search |
| K037 | Typesense geo-search | Querying | Typesense docs | Stable | Lat/lng filtering and sorting |
| K038 | Typesense faceting | Querying | Typesense docs | Stable | Facet counts and filtering |
| K039 | Typesense synonym management | Relevance | Typesense docs | Stable | API-managed synonyms |
| K040 | Typesense typo tolerance | Relevance | Typesense docs | Stable | Configurable per-field |
| K041 | pgvector extension | Vector | pgvector docs | Stable | PostgreSQL vector extension |
| K042 | pgvector HNSW / IVFFlat indexing | Vector | pgvector docs | Stable | ANN index types |
| K043 | pgvector distance functions (L2, IP, cosine, L1, Hamming, Jaccard) | Vector | pgvector docs | Stable | Multiple distance metrics |
| K044 | pgvector half-precision / binary / sparse vectors | Vector | pgvector docs | Stable | Storage optimization |
| K045 | pgvector + PostgreSQL FTS hybrid search | Hybrid | pgvector docs | Stable | RRF or cross-encoder fusion |
| K046 | pgvector iterative index scans | Vector | pgvector docs | Stable | Filtered ANN with relaxed/strict ordering |
| K047 | pgvector binary quantization + re-ranking | Performance | pgvector docs | Stable | Scale optimization |
| K048 | Qdrant vector search | Vector | Qdrant docs | Stable | High-performance vector DB |
| K049 | Qdrant hybrid queries (dense + sparse) | Hybrid | Qdrant docs | Stable | Built-in hybrid search |
| K050 | Qdrant payload filtering | Querying | Qdrant docs | Stable | Structured metadata filtering |
| K051 | Qdrant quantization (scalar, product, binary) | Performance | Qdrant docs | Stable | Memory reduction |
| K052 | Qdrant multitenancy | Architecture | Qdrant docs | Stable | Partitioned collections |
| K053 | Qdrant FastEmbed integration | Vector | Qdrant docs | Stable | On-device embeddings |
| K054 | Qdrant re-ranking with cross-encoders | Relevance | Qdrant docs | Stable | Second-pass relevance |
| K055 | Qdrant Edge (embedded vector search) | Vector | Qdrant docs | New | On-device, offline |
| K056 | Pinecone managed vector database | Vector | Pinecone docs | Stable | Serverless vector search |
| K057 | Pinecone namespaces (multitenancy) | Architecture | Pinecone docs | Stable | Logical partitioning |
| K058 | Pinecone metadata filtering | Querying | Pinecone docs | Stable | Key-value filters |
| K059 | Milvus (open-source vector DB) | Vector | Milvus docs | Stable | Distributed vector search |
| K060 | Milvus hybrid search (BM25 + dense) | Hybrid | Milvus docs | Stable | Built-in hybrid support |
| K061 | RRF (Reciprocal Rank Fusion) | Hybrid | Academic | Stable | Common fusion algorithm |
| K062 | Cross-encoder re-ranking | Relevance | Academic/ML | Stable | High-accuracy second-pass |
| K063 | Search query caching | Performance | Laravel/Redis | Stable | Cache search results by query hash |
| K064 | Real-time indexing (observer-based) | Indexing | Laravel Scout | Stable | Model events → index sync |
| K065 | Search performance benchmarking | Performance | General | Mature | Latency, QPS, recall measurement |
| K066 | Faceted search implementation | UX | Algolia/Meilisearch | Stable | Attribute-based drill-down |
| K067 | Embedding generation strategies | RAG | OpenAI/Local | New | API vs on-device embedding models |
| K068 | Chunking strategies for RAG | RAG | General | New | Document splitting for retrieval |
| K069 | RAG pipeline architecture (retrieve → augment → generate) | RAG | LangChain/LlamaIndex | New | Full pipeline design |
| K070 | Laravel + pgvector via Eloquent | Vector | Community | Emerging | PHP pgvector client libraries |

---

## Knowledge Classification

### Core (Essential for all implementations)
| ID | Item |
|---|---|
| K001 | Laravel Scout Searchable trait |
| K002 | Scout database engine |
| K005 | toSearchableArray |
| K008 | withoutSyncingToSearch |
| K009 | scout:import / scout:flush |
| K011 | Scout where clauses |
| K012 | Scout paginate |
| K017 | Soft delete handling |

### Advanced (Production-grade search)
| ID | Item |
|---|---|
| K004 | Scout queue integration |
| K014 | Custom engine development |
| K015 | SearchUsingFullText / SearchUsingPrefix |
| K018 | Algolia/Meilisearch/Typesense driver setup |
| K024 | Meilisearch filterable/sortable attributes |
| K025 | Typo tolerance configuration |
| K030 | Ranking rules customization |
| K041 | pgvector extension |
| K042 | HNSW / IVFFlat indexing |
| K063 | Search caching |
| K064 | Real-time indexing |

### Specialized (Niche/emerging use cases)
| ID | Item |
|---|---|
| K028 | Meilisearch hybrid search |
| K029 | Meilisearch RAG |
| K045 | pgvector + PostgreSQL FTS hybrid |
| K049 | Qdrant hybrid queries |
| K053 | Qdrant FastEmbed |
| K054 | Cross-encoder re-ranking |
| K055 | Qdrant Edge |
| K061 | RRF (Reciprocal Rank Fusion) |
| K066 | Faceted search |
| K067 | Embedding generation |
| K068 | Chunking strategies |
| K069 | RAG pipeline architecture |
| K070 | Laravel + pgvector via Eloquent |

---

## Dependency Map

```
Laravel Application
  └── Laravel Scout (laravel/scout)
        ├── Queue System (Redis, Database, SQS)
        │     └── Scout jobs (scout:import, model sync)
        ├── Engine Layer
        │     ├── Database Engine
        │     │     ├── MySQL (FULLTEXT indexes required)
        │     │     └── PostgreSQL (tsvector/tsquery + GIN indexes)
        │     ├── Collection Engine (no external deps)
        │     ├── Algolia Engine
        │     │     └── algolia/algoliasearch-client-php
        │     ├── Meilisearch Engine
        │     │     └── meilisearch/meilisearch-php
        │     │           └── Meilisearch server (self-hosted/cloud)
        │     ├── Typesense Engine
        │     │     └── typesense/typesense-php
        │     │           └── Typesense server (self-hosted/cloud)
        │     └── Custom Engine
        │           └── Extends Laravel\Scout\Engines\Engine
        │
        ├── Indexing Strategies
        │     ├── Batch (scout:import)
        │     ├── Incremental (observer-based save)
        │     ├── Conditional (shouldBeSearchable)
        │     └── Selective (searchable() on query)
        │
        └── Search Configuration (config/scout.php)
              ├── Engine-specific credentials
              ├── index-settings per model
              └── Queue settings

Vector Search Layer (optional, supplements Scout)
  ├── pgvector (via Laravel Doctrine/raw SQL)
  │     └── HNSW/IVFFlat indexes on vector columns
  │     └── PostgreSQL FTS for hybrid
  ├── Qdrant
  │     └── Qdrant PHP client / REST API
  │     └── FastEmbed for on-device embeddings
  ├── Pinecone
  │     └── Pinecone REST/gRPC API
  └── Milvus
        └── Milvus SDK / REST API

RAG Pipeline Layer
  ├── Embedding Provider
  │     ├── OpenAI / Azure OpenAI
  │     ├── Local (FastEmbed, sentence-transformers)
  │     └── Cloud (Cohere, Voyage)
  ├── Vector Store (from Vector Search Layer)
  ├── Document Chunker
  │     ├── RecursiveCharacterTextSplitter
  │     ├── Semantic chunking
  │     └── Token-aware splitting
  ├── Re-ranker (optional)
  │     ├── Cross-encoder (Cohere, BAAI/bge-reranker)
  │     └── FastEmbed cross-encoder
  └── LLM (for answer generation)
        ├── OpenAI GPT-4o / GPT-4o-mini
        ├── Anthropic Claude
        └── Local LLMs (Ollama)

Search Analytics
  ├── Algolia built-in analytics
  ├── Meilisearch built-in analytics
  └── Custom (Laravel + database/Redis tracking)
```

---

## Missing Knowledge Risk Analysis

| Knowledge Gap | Risk Level | Impact | Mitigation |
|---|---|---|---|
| Pinecone & Milvus PHP client maturity | Medium | Cannot integrate these vector DBs directly in Laravel without HTTP clients | Use REST API wrappers; prioritize typesense-php or qdrant PHP SDK which have first-party support |
| Laravel-native pgvector Eloquent integration | Medium | No native Scout driver for pgvector; requires raw SQL | Build custom Scout engine; community package `pgvector/pgvector-php` available but immature |
| Learning-to-rank (LTR) implementation in Laravel | Low | Advanced relevance tuning unavailable | Algolia/Meilisearch built-in ranking usually sufficient; LTR rarely needed |
| Cross-encoder re-ranking performance benchmarks | Low | Hard to predict latency impact for re-rank step | Small result windows (top 20→5) keep overhead manageable |
| RAG pipeline specific to Laravel (no dedicated package) | Medium | Must stitch together PHP embedding clients + vector store + LLM | Use HTTP clients; consider Python microservice for heavy ML operations |
| Real-time search analytics tracking library | Low | No drop-in analytics package for Meilisearch/Typesense | Custom middleware or events; Algolia has built-in |
| Distributed search cluster operations | Low | Complex self-hosting topology | Cloud-managed options (Algolia, Meilisearch Cloud, Typesense Cloud, Qdrant Cloud) recommended for production |

---

## Research Findings

### Key Architectural Patterns

**1. Scout as Unified Abstraction Layer**
Laravel Scout provides a consistent `Model::search('query')->get()` API across all search backends. The `Searchable` trait uses model observers to automatically sync Eloquent lifecycle events (save/delete) to the search index. This abstraction allows switching search engines by changing a single `SCOUT_DRIVER` environment variable, though engine-specific features require custom code via the `options()` or callback API.

**2. The Database Engine Sweet Spot**
Scout's `database` engine (with `SearchUsingFullText` and `SearchUsingPrefix` attributes) is severely underutilized. For applications with <50K records and simple search needs, it eliminates the operational cost of a separate search server while leveraging existing MySQL FULLTEXT or PostgreSQL GIN indexes. The prefix search optimization (`example%`) avoids expensive `%example%` scans for fields like IDs and emails.

**3. Meilisearch vs Typesense Decision Matrix**
Both are open-source, self-hostable alternatives to Algolia. Meilisearch emphasizes instant search-as-you-type out of the box with minimal configuration. Typesense offers more granular control over collection schemas, dynamic search parameters, and stronger built-in vector search. For pure keyword search, Meilisearch is simpler. For hybrid (keyword + vector) with explicit schema control, Typesense is stronger.

**4. pgvector as the "Default Vector Store"**
pgvector's key advantage is co-location of vectors with application data in PostgreSQL — no separate infrastructure, ACID compliance, JOINs across vectors and relational data, and point-in-time recovery. The HNSW index (v0.5.0+) provides production-ready ANN search. For Laravel apps already on PostgreSQL, pgvector is the lowest-friction vector search addition.

**5. Hybrid Search Fusion Methods**
RRF (Reciprocal Rank Fusion) is the simplest fusion method — `score = 1 / (k + rank)`. It requires no training and works well for combining keyword and vector results. Cross-encoder re-ranking is more accurate but adds latency (50-200ms for top-20 results). Fusion can happen:
- At the database level (pgvector + PostgreSQL FTS with RRF in SQL)
- At the search engine level (Meilisearch hybrid, Typesense hybrid, Qdrant hybrid)
- At the application level (query both engines, fuse in PHP)

**6. RAG Pipeline Architecture**
The emerging pattern for Laravel RAG is:
1. Document ingestion → chunking → embedding → vector store
2. Query → embed query → ANN search → top-k results
3. Optional: re-rank top-k with cross-encoder
4. Augment prompt with retrieved context → LLM → generated answer
5. (Optional) Index generated answer back for future retrieval

Libraries like LangChain PHP (community) or direct HTTP calls to OpenAI/Anthropic APIs are used. No single Laravel package yet dominates this space.

**7. Search Relevance Tuning Hierarchy**
1. **Data quality** — clean, well-structured indexed data
2. **Field weighting** — title > description > body
3. **Typo tolerance** — min word size for 1/2 typos
4. **Ranking rules** — word → typo → proximity → attribute → sort → position → exactness
5. **Custom ranking** — business-specific signals (popularity, recency)
6. **Personalization** — user-specific boost signals
7. **A/B testing** — validate relevance changes

**8. Performance Critical Paths**
- Indexing: Queue all sync operations (`'queue' => true`)
- Import: Use `makeAllSearchableUsing` for eager loading
- Query: Keep `where` filters on indexed fields; avoid post-query filtering
- paginate: Each page is a separate search engine call; cache liberally
- Vector search: HNSW > IVFFlat for query performance; IVFFlat > HNSW for build speed
- Hybrid search: Limit candidate pool before re-ranking (e.g., top-100 keyword + top-100 vector → fuse → top-20)

---

## Future Expansion Opportunities

1. **Laravel Scout pgvector Driver** — A first-party Scout engine for pgvector would unify vector search under Scout's API. Currently requires raw SQL or custom engine.

2. **Laravel-native RAG Package** — A battle-tested package combining Scout + embedding provider + LLM integration would lower the barrier to AI-powered search in Laravel.

3. **Unified Search Analytics** — A Laravel package that captures search queries, clicks, and conversions across all Scout engines (not just Algolia).

4. **Cross-Engine Multi-Search** — Search multiple backends simultaneously (e.g., full-text + vector) and fuse results at the Scout level with built-in RRF.

5. **Personalized Search Plugin** — Real-time user preference signals (clicks, purchases, views) that influence ranking without custom engine callbacks.

6. **Search-as-a-Service Console** — A Laravel Nova-style UI for managing indexes, synonyms, stop words, and viewing search analytics across engines.

7. **Real-time Indexing with Laravel Reverb** — WebSocket-based index sync status using Laravel Reverb for real-time dashboard feedback.

8. **Embedding Caching Layer** — Cache generated embeddings to avoid redundant API calls to embedding providers.

---

## Sources Consulted

### Tier 1 — Official Documentation (Primary Sources)
- Laravel Scout Documentation (11.x): https://laravel.com/docs/11.x/scout
- Meilisearch Documentation: https://docs.meilisearch.com
- Algolia Documentation: https://www.algolia.com/doc
- Typesense Documentation: https://typesense.org/docs
- pgvector GitHub & Docs: https://github.com/pgvector/pgvector
- Qdrant Documentation: https://qdrant.tech/documentation
- Milvus Documentation: https://milvus.io/docs
- Pinecone Documentation: https://docs.pinecone.io

### Tier 2 — Package Repositories & Community Libraries
- laravel/scout (GitHub): https://github.com/laravel/scout
- meilisearch/meilisearch-php (GitHub): https://github.com/meilisearch/meilisearch-php
- algolia/algoliasearch-client-php (GitHub): https://github.com/algolia/algoliasearch-client-php
- typesense/typesense-php (GitHub): https://github.com/typesense/typesense-php
- pgvector-php (GitHub): https://github.com/pgvector/pgvector-php
- Qdrant PHP SDK: https://github.com/sschlein/qdrant-php (community)

### Tier 3 — Academic & Industry References
- Reciprocal Rank Fusion (RRF) — Cormack et al., SIGIR 2009
- HNSW Algorithm — Malkov & Yashunin, 2016 (arXiv:1603.09320)
- DiskANN — Subramanya et al., 2019 (VLDB)
- BM25 Ranking — Robertson & Zaragoza, 2009 (Foundations and Trends in IR)

### Tier 4 — Community Resources & Articles
- Laravel Scout GitHub Issues & Discussions
- Meilisearch GitHub Discussions
- Laravel News search-related articles
- Various Medium/Dev.to posts on Laravel search implementations
