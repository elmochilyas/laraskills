# ECC Anti-Patterns — Instant Search with Alpine.js
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Instant Search with Alpine.js | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Missing Debounce on Input
2. Not Handling Click-Away Behavior
3. No Loading State During API Calls
4. Ignoring Empty Response Handling
5. No Minimum Characters Before Search
---
## Repository-Wide Anti-Patterns
- Using Alpine for complex search that needs server-side state
- Not separating search concerns from UI components
- Inconsistent search UX between Alpine and Livewire components
---
## Anti-Pattern 1: Missing Debounce on Input
### Category
Performance | User Experience
### Description
Binding search input directly to API call without `x-debounce`, triggering requests on every keystroke.
### Why It Happens
Simple Alpine binding `x-model="query"` with `@input` listener fires on every character change.
### Warning Signs
- Network requests fire on every keystroke
- Search results flicker with each character typed
- API rate limits hit during normal search use
- Slow typing produces visible lag
### Why Harmful
Each keystroke triggers a full search API call. For a 10-character query, this means 10 API calls instead of 1. Server load multiplies, and the UI churns with constant reloads.
### Consequences
- 10x query volume increase from rapid typing
- Search engine cost spikes
- Poor mobile experience (battery, data usage)
- API rate limiting blocking legitimate searches
### Alternative
Apply `x-debounce.300ms` to the input binding for search.
### Refactoring Strategy
1. Add `x-on:input.debounce.300ms="search()"` to search input
2. Or use `x-model.debounce.300ms="query"`
3. Test typing speed and verify single API call after pause
4. Validate no queries fired during rapid typing
5. Monitor query volume reduction
### Detection Checklist
- [ ] x-debounce.300ms applied to search input
- [ ] Rapid typing produces one API call
- [ ] Query volume reduced vs pre-debounce
- [ ] UX smooth without flickering
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Not Handling Click-Away Behavior
### Category
User Experience | Accessibility
### Description
Not closing the search results dropdown when the user clicks outside, leaving results visible and blocking other page interactions.
### Why It Happens
Dropdown visibility toggles only on input focus/blur, not on general click-away.
### Warning Signs
- Search dropdown stays open after clicking elsewhere
- Users must click the search input again to close
- Dropdown overlaps other page elements
- Mobile: dropdown covers the entire screen
### Why Harmful
Persistent dropdown blocks users from interacting with other page elements. It creates a frustrating "stuck" feeling where search results won't go away.
### Consequences
- Users frustrated by persistent dropdown
- Dropdown covers important page content
- Users click away repeatedly without effect
- Mobile users particularly affected
### Alternative
Use `x-on:click.away="open = false"` to close the dropdown on outside clicks.
### Refactoring Strategy
1. Add `x-on:click.away="resultsOpen = false"` to the search component
2. Also close on Escape key with `x-on:keydown.escape`
3. Test: click elsewhere, verify dropdown closes
4. Test: click inside dropdown, verify it stays open
5. Test: Escape key closes dropdown
### Detection Checklist
- [ ] Click-away closes dropdown
- [ ] Escape key closes dropdown
- [ ] Inside-dropdown clicks don't close it
- [ ] Mobile click-away works correctly
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: No Loading State During API Calls
### Category
User Experience | Accessibility
### Description
Not showing a loading indicator while the search API call is in progress, leaving users uncertain about whether their search is processing.
### Why It Happens
Developers assume API calls are fast enough to not need loading states. This breaks during network latency or high load.
### Warning Signs
- Delay between typing and results with no visual feedback
- Users type more because they think the search didn't fire
- "Stale" results shown while new search loads
- No loading spinner or skeleton in the dropdown
### Why Harmful
Users don't know if the search is working. They may retype, double-click, or leave while waiting. Stale results confuse users who think old results are new.
### Consequences
- Users retype queries thinking search didn't work
- Multiple unnecessary API calls from retyping
- Poor perceived performance even with fast API
- Accessibility gap: no loading announcement for screen readers
### Alternative
Show a loading indicator (spinner or skeleton) during API calls, clear or dim stale results.
### Refactoring Strategy
1. Add loading state variable `loading = false`
2. Set `loading = true` before API call, `false` after
3. Show spinner in dropdown when loading
4. Dim or hide stale results during loading
5. Add `aria-busy="true"` for accessibility
### Detection Checklist
- [ ] Loading state shown during API calls
- [ ] Spinner or skeleton in dropdown
- [ ] Stale results dimmed during loading
- [ ] Accessibility attributes set
- [ ] Smooth transition between states
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Ignoring Empty Response Handling
### Category
User Experience | Data Quality
### Description
Not handling the case where the search API returns zero results, leaving the dropdown open with no content or showing no feedback.
### Why It Happens
Developers focus on the happy path of populated results and forget the empty state within the dropdown.
### Warning Signs
- Dropdown disappears or shows nothing on zero results
- No "no results found" message in dropdown
- Users uncertain if search produced any results
- Empty dropdown remains open with no content
### Why Harmful
An empty dropdown with no message is ambiguous. Users don't know if the search failed or just returned no results. They may keep typing or abandon.
### Consequences
- Users confused by empty dropdown behavior
- No guidance on what to do next
- Missed opportunity to suggest alternatives
- Search appears broken for valid but no-result queries
### Alternative
Show "No results found for [query]" with suggestions for broader search or popular queries.
### Refactoring Strategy
1. Detect empty results in search response
2. Show message: "No results for '[query]'"
3. Provide alternatives: "Try broader terms" or "Browse popular"
4. Keep dropdown open with the message
5. Style empty state message clearly
### Detection Checklist
- [ ] Empty results handled in dropdown
- [ ] Clear message shown for zero results
- [ ] Alternatives or suggestions provided
- [ ] Dropdown remains visible with message
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: No Minimum Characters Before Search
### Category
Performance | User Experience
### Description
Triggering API search before the user has typed enough characters, returning overly broad results and wasting queries.
### Why It Happens
Direct binding with no guard condition. Search fires immediately on any input change.
### Warning Signs
- Search fires on 1-2 character inputs
- Single letter returns thousands of results
- API calls for empty or near-empty input
- Search engine costs linked to input character count
### Why Harmful
1-2 character searches are almost never useful. They return broad, non-specific results and consume API quota. Users get no value from these searches.
### Consequences
- Wasted search engine queries
- Users see useless broad results
- Higher API costs
- Slower perceived responsiveness from unnecessary calls
### Alternative
Check minimum character length (2-3) before making the API call.
### Refactoring Strategy
1. Add `if (this.query.length < 2) return` before API call
2. Show hint: "Type at least 2 characters to search"
3. Adjust minimum based on use case (2 for general, 3 for SKU)
4. Clear results dropdown when below minimum
5. Test that short inputs don't trigger API calls
### Detection Checklist
- [ ] Minimum 2-3 characters enforced
- [ ] Short input does not trigger API call
- [ ] Hint shown for minimum characters
- [ ] Results cleared below minimum
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
