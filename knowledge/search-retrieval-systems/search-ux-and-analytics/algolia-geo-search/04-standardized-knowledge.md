| Metadata | |
|---|---|
| KU ID | K021 |
| Subdomain | search-ux-and-analytics |
| Topic | Algolia Geo-Search |
| Source | Algolia Docs / Scout |
| Maturity | Stable |

## Overview

Algolia's geo-search enables location-based filtering and ranking of search results. Records can store `_geoloc` coordinates (lat, lng). Queries can filter by radius (aroundLatLng via aroundRadius), sort by distance, and rank geographically relevant results higher. Geo-search is integrated with Scout through the callback API for passing geo-parameters.

## Core Concepts

- **_geoloc**: Algolia's standard attribute for storing location coordinates.
- **aroundLatLng**: Center point for geo-based search.
- **aroundRadius**: Search radius in meters (or 'all' for unlimited).
- **aroundPrecision**: Rounding precision for distance-based grouping.
- **facetFilters**: Combine geo-filtering with regular facet filters.

## When To Use

- E-commerce with physical store or local inventory
- Service providers searchable by location (restaurants, contractors)
- Event or venue discovery near a location
- Real estate search with location filtering

## When NOT To Use

- Digital products or services not tied to a physical location
- Applications without location data for records
- Global search where location is irrelevant

## Best Practices

1. **Include _geoloc in toSearchableArray()**: Add lat/lng to each indexed record.
2. **Set aroundRadius based on use case**: Smaller radius for dense urban areas, larger for rural.
3. **Combine with facet filters**: Location + category for restaurant search.
4. **Use aroundPrecision for ambiguous location**: Group results by city block or neighborhood.
5. **Consider fallback radius**: If geo-results are too few, expand radius automatically.

## Architecture Guidelines

- Store latitude and longitude in the model's database, include `_geoloc` in `toSearchableArray()`.
- Use Scout callback API to pass geo parameters: `aroundLatLng`, `aroundRadius`.
- Combine with standard `where()` for non-geo filters.
- Geo-ranking (distance-based scoring) is automatic when `aroundLatLng` is specified.

## Performance Considerations

- Geo-search adds minimal overhead to Algolia queries.
- Radius filtering efficiently narrows the search space.
- Many geo-queries may benefit from query caching.

## Related Topics

- K018 (Algolia driver setup)
- K037 (Typesense geo-search)
- K066 (Faceted search implementation)

## AI Agent Notes

- Use `_geoloc` attribute in searchable data for Algolia geo-search.
- Geo-parameters are passed via Scout callback API.
- For agents: include `_geoloc` in `toSearchableArray()`; set reasonable `aroundRadius`; combine with `aroundPrecision` for location grouping.

## Verification

- [ ] _geoloc data included in toSearchableArray
- [ ] Geo-parameters configured in search queries
- [ ] Distance-based ranking working correctly
- [ ] Radius filtering returns expected results
- [ ] Combined with facet filters for richer queries
