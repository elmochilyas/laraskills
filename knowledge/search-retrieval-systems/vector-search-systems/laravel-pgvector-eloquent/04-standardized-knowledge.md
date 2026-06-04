| Metadata | |
|---|---|
| KU ID | K070 |
| Subdomain | vector-similarity-search |
| Topic | Laravel + pgvector via Eloquent |
| Source | Community |
| Maturity | Emerging |

## Overview

Integrating pgvector with Laravel Eloquent can be done via raw SQL, the `pgvector/pgvector-php` community package, or a custom Scout engine. Raw SQL provides full control and no external dependencies. The community package adds a `Vector` class and Eloquent integration helpers. A custom Scout engine would unify vector search under Scout's familiar `Model::search()` API.

## Core Concepts

- **Raw SQL Approach**: Use `DB::select()` with pgvector operators directly in queries.
- **Community Package**: `pgvector/pgvector-php` provides vector type casting and helper methods.
- **Eloquent Casting**: Cast a column to `AsVector` for automatic serialization/deserialization.
- **Query Scopes**: Encapsulate vector similarity queries in Eloquent local scopes.
- **No Native Scout Driver**: pgvector lacks a first-party Scout engine (community or custom).

## When To Use

- Laravel applications on PostgreSQL adding vector search
- Teams comfortable with raw SQL or community packages
- Prototyping vector search before building a custom Scout engine
- Applications needing tight integration between vector search and Eloquent models

## When NOT To Use

- Non-PostgreSQL databases (requires pgvector extension)
- Teams preferring Scout-native abstractions (no Scout driver for pgvector)
- Applications where a separate vector DB is already in use
- High-traffic vector search that might compete with OLTP queries

## Best Practices

1. **Start with raw SQL**: Simplest approach, no external dependencies.
2. **Encapsulate in scopes**: Create Eloquent local scopes for vector similarity queries.
3. **Add vector column via migration**: Use `$table->vector('embedding', 1536)` in migrations.
4. **Create ANN index**: HNSW or IVFFlat index on the vector column.
5. **Benchmark query performance**: Vector search on the primary database impacts transactional queries.

## Architecture Guidelines

- Add vector column in migration: `Schema::table('documents', fn($t) => $t->vector('embedding', 1536))`.
- Create index: `DB::statement('CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)');`.
- Define local scope: `scopeSimilarTo($query, $vector, $limit = 10)`.
- Or use community package for `$model->nearestNeighbors('embedding', $vector)->limit(10)`.

## Performance Considerations

- Vector search on the primary database shares resources with transactional queries.
- Consider read-replicas for vector search to avoid impacting writes.
- ANN indexes (HNSW) are needed for performance on datasets >10K vectors.
- Index build consumes database CPU and memory.

## Examples

```php
// Migration
Schema::table('documents', function (Blueprint $table) {
    $table->vector('embedding', 1536);
});

// Eloquent scope
class Document extends Model
{
    public function scopeNearestNeighbors($query, array $vector, int $limit = 10)
    {
        $vector = json_encode($vector);
        return $query->selectRaw("*, embedding <=> '$vector' AS distance")
            ->orderBy('embedding <=> $vector')
            ->limit($limit);
    }
}

// Usage
$similar = Document::nearestNeighbors($queryEmbedding, 20)->get();
```

## Related Topics

- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K043 (pgvector distance functions)
- K045 (pgvector + PostgreSQL FTS hybrid)

## AI Agent Notes

- No first-party Scout driver for pgvector — use raw SQL, community package, or custom Scout engine.
- Encapsulate vector queries in Eloquent scopes for clean code.
- For agents: start with raw SQL + Eloquent scopes; consider community package for convenience; evaluate performance impact on transactional queries.

## Verification

- [ ] pgvector extension installed
- [ ] Vector column added to migration
- [ ] ANN index created on vector column
- [ ] Eloquent scope for vector search defined
- [ ] Query returns semantically relevant results
- [ ] Performance benchmarked (impact on transactional queries)
