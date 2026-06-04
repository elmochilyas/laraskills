| Metadata | |
|---|---|
| Knowledge Unit ID | ku-05 |
| Subdomain | hybrid-search |
| Topic | Laravel Hybrid Implementation |
| Source | Community / Laravel |
| Maturity | Emerging |

## Overview

Implementing hybrid search in Laravel requires combining Scout (for keyword/full-text search) with a vector search capability (pgvector, Qdrant, Meilisearch vector). Fusion happens at the application level (PHP) or engine level (native hybrid). No first-party Scout driver for hybrid search exists yet; implementations are custom.

## Core Concepts

- **Scout + pgvector**: Scout for keyword queries, raw SQL/pgvector-php for vector queries
- **Scout + Qdrant**: Scout for keyword queries, Qdrant PHP SDK for vector queries
- **Single Engine Hybrid**: Meilisearch hybrid, Typesense hybrid, Qdrant hybrid (native fusion)
- **Application-Level Fusion**: Custom PHP service queries both paths and fuses results
- **Custom Scout Engine**: Build a single engine that queries both backends

## When To Use

- Production Laravel apps needing keyword + semantic search
- RAG pipelines where Laravel retrieves context for LLM generation
- E-commerce (product name exact match + conceptual product type search)
- Content platforms (documentation, blogs, knowledge bases)

## When NOT To Use

- Pure keyword search is sufficient
- Team lacks ML/embedding infrastructure
- Latency budget cannot absorb dual retrieval
- Single-engine non-hybrid solution meets requirements

## Best Practices

1. **Use Scout for keyword search**: Don't reinvent the wheel.
2. **Use engine-level hybrid if available**: Meilisearch/Typesense/Qdrant hybrid simplifies stack.
3. **Custom engine as last resort**: Significant development investment.
4. **Parallelize retrieval**: Run keyword and vector queries concurrently.
5. **Cache embeddings**: Avoid redundant API calls for frequent queries.
6. **Monitor fusion quality**: Track each path's contribution to top results.

## Architecture Guidelines

- Option A (Simplest): Meilisearch/Typesense hybrid — one engine, one API call
- Option B (PostgreSQL): pgvector + PostgreSQL FTS — single database, no extra server
- Option C (Custom): Scout for keyword + Qdrant SDK for vector — most flexible
- Option D (Scout Custom Engine): Wrap both backends in one Scout engine

## Performance Considerations

- Application-level fusion: ~2x query latency vs single path
- Engine-level hybrid: ~1.5x latency vs single path
- Memory for fused results: proportional to candidate pool size
- Cache fusion results for high-traffic queries

## Security Considerations

- Each path has its own authentication (Scout engine + vector store)
- Embedding API calls may send data externally
- Fusion service must handle partial failures gracefully
- Consistent access control across all retrieval paths

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Building custom hybrid without evaluating native options | Not knowing engine capabilities | Unnecessary complexity | Check engine hybrid support first |
| Sequential retrieval | Simple implementation | Double latency | Parallelize with async/await |
| Tightly coupling fusion to specific engines | Not abstracting | Hard to change engines later | Use interface/contract for retrieval |
| Not handling path failures | Assumption always available | 500 errors if one path down | Graceful degradation to single path |

## Anti-Patterns

- **Custom Scout engine before trying native hybrid**: Meilisearch/Typesense hybrid may be enough
- **Application-level fusion when engine provides native**: Extra complexity, no benefit
- **Ignoring Scout for keyword path**: Scout provides queues, pagination, where clauses
- **Not abstracting vector store**: Makes switching from pgvector to Qdrant painful

## Examples

`php
// Application-level hybrid service
class HybridSearchService
{
    public function search(string , array  = []): Collection
    {
        // Run both paths in parallel
         = async(fn() => Product::search()->take(100)->keys());
         = async(fn() => VectorSearch::search(, topK: 100));
        
        [, ] = await([, ]);
        
        // Fuse with RRF
         = rrfFusion(, , k: 60, topK: 20);
        
        return Product::whereIn('id', )
            ->orderByRaw('FIELD(id,' . implode(',', ) . ')')
            ->get();
    }
}
`

## Related Topics

- K028 (Meilisearch hybrid search)
- K045 (pgvector + FTS hybrid)
- K049 (Qdrant hybrid queries)
- K061 (RRF - Reciprocal Rank Fusion)
- K014 (Custom engine development)

## AI Agent Notes

- Laravel lacks first-party hybrid search; implementations are custom
- Engine-level hybrid is the pragmatic choice for most applications
- Application-level fusion provides maximum flexibility but increases complexity
- For agents: recommend engine-level hybrid first, fall back to application-level fusion

## Verification

- [ ] Keyword retrieval path works (Scout or FTS)
- [ ] Vector retrieval path works (pgvector, Qdrant, etc.)
- [ ] Fusion algorithm implemented and tested
- [ ] Parallel retrieval verified (not sequential)
- [ ] Graceful degradation for path failures
- [ ] Latency benchmarked against single-path baseline
