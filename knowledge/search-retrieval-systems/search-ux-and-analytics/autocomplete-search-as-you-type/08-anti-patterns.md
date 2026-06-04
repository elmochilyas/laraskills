# ECC Anti-Patterns — Autocomplete / Search-as-You-Type
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Autocomplete / Search-as-You-Type | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Missing Debounce Implementation
2. No Minimum Characters Threshold
3. Too Many or Too Few Suggestions
4. Not Using Search Engine Native Autocomplete Features
5. No Cache Layer for Popular Completions
---
## Repository-Wide Anti-Patterns
- Triggering full search queries on every keystroke
- Not differentiating autocomplete suggestions from full search results
- Ignoring mobile performance for instant search
---
## Anti-Pattern 1: Missing Debounce Implementation
### Category
Performance | User Experience
### Description
Sending search requests on every keystroke without debouncing, overwhelming the search engine and causing a poor user experience.
### Why It Happens
Simple implementation: bind input change directly to search API call without delay logic.
### Warning Signs
- Network tab shows rapid-fire search requests on typing
- Server load spikes during peak typing periods
- Search UI becomes sluggish with too many responses
- Users type faster than results can update
### Why Harmful
Each keystroke triggers a full search request, multiplying server load by 5-10x per user session. The UI flickers with constant updates, and the search engine bears unnecessary query volume.
### Consequences
- Increased search engine costs (Algolia/Meilisearch charge per query)
- Higher server load from unnecessary queries
- Poor UX with flickering results as users type
- Rate limiting triggered on high-traffic search
### Alternative
Implement debouncing at 300ms so search fires only after the user pauses typing.
### Refactoring Strategy
1. Add `x-debounce.300ms` for Alpine.js or implement debounce utility
2. For Livewire: add `.debounce.300ms` to wire:model
3. For custom JS: implement debounce function wrapping fetch/axios call
4. Test that typing quickly produces only one search call after the pause
5. Monitor query volume reduction after debounce implementation
### Detection Checklist
- [ ] Debounce implemented at 300ms
- [ ] Rapid typing produces limited API calls
- [ ] Query volume benchmarked before/after debounce
- [ ] User experience smooth without flickering
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: No Minimum Characters Threshold
### Category
Performance | User Experience
### Description
Triggering search before the user has typed enough characters to produce meaningful results, generating noise and unnecessary cost.
### Why It Happens
Developers assume users will type full words and don't guard against short inputs.
### Warning Signs
- Autocomplete fires on single character input
- 1-2 character inputs return thousands of irrelevant results
- Search engine bill correlates with typing speed
- Users see constantly changing irrelevant suggestions
### Why Harmful
Single-character searches return everything and provide no value. They consume search engine quota, increase latency, and frustrate users with noise.
### Consequences
- Wasted search engine queries on non-meaningful input
- Users overwhelmed with broad suggestions
- Higher API costs from unnecessary queries
- Slower perceived performance due to many unhelpful responses
### Alternative
Set minimum 2-3 characters before triggering search.
### Refactoring Strategy
1. Add character count check before making API call
2. Set minimum to 2 for general search, 3 for SKU/code search
3. Show placeholder hint: "Type at least 3 characters"
4. Disable search button/input until minimum met
5. Test that 1-2 char inputs don't trigger API calls
### Detection Checklist
- [ ] Minimum 2-3 characters enforced
- [ ] API calls not triggered for short inputs
- [ ] Placeholder hint shown for minimum characters
- [ ] Search button disabled until minimum met
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Too Many or Too Few Suggestions
### Category
User Experience | Performance
### Description
Returning too many suggestions (overwhelming users) or too few (not providing value), failing to optimize the suggestion count.
### Why It Happens
Default configuration is rarely optimal. Teams don't test different suggestion counts with real users.
### Warning Signs
- Autocomplete dropdown shows 20+ suggestions
- Users scroll through long suggestion lists
- Only 1-2 suggestions shown despite many matches
- Users keep typing because suggestions aren't helpful
### Why Harmful
Too many suggestions overwhelm users and slow rendering. Too few suggestions provide no value, defeating the purpose of autocomplete.
### Consequences
- Users ignore the suggestion dropdown entirely
- Cognitive overload from too many choices
- Parallax effect of scrolling through suggestions distracts from typing
- Autocomplete feature becomes unused or disliked
### Alternative
Limit suggestions to 5-10, prioritized by popularity or relevance.
### Refactoring Strategy
1. Set suggestion limit in search query (size=5 to start)
2. Prioritize suggestions: popular queries first, then relevant matches
3. Test with real users: do they find suggestions useful?
4. Adjust limit based on user behavior data
5. Consider showing result counts ("Laptops (234)") for context
### Detection Checklist
- [ ] Suggestion limit set (5-10)
- [ ] Suggestions prioritized by popularity/relevance
- [ ] User testing conducted for suggestion usefulness
- [ ] Result counts shown for context
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Not Using Search Engine Native Autocomplete Features
### Category
Maintainability | Productivity
### Description
Building custom autocomplete logic when the search engine already provides built-in instant search capabilities.
### Why It Happens
Teams build custom solutions because they don't know about engine-native features or assume they need more customization.
### Warning Signs
- Custom autocomplete API endpoints in the Laravel app
- Manual query suggestion generation logic
- Ignoring Meilisearch instant search or Algolia InstantSearch
- Custom debounce and cache layer built from scratch
### Why Harmful
Engine-native autocomplete is optimized, maintained, and free. Custom implementations require ongoing maintenance, have unknown performance characteristics, and miss engine-specific optimizations.
### Consequences
- Development time building and maintaining custom solution
- Missing engine-specific speed optimizations
- Custom code may not handle edge cases the engine does
- Harder to upgrade search engine version
### Alternative
Use Meilisearch instant search, Algolia InstantSearch, or Typesense's built-in search-as-you-type.
### Refactoring Strategy
1. Check search engine documentation for instant search features
2. Replace custom autocomplete with engine-native solution
3. Use Scout callbacks to pass engine-specific parameters
4. Test that native solution meets customization needs
5. Remove custom autocomplete code
### Detection Checklist
- [ ] Engine-native autocomplete features used
- [ ] No custom autocomplete API endpoints
- [ ] Engine features meet autocomplete requirements
- [ ] Custom code removed where engine covers
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Skill: Custom Engine Development
---
## Anti-Pattern 5: No Cache Layer for Popular Completions
### Category
Performance | Cost
### Description
Not caching popular autocomplete suggestions, causing the same suggestion queries to hit the search engine repeatedly.
### Why It Happens
Autocomplete seems lightweight enough that caching appears unnecessary. Teams don't analyze query patterns to see the repetition.
### Warning Signs
- Same suggestion queries seen hundreds of times in logs
- Query volume dominated by popular prefix patterns
- Search engine costs scale with autocomplete usage
- No caching visible in autocomplete implementation
### Why Harmful
Popular completions are requested hundreds or thousands of times. Each request goes to the search engine, adding latency and cost for results that rarely change.
### Consequences
- Higher search engine costs from redundant queries
- Increased latency for popular suggestions
- Search engine load from repeated identical queries
- Wasted infrastructure capacity
### Alternative
Cache popular autocomplete suggestions with a short TTL (e.g., 60 seconds).
### Refactoring Strategy
1. Analyze autocomplete query logs to identify popular prefixes
2. Implement in-memory cache (Redis) for suggestion results
3. Set TTL of 60 seconds for cached completions
4. Invalidate cache when indexed data changes significantly
5. Monitor cache hit rate and adjust TTL
### Detection Checklist
- [ ] Cache layer implemented for popular completions
- [ ] Cache hit rate monitored
- [ ] TTL configured appropriately
- [ ] Cache invalidated on significant data changes
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
