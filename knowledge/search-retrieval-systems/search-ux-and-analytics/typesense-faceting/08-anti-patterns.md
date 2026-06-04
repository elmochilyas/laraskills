# ECC Anti-Patterns — Typesense Faceting
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Typesense Faceting | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Not Declaring Facetable Fields in Schema
2. Displaying Too Many Facet Values
3. Not Using Facet Search for Large Value Lists
4. Not Ordering Facets by Count
5. Not Combining Facets with Sort
---
## Repository-Wide Anti-Patterns
- Using facet for static fields that never change
- Not updating facet counts when filters are applied
- Hardcoding facet configuration per-collection instead of using shared patterns
---
## Anti-Pattern 1: Not Declaring Facetable Fields in Schema
### Category
Data Quality | Reliability
### Description
Failing to set `facet: true` in the Typesense collection schema for filterable attributes, making faceting impossible for those fields.
### Why It Happens
Facetable fields require explicit schema configuration before indexing. Unlike database columns, they aren't automatically facetable.
### Warning Signs
- Facet counts always return zero
- No facet options in search UI
- Filter dropdowns empty despite data existing
- Filtering by facets has no effect on results
### Why Harmful
Faceting silently fails. Users see a filter UI that doesn't work. The entire faceted search experience is broken due to missing schema declaration.
### Consequences
- Faceted search features non-functional
- Development time debugging non-obvious cause
- Re-indexing required after schema update
- Users confused by broken filter controls
### Alternative
Declare all filterable fields with `facet: true` in the Typesense collection schema before importing data.
### Refactoring Strategy
1. Update collection schema to include `facet: true` on all filterable fields
2. Re-index models to apply schema changes
3. Test facet counts and filtering
4. Add schema validation to deployment pipeline
5. Document facet schema configuration
### Detection Checklist
- [ ] facet: true declared on all filterable fields
- [ ] Facet counts returned correctly
- [ ] Facet filtering functional
- [ ] Schema configuration documented
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Displaying Too Many Facet Values
### Category
User Experience | Performance
### Description
Returning and displaying all facet values (potentially hundreds) instead of limiting to the most relevant ones, overwhelming users.
### Why It Happens
Default behavior returns all facet values. No limit is configured.
### Warning Signs
- Brand facet shows 500+ values
- Category facet list requires scrolling
- Filter UI dominated by long facet lists
- Mobile users must scroll extensively through facets
### Why Harmful
Too many facet values overwhelm users and make the filter UI unusable. Users cannot find the value they want among hundreds of options.
### Consequences
- Low facet engagement
- Users ignore filters entirely
- Poor mobile experience with long lists
- Cognitive overload from too many choices
### Alternative
Limit displayed facet values to the top 10 most popular, with a "show all" option.
### Refactoring Strategy
1. Configure facet value limit in Typesense query
2. Default: show top 10 facet values by count
3. Add "Show all N values" expandable option
4. Order facet values by count descending
5. Test facet UI usability with real data
### Detection Checklist
- [ ] Facet values limited to 10-20 by default
- [ ] "Show all" option available
- [ ] Values ordered by count descending
- [ ] Mobile facet usability verified
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Not Using Facet Search for Large Value Lists
### Category
User Experience | Functionality
### Description
Not enabling facet search for facets with 100+ values, forcing users to scroll through unsearchable long lists.
### Why It Happens
Facet search requires explicit configuration. Default list display works for small value sets.
### Warning Signs
- Brand/category facets with 100+ values but no search box
- Users scroll through long lists to find values
- No text input for filtering facet values
- Mobile: facet list is unmanageably long
### Why Harmful
Long non-searchable facet lists are unusable. Users cannot efficiently find specific values among hundreds of options.
### Consequences
- Facets ignored by users
- Poor user experience for high-cardinality facets
- Users resort to typing unfiltered searches
- Filter engagement low
### Alternative
Enable facet search for facets with 100+ values, showing a search box within the facet.
### Refactoring Strategy
1. Identify facets with 100+ unique values
2. Enable Typesense facet search for those fields
3. Add search input in facet UI
4. Show top 5-10 matching values as user types
5. Test with large brand/category lists
### Detection Checklist
- [ ] High-cardinality facets identified
- [ ] Facet search enabled
- [ ] Search box shown in facet UI
- [ ] Users can search within facet values
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Not Ordering Facets by Count
### Category
User Experience | Data Quality
### Description
Displaying facet values in alphabetical order instead of by result count, hiding popular filtering options behind less relevant ones.
### Why It Happens
Alphabetical is the default sorting. Developers don't configure count-based ordering.
### Warning Signs
- Facet values in alphabetical order
- Low-count values shown before popular ones
- "Other" category appears first
- Users scroll past irrelevant values to find common ones
### Why Harmful
Popular facet values that most users filter by are buried in alphabetical order. Users must scan past less relevant options to find what they need.
### Consequences
- Reduced facet engagement
- Users don't discover popular filter options
- Filtering takes longer than necessary
- Frustration from scrolling past irrelevant values
### Alternative
Order facet values by count descending. Show most popular values first.
### Refactoring Strategy
1. Configure facet value sorting to use count descending
2. Test: most popular values appear first
3. Consider alphabetical as secondary sort for equal counts
4. Monitor facet click-through by position
5. Allow users to toggle between count and alphabetical if needed
### Detection Checklist
- [ ] Facet values ordered by count descending
- [ ] Most popular values appear first
- [ ] Facet engagement monitored by position
- [ ] Toggle option available if needed
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Not Combining Facets with Sort
### Category
User Experience | Functionality
### Description
Providing facets and filtering without allowing users to sort within filtered results, forcing them to accept default ordering.
### Why It Happens
Facet implementation focuses on narrowing results. Sort functionality is treated as a separate feature.
### Warning Signs
- Filtered results always in default order
- No sort options when facets are active
- Users cannot sort by price, date, or popularity within filtered results
- Sort controls disappear when facets are selected
### Why Harmful
Users who filter by category want to sort within that category. Without sort, they accept default ranking that may not match their priority (cheapest, newest, most popular).
### Consequences
- Reduced user control over result ordering
- Poor e-commerce search experience (can't sort by price)
- Users abandon filtered search for browsing
- Filter-sort combination expected but missing
### Alternative
Combine facets with sort options. When filters are active, allow users to sort results within the filtered set.
### Refactoring Strategy
1. Add sort options to search UI (price, date, popularity)
2. Pass sort parameter to Typesense query via Scout callback
3. Verify sort works within filtered (faceted) results
4. Combine `filter_by` with `sort_by` parameters
5. Test all facet + sort combinations
### Detection Checklist
- [ ] Sort options available with facets
- [ ] Sort works within filtered results
- [ ] All facet + sort combinations functional
- [ ] Sort parameters passed correctly to Typesense
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
