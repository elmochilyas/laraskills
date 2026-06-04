# Knowledge Unit: Customizing Engine Searches (Closure API)

## Metadata

- **ID:** K013
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Advanced engine-specific options

## Executive Summary

Scout's closure-based callback API allows passing engine-specific search parameters that the abstraction layer cannot express generically. When calling `Model::search()`, the second argument accepts a closure that receives the engine's search client, enabling direct manipulation of engine-specific features like typo tolerance thresholds, ranking rules, and custom parameters that don't have Scout-level equivalents.

## Core Concepts

- **Closure Signature**: `function($engine, $query, $options) { ... }`. The engine is the raw SDK client.
- **Return Override**: If the closure returns a result, Scout uses it instead of its own.
- **Scope**: Only affects that single query call. Does not alter global configuration.
- **Engine-Specific**: The closure receives the underlying engine client (e.g., Meilisearch Index, Algolia Index), not a Scout abstraction.

## Internal Mechanics

Scout's `search()` method accepts an optional `$callback` parameter. When a `search()` query is executed, Scout calls the engine adapter's `search()` method, passing the callback. The engine adapter then invokes the callback with the raw engine client, giving it an opportunity to modify query parameters or handle the response.

## Patterns

- **Meilisearch filter overrides**: Pass `client`-scoped filter functions not expressible via `where()`.
- **Typesense query_by_weights**: Set per-field weights dynamically per query.
- **Algolia optional filters**: Set `disableTypoToleranceOnAttributes()` or `enableRules()` for a single query.
- **Raw response access**: Extract engine-specific metadata (facets, exhausted flags).

## Architectural Decisions

The closure API was added to address the fundamental tension in abstraction layers: generic APIs cannot expose every engine-specific feature without leaking abstractions. The closure provides an escape hatch without compromising the primary API.

## Tradeoffs

- Bypasses abstraction — code using the closure API is engine-specific and not portable.
- No Scout-level validation — engine client receives raw values and may error.
- Testing requires mocking the underlying engine client.

## Performance Considerations

- No overhead if closure is simple. Return override should be used carefully.
- Calling engine-specific features can unlock performance optimizations (e.g., reducing typo tolerance at query time for shorter queries).

## Production Considerations

- **Document engine-specific code** — future developers need to know this is not portable.
- **Test against the specific engine** — mock the raw SDK client.
- **Keep closures focused** — one concern per callback, extract complex logic into dedicated classes.

## Common Mistakes

- Overriding the return value unnecessarily — bypasses Scout's model hydration.
- Making engine-specific code that prevents engine switching.
- Not wrapping in try/catch — engine client exceptions may differ from Scout's exceptions.

## Failure Modes

- Closure throws an exception that Scout doesn't catch — breaks the search response.
- Return override returns an unexpected format — Scout attempts to hydrate incompatible data.

## Ecosystem Usage

Used in advanced production implementations where engine-specific features are required. Seen in e-commerce (custom ranking overrides) and multi-tenant search (dynamic filter scoping).

## Related Knowledge Units

- K001 (Searchable trait)
- K014 (Custom engine development)
- K020 (Algolia analytics)

## Research Notes

Source: Laravel Scout docs. The callback API is documented but rarely the first approach. Most use cases are covered by `where()`, `searchableAs()`, and engine config. The callback is last-resort for engine-specific needs.


## Mental Models

- **Adapter Pattern**: Custom engine development follows the adapter pattern. Scout defines the interface; your engine implements it. The application never knows which engine is behind the facade.
- **Translator Role**: Your custom engine is a translator between Scout's standardized search API and your backend's native protocol. All complexity lives in the translation layer.

