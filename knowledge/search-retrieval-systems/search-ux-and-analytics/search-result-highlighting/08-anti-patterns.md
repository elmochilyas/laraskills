# ECC Anti-Patterns — Search Result Highlighting
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Search Result Highlighting | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Not Using Engine-Native Highlighting
2. Reusing Raw Highlight Tags Without Stripping
3. Highlighting Without Snippet Context
4. Inconsistent Highlight Styling
5. No Custom Highlighting for Database Engine
---
## Repository-Wide Anti-Patterns
- Applying highlighting to all fields including identifiers
- Not handling unicode/multibyte character boundaries in snippets
- Using underline for highlights (conflicts with link styling)
---
## Anti-Pattern 1: Not Using Engine-Native Highlighting
### Category
Productivity | Maintainability
### Description
Implementing custom highlighting logic in PHP when the search engine (Meilisearch, Algolia) already provides built-in highlighting with zero configuration.
### Why It Happens
Developers don't know about engine-native highlighting features or assume custom implementation gives more control.
### Warning Signs
- Custom PHP string replacement for highlighting
- Highlighting not matching actual search terms
- Manual snippet generation from stored text
- No use of Meilisearch `_formatted` or Algolia `_highlightResult`
### Why Harmful
Engine-native highlighting is optimized, accurate, and free. Custom implementation duplicates effort, introduces bugs, and misses edge cases the engine handles.
### Consequences
- Development time wasted on custom highlighting
- Inaccurate highlighting (wrong terms highlighted)
- Missing highlighting edge cases (partial words, stemming)
- Harder to switch search engines
### Alternative
Use engine-native highlighting. Configure via Scout parameters.
### Refactoring Strategy
1. Check search engine documentation for highlighting features
2. Enable native highlighting via Scout callback
3. Remove custom PHP highlighting logic
4. Test highlighting accuracy with various query types
5. Strip engine markup and re-wrap with application CSS classes
### Detection Checklist
- [ ] Engine-native highlighting enabled
- [ ] Custom PHP highlighting removed
- [ ] Highlighting matches actual search terms
- [ ] Edge cases handled (partial words, stemming)
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Reusing Raw Highlight Tags Without Stripping
### Category
Security | Maintainability
### Description
Outputting raw HTML `<em>` tags from search engine highlighting directly in views without converting to application-specific markup, creating styling and security issues.
### Why It Happens
Engine highlighting returns `<em>` tags by default. Developers output them directly without processing.
### Warning Signs
- Raw `<em>` tags in rendered search results
- No custom highlight CSS class
- Highlight tags not wrapped in application markup
- `<em>` styling inconsistent with design system
### Why Harmful
Search engine `<em>` tags may conflict with application CSS or accessibility requirements. You cannot customize highlight appearance without changing engine configuration. Raw HTML output may introduce XSS risks if not properly escaped.
### Consequences
- Highlight styling inconsistent with application design
- CSS specificity battles between engine tags and app styles
- Accessibility issues with default `<em>` semantics
- Potential XSS if highlighting is not properly escaped
### Alternative
Strip engine highlight markup and re-wrap with application-specific HTML/Markdown.
### Refactoring Strategy
1. Strip `<em>` tags from highlighted fields
2. Replace with `<mark>` or `<span class="search-highlight">`
3. Apply CSS styling to highlight class
4. Ensure proper HTML escaping (Blade {{ }} auto-escapes)
5. Test highlighting across all result types
### Detection Checklist
- [ ] Engine highlight tags stripped
- [ ] Application-specific markup applied
- [ ] Highlight CSS class styled
- [ ] HTML escaping verified
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Highlighting Without Snippet Context
### Category
User Experience | Data Quality
### Description
Showing highlighted terms in isolation without surrounding context text, making it hard for users to understand why the result matched.
### Why It Happens
Developers highlight the matched field value entirely without generating a snippet around the match.
### Warning Signs
- Long text fields shown highlighted in full
- No snippet/truncation around matched terms
- Users must read entire field to find the match
- Highlighted terms appear without context
### Why Harmful
Without snippet context, users see a wall of highlighted text and must search for the match themselves. The highlighting doesn't help them quickly assess relevance.
### Consequences
- Users cannot quickly determine why a result matched
- Reduced scanability of search results
- Highlighting feature less useful than intended
- Poor UX for long-text content
### Alternative
Generate snippets: extract 100-200 characters around the matched term and highlight within the snippet context.
### Refactoring Strategy
1. Use engine-native snippet generation where available
2. For custom highlighting: extract text around the first match
3. Show 50-100 characters before and after the match
4. Highlight match terms within the snippet
5. Limit snippet length for consistent result card sizes
### Detection Checklist
- [ ] Snippet context shown around highlighted terms
- [ ] Snippet length appropriate (100-200 chars)
- [ ] Engine-native snippets used where available
- [ ] Long text fields truncated with snippet
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Inconsistent Highlight Styling
### Category
User Experience | Maintainability
### Description
Applying different highlight styling across different result types or search contexts, creating visual inconsistency and user confusion.
### Why It Happens
Different search features or result templates are implemented by different developers without a shared highlight component.
### Warning Signs
- Different highlight colors in different search contexts
- Product search highlights differ from article search
- Some results have bold, others have colored background
- No shared highlight component or CSS class
### Why Harmful
Inconsistent styling confuses users and looks unpolished. It suggests the search feature is disjointed and not maintained as a cohesive experience.
### Consequences
- Unprofessional visual appearance
- Users uncertain about what highlighting means
- Higher maintenance burden from duplicated styling
- Accessibility issues from inconsistent contrast
### Alternative
Create a shared highlight component with consistent styling across all search contexts.
### Refactoring Strategy
1. Create shared CSS class `.search-highlight` with consistent styling
2. Create Blade component or helper for highlight rendering
3. Apply consistent styling across all search result templates
4. Ensure sufficient color contrast for accessibility
5. Test highlighting in all search contexts
### Detection Checklist
- [ ] Shared highlight component exists
- [ ] Consistent CSS class used across all search
- [ ] Color contrast meets accessibility standards
- [ ] All search contexts have consistent highlighting
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: No Custom Highlighting for Database Engine
### Category
Functionality | User Experience
### Description
Not implementing any highlighting when using Scout's database engine (which lacks native highlighting), missing the UX benefit entirely.
### Why It Happens
Developers assume highlighting is an engine feature and skip it for database engines.
### Warning Signs
- No highlighting in search results with Scout database engine
- No custom PHP highlighting logic
- Users cannot see why results matched
- Result snippets unmarked
### Why Harmful
Without highlighting, users cannot quickly scan results to understand why they matched. They must read each result to determine relevance, reducing search efficiency.
### Consequences
- Reduced search result scanability
- Users must work harder to find relevant results
- Search perceived as less useful
- Inconsistent experience with engine-native search
### Alternative
Implement custom PHP highlighting using `str_ireplace` or regex for Scout's database engine.
### Refactoring Strategy
1. Create custom highlight helper function
2. Split query into terms, wrap each in `<mark>` tag within result text
3. Generate snippet around first match for long text
4. Apply same CSS styling as engine-native highlighting
5. Test with multi-word queries and partial matches
### Detection Checklist
- [ ] Custom highlighting implemented for database engine
- [ ] Highlighting matches query terms
- [ ] Consistent styling with engine-native highlighting
- [ ] Multibyte characters handled correctly
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Skill: Custom Engine Development
