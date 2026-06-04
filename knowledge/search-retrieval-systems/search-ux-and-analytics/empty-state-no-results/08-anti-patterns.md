# ECC Anti-Patterns — Empty State / No Results
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Empty State / No Results | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Showing Blank Page on Zero Results
2. Not Logging Zero-Result Queries
3. No Query Suggestions or "Did You Mean" Feature
4. No Broader Search Alternatives
5. No Call to Action on Empty Results
---
## Repository-Wide Anti-Patterns
- Treating no-results as a user error rather than a UX opportunity
- Applying the same empty state for all no-result scenarios
- Not tying empty state improvements to metrics
---
## Anti-Pattern 1: Showing Blank Page on Zero Results
### Category
User Experience | Accessibility
### Description
Displaying a blank search results page when no matches are found, providing no feedback or guidance to the user.
### Why It Happens
Developers handle the empty results case with minimal code - just returning an empty collection. The UI receives an empty list and renders nothing.
### Warning Signs
- Search returns empty white page with no content
- Users must use browser back button to recover
- No message, no suggestions, no alternative actions
- Error boundaries or empty states not implemented
### Why Harmful
A blank page gives no information about what went wrong. Users don't know if the search failed, their query was bad, or nothing exists. This is the most frustrating search UX pattern.
### Consequences
- Users immediately abandon the search
- No guidance on how to find what they need
- Search is perceived as broken or useless
- High bounce rate on no-result pages
### Alternative
Always show a friendly message, suggestions, and alternative actions on zero results.
### Refactoring Strategy
1. Detect empty result set in controller
2. Return view with empty state instead of blank
3. Include: friendly message, suggestions, popular alternatives
4. Style empty state with illustration or icon
5. Test with real no-result queries
### Detection Checklist
- [ ] Blank page never appears for zero results
- [ ] Friendly message shown
- [ ] Suggestions provided
- [ ] Alternative actions available
- [ ] Mobile empty state also handled
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 2: Not Logging Zero-Result Queries
### Category
Data Quality | Process
### Description
Not tracking or logging queries that return zero results, losing valuable signals about content gaps and search quality issues.
### Why It Happens
Analytics integration focuses on successful searches. Zero-result queries are an afterthought.
### Warning Signs
- No dashboard for zero-result queries
- Teams unaware of what searches fail most
- Same zero-result queries persist for months
- No content gap analysis process
### Why Harmful
Every zero-result query is a data point about what users want but can't find. Without logging, these insights are lost. Content gaps remain unfilled, and search quality doesn't improve.
### Consequences
- Persistent content gaps unknown to the team
- Users repeatedly fail to find what they need
- No data-driven prioritization for new content
- Missed business opportunities
### Alternative
Log all zero-result queries with frequency, analyze patterns, and create a review process.
### Refactoring Strategy
1. Add zero-result query logging in search service
2. Store query, timestamp, user segment, filter context
3. Create weekly report of top zero-result queries
4. Categorize: typos, content gaps, obscure terms
5. Create action items for each category
### Detection Checklist
- [ ] Zero-result queries logged
- [ ] Frequency tracking implemented
- [ ] Review process established
- [ ] Content gaps addressed regularly
- [ ] Zero-result rate trend monitored
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: No Query Suggestions or "Did You Mean" Feature
### Category
User Experience | Data Quality
### Description
Not providing query suggestions or "did you mean" corrections on no-result pages, leaving users to guess how to rephrase their search.
### Why It Happens
Query suggestion logic requires additional configuration (synonyms, typo tolerance, popular queries). Teams skip it as non-essential.
### Warning Signs
- No "did you mean" shown for obvious typos
- Users must manually correct spelling
- Popular queries not shown as alternatives
- No alternative query suggestions on zero results
### Why Harmful
Users who make a typo or use non-standard terminology get no help finding what they need. They must guess the right search terms, leading to frustration and abandonment.
### Consequences
- Users abandon after first failed search attempt
- Obvious typos not corrected for users
- High zero-result rate from common spelling errors
- Poor experience for non-expert users
### Alternative
Show "did you mean" suggestions and alternative popular queries on zero results.
### Refactoring Strategy
1. Configure synonym sets for common misspellings
2. Implement typo tolerance in search engine
3. Show "Did you mean: [corrected query]" on zero results
4. Display popular/trending searches as alternatives
5. A/B test suggestion effectiveness
### Detection Checklist
- [ ] "Did you mean" suggestions implemented
- [ ] Synonym sets configured for common misspellings
- [ ] Popular queries shown on zero results
- [ ] Suggestion effectiveness measured
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 4: No Broader Search Alternatives
### Category
User Experience | Data Quality
### Description
Not offering broader search options when filters or specific queries return zero results, forcing users to manually revert filters.
### Why It Happens
Search views assume users will manage their own filter combinations.
### Warning Signs
- Users must clear filters manually to get results
- No "show all in category" button on zero results
- No filter relaxation suggestions
- Filtered search with zero results shows no alternatives
### Why Harmful
When filters over-constrain results, users have to manually figure out which filter to remove. This requires understanding which filter is the most restrictive - a burden on the user.
### Consequences
- Users remove all filters instead of the right one
- Abandonment when users don't know how to fix
- Poor experience for faceted search
- Reduced engagement with filtering features
### Alternative
Show "Try removing filters" or "Show results in [broader category]" on zero results.
### Refactoring Strategy
1. Detect when filters cause zero results
2. Show "Searching in all categories" or "Remove filters" link
3. Suggest removing the most restrictive filter first
4. Show unfiltered popular results as alternatives
5. Implement iterative filter relaxation
### Detection Checklist
- [ ] Filter relaxation suggestions shown on zero results
- [ ] "Remove filters" link provided
- [ ] Most restrictive filter identified and suggested for removal
- [ ] Unfiltered alternatives shown
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 5: No Call to Action on Empty Results
### Category
User Experience | Conversion
### Description
Not providing any actionable next step on the no-results page, leaving users in a dead end with no way forward.
### Why It Happens
Developers consider the empty state handled once a message is shown. They don't think about what the user should do next.
### Warning Signs
- Empty state shows message but no buttons or links
- Users must use browser back to continue
- No contact/support option on no results
- No way to report missing content
### Why Harmful
When search fails and no next step is offered, users feel stuck. They cannot report the missing content, contact support, or find an alternative path.
### Consequences
- Lost users who would have contacted support
- Missing content never reported to the team
- Negative brand perception from dead-end UX
- No feedback loop for search quality improvement
### Alternative
Provide actionable next steps: contact support, report missing content, browse popular categories, or try a different search.
### Refactoring Strategy
1. Add "Contact Us" button on no-results page
2. Add "Suggest this product" or "Report missing item" link
3. Show popular categories as alternative browsing options
4. Include search tips: "Try fewer words, use broader terms"
5. Track which CTAs users click for UX optimization
### Detection Checklist
- [ ] Contact/support option on no results
- [ ] Missing content reporting mechanism
- [ ] Popular alternatives shown
- [ ] Search tips displayed
- [ ] CTA click tracking implemented
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
