# Knowledge Unit: Typesense Geo-Search

## Metadata

- **ID:** K037
- **Subdomain:** Search UX & Analytics
- **Source:** Typesense Docs
- **Maturity:** Stable
- **Laravel Relevance:** Lat/lng filtering and sorting

## Executive Summary

Typesense supports geo-search through lat/lng fields in the collection schema. Geo-filtering includes radius, bounding box, and polygon queries. Results can be sorted by distance using the `_text_match` ranking with geo-pin. Typesense's geo-search is configured at the schema level by declaring lat/lng fields with the `geopoint` or `geopoint[]` type.

## Core Concepts

- **Geo Data Schema**: Fields of type `geopoint` store `[lat, lng]` pairs.
- **Radius Filter**: `filter_by: _geo_radius(lat, lng, distance_meters)`.
- **Bounding Box Filter**: `_geo_bounding_box(lat, lng, lat, lng)`.
- **Distance Sorting**: `sort_by: _geo_dist(lat, lng):asc` for nearest-first ordering.

## Internal Mechanics

Typesense indexes geopoint fields in a geo-optimized data structure. At query time, geo-filters are applied during the search (filter-aware, not post-filter). The `_geo_dist` function computes great-circle distance using the haversine formula. This distance can be used for both filtering and sorting.

## Patterns

- **Local search**: Find places within a radius of the user's location.
- **Distance-aware ranking**: Combine textual relevance with proximity.
- **Multi-location indexing**: Use `geopoint[]` for entities with multiple locations.

## Architectural Decisions

Typesense integrated geo-search as a native feature (rather than an add-on) because location-based search is a common requirement. The `geopoint` and `geopoint[]` types are first-class schema types, not just regular fields.

## Tradeoffs

- Typesense geo-search is less mature than Algolia's but comparable in functionality.
- Geo-queries must use Typesense's filter_by syntax — Scout's `where()` does not abstract geo.
- `geopoint` schema changes require collection re-creation (like all Typesense schema changes).

## Performance Considerations

- Geo-filtering is efficient due to Typesense's in-memory processing.
- Radius distance computation adds microseconds per candidate.
- Bounding box filtering is typically faster than radius (simple coordinate comparison).

## Production Considerations

- **Define geo fields in the collection schema** with `type: "geopoint"`.
- **Use Scout's callback API** to pass geo filter_by parameters.
- **Ensure all indexed records have valid lat/lng** — null geo fields may cause filtering errors.
- **Test with edge coordinates** (equator, poles).

## Common Mistakes

- Using `geopoint[]` when only a single location is needed — adds unnecessary complexity.
- Expecting Scout to abstract geo parameters — requires Typesense-specific query parameters.
- Storing coordinates in separate lat/lng fields instead of using the `geopoint` type.
- Not normalizing coordinate values within valid ranges.

## Failure Modes

- **Invalid coordinates**: Lat/lng values outside valid ranges cause query errors.
- **Missing geo data**: Records without geo fields are excluded from geo-filtered queries.
- **Schema change**: Adding a geo field to existing collections requires re-creation.

## Ecosystem Usage

Used in Typesense-based location-aware applications: store locators, real estate, event discovery, delivery services.

## Related Knowledge Units

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K021 (Algolia geo-search)

## Research Notes

Source: Typesense docs. Typesense geo-search supports the most common geo operations (radius, bounding box, distance sort). The `geopoint[]` type for multi-location entities is a unique feature not present in all search engines.


## Mental Models

- **Lightning Rod**: Typesense is designed for sub-50ms responses. Every architectural decision prioritizes speed, like a lightning rod channeling energy with minimal resistance.
- **Schema-on-Write**: Unlike schema-on-read databases, Typesense enforces structure at write time, like pre-sorting mail before delivery rather than sorting at the mailbox.

