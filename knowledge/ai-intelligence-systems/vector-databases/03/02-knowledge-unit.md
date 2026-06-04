# Knowledge Unit: Query Patterns & Filtering

## Metadata

- **ID:** ku-03
- **Subdomain:** Vector Databases
- **Slug:** query-patterns---filtering
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Query patterns and filtering define how applications search vector databases â€” combining vector similarity with metadata filters, hybrid search (vector + keyword), multi-vector queries, and pagination. Effective query design ensures that search results are both semantically relevant and contextually appropriate (filtered by source, date, access level, etc.). In the Laravel AI ecosystem, query patterns are implemented through the vector store abstraction's search method, with provider-specific syntax for metadata filtering.

## Core Concepts

- **Vector Query:** A search request containing a query vector, top-K count, distance threshold, and metadata filters.
- **Metadata Filtering:** Applying structured conditions (field = value, field IN list, field > threshold) alongside vector search.
- **Pre-Filtering vs. Post-Filtering:** Applying metadata filters before vector search (pre-filter) vs. after retrieving results (post-filter). Pre-filtering preserves recall for large filtered subsets.
- **Hybrid Search:** Combining vector similarity with keyword (BM25) search. Uses weighted fusion to combine result sets. Essential for domains with proper nouns and exact matches.
- **Multi-Vector Query:** Searching with multiple query vectors and combining results (for multi-modal queries or query decomposition).
- **Filter Expression Syntax:** Provider-specific syntax for metadata filters (Qdrant: `should`/`must`, Pinecone: `$eq`/`$in`, pgvector: SQL WHERE).
- **Pagination:** Iterating through search results in pages (offset/limit or cursor-based). Limited support in ANN search â€” pagination is approximate.
- **Re-ranking:** Applying a more expensive relevance model to refine the results from a fast initial ANN search.

## Mental Models

- **Vector Query:** A search request containing a query vector, top-K count, distance threshold, and metadata filters.
- **Metadata Filtering:** Applying structured conditions (field = value, field IN list, field > threshold) alongside vector search.
- **Pre-Filtering vs. Post-Filtering:** Applying metadata filters before vector search (pre-filter) vs. after retrieving results (post-filter). Pre-filtering preserves recall for large filtered subsets.


## Internal Mechanics

The internal mechanics of Query Patterns & Filtering follow established patterns within the Vector Databases domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Prefer pre-filtering over post-filtering.** Post-filtering may return fewer than top-K results if many results are filtered out after retrieval.
- **Use metadata fields that have high selectivity.** Fields that filter out 90%+ of data are most effective for pre-filtering.
- **Create database-level indexes on metadata filter fields.** Unindexed metadata filtering is slow.
- **For hybrid search, tune the fusion weight.** Start with 50/50 vector-keyword weight, adjust based on evaluation.
- **Set a minimum score threshold.** Exclude results below a relevance threshold to reduce noise.
- **Cache frequent queries.** Semantic caching stores query vectors and results for identical or similar queries.
- **Log query performance.** Track latency, results count, and filter selectivity.

## Patterns

- **Prefer pre-filtering over post-filtering.** Post-filtering may return fewer than top-K results if many results are filtered out after retrieval.
- **Use metadata fields that have high selectivity.** Fields that filter out 90%+ of data are most effective for pre-filtering.
- **Create database-level indexes on metadata filter fields.** Unindexed metadata filtering is slow.
- **For hybrid search, tune the fusion weight.** Start with 50/50 vector-keyword weight, adjust based on evaluation.
- **Set a minimum score threshold.** Exclude results below a relevance threshold to reduce noise.
- **Cache frequent queries.** Semantic caching stores query vectors and results for identical or similar queries.
- **Log query performance.** Track latency, results count, and filter selectivity.

## Architectural Decisions

- Implement query building as a **fluent interface** or query builder pattern: `$store->query($vector)->where('source', 'docs')->topK(10)->search()`.
- Standardize filter operators across providers: `eq`, `neq`, `in`, `gt`, `gte`, `lt`, `lte`, `range`.
- For hybrid search, use a **fusion service** that runs vector and keyword searches independently and merges results with configurable weights.
- For re-ranking, use a **cross-encoder model** (Cohere Rerank, BGE Reranker) or a small LLM to score relevance.
- Implement **query result normalization** â€” ensure scores are in a consistent range (0-1) regardless of the underlying provider.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Pre-filtering with a low-selectivity filter (only 10% of vectors match) reduces the search space by 10x â€” significant speedup.
- Post-filtering retrieves top-K results and then filters â€” if the filter matches only 1% of results, effective K is 100x too low.
- Hybrid search adds latency (vector search + keyword search + fusion). Total: 20-100ms.
- Re-ranking with cross-encoder: 50-200ms per query (re-ranking top-20 results). Use only for precision-critical applications.
- Filter evaluation: simple equality filters are fast (<1ms); complex nested conditions slow down search.
- Caching frequent queries: 20-40% hit rate for user-facing search. Cache TTL depends on content update frequency.

## Production Considerations



## Common Mistakes

- Using post-filtering with selective filters â€” retrieving 10 results and filtering to 1 because the filter matches few items.
- Not creating database indexes on filter fields â€” metadata filtering is slow without proper indexing.
- Using non-standardized filter syntax â€” porting query logic between providers requires complete rewrites.
- Ignoring score normalization â€” mixing results from different providers with different score ranges.
- Not setting a minimum score threshold â€” retrieving low-relevance results that add noise.
- Using OR conditions extensively in filters â€” complex filters are slower and harder to optimize.

## Failure Modes

- **Application-Layer Filtering:** Retrieving all vectors and filtering in PHP. Only acceptable for datasets under 1000 vectors.
- **Filter Overload:** Applying 20 filter conditions when 3-5 would suffice. Each filter adds latency.
- **No Filter Indexing:** Filtering by unindexed fields. The vector DB must scan all metadata.
- **Hybrid Search Without Evaluation:** Enabling hybrid search without measuring whether it improves retrieval quality.
- **Score Obsession:** Relying on absolute score values for decisions. Scores are relative within a query, not absolute across queries.

## Ecosystem Usage

### Query Builder
```php
class VectorQueryBuilder {
    public function __construct(private VectorStore $store) {}

    public function search(array $queryVector): self {
        $this->query = new VectorQuery(vector: $queryVector);
        return $this;
    }

    public function where(string $field, string $operator, mixed $value): self {
        $this->query->filters[] = new FilterCondition($field, $operator, $value);
        return $this;
    }

    public function topK(int $k): self {
        $this->query->topK = $k;
        return $this;
    }

    public function minScore(float $score): self {
        $this->query->minScore = $score;
        return $this;
    }

    public function get(): SearchResult {
        return $this->store->search($this->query);
    }
}

// Usage:
$results = $queryBuilder
    ->search($queryVector)
    ->where('source', 'eq', 'documentation')
    ->where('date', 'gte', '2025-01-01')
    ->where('access_level', 'in', ['public', 'internal'])
    ->topK(5)
    ->minScore(0.7)
    ->get();
```

### Hybrid Search
```php
class HybridSearch {
    public function __construct(
        private VectorStore $vectorStore,
        private KeywordSearch $keywordSearch,
        private float $vectorWeight = 0.5,
    ) {}

    public function search(string $text, array $queryVector, array $filters = [], int $topK = 10): array {
        // Run both searches in parallel
        [$vectorResults, $keywordResults] = parallel([
            fn() => $this->vectorStore->search(new VectorQuery($queryVector, $topK * 2, $filters)),
            fn() => $this->keywordSearch->search($text, $topK * 2, $filters),
        ]);

        // Fuse results with RRF (Reciprocal Rank Fusion)
        return $this->reciprocalRankFusion(
            $vectorResults->matches,
            $keywordResults,
            $topK,
            $this->vectorWeight,
        );
    }
}
```

## Related Knowledge Units

- ku-01 (Vector Database Fundamentals): Foundation for queries.
- ku-02 (Indexing Strategies): Index configuration affects query performance.
- ku-04 (Data Synchronization): Keeping filter metadata up-to-date.
- retrieval-augmented-generation/ku-01: RAG query patterns.
- retrieval-augmented-generation/ku-05: Evaluating query quality.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

