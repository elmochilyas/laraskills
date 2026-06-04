| Metadata | |
|---|---|
| KU ID | K013 |
| Subdomain | scout-querying |
| Topic | Customizing Engine Searches |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

Scout's callback API allows passing engine-specific search parameters through the `search()` method. The `Model::search('query')->options()` or callback syntax lets developers customize searches with engine-native features like typo tolerance settings, ranking rules, filters, and facet requests without leaving Scout's fluent API.

## Core Concepts

- **Callback API**: `Product::search('shoes')->query(function ($engine, $query) { ... })` provides direct engine access.
- **Options Method**: `Product::search('shoes')->options($array)` passes raw parameters to the engine.
- **Engine-Specific**: Each engine (Meilisearch, Algolia, Typesense) accepts different parameters.
- **Scout Abstraction**: Scout handles the common API; callbacks handle engine-specific customization.

## When To Use

- Passing engine-specific relevance parameters (ranking rules, typo settings)
- Adding facet counts, filters, or analytics tags to a search
- Setting geo-distance filters or sorting parameters unique to an engine
- Any search feature not covered by Scout's standard where/paginate methods

## When NOT To Use

- Standard `where()` or `whereIn()` clauses suffice for simple filtering
- Results need to remain engine-agnostic (callback ties you to specific engine)
- Changes apply globally to all searches (configure in engine settings instead)

## Best Practices

1. **Use callbacks for query-time customization**: Save engine-level defaults for index settings.
2. **Wrap engine-specific code in conditional checks**: `if (config('scout.driver') === 'meilisearch')`.
3. **Abstract behind repository/service classes**: Don't spread callbacks across controllers.
4. **Document which engine features are used**: Team members need to know required backend configuration.

## Architecture Guidelines

- Keep engine-specific logic in dedicated service classes, not controllers.
- Use the callback closure to pass parameters: `Product::search($q)->query(fn($meilisearch, $query) => $meilisearch->setFilter('price > 10'))`.
- For complex queries, create a SearchService or QueryBuilder class that wraps Scout calls.
- Filter- or sort-only customizations can use `options()` with key-value arrays.

## Performance Considerations

- Engine-specific callbacks add negligible overhead — they transform the request before sending.
- Complex filters or aggregations may increase search backend processing time.
- Callback parameters are not cached — they're applied on every search.

## Related Topics

- K001 (Searchable trait)
- K014 (Custom engine development)
- K018 (Algolia driver setup)
- K023 (Meilisearch driver setup)
- K033 (Typesense driver setup)

## AI Agent Notes

- The callback API is the bridge between Scout's generic interface and engine-specific power features.
- Wrap in conditional checks to avoid coupling to a specific engine.
- For agents: use callbacks sparingly; prefer index-level settings for global behavior and callbacks for per-query customization.

## Verification

- [ ] Engine-specific callbacks work for your backend
- [ ] Engine-specific code does not break when switching engines
- [ ] SearchService or equivalent abstraction in place
- [ ] Callbacks tested with engine's full feature set
