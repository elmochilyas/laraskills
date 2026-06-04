| Metadata | |
|---|---|
| KU ID | ku-09 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Scout Searchable Trait |
| Source | Laravel Scout |
| Maturity | Stable |

## Overview

The Searchable trait is the foundation of Laravel Scout integration. Adding it to an Eloquent model enables automatic index synchronization, search() query method, and pagination. The trait provides customizable methods: 	oSearchableArray(), searchableAs(), shouldBeSearchable(), and getScoutKey().

## Core Concepts

- **Trait Integration**: use Searchable in model enables all Scout features
- **Automatic Sync**: Model save/delete triggers index updates
- **search() Method**: Model::search('query')->get() for search queries
- **Customizable Array**: 	oSearchableArray() shapes indexed data
- **Custom Index Name**: searchableAs() overrides default index name
- **Conditional Indexing**: shouldBeSearchable() gates indexing

## When To Use

- Every model that needs search capability
- Models whose data should appear in search results

## When NOT To Use

- Models that should not appear in search (internal, logging, etc.)
- Non-Eloquent data sources (use custom import process)

## Best Practices

1. **Always implement 	oSearchableArray()**: Control what data is indexed.
2. **Use shouldBeSearchable()**: Gate on published/active status.
3. **Transform relations**: Denormalize related data for search.
4. **Override searchableAs()**: Use descriptive index names.
5. **Type cast all fields**: Prevent engine schema type mismatches.

## Related Topics

- K005 (toSearchableArray)
- K006 (searchableAs)
- K007 (shouldBeSearchable)

## AI Agent Notes

- The Searchable trait is the entry point for all Laravel Scout functionality
- Most common mistake: not implementing toSearchableArray() and relying on defaults
- For agents: always customize toSearchableArray() and shouldBeSearchable()

## Verification

- [ ] Searchable trait added to model
- [ ] toSearchableArray() implemented
- [ ] shouldBeSearchable() implemented (if conditional indexing needed)
- [ ] searchableAs() returns descriptive name
- [ ] Relation data denormalized as needed
- [ ] All indexed fields type-cast
