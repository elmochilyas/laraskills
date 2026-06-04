| Metadata | |
|---|---|
| KU ID | K037 |
| Subdomain | search-ux-and-analytics |
| Topic | Typesense Geo-Search |
| Source | Typesense Docs |
| Maturity | Stable |

## Overview

Typesense supports geo-search with latitude/longitude coordinates stored in a dedicated `geopoint` field type. Geo-filtering supports radius-based filtering (`_geo_distance`), bounding box filtering, and distance-based sorting. Geo-queries are combined with full-text search and facet filters for location-aware search results.

## Core Concepts

- **geopoint Field**: Special field type storing lat/lng coordinates.
- **_geo_distance**: Filter results within a radius from a center point.
- **_geo_bounding_box**: Filter results within a rectangular geographic area.
- **Distance Sorting**: Sort results by distance from a center point.
- **Geo + Text**: Combine geo-filters with keyword search in a single query.

## When To Use

- Location-based search (nearby stores, restaurants, services)
- Real estate search with location filtering
- Event discovery near a user's location
- Delivery radius filtering

## When NOT To Use

- Non-location-based content
- Applications without coordinate data

## Best Practices

1. **Store coordinates in geopoint field type**: `['name' => 'location', 'type' => 'geopoint']`.
2. **Use _geo_distance for radius filtering**: Specify center and radius in meters.
3. **Combine with text search**: `query_by` for keyword search + `filter_by` for geo.
4. **Sort by distance**: `sort_by: _geo_distance:desc` for nearest-first ordering.
5. **Set reasonable radius limits**: Prevent unbounded geo-queries.

## Related Topics

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K021 (Algolia geo-search)

## AI Agent Notes

- Use `geopoint` field type in collection schema for location data.
- Combine geo-filters with full-text search for location-aware results.
- For agents: add geopoint field to schema; use `_geo_distance` for radius filtering; sort by distance for nearest results.

## Verification

- [ ] geopoint field declared in collection schema
- [ ] _geo_distance filtering working
- [ ] Distance-based sorting correct
- [ ] Geo + text combined queries functional
- [ ] Radius limits configured
