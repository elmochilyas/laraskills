# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade View Layer
**Knowledge Unit:** Blade Fragments
**Generated:** 2026-06-03

---

# Decision Inventory

* Fragment vs Livewire for Partial Updates
* Fragment Response Caching Strategy
* Fragment Name and ID Convention

---

# Architecture-Level Decision Trees

---

## Decision 1: Fragment vs Livewire for Partial Updates

---

## Decision Context

Whether to use Blade Fragments (with Turbo/HTMX) or Livewire for handling partial page updates.

---

## Decision Criteria

* Whether the component needs to maintain client-side state
* JavaScript requirements
* State management complexity
* Interaction model (navigation-driven vs event-driven)

---

## Decision Tree

Does the UI need to maintain client-side state (form input values, scroll position, toggles)?
↓
YES → Use Livewire (stateful, event-driven, maintains component state)
NO → Is the update purely navigation-driven (changing a page section)?
    YES → Use Blade Fragments with Turbo/HTMX (stateless, bandwidth optimization)
NO → Does the component have complex interactivity (drag-drop, real-time validation)?
    YES → Use Livewire or Alpine.js
    NO → Use Blade Fragments (simpler, less JS)
NO → Is the initial page load for this section critical for SEO?
    YES → Use Blade Fragments — full HTML on initial request, fragments on subsequent
    NO → Either works; fragments are simpler

---

## Rationale

Blade Fragments are stateless bandwidth optimizations for navigation-driven updates. Livewire provides full state management for interactive components. Fragments are simpler but cannot maintain client state across updates.

---

## Recommended Default

**Default:** Blade Fragments for navigation-driven content updates where no client state is maintained; Livewire for interactive stateful components
**Reason:** Fragments provide bandwidth savings with minimal complexity. Livewire provides necessary infrastructure when state management is required. Using fragments for stateful UI leads to broken UX.

---

## Risks Of Wrong Choice

* Fragments for interactive state: Form input values lost on update, scroll position reset, broken UX
* Livewire for simple content navigation: Unnecessary complexity, heavier frontend bundle

---

## Related Rules

* Do Not Use Fragments for Interactive Stateful Components (05-rules.md)
* Return Full Page on First Request, Fragment on Subsequent (05-rules.md)

---

## Related Skills

* Skill: Implement Blade Fragment Responses for Turbo/HTMX Navigation

---

## Decision 2: Fragment Response Caching Strategy

---

## Decision Context

Whether to cache fragment responses and full-page responses with the same or different cache keys and TTLs.

---

## Decision Criteria

* Whether fragment content changes at a different rate than the layout
* Cache hit ratio requirements
* Bandwidth vs freshness tradeoffs

---

## Decision Tree

Does the fragment content change at the same rate as the full page (layout)?
↓
YES → Same cache key/TTL possible but separate keys still recommended for clarity
NO → Does the fragment change more frequently than the layout?
    YES → Separate cache keys with shorter TTL for fragment (e.g., 300s vs 3600s)
    NO → Fragment changes less frequently than layout?
        YES → Separate keys with longer TTL for fragment
NO → Are cache hit rates a performance concern?
    YES → Separate keys ensure optimal hit rates per response type
    NO → Separate keys still recommended for flexibility

---

## Rationale

Fragment content (e.g., a user list) may change more frequently than the page layout. Sharing a single cache entry forces both to use the same TTL, either serving stale fragments or invalidating the layout unnecessarily.

---

## Recommended Default

**Default:** Separate cache keys for fragment and full-page responses with independent TTLs
**Reason:** Different content types have different freshness requirements. Fragment content typically changes more frequently and can tolerate shorter TTLs. Layouts change rarely and benefit from longer TTLs.

---

## Risks Of Wrong Choice

* Single cache key: Either stale fragments or over-frequent layout invalidation, suboptimal cache performance
* No caching for fragments: Missed bandwidth optimization opportunity — fragments are meant to reduce payload

---

## Related Rules

* Cache Fragment Responses Separately from Full-Page Responses (05-rules.md)

---

## Related Skills

* Skill: Implement Blade Fragment Responses for Turbo/HTMX Navigation

---

## Decision 3: Fragment Name and ID Convention

---

## Decision Context

How to name `@fragment` directives and their corresponding DOM element IDs for reliable client-side targeting.

---

## Decision Criteria

* Whether the fragment name matches the client-side target selector
* Whether fragment names are unique within the view
* Whether fragment names contain sensitive information

---

## Decision Tree

Does the DOM wrapper element have an `id` matching the fragment name?
↓
YES → Consistent — client-side targeting works correctly
NO → Can the client use a different selector (hx-target="#other-id")?
    YES → Wrapper ID only needs to match the client target, not fragment name
    NO → Add matching `id` attribute — client targeting will fail
NO → Are fragment names unique within this view?
    YES → Good — no extraction conflicts
    NO → Rename duplicates — first match wins, others silently dropped
NO → Do fragment names contain sensitive information?
    YES → Rename — `@fragment('user-credit-card-info')` leaks data in source
    NO → Good — names are descriptive but not sensitive

---

## Rationale

Fragment names are the contract between server and client. The extraction logic matches by name, and the client targets by DOM ID. Inconsistent naming causes silent failures. Sensitive names leak information.

---

## Recommended Default

**Default:** Fragment name = DOM wrapper ID = descriptive, non-sensitive, unique per view
**Reason:** Consistent naming between server fragment contract and client DOM target eliminates a class of silent failures where content doesn't update.

---

## Risks Of Wrong Choice

* Mismatched fragment name and ID: Client targeting silently fails, content never updates
* Duplicate fragment names: Only first match extracted, second fragment silently dropped
* Sensitive fragment names: Information leaked in template source

---

## Related Rules

* Match Fragment Wrapper ID to Fragment Name (05-rules.md)
* Use Unique Fragment Names Per View (05-rules.md)
* Do Not Nest Fragments (05-rules.md)

---

## Related Skills

* Skill: Implement Blade Fragment Responses for Turbo/HTMX Navigation
