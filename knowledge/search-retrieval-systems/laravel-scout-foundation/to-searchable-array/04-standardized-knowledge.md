| Metadata | |
|---|---|
| KU ID | K005 |
| Subdomain | search-indexing-and-synchronization |
| Topic | toSearchableArray Customization |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

`toSearchableArray()` controls which model data is sent to the search engine for indexing. By default, Scout sends all model attributes. Overriding this method lets you select specific fields, include related data, transform values, and exclude sensitive information. This is the primary mechanism for shaping search results content.

## Core Concepts

- **Default Behavior**: Returns `$this->toArray()`, sending all model attributes to the search engine.
- **Customization**: Override to return only the fields needed for search display and filtering.
- **Related Data**: Include attributes from relationships (author name, category, tags).
- **Data Transformation**: Format dates, combine fields, compute derived values before indexing.
- **Sensitive Data Exclusion**: Never include passwords, payment details, or PII in the index.

## When To Use

- Every Searchable model should customize `toSearchableArray()` to limit indexed data
- Including searchable related data (author names, category labels)
- Transforming data for better search experience (computed fields, formatted locations)
- Excluding sensitive or unnecessary columns from the search index

## When NOT To Use

- The model has very few attributes and all are safe/necessary to index
- Using a community package that expects the default format
- Developing/testing (default is acceptable temporarily)

## Best Practices

1. **Only include fields needed for search display and filtering**: Less data = faster, cheaper indexing.
2. **Include related data for context**: Author name, category, tags improve search relevance.
3. **Transform data for search**: Format as flat arrays for better engine compatibility.
4. **Exclude sensitive data**: Never send passwords, tokens, or PII to search engines.
5. **Maintain backwards compatibility**: Changing the array shape may affect existing search results.

## Architecture Guidelines

- Return an associative array with field names as keys.
- Include filtering fields (status, category_id) even if not displayed — they're needed for `where()` clauses.
- Eager-load relations via `makeAllSearchableUsing()` to prevent N+1.
- Use `$this->relation->field` syntax to access related data.
- Consider computed attributes for complex transformations.

## Performance Considerations

- Larger arrays = more data transferred to the search engine per record.
- Related data access in `toSearchableArray()` triggers queries if not eager-loaded.
- Transformation logic runs on every save — keep it efficient.
- Index size directly impacts search latency and storage costs.

## Examples

```php
class Post extends Model
{
    use Searchable;

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'excerpt' => Str::limit($this->body, 200),
            'author_name' => $this->author->name,
            'category_name' => $this->category->name,
            'tags' => $this->tags->pluck('name')->toArray(),
            'status' => $this->status,
            'created_at' => $this->created_at->timestamp,
        ];
    }
}
```

## Related Topics

- K001 (Searchable trait)
- K010 (makeAllSearchableUsing)
- K011 (Scout where clauses)
- K006 (searchableAs)

## AI Agent Notes

- Always customize `toSearchableArray()` — the default sends too much data.
- Include fields needed for both display and filtering.
- For agents: include filtering fields (status, category_id, tenant_id) even if they aren't displayed in search results.

## Verification

- [ ] toSearchableArray returns only necessary fields
- [ ] Related data included and eager-loaded
- [ ] Sensitive data excluded from index
- [ ] Filtering fields (status, category, tenant) included
- [ ] Data transformations documented and tested
