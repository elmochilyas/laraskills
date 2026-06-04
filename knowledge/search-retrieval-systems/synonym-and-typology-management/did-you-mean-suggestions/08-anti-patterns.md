# ECC Anti-Patterns — Did-You-Mean Suggestions
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Synonym and Typology Management | Knowledge Unit | Did-You-Mean Suggestions | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Building Custom Spell Correction When Engine Typo Tolerance Exists
2. Not Tracking Zero-Result Queries for Suggestion Candidates
3. Not Displaying "Did You Mean" for Failed Searches
4. No Suggestion CTR Monitoring
5. Not Caching Popular Suggestions
---
## Repository-Wide Anti-Patterns
- Implementing suggestion logic in the frontend instead of the search service
- Not falling through to original query when suggestions produce worse results
- Using LLM for suggestion generation when pattern-based approaches suffice
---
## Anti-Pattern 1: Building Custom Spell Correction When Engine Typo Tolerance Exists
### Category
Productivity | Maintainability
### Description
Implementing custom spelling correction (Levenshtein, n-gram) in PHP when the search engine already provides built-in typo tolerance that handles most misspellings automatically.
### Why It Happens
Developers don't know about engine typo tolerance or think custom implementation gives more control.
### Warning Signs
- Custom PHP Levenshtein implementation for spell correction
- Manual dictionary of correct spellings
- No use of Meilisearch/ Typesense/Algolia typo tolerance
- Custom correction code that duplicates engine functionality
### Why Harmful
Engine typo tolerance is optimized, well-tested, and requires no maintenance. Custom implementations add code to maintain, bugs to fix, and often perform worse than engine-native solutions.
### Consequences
- Duplicate effort maintaining custom spell correction
- Lower accuracy than engine-native typo tolerance
- Performance overhead from PHP-based correction
- Missed improvements from engine typo tolerance updates
### Alternative
Enable and configure the search engine's built-in typo tolerance before considering custom implementations.
### Refactoring Strategy
1. Enable typo tolerance in search engine configuration
2. Remove custom PHP spell correction code
3. Test that common misspellings are handled by engine
4. Keep custom suggestions only for cases engine cannot handle
5. Add Scout callbacks to pass typo tolerance parameters
### Detection Checklist
- [ ] Engine typo tolerance enabled
- [ ] Custom spell correction removed or minimized
- [ ] Common misspellings handled by engine
- [ ] Custom code only for edge cases engine misses
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 2: Not Tracking Zero-Result Queries for Suggestion Candidates
### Category
Data Quality | Process
### Description
Not logging zero-result queries to identify candidates for "did you mean" suggestions, missing the most obvious source of suggestion data.
### Why It Happens
Analytics tracking is set up for general search metrics, not specifically for zero-result analysis.
### Warning Signs
- Zero-result queries not logged
- No list of queries needing "did you mean" suggestions
- Same zero-result queries persist without correction
- Suggestion candidates guessed instead of data-driven
### Why Harmful
Zero-result queries are the best source of "did you mean" candidates. Without tracking them, you're guessing what suggestions users need rather than using actual failure data.
### Consequences
- Suggestion coverage misses most-needed corrections
- Users continue to hit zero-result queries without help
- Content gaps remain unidentified
- Suggestion effort wasted on irrelevant candidates
### Alternative
Log all zero-result queries and use them as the primary source for "did you mean" suggestions.
### Refactoring Strategy
1. Add zero-result query logging to search service
2. Review zero-result queries regularly
3. Identify common misspellings from the log
4. Add synonyms or typo tolerance corrections
5. Track suggestion effectiveness
### Detection Checklist
- [ ] Zero-result queries logged
- [ ] Regular review of zero-result queries
- [ ] Suggestions derived from actual user failures
- [ ] Suggestion effectiveness tracked
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Not Displaying "Did You Mean" for Failed Searches
### Category
User Experience | Functionality
### Description
Not showing any "did you mean" suggestion on zero-result pages, leaving users with no help for misspelled or incorrect queries.
### Why It Happens
Teams handle zero-result display but don't implement suggestion logic alongside it.
### Warning Signs
- Zero-result pages show no suggestions
- Users must manually retype queries
- No "Showing results for X instead" message
- Misspelled queries return empty with no correction
### Why Harmful
Users who make typos get no help finding what they need. They must guess the correct spelling or abandon the search entirely.
### Consequences
- Users abandon after first failed search
- High zero-result rate from correctable misspellings
- Poor UX for common typos
- Missed opportunity to guide users
### Alternative
Show a "Did you mean: [suggestion]?" message on zero-result queries when a close match is found.
### Refactoring Strategy
1. Implement suggestion lookup on zero-result paths
2. Check close matches via typo tolerance or suggestion API
3. Display "Showing results for [suggestion]. Search for [original] instead?"
4. Track suggestion click-through rate
5. Handle case where suggestion has more results than original
### Detection Checklist
- [ ] "Did you mean" shown on zero results
- [ ] Suggestions relevant to original query
- [ ] Users can accept suggestion or keep original
- [ ] Suggestion CTR monitored
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 4: No Suggestion CTR Monitoring
### Category
Data Quality | Process
### Description
Implementing "did you mean" suggestions but not tracking whether users actually click them, operating without feedback on suggestion quality.
### Why It Happens
Suggestion display is implemented as a UI feature. Analytics tracking for suggestion clicks is overlooked.
### Warning Signs
- No click tracking on "did you mean" suggestions
- Unknown suggestion effectiveness
- Same poor suggestions shown repeatedly
- No data to improve suggestion quality
### Why Harmful
Without CTR monitoring, you cannot tell if suggestions help or confuse users. Bad suggestions that users ignore provide no value but still consume resources.
### Consequences
- Low-quality suggestions persist
- No feedback loop for suggestion improvement
- Resources wasted on ineffective suggestions
- Missed signal for search quality improvement
### Alternative
Track suggestion impressions and clicks. Use CTR to evaluate and improve suggestion quality.
### Refactoring Strategy
1. Add click tracking to suggestion UI elements
2. Log suggestion shown and suggestion clicked events
3. Calculate suggestion CTR = clicks / impressions
4. Review low-CTR suggestions for improvement
5. A/B test suggestion format and placement
### Detection Checklist
- [ ] Suggestion CTR tracked
- [ ] Low-CTR suggestions identified and improved
- [ ] Suggestion improvement driven by data
- [ ] A/B testing for suggestion optimization
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Not Caching Popular Suggestions
### Category
Performance | Cost
### Description
Computing "did you mean" suggestions on every zero-result query without caching, causing redundant computation for popular misspellings.
### Why It Happens
Suggestion computation seems lightweight. Teams don't consider that the same misspellings occur thousands of times.
### Warning Signs
- Same suggestion computed repeatedly for identical queries
- Suggestion computation visible in search profiling
- Popular misspellings generate suggestion lookups every time
- No cache layer for suggestion results
### Why Harmful
Popular misspellings (e.g., "teh" → "the") occur thousands of times. Computing suggestions each time is wasteful and adds latency to every zero-result query.
### Consequences
- Unnecessary server load from redundant suggestion computation
- Higher latency for zero-result queries
- Wasted infrastructure capacity
- Suggestion computation costs at scale
### Alternative
Cache suggestion results for common queries with a reasonable TTL.
### Refactoring Strategy
1. Identify most common queries needing suggestions from logs
2. Cache suggestion results with 1-hour TTL
3. Use normalized query as cache key
4. Invalidate cache when synonym/typo configurations change
5. Monitor cache hit ratio for suggestion lookups
### Detection Checklist
- [ ] Suggestion results cached
- [ ] Cache hit ratio monitored
- [ ] Cache invalidation on configuration changes
- [ ] Suggestion latency improved with caching
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
