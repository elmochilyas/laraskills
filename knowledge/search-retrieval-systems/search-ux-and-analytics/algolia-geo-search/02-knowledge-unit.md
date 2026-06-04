# Knowledge Unit: Algolia Geo-Search

## Metadata

- **ID:** K021
- **Subdomain:** Search UX & Analytics
- **Source:** Algolia Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Spatial filtering

## Executive Summary

Algolia geo-search enables filtering and ranking search results by geographic location. It supports lat/lng coordinate storage, radius filtering, bounding box filtering, and "around" (nearest) queries. In Laravel Scout, geo-search parameters are passed via the `options()` callback or the `search()` callback closure for engine-specific features.

## Core Concepts

- **Geo Data in Index**: Store `_geoloc` array with `lat` and `lng` values in the searchable array.
- **Around Radius**: Find results within a radius of a point, optionally sorted by distance.
- **Bounding Box**: Filter results within a rectangular geographic area.
- **Inside Polygon**: Filter results within a custom polygon (more complex shapes).
- **Distance Ranking**: Results can be ranked by proximity as part of the ranking formula.

## Internal Mechanics

Algolia indexes `_geoloc` data in a geo-optimized data structure. At query time, the `aroundLatLng` and `aroundRadius` parameters trigger geo-filtering. Algolia computes the great-circle distance between the query point and each candidate result. Distance can be used as a ranking criterion (positioned in the ranking rule sequence) or as a filter.

## Patterns

- **Local search**: "Find stores near me" with radius filtering.
- **Distance sorting**: Sort search results by proximity.
- **Geo + text**: Combine textual search with geographic filtering.
- **Faceted geo search**: Use facet counting with geo constraints.

## Architectural Decisions

Algolia treats geo data as a first-class indexed type, not just another attribute. This enables efficient geo-filtering during search (filter-aware, not post-filter).

## Tradeoffs

- Geo-search is engine-specific — Scout does not abstract geo parameters (requires callback API).
- Each engine has different geo capabilities: Algolia (most mature), Typesense (lat/lng filtering), Meilisearch (geo via filterable attributes).
- Geo-ranking must be integrated into the ranking formula.

## Performance Considerations

- Geo-filtering is highly optimized — sub-millisecond overhead for most queries.
- Geo-ranking adds sorting overhead but is typically <1ms.
- Very large geo areas may return many candidates — pagination limits help.

## Production Considerations

- **Store `_geoloc` in `toSearchableArray()`** with proper lat/lng values.
- **Use the callback API** to pass geo parameters since Scout doesn't abstract them.
- **Test geo queries** with edge cases (equator, poles, date line).
- **Consider precision**: Using enough decimal places for lat/lng (6 decimal places = ~10cm precision).

## Common Mistakes

- Not storing `_geoloc` in the indexed data — geo queries return empty results.
- Expecting Scout's `where()` to handle geo parameters — requires the callback API.
- Using insufficient coordinate precision — results may be less accurate than expected.
- Forgetting that geo-filtering applies after text search — combine both for best results.

## Failure Modes

- **No results within radius**: Empty result set if no indexed records exist in the radius.
- **Incorrect distance calculations**: Wrong coordinates produce unexpected results.
- **Cross-engine portability**: Geo-search code using Algolia's callback API doesn't work with other engines.

## Ecosystem Usage

Common in local business directories, real estate listings, event discovery, and any location-aware application.

## Related Knowledge Units

- K018 (Algolia driver setup)
- K013 (Customizing engine searches)
- K037 (Typesense geo-search)

## Research Notes

Source: Algolia docs. Geo-search is one of Algolia's most mature features. The `_geoloc` convention is well-established. Other engines have caught up (Typesense, Meilisearch both support geo), but Algolia's implementation remains the most feature-rich.


## Mental Models

- **Instant Gratification**: Algolia's architecture is built around instant search results as the user types. Every millisecond is optimized for perceived performance.
- **Analytics Dashboard**: Algolia analytics are like having a magnifying glass on your search bar — you see exactly what users search for and whether they find it.

