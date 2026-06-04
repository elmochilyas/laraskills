# ECC Anti-Patterns — Search UX Patterns
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Search UX Patterns | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No Debounce on Search Input
2. No Loading State During Search
3. No Empty State Handling
4. No Search Suggestions or Autocomplete
5. Missing Mobile-Responsive Search UI
---
## Repository-Wide Anti-Patterns
- Copy-pasting search UI patterns without consistency review
- Not treating search as a system (input → results → empty → error states)
- Designing search UI for desktop only
---
## Anti-Pattern 1: No Debounce on Search Input
### Category
Performance | User Experience
### Description
Triggering search on every keystroke without debouncing, overwhelming the server and creating a flickering user experience.
### Why It Happens
Simple input binding without considering the performance implications of per-keystroke queries.
### Warning Signs
- Network requests on every keystroke
- Search results flicker as user types
- API rate limits hit during normal usage
- Slow perceived performance
### Why Harmful
Each keystroke triggers a full search cycle. For a 6-character query, this means 6x the necessary server load and a poor flickering UX.
### Consequences
- 10x unnecessary server load
- Search engine cost inflation
- Poor user experience with flickering results
- Mobile data waste from unnecessary requests
### Alternative
Debounce input at 300ms. Search fires only when the user pauses typing.
### Refactoring Strategy
1. Add 300ms debounce to search input
2. Test rapid typing produces single search call
3. Monitor query volume reduction
4. Ensure smooth UX without flickering
### Detection Checklist
- [ ] Debounce implemented at 300ms
- [ ] Rapid typing produces one search call
- [ ] Query volume reduced post-debounce
- [ ] Smooth search UX
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: No Loading State During Search
### Category
User Experience | Accessibility
### Description
Not showing any loading indicator while search results are being fetched, leaving users uncertain about whether the search is working.
### Why It Happens
Fast local development hides latency. Loading states seem unnecessary until production.
### Warning Signs
- No spinner, skeleton, or progress indicator during search
- Stale results shown while new results load
- Users stare at blank/unchanged area during search
- No accessibility announcement for search loading
### Why Harmful
Without loading states, users don't know if the search is processing. They may click again, navigate away, or assume the search is broken.
### Consequences
- Users retype queries thinking nothing happened
- Multiple unintended search requests
- Poor perceived performance
- Accessibility gap for screen reader users
### Alternative
Show a loading indicator (spinner or skeleton) during search fetch.
### Refactoring Strategy
1. Add loading state variable in component/controller
2. Show spinner or skeleton during search
3. Dim or hide stale results during loading
4. Add `aria-busy="true"` for accessibility
5. Ensure smooth transition between loading and results
### Detection Checklist
- [ ] Loading indicator shown during search
- [ ] Stale results handled during loading
- [ ] Accessible loading announcement
- [ ] Smooth transition between states
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: No Empty State Handling
### Category
User Experience | Accessibility
### Description
Showing a blank page or empty content area when the user hasn't searched yet or when search returns no results.
### Why It Happens
Developers focus on populated search results and don't handle the initial or empty states.
### Warning Signs
- Blank page before user types first search
- Empty white content area on search page load
- No welcome message, suggestions, or popular searches
- Zero-result search shows blank results section
### Why Harmful
Blank states provide no guidance or value. Users don't know what to do, what they can search for, or whether the search feature is working.
### Consequences
- Users confused about how to start searching
- High bounce rate on search page
- Missed opportunity to guide users
- Search feature perceived as empty or broken
### Alternative
Design three states: initial (before search), loading (during search), empty (no results).
### Refactoring Strategy
1. Design initial state: search tips, popular searches, categories
2. Design loading state: skeleton or spinner
3. Design empty state: friendly message, suggestions, popular alternatives
4. Implement state switching in the search component
5. Test all three states
### Detection Checklist
- [ ] Initial state with guidance shown before search
- [ ] Loading state during search
- [ ] Empty state with suggestions on no results
- [ ] All three states styled and tested
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 4: No Search Suggestions or Autocomplete
### Category
User Experience | Functionality
### Description
Not providing any query suggestions or autocomplete as users type, missing the opportunity to guide users toward effective searches.
### Why It Happens
Search suggestions require additional implementation beyond basic search results.
### Warning Signs
- No suggestions appear while typing
- Users must complete full query before searching
- Typing "lap" doesn't suggest "laptop"
- No popular searches shown
### Why Harmful
Without suggestions, users must type full queries and correct their own typos. They may not know what terms work best for search.
### Consequences
- Higher typo-related zero-result rates
- Users don't discover available content
- Slower search experience
- Missed guidance for effective query formulation
### Alternative
Provide autocomplete suggestions with 2-3 characters minimum, debounced, showing popular queries.
### Refactoring Strategy
1. Implement autocomplete endpoint returning popular suggestions
2. Show suggestions in dropdown as user types
3. Debounce and set minimum characters
4. Prioritize popular/trending queries
5. Allow direct navigation to suggestion
### Detection Checklist
- [ ] Autocomplete suggestions implemented
- [ ] Debounce and minimum characters set
- [ ] Suggestions prioritized by popularity
- [ ] Suggestion navigation working
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Missing Mobile-Responsive Search UI
### Category
User Experience | Accessibility
### Description
Not optimizing search UI for mobile devices, making search difficult or impossible on small screens.
### Why It Happens
Search UI is designed for desktop and adapted as an afterthought, if at all.
### Warning Signs
- Small tap targets for filter controls
- Search results too wide for mobile screens
- Facet filters don't work on touch devices
- Slow search performance on mobile connections
- No mobile-optimized search layout
### Why Harmful
Mobile users are often the majority of search traffic. A poor mobile search experience drives users away. Small tap targets cause errors. Slow search on mobile connections frustrates users.
### Consequences
- Lost mobile search engagement
- High mobile bounce rate
- Poor app store ratings
- Accessibility complaints from mobile users
### Alternative
Design search with a mobile-first approach: full-width input, large tap targets, responsive result cards.
### Refactoring Strategy
1. Design mobile-first search layout
2. Large touch targets (minimum 44x44px)
3. Full-width search input on mobile
4. Responsive result cards (single column on mobile)
5. Test on multiple mobile devices and connection speeds
6. Consider progressive enhancement for slower connections
### Detection Checklist
- [ ] Mobile-first search layout
- [ ] Large tap targets (44x44px minimum)
- [ ] Responsive result cards
- [ ] Tested on mobile devices
- [ ] Performance acceptable on slow connections
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
