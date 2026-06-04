# Folder Architecture: Search & Retrieval Systems

```
search-retrieval-systems/
│
├── 01-laravel-scout-foundation/
│   ├── README.md                           # Overview, installation, configuration
│   ├── installation/
│   │   ├── composer-setup.md               # composer require laravel/scout
│   │   ├── configuration-reference.md       # config/scout.php full reference
│   │   └── queue-setup.md                  # Queue configuration for async indexing
│   ├── searchable-trait/
│   │   ├── basic-usage.md                  # Adding Searchable to models
│   │   ├── to-searchable-array.md          # Customizing indexed data
│   │   ├── searchable-as.md                # Custom index naming
│   │   ├── get-scout-key.md                # Custom model ID for search
│   │   └── searchable-using.md             # Per-model engine selection
│   ├── indexing/
│   │   ├── batch-import.md                 # scout:import / scout:flush
│   │   ├── adding-records.md               # Auto-sync via save/create
│   │   ├── updating-records.md             # Auto-sync via save
│   │   ├── removing-records.md             # Auto-sync via delete
│   │   ├── soft-delete-handling.md         # __soft_deleted attribute
│   │   ├── pausing-indexing.md             # withoutSyncingToSearch
│   │   ├── conditional-indexing.md         # shouldBeSearchable
│   │   └── modifying-import-queries.md     # makeAllSearchableUsing
│   ├── searching/
│   │   ├── basic-searching.md              # Model::search('query')->get()
│   │   ├── where-clauses.md                # where / whereIn / whereNotIn
│   │   ├── pagination.md                   # paginate() and cursor support
│   │   ├── raw-results.md                  # raw() for engine-native responses
│   │   ├── custom-indexes.md               # within() method
│   │   └── customizing-engine-searches.md  # Closure-based engine customization
│   └── custom-engines/
│       ├── writing-engines.md              # Extending Laravel\Scout\Engines\Engine
│       ├── registering-engines.md          # EngineManager::extend()
│       └── engine-methods-reference.md     # update, delete, search, paginate, etc.
│
├── 02-database-fulltext-search/
│   ├── README.md
│   ├── mysql-fulltext/
│   │   ├── setup.md                        # FULLTEXT index creation
│   │   ├── boolean-mode.md                 # +word, -word, wildcard syntax
│   │   ├── natural-language-mode.md         # Relevance-based sorting
│   │   ├── query-expansion.md              # WITH QUERY EXPANSION
│   │   └── performance-tuning.md           # ft_min_word_len, innodb_ft
│   ├── postgresql-fulltext/
│   │   ├── setup.md                        # tsvector column, GIN index
│   │   ├── tsquery-operators.md            # &, |, !, <-> operators
│   │   ├── ranking.md                      # ts_rank, ts_rank_cd
│   │   ├── highlighting.md                 # ts_headline
│   │   ├── dictionaries.md                 # Custom stop words, synonyms, thesaurus
│   │   └── performance-tuning.md           # GIN vs GiST index choice
│   └── scout-database-engine/
│       ├── setup.md                        # SCOUT_DRIVER=database
│       ├── search-using-fulltext.md        # #[SearchUsingFullText] attribute
│       ├── search-using-prefix.md          # #[SearchUsingPrefix] attribute
│       └── when-to-use.md                  # Decision guide vs dedicated engines
│
├── 03-meilisearch/
│   ├── README.md                           # Overview, self-host vs cloud
│   ├── setup/
│   │   ├── installation.md                 # Docker, Sail, binary, cloud
│   │   ├── scout-integration.md            # Driver config + SDK
│   │   └── first-index.md                  # Creating and populating index
│   ├── indexing/
│   │   ├── documents.md                    # Adding/updating/deleting documents
│   │   ├── primary-key.md                  # Auto vs explicit key selection
│   │   └── index-settings.md              # Filterable, sortable, searchable attrs
│   ├── search-features/
│   │   ├── fulltext-search.md              # Search-as-you-type, prefix search
│   │   ├── typo-tolerance.md               # minWordSizeForTypos, disableOnAttributes
│   │   ├── synonyms.md                     # Manual and multi-synonym config
│   │   ├── faceted-search.md               # Filter facets, distribution facets
│   │   ├── filtering.md                    # Numeric, string, geo filters
│   │   ├── sorting.md                      # Sortable attributes configuration
│   │   ├── geo-search.md                   # _geo field, radius filtering
│   │   └── hybrid-search.md                # Keyword + semantic fusion
│   ├── relevance/
│   │   ├── ranking-rules.md                # 7 default rules explained
│   │   ├── custom-ranking.md               # asc/desc attribute ranking
│   │   ├── proximity-weighting.md          # Term proximity ranking
│   │   ├── attribute-weighting.md          # Field importance ranking
│   │   └── exactness.md                    # Exact match boosting
│   ├── advanced/
│   │   ├── rag-conversational.md           # Built-in RAG pipeline
│   │   ├── vector-search.md                # Auto-embeddings configuration
│   │   ├── multi-index-search.md           # Searching across indexes
│   │   ├── pagination.md                   # Hits per page, offset
│   │   └── analytics.md                    # Search analytics dashboard
│   └── operations/
│       ├── configuration.md                # server config, env vars
│       ├── backup-and-restore.md           # Dumps and snapshots
│       ├── monitoring.md                   # Metrics, health checks
│       └── scaling.md                      # Sharding, replication, cloud
│
├── 04-algolia/
│   ├── README.md                           # Overview, pricing, architecture
│   ├── setup/
│   │   ├── account-setup.md                # API keys, application creation
│   │   ├── scout-integration.md            # Driver config + PHP SDK
│   │   └── index-settings.md              # Config via scout.php or dashboard
│   ├── indexing/
│   │   ├── pushing-data.md                 # Records, objectID, attributes
│   │   ├── partial-updates.md              # Partial attribute updates
│   │   ├── delete-operations.md            # Delete by objectID or query
│   │   └── multi-index-strategies.md       # Replicated, virtual, primary+secondary
│   ├── search-features/
│   │   ├── fulltext-search.md              # Searchable attributes, ranking
│   │   ├── typo-tolerance.md               # minWordSizefor1Typo, 2Typo
│   │   ├── synonyms.md                     # Regular, one-way, alternative
│   │   ├── faceted-search.md               # Filter-only, regular facets
│   │   ├── filtering.md                    # Numeric, tag, facet filters
│   │   ├── geo-search.md                   # aroundLatLng, aroundRadius
│   │   └── query-rules.md                  # Promote, hide, redirect rules
│   ├── relevance/
│   │   ├── ranking-strategies.md           # searchableAttributes, ranking formula
│   │   ├── custom-ranking.md               # Numeric/attribute ranking
│   │   ├── personalization.md              # User-specific relevance
│   │   └── ab-testing.md                   # A/B test setup and analysis
│   ├── analytics/
│   │   ├── search-analytics.md             # Top searches, click-through, conversion
│   │   ├── click-analytics.md              # Click position, CTR
│   │   ├── user-identification.md          # SCOUT_IDENTIFY integration
│   │   └── events-tracking.md              # Click, conversion, view events
│   └── advanced/
│       ├── insights-api.md                 # AI-powered recommendations
│       ├── vector-search.md                # AI Search with embeddings
│       ├── neural-search.md                # Neural matching for semantic results
│       ├── query-categorization.md         # Automatic query classification
│       └── algolia-agent-studio.md         # AI agent builder
│
├── 05-typesense/
│   ├── README.md                           # Overview, self-host vs cloud
│   ├── setup/
│   │   ├── installation.md                 # Docker, binary, cloud
│   │   ├── scout-integration.md            # Driver config + PHP SDK
│   │   └── collection-schemas.md           # Schema definition in scout.php
│   ├── indexing/
│   │   ├── documents.md                    # Create, update, upsert, delete
│   │   ├── collection-management.md        # Drop, alter, import/export
│   │   └── schema-migration.md             # Re-indexing on schema change
│   ├── search-features/
│   │   ├── fulltext-search.md              # query_by, query_by_weights
│   │   ├── typo-tolerance.md               # num_typos, typo_tokens_threshold
│   │   ├── synonyms.md                     # API-based synonym management
│   │   ├── faceted-search.md               # Facet counts, facet filtering
│   │   ├── filtering.md                    # Numeric, string, geo filters
│   │   ├── grouping.md                     # Group by field (deduplication)
│   │   ├── geo-search.md                   # Lat/lng, radius, polygon
│   │   ├── vector-search.md                # ANN with embedding vectors
│   │   └── hybrid-search.md                # Keyword + vector fusion
│   ├── relevance/
│   │   ├── ranking.md                      # text_match_weight, vector_weight
│   │   ├── custom-ranking.md               # Infix, exact, max_candidates
│   │   └── dynamic-parameters.md           # Scout options() method
│   └── advanced/
│       ├── stemming.md                     # Built-in stemmer configuration
│       ├── stop-words.md                   # Stop words management
│       ├── phrase-search.md                # Exact phrase matching
│       └── override-scoring.md             # Rule-based score overrides
│
├── 06-vector-search-systems/
│   ├── README.md                           # Overview: what vectors are, use cases
│   ├── core-concepts/
│   │   ├── embeddings.md                   # What embeddings are, dimension meaning
│   │   ├── distance-metrics.md             # Cosine, Euclidean, dot product, Hamming
│   │   ├── ann-vs-exact.md                 # Approximate vs exact nearest neighbor
│   │   ├── hnsw-index.md                   # Hierarchical Navigable Small World
│   │   ├── ivfflat-index.md                # Inverted File with Flat Compression
│   │   └── quantization.md                 # Binary, scalar, product quantization
│   ├── pgvector/
│   │   ├── installation.md                 # Extension setup, docker, config
│   │   ├── getting-started.md              # CREATE EXTENSION, vector type
│   │   ├── storing-vectors.md              # Insert, update, bulk COPY operations
│   │   ├── querying.md                     # <->, <=>, <#> operators, ORDER BY + LIMIT
│   │   ├── indexing.md
│   │   │   ├── hnsw.md                     # m, ef_construction, ef_search params
│   │   │   └── ivfflat.md                  # lists, probes parameters
│   │   ├── advanced-features.md
│   │   │   ├── half-precision.md           # halfvec type for storage efficiency
│   │   │   ├── binary-vectors.md           # bit type, Hamming/Jaccard distance
│   │   │   ├── sparse-vectors.md           # sparsevec type for bag-of-words
│   │   │   ├── binary-quantization.md      # Index + re-rank strategy
│   │   │   ├── iterative-scans.md          # strict vs relaxed ordering with filtering
│   │   │   └── expression-indexing.md      # Subvector and cast-based indexes
│   │   ├── hybrid-search.md                # pgvector + PostgreSQL FTS + RRF
│   │   ├── performance.md                  # Tuning: work_mem, maintenance_work_mem
│   │   ├── php-integration.md              # pgvector-php, raw SQL from Laravel
│   │   └── operations.md                   # Vacuuming, monitoring, replication
│   ├── qdrant/
│   │   ├── installation.md                 # Docker, cloud, Qdrant Edge
│   │   ├── getting-started.md              # Collections, points, vectors
│   │   ├── data-management.md
│   │   │   ├── collections.md              # Create, configure, delete
│   │   │   ├── points.md                   # Upsert, update, delete operations
│   │   │   ├── vectors.md                  # Dense, sparse, multi-vectors
│   │   │   ├── payload.md                  # Metadata/sidecar data
│   │   │   └── storage.md                  # On-disk vs in-memory config
│   │   ├── search.md
│   │   │   ├── basic-search.md             # ANN with vector input
│   │   │   ├── filtering.md                # Payload filtering (must, should, must_not)
│   │   │   ├── hybrid-queries.md           # Dense + sparse fusion
│   │   │   ├── search-relevance.md         # Scoring options, oversampling
│   │   │   └── low-latency.md              # Optimizing for <10ms
│   │   ├── indexing.md                     # HNSW config, quantization, on-disk
│   │   ├── fastembed-integration.md        # On-device embeddings from PHP
│   │   ├── re-ranking.md                   # Cross-encoder second-pass
│   │   ├── multitenancy.md                 # Partitioned collections
│   │   ├── qdrant-edge.md                  # Embedded, offline vector search
│   │   ├── php-integration.md              # REST API, community SDK
│   │   └── operations.md                   # Snapshots, scaling, security
│   ├── pinecone/
│   │   ├── getting-started.md              # Serverless indexes
│   │   ├── managing-indexes.md             # Pod vs serverless, dimensions, metric
│   │   ├── upserting-data.md               # Namespaces, metadata, vectors
│   │   ├── querying.md                     # topK, filter, includeMetadata
│   │   ├── metadata-filtering.md           # $eq, $in, $gte, $lte, $exists
│   │   ├── namespaces.md                   # Multi-tenancy support
│   │   └── php-integration.md              # REST/gRPC client for Laravel
│   └── milvus/
│       ├── getting-started.md              # Standalone vs cluster deployment
│       ├── collections.md                  # Schema, auto-id, primary keys
│       ├── indexing.md                     # IVF, HNSW, DiskANN, GPU indexes
│       ├── hybrid-search.md                # BM25 + dense vector search
│       ├── multi-vector-search.md          # ColBERT-style multi-vector
│       └── php-integration.md              # REST SDK integration
│
├── 07-hybrid-search/
│   ├── README.md                           # Why hybrid? keyword + semantic fusion
│   ├── architectures/
│   │   ├── engine-level-hybrid.md          # Meilisearch, Typesense, Qdrant native
│   │   ├── database-level-hybrid.md        # pgvector + PostgreSQL FTS
│   │   ├── application-level-hybrid.md     # Query two engines, fuse in PHP
│   │   └── microservice-hybrid.md          # Dedicated hybrid search service
│   ├── fusion-methods/
│   │   ├── reciprocal-rank-fusion.md       # RRF algorithm and parameters
│   │   ├── weighted-sum.md                 # Alpha weighting between scores
│   │   ├── cross-encoder-fusion.md         # Re-rank fused results with CE
│   │   └── distribution-based-score-fusion.md  # Score normalization and fusion
│   ├── implementation-patterns/
│   │   ├── scout-plus-pgvector.md          # Scout for keyword + raw pgvector for vectors
│   │   ├── meilisearch-hybrid-setup.md     # Enabling hybrid in Meilisearch
│   │   ├── typesense-hybrid-setup.md       # Text + vector query configuration
│   │   └── qdrant-hybrid-setup.md          # Dense + sparse named vectors
│   └── performance-considerations.md       # Candidate pool sizing, latency budgets
│
├── 08-relevance-and-ranking/
│   ├── README.md                           # Relevance fundamentals and metrics
│   ├── metrics/
│   │   ├── precision-recall.md             # Basic IR metrics
│   │   ├── ndcg.md                         # Normalized Discounted Cumulative Gain
│   │   ├── mrr.md                          # Mean Reciprocal Rank
│   │   ├── map.md                          # Mean Average Precision
│   │   └── serp-quality.md                 # Search result page quality assessment
│   ├── ranking-strategies/
│   │   ├── field-weighting.md              # Boosting title over body
│   │   ├── recency-boosting.md             # Freshness signals in ranking
│   │   ├── popularity-boosting.md          # Views, purchases, ratings
│   │   ├── personalization.md              # User-specific ranking signals
│   │   └── geo-relevance.md                # Distance-based result ordering
│   ├── re-ranking/
│   │   ├── cross-encoder-overview.md       # How cross-encoders improve relevance
│   │   ├── cohere-rerank.md                # Cohere rerank API integration
│   │   ├── fastembed-rerankers.md          # On-device cross-encoder re-ranking
│   │   ├── bge-reranker.md                 # BAAI/bge-reranker-v2 models
│   │   └── two-stage-pipeline.md           # Coarse retrieval + fine re-ranking
│   ├── learning-to-rank/
│   │   ├── overview.md                     # When LTR is needed
│   │   ├── feature-engineering.md          # Click-through, dwell time, conversion
│   │   ├── model-training.md               # Pointwise, pairwise, listwise approaches
│   │   └── integration.md                  # Deploying LTR to search engine
│   └── ab-testing/
│       ├── algolia-ab-testing.md           # Built-in Algolia A/B test framework
│       ├── custom-ab-testing.md            # Implementing A/B tests in Laravel
│       └── metrics-and-analysis.md         # Statistical significance, reporting
│
├── 09-search-ux-and-analytics/
│   ├── README.md
│   ├── search-ux/
│   │   ├── search-as-you-type.md           # Instant search implementation
│   │   ├── autocomplete.md                 # Query suggestions, trending searches
│   │   ├── faceted-navigation.md           # Category/attribute drill-down UI
│   │   ├── search-results-page.md          # Result card design, snippets
│   │   ├── empty-query-state.md            # Zero results handling, recommendations
│   │   └── search-input-design.md          # Debouncing, placeholder, clear
│   ├── query-understanding/
│   │   ├── query-categorization.md         # Classifying user intent
│   │   ├── spelling-correction.md          # "Did you mean" suggestions
│   │   ├── query-suggestions.md            # Popular/completed queries
│   │   └── stop-words.md                   # Stop words management per engine
│   ├── analytics/
│   │   ├── algolia-analytics.md            # Algolia dashboard integration
│   │   ├── meilisearch-analytics.md        # Meilisearch analytics API
│   │   ├── custom-search-analytics.md      # Database/Redis-based tracking in Laravel
│   │   ├── click-tracking.md               # Recording search clicks and positions
│   │   ├── conversion-tracking.md          # Mapping searches to outcomes
│   │   └── search-abandonment.md           # Zero-result queries analysis
│   └── reporting/
│       ├── top-searches.md                 # Most frequent queries
│       ├── no-result-queries.md            # Queries returning zero results
│       ├── search-funnel.md                # Search → Click → Conversion funnel
│       └── performance-dashboard.md        # Latency, QPS, error rate metrics
│
├── 10-synonym-and-typology-management/
│   ├── README.md
│   ├── synonyms/
│   │   ├── meilisearch-synonyms.md         # API and multi-way synonym config
│   │   ├── algolia-synonyms.md             # Regular, one-way, alternative types
│   │   ├── typesense-synonyms.md           # Synonym collection API
│   │   └── synonym-best-practices.md       # When to use synonyms vs stemmers
│   ├── typo-tolerance/
│   │   ├── meilisearch-typo.md             # minWordSizeForTypos, disableOnAttributes
│   │   ├── algolia-typo.md                 # minWordSizefor1Typo, 2Typo, disableTypoToleranceOn
│   │   ├── typesense-typo.md               # num_typos, typo_tokens_threshold
│   │   └── typo-tolerance-strategies.md    # Balancing recall vs precision
│   ├── stemming-and-tokenization/
│   │   ├── engine-stemmers.md              # Built-in language stemmers comparison
│   │   ├── custom-tokenizers.md            # Configuring tokenization per language
│   │   └── stop-words.md                   # Language-specific stop word lists
│   └── manage-glossary.md                  # Running glossary of terms, field weights, exceptions
│
├── 11-search-caching/
│   ├── README.md
│   ├── strategies/
│   │   ├── query-result-caching.md         # Cache raw search results by query hash
│   │   ├── fragment-caching.md             # Cache partial search components
│   │   ├── tag-based-invalidation.md        # Invalidate by model/index tag
│   │   └── stale-while-revalidate.md       # Background refresh patterns
│   ├── implementation/
│   │   ├── laravel-cache-integration.md    # Using Cache facade with Scout
│   │   ├── redis-search-cache.md           # Redis-specific configurations
│   │   ├── http-caching.md                 # ETags, Last-Modified for search API
│   │   └── opcode-caching.md               # PHP opcode caching for search logic
│   └── invalidation-strategies.md          # Event-based, TTL, webhook cache clearing
│
├── 12-real-time-indexing/
│   ├── README.md
│   ├── mechanisms/
│   │   ├── model-observer-sync.md          # How Scout observers trigger indexing
│   │   ├── queue-based-indexing.md         # Async indexing job configuration
│   │   ├── bulk-queued-imports.md          # Chunked import jobs
│   │   └── conditional-sync.md             # shouldBeSearchable gate
│   ├── event-driven-indexing.md            # Laravel events → queue → index
│   ├── webhook-based-sync.md               # External data source → search index
│   └── monitoring-index-health.md          # Checking index lag, failed jobs
│
├── 13-search-performance/
│   ├── README.md
│   ├── benchmarking/
│   │   ├── latency-measurement.md          # End-to-end search latency profiling
│   │   ├── throughput-testing.md           # Queries per second measurement
│   │   ├── recall-benchmarking.md          # Comparing ANN vs exact recall
│   │   └── load-testing.md                 # K6/artillery for search endpoints
│   ├── optimization/
│   │   ├── query-optimization.md           # Reduce filter complexity, limit fields
│   │   ├── index-optimization.md           # HNSW params, IVFFlat, quantization
│   │   ├── hardware-sizing.md              # Memory, CPU, disk recommendations
│   │   ├── connection-pooling.md           # Persistent search engine connections
│   │   └── response-slimming.md            # Returning only needed fields
│   └── monitoring/
│       ├── search-metrics.md               # Latency percentiles (p50, p95, p99)
│       ├── error-tracking.md               # Indexing failures, search timeouts
│       └── alerting.md                     # Threshold-based alert configuration
│
├── 14-rag-search-pipelines/
│   ├── README.md                           # RAG fundamentals and search's role
│   ├── architecture/
│   │   ├── pipeline-overview.md            # Ingest → Chunk → Embed → Store → Retrieve → Generate
│   │   ├── component-diagrams.md           # System architecture diagrams
│   │   └── technology-choices.md           # Embedding providers, vector stores, LLMs
│   ├── document-processing/
│   │   ├── ingestion-strategies.md         # PDF, HTML, database, API sources
│   │   ├── chunking-strategies.md          # Recursive, semantic, token-aware
│   │   ├── chunking-parameters.md          # Chunk size, overlap, separators
│   │   └── metadata-extraction.md          # Source, date, author, section tracking
│   ├── embedding/
│   │   ├── embedding-models.md             # OpenAI text-embedding-3, voyage, Cohere
│   │   ├── on-device-embeddings.md         # FastEmbed, sentence-transformers (local)
│   │   ├── embedding-caching.md            # Cache embeddings to avoid API costs
│   │   └── batch-embedding.md              # Processing documents in batches
│   ├── retrieval/
│   │   ├── vector-retrieval.md             # ANN search in vector store
│   │   ├── hybrid-retrieval.md             # Keyword + vector fusion for RAG
│   │   ├── re-ranking-for-rag.md           # Cross-encoder to improve context quality
│   │   └── context-window-management.md    # Token budget for LLM context
│   ├── generation/
│   │   ├── prompt-engineering.md           # Crafting effective retrieval prompts
│   │   ├── llm-integration.md              # OpenAI, Anthropic, local LLM calls
│   │   ├── citation-generation.md          # Linking answers back to source documents
│   │   └── streaming-responses.md          # Server-Sent Events for real-time answers
│   └── laravel-rag-examples.md             # End-to-end RAG example in Laravel
│
├── 15-search-operations/
│   ├── README.md
│   ├── deployment/
│   │   ├── scout-deployment-checklist.md   # Sync index settings in deploy pipeline
│   │   ├── search-engine-clustering.md     # Production topology for self-hosted
│   │   ├── blue-green-indexing.md          # Zero-downtime index re-creation
│   │   └── environment-separation.md       # Dev/staging/prod index strategy
│   ├── maintenance/
│   │   ├── index-optimization.md           # Re-indexing, compaction, optimization
│   │   ├── data-consistency-checks.md      # Verifying DB ↔ search index parity
│   │   ├── log-rotation.md                 # Search engine log management
│   │   └── upgrade-procedures.md           # Engine version upgrades
│   ├── disaster-recovery/
│   │   ├── backup-strategies.md            # Index snapshots and exports
│   │   ├── restore-procedures.md           # Rebuilding from database or snapshot
│   │   └── fallback-strategies.md          # Graceful degradation when search is down
│   └── security/
│       ├── api-key-management.md           # Master vs search-only keys
│       ├── tenant-isolation.md             # Multi-tenant search security
│       └── rate-limiting.md                # Search endpoint protection
│
├── 16-search-system-decision-guides/
│   ├── README.md
│   ├── engine-comparison-matrix.md         # Feature comparison: all engines
│   ├── when-to-use-what.md                 # Decision tree by use case
│   ├── small-project-search.md             # Recommendations for <10K records
│   ├── medium-project-search.md            # Recommendations for 10K-1M records
│   ├── large-project-search.md             # Recommendations for 1M+ records
│   ├── ecommerce-search-guide.md           # Specific patterns for e-commerce
│   ├── content-site-search-guide.md        # Blog, documentation, CMS patterns
│   ├── saas-multi-tenant-search.md         # Tenant isolation patterns
│   ├── cost-analysis.md                    # Pricing comparison (self-hosted vs cloud)
│   └── migration-guides/
│       ├── database-to-scout-engine.md     # Migrating from DB engine to dedicated
│       ├── algolia-to-meilisearch.md       # Switching between engines
│       └── adding-vector-search.md         # Adding vector search to existing FTS
│
└── assets/
    ├── diagrams/
    │   ├── scout-architecture.png          # Scout system architecture diagram
    │   ├── hybrid-search-flow.png          # Hybrid search pipeline diagram
    │   ├── rag-pipeline.png                # RAG search pipeline diagram
    │   └── engine-comparison-chart.png     # Visual engine comparison
    ├── templates/
    │   ├── scout-config-template.php       # config/scout.php template
    │   ├── searchable-model-template.php   # Model with Searchable trait template
    │   ├── custom-engine-template.php      # Custom Scout engine boilerplate
    │   └── search-controller-template.php  # Search endpoint controller template
    └── references/
        ├── glossary.md                     # Domain terminology dictionary
        └── acronyms.md                     # Common acronyms (ANN, HNSW, IVFFlat, RRF, etc.)
```

## Key Architecture Decisions

### Folder Structure Principles
1. **Foundation-first** — Folder 01 covers Scout, the core Laravel abstraction. All subsequent folders build on it.
2. **Engine-specific folders** (03-05) — Each search appliance gets its own folder with parallel substructure (setup, indexing, search features, relevance, advanced).
3. **Cross-cutting concerns** (02, 06-15) — Topics that span multiple engines (vector search, hybrid, performance, RAG) have their own folders.
4. **Decision guides** (16) — Synthesis folder with comparison matrices and migration paths.
5. **Assets** — Shared diagrams, templates, and reference material.

### File Naming Conventions
- Use lowercase-kebab-case for all files and folders
- Prefix numeric for ordered learning paths (01-, 02-, etc.)
- Use descriptive names ending with `.md`
- Template files include language suffix (`.php`, `.json`, etc.)

### Content Organization Per File
- Each file starts with a brief section overview (2-3 sentences)
- Code examples use PHP with Laravel syntax
- Configuration examples show both `.env` and config file approaches
- Performance notes and caveats are called out in blockquotes
- External references link to source documentation
