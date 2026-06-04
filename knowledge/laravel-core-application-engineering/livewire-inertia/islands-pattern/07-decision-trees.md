# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire Islands Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* Islands Pattern vs Full-Page Component for Content Pages
* State Sharing Between Islands vs Independent Data Fetching
* Island Component vs Inertia Page Component for Interactive Sections

---

# Architecture-Level Decision Trees

---

## Decision 1: Islands Pattern vs Full-Page Component for Content Pages

---

## Decision Context

Whether to use the Islands pattern (individual Livewire components in a Blade view) or a full-page Livewire component for a page.

---

## Decision Criteria

* Percentage of the page that is interactive (needs Livewire) vs static HTML
* Whether static content should be rendered as plain Blade (fast, cacheable)
* Whether page-level shared state is needed across multiple interactive sections
* Whether the initial page load performance is critical

---

## Decision Tree

Is more than 50% of the page content interactive?
↓
YES → Use full-page component — manage the entire page as a Livewire component
NO → Does the page have mostly static content with 1-3 interactive widgets?
    YES → Use Islands — embed Livewire components in a standard Blade view
    NO → Is the page static with no interactive elements?
        YES → Use plain Blade — no Livewire needed at all
        NO → Use Islands — a few interactive sections in an otherwise static page

---

## Rationale

Full-page Livewire serializes the entire page state on every AJAX request, including static content that never changes. The Islands pattern renders static content as plain Blade (fast, cacheable) and only serializes the interactive components. For content-heavy pages with a few widgets, Islands provide significantly better performance.

---

## Recommended Default

**Default:** Islands for content-heavy pages. Full-page components for highly interactive pages.
**Reason:** The 50% interactivity threshold determines whether Livewire serialization overhead is justified. Below 50%, Islands provide better performance by keeping static content as plain Blade.

---

## Risks Of Wrong Choice

* Full-page for blog with comment section: Blog content serialized on every comment AJAX — unnecessary overhead
* Islands for dashboard: Multiple independent components — harder state management, more requests
* Island without lazy loading: Comment section loads on page load — delays page paint
* Full-page with lazy loading for static content: `#[Lazy]` on the page itself — placeholder for full content

---

## Related Rules

* Choose Islands for Content Pages

---

## Related Skills

* Implement the Islands Pattern for Content-Heavy Pages

---

---

## Decision 2: State Sharing Between Islands vs Independent Data Fetching

---

## Decision Context

Whether islands should share state (via `$dispatch`, shared services) or each fetch data independently.

---

## Decision Criteria

* Whether multiple islands display the same data (redundant fetching)
* Whether the islands are related (e.g., search form island + results island)
* Whether the islands should stay independent for modularity
* Whether the data is already loaded by the Blade view (passed as props)

---

## Decision Tree

Do multiple islands display the same underlying data (user profile in sidebar + user name in header)?
↓
YES → Pass data as Blade props from the parent view — both islands receive the same data
NO → Do the islands need to react to each other's state (search form + results list)?
    YES → Use `$dispatch` events — search dispatches event, results island listens and refreshes
    NO → Should the islands be fully independent (they can be removed without affecting others)?
        YES → Let each fetch independently — loose coupling, islands are self-contained
        NO → Do the islands share a common data source (same database table)?
            YES → Each fetches independently — duplicate queries, but decoupled
            NO → Let each fetch independently — default for unrelated islands

---

## Rationale

Islands are designed to be independent and self-contained. State sharing between islands creates coupling that makes it harder to move or remove islands. Pass data as Blade props when both islands need the same data. Use `$dispatch` events when islands need to react to each other. Independent fetching is the default.

---

## Recommended Default

**Default:** Each island fetches its own data independently. Pass shared data as Blade props from the parent view. Use `$dispatch` events for reactive communication.
**Reason:** Independent islands are modular, testable, and removable. State sharing is the exception, not the rule. Blade props are the simplest sharing mechanism.

---

## Risks Of Wrong Choice

* `$dispatch` for every communication: Complex event wiring — hard to trace data flow
* Shared service for islands: Islands coupled to a shared service — can't extract one independently
* Redundant data fetching: Three islands query the same data — wasteful, but decoupled
* No data sharing when needed: Islands display different values for the same data — inconsistent

---

## Related Rules

* Islands Are Independent by Default

---

## Related Skills

* Implement the Islands Pattern for Content-Heavy Pages

---

---

## Decision 3: Island Component vs Inertia Page Component for Interactive Sections

---

## Decision Context

Whether to build an interactive section within a content page as a Livewire island or an Inertia page component.

---

## Decision Criteria

* Whether the surrounding page is Blade or Inertia
* Whether the interactive section needs server-driven simplicity or rich client interactivity
* Whether the team has both Livewire and Inertia available
* Whether the interactive section is form-heavy (Livewire strength) or UI-rich (Inertia strength)

---

## Decision Tree

Is the surrounding page a Blade view?
↓
YES → Use Livewire island — Livewire integrates naturally with Blade
NO → Is the surrounding page an Inertia page?
    YES → Use Inertia page component — consistent with Inertia's paradigm
    NO → Is the interactive section form-heavy (validation, submission, real-time feedback)?
        YES → Use Livewire island — Livewire excels at form handling
        NO → Is the interactive section UI-rich (complex state management, animations)?
            YES → Use Inertia component — Inertia's JS framework handles complex UIs better
            NO → Use Livewire island — simpler for standard interactivity

---

## Rationale

Livewire islands are the natural choice for adding interactivity to Blade views. They integrate with Blade layouts and don't require JS build tooling. Inertia page components are the right choice for interactivity within Inertia pages — mixing Livewire into an Inertia page is not supported.

---

## Recommended Default

**Default:** Livewire island for interactive sections in Blade views. Inertia component for interactive sections in Inertia pages.
**Reason:** Each stack integrates best with its own rendering pipeline. Mixing stacks on the same page (Livewire in Inertia) is not supported.

---

## Risks Of Wrong Choice

* Inertia component in Blade view: Inertia requires its own page lifecycle — can't embed in Blade
* Livewire island in Inertia page: Not supported — Livewire's AJAX conflicts with Inertia's navigation
* Island for UI-rich interaction: Server round trips for complex client state — sluggish UX
* Inertia for simple form: JS build tooling for a simple form — unnecessary complexity

---

## Related Rules

* Livewire for Blade, Inertia for JS Frontends

---

## Related Skills

* Implement the Islands Pattern for Content-Heavy Pages
