| Metadata | |
|---|---|
| KU ID | K016 |
| Subdomain | database-fulltext-search |
| Topic | SearchUsingPrefix Attribute |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

The `#[SearchUsingPrefix]` attribute tells Scout's database engine to use prefix matching (`LIKE 'term%'`) on specified columns. This is ideal for identifier fields like emails, usernames, SKUs, and order numbers where you want to search by prefix rather than full-text tokenization. Prefix matching avoids expensive `%term%` (leading wildcard) scans by leveraging standard B-tree indexes.

## Core Concepts

- **Prefix Matching**: Generates `WHERE column LIKE 'term%'` queries.
- **B-Tree Index Compatible**: Unlike leading-wildcard LIKE, prefix queries can use standard B-tree indexes.
- **Identifier-Focused**: Designed for structured data fields, not free-text content.
- **Complement to SearchUsingFullText**: Use together for mixed content (text + identifiers).

## When To Use

- Searchable identifier fields: email, username, SKU, order number, phone
- Auto-complete/search-as-you-type on structured fields
- Fields requiring exact prefix rather than tokenized full-text search
- Combined with `SearchUsingFullText` for models with both text and identifier content

## When NOT To Use

- Free-text content fields (title, body, description) — use `SearchUsingFullText` instead
- Fields without a B-tree index on the column (prefix LIKE still benefits from indexes)
- Dedicated search engines (Meilisearch, Typesense, Algolia handle this differently)
- When full-token search is needed (search within the identifier, not from the start)

## Best Practices

1. **Add B-tree indexes** on prefixed columns for performance.
2. **Use for identifiers only**: Email, username, SKU, order number.
3. **Combine with SearchUsingFullText**: Apply both attributes for mixed content models.
4. **Consider case-insensitive collation**: MySQL's default collation is case-insensitive; PostgreSQL may need `ILIKE`.

## Architecture Guidelines

- Apply the attribute on the model: `#[SearchUsingPrefix(['email', 'username'])]`.
- Ensure B-tree indexes exist on prefixed columns (add via migration if needed).
- Combine with `#[SearchUsingFullText(['title', 'body'])]` for comprehensive search.
- The prefix search applies to the entire model's search query — not per-field.

## Performance Considerations

- Prefix LIKE (`term%`) can use B-tree indexes — very fast on indexed columns.
- Without an index, prefix LIKE still performs a table scan, but faster than leading-wildcard LIKE.
- Leading wildcard LIKE (`%term%`) cannot use B-tree indexes and requires full table scan.
- The attribute only affects query construction — index management is separate.

## Examples

```php
use Laravel\Scout\Attributes\SearchUsingPrefix;
use Laravel\Scout\Attributes\SearchUsingFullText;

class User extends Model
{
    use Searchable;

    #[SearchUsingPrefix(['email', 'username'])]
    #[SearchUsingFullText(['bio', 'interests'])]
    protected function searchableAttributes(): array
    {
        return ['email', 'username', 'bio', 'interests'];
    }
}
```

## Related Topics

- K015 (SearchUsingFullText attribute)
- K002 (Scout database engine)
- K032 (Meilisearch search-as-you-type)

## AI Agent Notes

- Essential for identifier search (emails, SKUs) where prefix matching is preferred over tokenization.
- B-tree indexes make prefix LIKE performant — add them in migrations.
- For agents: use for any searchable identifier field to enable fast prefix matching.

## Verification

- [ ] SearchUsingPrefix attribute applied to model
- [ ] B-tree index exists on prefixed columns
- [ ] Prefix search returns expected results
- [ ] Leading wildcard queries avoided
