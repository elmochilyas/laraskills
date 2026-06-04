# ECC Anti-Patterns — Meilisearch Faceted Search
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Meilisearch Faceted Search | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Not Declaring FilterableAttributes Before Indexing
2. Displaying All Facets Without Prioritization
3. Not Using Facet Stats for Numeric Attributes
4. Ignoring Facet Search for Large Value Lists
5. Not Ordering Facets by Relevance or Count
---
## Repository-Wide Anti-Patterns
- Declaring too many filterable attributes, impacting performance
- Not synchronizing facet configuration between environments
- Treating facet counts as precise rather than approximate
---
## Anti-Pattern 1: Not Declaring filterableAttributes Before Indexing
### Category
Data Quality | Reliability
### Description
Failing to declare attributes as `filterableAttributes` in Meilisearch index settings before importing data, making facet filtering and counts unavailable.
### Why It Happens
Filterable attributes must be explicitly configured. Unlike database columns, they aren't automatically searchable for filtering.
### Warning Signs
- Facet filter dropdowns show no options
- Facet counts always return zero
- Filtering by category/brand/price has no effect
- Meilisearch API errors about non-filterable attributes
### Why Harmful
Facet features silently fail. Users see filter UIs that don't work. The entire faceted search experience is broken despite correct indexing of data.
### Consequences
- Faceted search UI broken
- Users cannot drill down or filter results
- Development time wasted debugging non-obvious cause
- Re-indexing required after adding filterable attributes
### Alternative
Declare all needed filterable attributes in index settings before importing data.
### Refactoring Strategy
1. Update `scout.php` or Meilisearch index settings with `filterableAttributes`
2. List all fields needed for facet filtering
3. Re-index models to apply the schema change
4. Test facet filtering and counts
5. Add schema validation in deployment pipeline
### Detection Checklist
- [ ] All filterable attributes declared in index settings
- [ ] Facet filtering works for all declared attributes
- [ ] Facet counts return correct values
- [ ] Schema changes captured in deployment
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Displaying All Facets Without Prioritization
### Category
User Experience | Performance
### Description
Showing every available facet in the search UI without prioritization, overwhelming users with too many filtering options.
### Why It Happens
Developers dynamically render all available facets from the API response without curating which are most useful.
### Warning Signs
- 15+ facet categories displayed in filter UI
- Users scroll through extensive facet lists
- Low-importance facets shown alongside critical ones
- Filter UI takes up half the search page
### Why Harmful
Too many facets overload users with choices. They may ignore all filters or struggle to find the relevant ones. This reduces filter engagement and search satisfaction.
### Consequences
- Reduced filter usage due to overwhelming choices
- Cognitive overload from too many filter categories
- Poor mobile UX with extensive facet lists
- Less-used facets clutter the UI for everyone
### Alternative
Prioritize the top 3-5 most important facets. Expand additional facets under "More filters" or use a facet search pattern.
### Refactoring Strategy
1. Analyze facet usage from search analytics
2. Select top 3-5 facets that users interact with most
3. Display primary facets prominently
4. Add "More filters" expandable section for secondary facets
5. A/B test facet layout for engagement
### Detection Checklist
- [ ] Facets prioritized by importance
- [ ] Maximum 5-7 facets displayed by default
- [ ] Additional facets hidden behind expandable section
- [ ] Facet usage analyzed for prioritization
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Not Using Facet Stats for Numeric Attributes
### Category
User Experience | Functionality
### Description
Treating numeric attributes (price, rating, year) as regular facets instead of using Meilisearch's facet stats for range filtering.
### Why It Happens
Developers treat all facets uniformly without distinguishing between categorical and numeric attributes.
### Warning Signs
- Price shown as individual discrete values ($10, $20, $30, etc.)
- No price range slider in filter UI
- Numeric facets show hundreds of individual value options
- Rating displayed as individual star values
### Why Harmful
Numeric attributes as discrete facets produce hundreds of options (every price point, every year). Users cannot filter by range. The UX is terrible for numeric fields.
### Consequences
- Users cannot filter by price range or rating range
- Facet list is enormous and unusable for numeric fields
- Poor e-commerce search experience
- Users abandon filtered search due to unusable numeric facets
### Alternative
Use Meilisearch facet stats (min, max, sum) to implement range sliders for numeric attributes.
### Refactoring Strategy
1. Configure `facetStats` for numeric attributes in Meilisearch
2. Implement range slider UI using min/max from stats
3. Apply numeric range filters as filter expressions
4. Test range filtering for price, rating, year fields
5. Consider discrete numeric facets only for low-cardinality values
### Detection Checklist
- [ ] Numeric attributes use facet stats
- [ ] Range slider or min/max input implemented
- [ ] Numeric range filtering working
- [ ] No discrete value listing for high-cardinality numerics
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Ignoring Facet Search for Large Value Lists
### Category
User Experience | Performance
### Description
Not enabling facet search when facet values exceed 100+, forcing users to scroll through extensive flat lists.
### Why It Happens
Facet search is an opt-in feature. Default behavior displays all facet values as a flat list.
### Warning Signs
- Brand/category facet lists with 200+ values
- Users scroll through long alphabetic lists
- No search box within facet lists
- Mobile facet lists require extensive scrolling
### Why Harmful
Long flat facet lists are unusable. Users must scroll through hundreds of values to find what they need. This discourages facet usage entirely.
### Consequences
- Facet filters ignored due to long lists
- Users abandon drill-down navigation
- Poor mobile UX with scrolling through hundreds of items
- Users resort to typing unfiltered searches
### Alternative
Enable Meilisearch facet search for attributes with 100+ values, showing a search box within the facet.
### Refactoring Strategy
1. Identify facets with 100+ unique values
2. Enable `facetSearch` for those attributes
3. Add search box in facet UI for these attributes
4. Show top 5-10 matching values with search-as-you-type
5. Test with large brand/category lists
### Detection Checklist
- [ ] High-cardinality facets identified
- [ ] Facet search enabled for 100+ value facets
- [ ] Search box shown in facet UI
- [ ] Users can type to find specific facet values
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Not Ordering Facets by Relevance or Count
### Category
User Experience | Data Quality
### Description
Displaying facet values in alphabetical or arbitrary order instead of by count (most popular first), making relevant filters harder to find.
### Why It Happens
Meilisearch returns facet values in alphabetical order by default. No explicit ordering is configured.
### Warning Signs
- "Other" category appears first in facet list
- Low-count facet values shown before popular ones
- Users must scroll past irrelevant values to find popular ones
- Facet values in alphabetical order regardless of popularity
### Why Harmful
Alphabetical ordering ignores what's relevant to the user. Popular values that most users filter by are buried in the middle of the list. Users must scan all values to find what they need.
### Consequences
- Reduced facet engagement
- Users don't discover popular filtering options
- Increased time to find desired filter value
- Poor UX for frequently used facet values
### Alternative
Order facet values by count descending. Show most popular values first.
### Refactoring Strategy
1. Configure facet ordering to sort by count descending
2. Show "popular" facet values as default view
3. Optionally show "show all" for complete alphabetical list
4. Test that most popular values appear first
5. Monitor facet click-through rates by position
### Detection Checklist
- [ ] Facet values ordered by count descending
- [ ] Most popular values appear first
- [ ] "Show all" option available if needed
- [ ] Facet engagement monitored
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
