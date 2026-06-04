# ECC Anti-Patterns — Algolia Geo-Search
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Algolia Geo-Search | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Missing _geoloc in toSearchableArray
2. Fixed Radius Without Fallback
3. Not Combining Geo with Facet Filters
4. Ignoring aroundPrecision for Location Grouping
5. Geo-Search Without User Location Detection
---
## Repository-Wide Anti-Patterns
- Hardcoding geo-parameters instead of making them configurable
- Not handling cases where user location is unavailable
- Treating geo-rank as separate from relevance ranking
---
## Anti-Pattern 1: Missing _geoloc in toSearchableArray
### Category
Data Quality | Reliability
### Description
Not including `_geoloc` data in the `toSearchableArray()` return value, making geo-search impossible despite having location data in the database.
### Why It Happens
Developers forget to add `_geoloc` as a computed field in the searchable array since it's not a database column but a composite attribute.
### Warning Signs
- Geo-search parameters passed but have no effect
- Location data in database but not searchable
- Search results not filtered or ranked by distance
- `_geoloc` field absent from indexed data
### Why Harmful
Geo-search silently fails. Developers think geo-filtering is active but results are unfiltered. Users see out-of-area results without understanding why.
### Consequences
- Geo-filtering appears broken
- Users see irrelevant location results
- Debugging consumes time because the cause is non-obvious
- Re-indexing required to fix
### Alternative
Always include `_geoloc` as a computed attribute in `toSearchableArray()` when location-based search is needed.
### Refactoring Strategy
1. Add `_geoloc` computation in `toSearchableArray()`:
   `'_geoloc' => ['lat' => $this->latitude, 'lng' => $this->longitude]`
2. Re-index models to include geo data
3. Test geo-search with known coordinates
4. Verify geo-filtering returns expected results
### Detection Checklist
- [ ] _geoloc included in toSearchableArray
- [ ] Latitude and longitude populated for all records
- [ ] Geo-search tested with known coordinates
- [ ] Re-indexed after adding _geoloc
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Fixed Radius Without Fallback
### Category
User Experience | Data Quality
### Description
Setting a fixed search radius without a fallback or expansion mechanism, resulting in too few or zero results in low-density areas.
### Why It Happens
Developers set a radius that works for dense urban areas and don't consider rural or low-density locations.
### Warning Signs
- Zero results in rural areas despite matching inventory
- Same radius for all locations regardless of density
- Users in low-density areas see no results
- No radius expansion logic implemented
### Why Harmful
Users in low-density areas get empty results despite relevant inventory existing slightly beyond the fixed radius. This creates a poor experience for a significant portion of users.
### Consequences
- Lost customers in less-dense areas
- Inconsistent search experience by location
- Users assume the business has no presence in their area
- Support requests from users outside urban centers
### Alternative
Implement radius expansion: start with a reasonable radius, expand gradually if too few results, with a maximum cap.
### Refactoring Strategy
1. Set initial radius based on use case (e.g., 10km for restaurants, 50km for services)
2. If results < minimum threshold, expand radius by 50%
3. Continue expanding until minimum results met or max radius reached
4. Show "expanded search area" notice to users
5. Monitor radius expansion frequency
### Detection Checklist
- [ ] Radius fallback/expansion implemented
- [ ] Different radius for different location densities
- [ ] Minimum result threshold defined
- [ ] Radius expansion notice shown to users
- [ ] Expansion frequency monitored
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Not Combining Geo with Facet Filters
### Category
User Experience | Accuracy
### Description
Using geo-search without combining with category, price, or other facet filters, forcing users to sort through irrelevant results within the radius.
### Why It Happens
Geo-search is implemented as a standalone feature. Facet integration is treated as a separate concern.
### Warning Signs
- Geo-filtered results show all categories without filtering
- Users must scroll past irrelevant types within the area
- Facet filters and geo-filter not combined in search UI
- Search API handles geo and facets separately
### Why Harmful
Users looking for specific services within a radius get all results in the area. They must mentally filter results instead of using the UI, creating friction.
### Consequences
- Poor user experience for combined location + category searches
- Users abandon search due to irrelevant results
- Missed opportunity for richer search queries
- Facet and geo implementation silos
### Alternative
Combine geo-parameters with facet filters in the same Scout callback to enable location + category searches.
### Refactoring Strategy
1. Add facet filters alongside geo parameters in Scout callback
2. Create search UI combining location input with facet selection
3. Test combined queries: location + category + price range
4. Ensure facet counts reflect geo-filtered results
### Detection Checklist
- [ ] Geo and facet filters combined in Scout callbacks
- [ ] Search UI combines location input with facets
- [ ] Combined queries tested
- [ ] Facet counts accurate within geo scope
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Ignoring aroundPrecision for Location Grouping
### Category
User Experience | Data Quality
### Description
Not using `aroundPrecision` to group nearby locations, showing many results at slightly different distances instead of meaningful location groups.
### Why It Happens
Developers don't know about `aroundPrecision` or think exact distance display is more useful for users.
### Warning Signs
- Results list shows many entries at 0.1km, 0.2km, 0.3km differences
- Same street or building appears as multiple entries
- No location grouping in search results
- Users complain about repetitive nearby results
### Why Harmful
Showing every nearby location individually clutters results and hides diversity. Users see 10 results in one neighborhood instead of 1 per neighborhood.
### Consequences
- Cluttered search results
- Reduced result diversity at the neighborhood level
- Poor mobile experience with many close-distance entries
- Users miss varied results due to same-location clustering
### Alternative
Use `aroundPrecision` to group results by city block, neighborhood, or district.
### Refactoring Strategy
1. Determine appropriate precision based on location density
2. Set `aroundPrecision` in Scout callback (e.g., 100m for urban, 1000m for rural)
3. Test grouping behavior with known nearby locations
4. Review grouped results for appropriateness
5. Consider dynamic precision based on location density
### Detection Checklist
- [ ] aroundPrecision configured appropriately
- [ ] Results grouped by meaningful location boundaries
- [ ] Grouping tested for over/under aggregation
- [ ] Dynamic precision considered
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Geo-Search Without User Location Detection
### Category
User Experience | Technology
### Description
Requiring users to manually enter location for geo-search instead of detecting their location automatically, adding friction to the search experience.
### Why It Happens
Developers avoid browser location APIs due to permission concerns or assume manual entry is simpler.
### Warning Signs
- Users must type city/zip code to search near them
- No "near me" or location detection feature
- High drop-off on search pages requiring location input
- Mobile users not offered automatic location detection
### Why Harmful
Manual location entry adds friction. Users on mobile are used to automatic location detection. Forcing manual entry reduces search usage and satisfaction.
### Consequences
- Lower search engagement on mobile
- Users abandon search rather than enter location
- Missed convenience advantage of geo-search
- Higher bounce rate on location-dependent searches
### Alternative
Use browser Geolocation API or IP-based location detection as default, with manual override.
### Refactoring Strategy
1. Implement browser Geolocation API for automatic detection
2. Add IP-based fallback when browser location unavailable
3. Allow manual location override with autocomplete
4. Cache user's last known location for repeat visits
5. Surface "Near Me" button prominently
### Detection Checklist
- [ ] Browser Geolocation API implemented
- [ ] IP-based location fallback configured
- [ ] Manual location override available
- [ ] User location cached for repeat visits
- [ ] "Near Me" option prominently displayed
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Skill: Custom Engine Development
