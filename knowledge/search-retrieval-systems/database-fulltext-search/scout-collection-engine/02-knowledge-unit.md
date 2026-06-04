# Knowledge Unit: Scout Collection Engine

## Metadata

- **ID:** K003
- **Subdomain:** Full-Text Search Engines
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Dev-only, uses Str::is matching

## Executive Summary

Scout's collection engine performs search entirely in PHP memory by loading all models from the database and applying `Str::is()` pattern matching against the search term. It requires no external dependencies, no indexes, and no server setup. It is explicitly intended for development use only — not production.

## Core Concepts

- **In-Memory Search**: Loads all records from the database into a Collection, filters using PHP string matching.
- **No Indexing**: No search index is built or maintained. Every search scans all records.
- **`Str::is()` Matching**: Uses Laravel's `Str::is()` method, which supports wildcard (`*`) patterns. Search "lar*" matches "laravel".
- **Pagination**: Collections are paginated in memory, which means all records are still loaded from the database.

## Internal Mechanics

The collection engine adapter overrides the search to use `Model::all()`, then applies `Str::is()` filtering on the resulting collection. Sorting uses a basic relevance heuristic. Pagination is applied to the in-memory collection. This completely bypasses any database-level search indexes.

## Patterns

- **Development only**: Used in local and CI environments where no search server is available.
- **Testing**: Combined with `Scout::fake()` for test suites that need searchable models but shouldn't hit real engines.
- **Demo/Prototype**: Quick search demonstration without infrastructure.

## Architectural Decisions

The collection engine exists solely to allow Scout to function without any search infrastructure. It ensures that `Model::search()` never throws "driver not configured" errors, even in environments without a search server.

## Tradeoffs

- Zero infrastructure, zero configuration — every search scans the entire table.
- Not suitable for any production database with >100 records.
- Pagination loads all records from the database regardless of the page requested.

## Performance Considerations

- O(n) complexity — every search loads and iterates ALL records from the database.
- Memory exhaustion risk on large tables.
- Database query loads all rows — massive I/O and memory usage.

## Production Considerations

- **Never use in production**. The documentation explicitly marks it for development only.
- **Use the database engine** for production if you need zero-infrastructure search.
- **Ensure `SCOUT_DRIVER` is set** to a production engine in the production environment.

## Common Mistakes

- Accidentally using the collection engine in production because `SCOUT_DRIVER` is not set.
- Thinking "it works on my machine" means it's production-ready.

## Failure Modes

- **Memory exhaustion**: Loading a 1M-row table into a PHP collection to search it.
- **Database I/O spike**: Loading all columns of all rows on every search request.
- **Timeouts**: PHP execution timeout kills the request before search completes.

## Ecosystem Usage

Used exclusively in development and CI environments as a placeholder engine.

## Related Knowledge Units

- K002 (Scout database engine)
- K001 (Searchable trait)

## Research Notes

Source: Laravel Scout docs. The collection engine uses `Str::is()` which supports `*` wildcards — this is more permissive than a simple `str_contains()`. The engine was designed for the "laravel new" experience where no search server is available.


## Mental Models

- **Central Switchboard**: Laravel Scout is like a switchboard operator — you tell it which model to search and which engine to use, and it connects them without you handling the wiring.
- **Adapter Pattern**: Scout is the universal power outlet adapter. Your application speaks one language (Scout), and Scout translates to whatever search engine you plug in.

