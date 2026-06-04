# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Inertia Page Components
**Generated:** 2026-06-03

---

# Decision Inventory

* Persistent Layout vs Per-Page Layout
* Inertia Page Component vs Blade Template for View Layer
* TypeScript Interface vs Inline Type for Page Props

---

# Architecture-Level Decision Trees

---

## Decision 1: Persistent Layout vs Per-Page Layout

---

## Decision Context

Whether to use Inertia's persistent layout (shared across navigations, maintaining state) or a per-page layout that re-mounts on every navigation.

---

## Decision Criteria

* Whether layout state should persist across page navigations (sidebar scroll, search input)
* Whether the layout has expensive initialization that should run once
* Whether pages have different layout needs (auth pages vs app pages)
* Whether the layout contains navigation state that should not reset on page change

---

## Decision Tree

Does the layout contain state that should persist across navigations (sidebar scroll position, search query)?
↓
YES → Use persistent layout — layout state survives page navigation
NO → Does the layout have expensive initialization (API calls, data fetching)?
    YES → Use persistent layout — initialize once, not on every page visit
    NO → Do different groups of pages need different layouts (auth vs app vs admin)?
        YES → Use per-page layout with conditional layout selection — or a meta layout that delegates
        NO → Use persistent layout — simpler, one layout wraps all pages

---

## Rationale

Persistent layouts are Inertia's key advantage over traditional server-rendered apps. The layout component mounts once and survives navigations, preserving state. Per-page layouts are simpler but lose this benefit. Use persistent layouts as the default, with per-page layouts only when different page groups need fundamentally different layout structures.

---

## Recommended Default

**Default:** Single persistent layout wrapping all application pages. Use per-page layout for distinct page families (login pages, admin pages) that need fundamentally different layout structure.
**Reason:** Persistent layouts preserve state and avoid re-mounting costs. They provide the SPA feel where the shell stays stable and only the page content changes.

---

## Risks Of Wrong Choice

* Per-page layout for standard app: Layout re-mounts on every navigation — state lost, expensive re-initialization
* Persistent layout for auth pages: Layout with sidebar and nav shows on login page — confusing
* No layout at all: Every page must implement its own shell — repetitive

---

## Related Rules

* Persistent Layout for App Pages

---

## Related Skills

* Create an Inertia Page Component with Typed Props and Layout

---

---

## Decision 2: Inertia Page Component vs Blade Template for View Layer

---

## Decision Context

Whether to render a page using an Inertia page component (JS/TS) or a traditional Blade template.

---

## Decision Criteria

* Whether the page needs client-side interactivity
* Whether the page is content-focused (blog, docs) or application-focused (dashboard, form)
* Whether the team uses Inertia as the primary frontend stack
* Whether SEO is critical (Blade renders full HTML, Inertia needs SSR)

---

## Decision Tree

Is the page a content-focused page (blog post, documentation) with minimal interactivity?
↓
YES → Use Blade — simpler, full HTML on first load, no JS bundle for content pages
NO → Does the page need complex client-side interactivity (forms with validation, real-time updates)?
    YES → Use Inertia page component — leverage useForm, props, and JS framework
    NO → Is the application primarily an Inertia app (most pages use Inertia)?
        YES → Use Inertia page component — consistency across the app
        NO → Use Blade — simpler for pages that don't need Inertia's features

---

## Rationale

Inertia page components are the standard view layer for Inertia applications. They receive typed props, participate in client-side navigation, and can use the full JS framework ecosystem. Blade is simpler for content-focused pages where Inertia's features aren't needed. Using Blade in an Inertia app creates a "hybrid mode" where some pages are SPA and others are full-page loads.

---

## Recommended Default

**Default:** Inertia page component in Inertia applications. Blade for content pages in non-Inertia applications.
**Reason:** Consistency matters — mixing Inertia and Blade pages means losing client-side navigation between them. Only mix when the content pages are truly static and the navigation disruption is acceptable.

---

## Risks Of Wrong Choice

* Inertia for blog content: 100KB+ JS bundle for a page that's just text — slow initial load
* Blade in Inertia app: Navigation from Blade to Inertia page is full-page load — breaks SPA feel
* Inertia without SSR for SEO: Search engines don't index client-rendered content well

---

## Related Rules

* Inertia for Interactive Pages, Blade for Content Pages

---

## Related Skills

* Create an Inertia Page Component with Typed Props and Layout

---

---

## Decision 3: TypeScript Interface vs Inline Type for Page Props

---

## Decision Context

Whether to define a named TypeScript interface for page props or use an inline type.

---

## Decision Criteria

* Whether the props are used in multiple components
* Whether the props are complex (10+ fields, nested objects)
* Whether the team enforces strict TypeScript types
* Whether the props come from a PHP DTO that could be code-generated

---

## Decision Tree

Are the props used by 2+ components (shared between parent and child)?
↓
YES → Define a named TypeScript interface — exported, reusable, single source of truth
NO → Are the props complex (10+ fields, nested, optional)?
    YES → Define a named TypeScript interface — readability, maintainability
    NO → Are the props coming from a PHP DTO that could be auto-generated?
        YES → Define a named TypeScript interface — target for code generation tooling
        NO → Use inline type — `const { user, posts }: { user: User, posts: Post[] } = ...`

---

## Rationale

Named interfaces are more maintainable than inline types for complex or shared props. They're exported, reusable, and can be generated from PHP types. Inline types are acceptable for simple pages with 2-3 flat props. The tipping point is complexity or reuse.

---

## Recommended Default

**Default:** Named TypeScript interface for every page component's props. Inline type only for trivial 1-2 prop pages.
**Reason:** Named interfaces are easier to maintain, refactor, and document. They also enable code generation from PHP types. The overhead of a named interface is negligible.

---

## Risks Of Wrong Choice

* Inline type with 15 fields: Unreadable type inline in component — hard to refactor, no reuse
* Named interface for 2 props: File overhead for `interface Props { name: string; email: string }`
* No type at all: `props: any` — no compile-time errors for misspelled or missing props
* Interface not exported: Can't be used by child components or utility types

---

## Related Rules

* TypeScript Interface for Every Page

---

## Related Skills

* Create an Inertia Page Component with Typed Props and Layout
