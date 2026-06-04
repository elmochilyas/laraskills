| Metadata | |
|---|---|
| KU ID | K003 |
| Subdomain | full-text-search-engines |
| Topic | Scout Collection Engine |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

Scout's `collection` engine performs search entirely in-memory using PHP's `Str::is()` pattern matching. It does not require any external search server or database indexes — all searchable records are loaded from the database, and filtering happens in application memory. This engine is designed for development and testing only.

## Core Concepts

- **In-Memory Search**: All records are loaded from the database and filtered in PHP memory.
- **Str::is() Matching**: Uses Laravel's `Str::is()` for pattern matching against searchable attributes.
- **No External Dependencies**: No search server, no database indexes, no configuration beyond the engine setting.
- **Development Only**: Intended for local development and testing environments only.

## When To Use

- Local development environments
- Unit and feature tests (especially with `Scout::fake()` for isolated testing)
- Prototyping before configuring a production search engine
- CI/CD pipelines where a search engine is unavailable

## When NOT To Use

- Production environments (loading all records into memory is not scalable)
- Datasets larger than a few hundred records
- Applications requiring relevance ranking, typo tolerance, or faceted search
- Any scenario where real search engine features are needed

## Best Practices

1. **Use for development only**: Configure `SCOUT_DRIVER=collection` in `.env.local` or `phpunit.xml`.
2. **Switch to database/Meilisearch/Typesense in production**: Never deploy with collection engine.
3. **Test with your production engine**: Collection engine behavior differs significantly from real engines.
4. **Understand limitations**: No relevance ranking, no pagination performance, no filtering beyond `Str::is()`.

## Architecture Guidelines

- Set in `.env`: `SCOUT_DRIVER=collection` for local dev.
- For tests, use `Scout::fake()` which replaces the engine with a collection-like fake.
- Production config should use `database`, `meilisearch`, `typesense`, or `algolia`.
- The collection engine is essentially Scout without an external search backend.

## Performance Considerations

- Loads ALL searchable records from the database into memory on every search.
- Memory usage = number of records × average record size. A 10,000 record model with 1KB average uses 10MB per search.
- Search time is O(n) — linear scan of all records.
- Not suitable for any dataset beyond trivial size.

## Related Topics

- K002 (Scout database engine)
- K001 (Searchable trait)

## AI Agent Notes

- Collection engine is for development/testing only — never production.
- Test with your actual production engine, not just the collection engine.
- For agents: configure via environment (collection for dev, real engine for prod).

## Verification

- [ ] SCOUT_DRIVER=collection in .env.local / phpunit.xml
- [ ] Production uses a real search engine
- [ ] Tests pass with both collection and production engines
