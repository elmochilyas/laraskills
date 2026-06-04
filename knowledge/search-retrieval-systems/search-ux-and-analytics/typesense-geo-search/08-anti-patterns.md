# ECC Anti-Patterns — Typesense Geo-Search
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Typesense Geo-Search | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Not Using geopoint Field Type for Coordinates
2. Not Combining Geo with Full-Text Search
3. Missing Radius Limits on Geo-Queries
4. No Distance-Based Sorting
5. Not Handling Edge Cases (No Coordinates, Invalid Coordinates)
---
## Repository-Wide Anti-Patterns
- Storing lat/lng as separate numeric fields instead of geopoint type
- Not indexing geo field as facet for combined geo + facet filtering
- Hardcoding center coordinates instead of accepting user location
---
## Anti-Pattern 1: Not Using geopoint Field Type for Coordinates
### Category
Data Quality | Functionality
### Description
Storing latitude and longitude as separate numeric fields instead of using the dedicated `geopoint` field type, making geo-search features unavailable.
### Why It Happens
Developers are familiar with storing coordinates as lat/lng columns and don't know about Typesense's geopoint type.
### Warning Signs
- Latitude and longitude stored as separate fields
- Geo-filter (`_geo_distance`) not working
- No geopoint field in collection schema
- Coordinates stored as regular numeric facetable fields
### Why Harmful
Typesense's geo-search features (`_geo_distance`, `_geo_bounding_box`, distance sorting) only work with the `geopoint` field type. Storing coordinates as regular fields makes all geo-search impossible.
### Consequences
- Geo-search features non-functional
- Custom geo-filtering must be implemented as post-filter
- Poor performance from post-filtering geo results
- Re-indexing required to fix schema
### Alternative
Declare a `geopoint` field type in the collection schema and populate it with `[lat, lng]` array.
### Refactoring Strategy
1. Add geopoint field to collection schema: `['name' => 'location', 'type' => 'geopoint']`
2. Populate geopoint from lat/lng in `toSearchableArray()`
3. Re-index models
4. Test `_geo_distance` filtering
5. Remove latitude/longitude as separate facetable fields if no longer needed
### Detection Checklist
- [ ] geopoint field declared in collection schema
- [ ] Coordinates stored as geopoint type
- [ ] `_geo_distance` filtering working
- [ ] Separate lat/lng fields removed or deprecated
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Not Combining Geo with Full-Text Search
### Category
Functionality | User Experience
### Description
Applying geo-search alone without combining with full-text keyword search, limiting results to location-only matching.
### Why It Happens
Geo-search is implemented as a standalone feature. Full-text search with geo-filtering requires combined query parameters.
### Warning Signs
- Geo-filtered results ignore keyword relevance
- Users must search by location only, not by what they want
- No `query_by` parameter when geo-filter is active
- Results are geographically correct but irrelevant to query
### Why Harmful
Users need both: results that are relevant AND nearby. Geo-only search returns everything in the area. Keyword-only search ignores location. Both extremes provide poor UX.
### Consequences
- Users get geographically relevant but content-irrelevant results
- Poor experience for location-aware content search
- Users must browse through all nearby items
- Missed value of combined geo + text search
### Alternative
Combine `query_by` (full-text) with `filter_by` (geo) in the same Typesense query.
### Refactoring Strategy
1. Include both `query_by` and `filter_by` with `_geo_distance` in search query
2. Combine keyword relevance with location proximity
3. Test: search for "pizza" within 5km radius
4. Verify ranking combines text relevance and distance
5. Allow users to adjust radius and refine keywords
### Detection Checklist
- [ ] Full-text and geo combined in single query
- [ ] Results relevant both by text and location
- [ ] Text relevance and distance both influence ranking
- [ ] Users can adjust both query and location
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Missing Radius Limits on Geo-Queries
### Category
Performance | User Experience
### Description
Not setting maximum radius on geo-queries, allowing unbounded searches that return results from across the world.
### Why It Happens
Default geo-queries have no radius limit. Developers assume the application or user will constrain the radius.
### Warning Signs
- Geo-search returns results from other countries
- No default or maximum radius configured
- Performance degradation on geo-queries without limits
- Users see irrelevant far-away results mixed with local ones
### Why Harmful
Unbounded geo-queries include results from everywhere, defeating the purpose of location-based search. Performance suffers as the query space grows without constraint.
### Consequences
- Irrelevant far-away results in search
- Slower query performance from large search space
- Users confused by non-local results
- Higher search engine load from unbounded queries
### Alternative
Set a default radius (e.g., 25km) and a maximum radius cap (e.g., 100km).
### Refactoring Strategy
1. Set default radius appropriate for use case (e.g., 25km for restaurants)
2. Cap maximum allowed radius (e.g., 100km)
3. Allow users to adjust radius within the cap
4. Validate radius parameter against maximum
5. Show radius in search UI
### Detection Checklist
- [ ] Default radius set
- [ ] Maximum radius cap configured
- [ ] Radius parameter validated
- [ ] Users can adjust radius within limits
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: No Distance-Based Sorting
### Category
User Experience | Functionality
### Description
Not sorting geo-search results by distance from the user's location, showing nearest results mixed arbitrarily among results.
### Why It Happens
Geo-filtering is implemented without configuring distance-based sorting.
### Warning Signs
- Nearest results not shown first
- Results sorted by text relevance only, ignoring distance
- No distance indicator in result display
- Users receive results from far away before nearby ones
### Why Harmful
For location-based search, distance is often the primary ranking signal. Showing far-away results before nearby ones makes the search feel broken.
### Consequences
- Users must scan results to find nearby options
- Poor UX for "near me" type searches
- Result ordering doesn't match user expectation
- Users lose trust in location accuracy
### Alternative
Sort geo-search results by distance from the user's location using `sort_by: _geo_distance:asc`.
### Refactoring Strategy
1. Add distance sorting to geo-search query: `sort_by: _geo_distance:asc`
2. Display distance in result cards (e.g., "0.5 km away")
3. Offer combined sort: text relevance + distance weighting
4. Test that nearest results appear first
5. Allow users to toggle distance sorting
### Detection Checklist
- [ ] Distance sorting implemented
- [ ] Nearest results appear first
- [ ] Distance displayed in result cards
- [ ] Combined relevance + distance sorting available
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Not Handling Edge Cases (No Coordinates, Invalid Coordinates)
### Category
Reliability | User Experience
### Description
Not handling records missing coordinates or having invalid coordinate values, causing geo-search errors or silent failures.
### Why It Happens
Geo-search implementation assumes all records have valid coordinates. Edge cases are not tested.
### Warning Signs
- Search errors when records have null coordinates
- Records with invalid lat/lng (-200, 500) break geo-queries
- No fallback for records without location data
- Geo-search returns fewer results than expected without explanation
### Why Harmful
Records with missing or invalid coordinates cause search errors or are silently excluded. Users don't know why some records are missing from geo-search.
### Consequences
- Incomplete geo-search results
- Search errors from coordinate validation failures
- Users don't see valid records that happen to lack coordinates
- Hard-to-diagnose geo-search issues
### Alternative
Validate coordinates during indexing. Provide fallback for records without location data.
### Refactoring Strategy
1. Add coordinate validation in `toSearchableArray()`
2. Skip geo-tagged indexing for records with invalid coordinates
3. Log coordinate validation failures for data cleanup
4. Provide fallback: show records without coordinates as "location unavailable"
5. Implement data cleanup process for missing coordinates
### Detection Checklist
- [ ] Coordinate validation implemented
- [ ] Records with invalid coordinates handled gracefully
- [ ] Fallback for records without location
- [ ] Coordinate validation failures logged
- [ ] Data cleanup process established
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
