| Metadata | |
|---|---|
| KU ID | K015 |
| Subdomain | database-fulltext-search |
| Topic | SearchUsingFullText Attribute |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

The `#[SearchUsingFullText]` attribute tells Scout's database engine which model columns have FULLTEXT (MySQL) or `tsvector` (PostgreSQL) indexes. When applied, Scout generates `MATCH ... AGAINST` queries (MySQL) or `tsvector` queries (PostgreSQL) instead of slower `LIKE` scans. This is the primary optimization for database-backed search in Laravel.

## Core Concepts

- **Attribute Declaration**: `#[SearchUsingFullText(['title', 'body'])]` on the model.
- **MySQL Behavior**: Generates `MATCH(columns) AGAINST(? IN BOOLEAN MODE)` queries.
- **PostgreSQL Behavior**: Uses `tsvector` columns with `tsquery` text search operators.
- **FULLTEXT Index Required**: The attribute only changes the query syntax — the index must exist.
- **Fallback Without Index**: If no FULLTEXT index exists, MySQL falls back to `LIKE` queries.

## When To Use

- MySQL models with FULLTEXT indexes on text columns (title, body, description)
- PostgreSQL models with `tsvector` generated columns and GIN indexes
- Any Scout database engine search where you want FULLTEXT performance

## When NOT To Use

- Columns without FULLTEXT/GIN indexes (the attribute has no effect without the index)
- Identifier columns (emails, SKUs, usernames) — use `SearchUsingPrefix` instead
- When using a dedicated search engine (Meilisearch, Typesense, Algolia)
- When using Scout's collection engine (no database queries)

## Best Practices

1. **Create FULLTEXT indexes in migrations** before adding the attribute.
2. **List only indexed columns** in the attribute array.
3. **Combine with `SearchUsingPrefix`** for mixed content (text + identifiers).
4. **Use Boolean Mode** (default) — avoid MySQL's Natural Language Mode 50% threshold.
5. **Configure MySQL `innodb_ft_min_token_size`** based on your content type.

## Architecture Guidelines

- Add the attribute to the model class: `#[SearchUsingFullText(['title', 'body', 'description'])]`.
- Create the FULLTEXT index in a migration: `$table->fullText(['title', 'body'])`.
- For PostgreSQL, create a generated `tsvector` column with a GIN index.
- The attribute can be combined with other Scout attributes on the same model.

## Performance Considerations

- FULLTEXT with `SearchUsingFullText` is 10-100x faster than `LIKE` queries on large tables.
- FULLTEXT indexes add 30-50% insert/update overhead.
- The attribute itself adds no overhead — it only changes query construction.
- Without the index matching the attribute's columns, performance degrades to `LIKE` scans.

## Examples

```php
use Laravel\Scout\Attributes\SearchUsingFullText;

class Post extends Model
{
    use Searchable;

    #[SearchUsingFullText(['title', 'body'])]
    protected function searchableAttributes(): array
    {
        return ['title', 'body', 'author_id'];
    }
}
```

## Related Topics

- K002 (Scout database engine)
- K016 (SearchUsingPrefix attribute)
- K041 (pgvector extension)

## AI Agent Notes

- The attribute only controls query syntax — the FULLTEXT index is what provides the performance gain.
- Without a matching index, the attribute has no effect.
- For agents: always create the FULLTEXT index in a migration before using this attribute.

## Verification

- [ ] FULLTEXT index created matching attribute columns
- [ ] SearchUsingFullText attribute applied to model
- [ ] Queries use MATCH...AGAINST (verify in query log)
- [ ] Performance gain confirmed (vs LIKE baseline)
