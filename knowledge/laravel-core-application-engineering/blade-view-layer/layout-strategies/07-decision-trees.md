# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade View Layer
**Knowledge Unit:** Layout Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

* Single vs Multi-Layout Strategy
* Base Layout vs Standalone Section Layouts
* Section-Specific Asset Loading Strategy

---

# Architecture-Level Decision Trees

---

## Decision 1: Single vs Multi-Layout Strategy

---

## Decision Context

Whether to use a single layout for all pages or create separate layouts per application section (public, admin, auth, dashboard).

---

## Decision Criteria

* Number of distinct application sections with different navigation
* Number of user roles
* Different asset bundles per section
* Maintenance complexity tolerance

---

## Decision Tree

How many distinct navigation/sidebar structures does the app have?
↓
1 (simple blog, landing page, single-role CRUD)?
YES → Single layout is sufficient
NO → 2-5 distinct sections (public, admin, auth, dashboard)?
    YES → Multi-layout (one layout per section)
NO → Does a single layout exist with conditionals for each section?
    YES → How many `@if`/`@elseif` blocks?
        < 3 → Single layout may still work, but multi-layout is cleaner
        >= 3 → Split into separate layouts immediately

---

## Rationale

A single layout with `@if(admin)/@elseif(user)/@else` blocks becomes unreadable as conditionals multiply. Separate layouts isolate navigation changes per section — modifying the admin sidebar affects only the admin layout, not the public or auth layouts.

---

## Recommended Default

**Default:** Multi-layout for any application with 2+ distinct sections (admin, public, auth)
**Reason:** Single layout with conditionals creates maintenance traps. Separate layouts isolate changes per section and keep each layout file simple.

---

## Risks Of Wrong Choice

* Single layout with too many conditionals: Unreadable, every new section adds complexity, changing one section's nav affects all sections
* Layout per page: Excessive files, no reuse, violates DRY

---

## Related Rules

* Create a New Layout for Each Application Section with Different Navigation (05-rules.md)
* Cap Layout Inheritance Depth at 3 Levels (05-rules.md)

---

## Related Skills

* Skill: Implement Multi-Layout Strategy for Application Sections

---

## Decision 2: Base Layout vs Standalone Section Layouts

---

## Decision Context

Whether to create a shared base layout for the HTML shell (DOCTYPE, head, body) or have each section layout define the full HTML structure independently.

---

## Decision Criteria

* Whether the HTML shell (DOCTYPE, head, meta tags) is identical across sections
* Number of section layouts
* Maintenance cost of duplicate HTML shell
* Whether any section has fundamentally different HTML structure

---

## Decision Tree

Is the HTML shell (DOCTYPE, head, meta tags, viewport) identical across all sections?
↓
YES → Create `layouts/base.blade.php` with shared shell
    YES → Each section layout extends base: `@extends('layouts.base')`
NO → Does a section have fundamentally different HTML structure?
    YES → That section may skip the base layout (rare)
    NO → Create base layout — duplication is avoidable
NO → How many section layouts exist?
    < 3 → Base layout still recommended (eliminates duplication)
    >= 3 → Base layout is essential (changes to meta tags update everywhere)

---

## Rationale

The DOCTYPE, meta charset, viewport tag, and HTML structure are identical across all layouts. Without a base, these are duplicated in every section layout. A base layout eliminates duplication by providing the shared shell once.

---

## Recommended Default

**Default:** Create `layouts/base.blade.php` for the shared HTML shell; all section layouts extend it
**Reason:** A base layout eliminates duplication of DOCTYPE, head, meta tags across all section layouts. Changes to the HTML shell propagate everywhere.

---

## Risks Of Wrong Choice

* No base layout: Duplicate HTML shell in every section layout, changes require editing every file
* Base layout for fundamentally different section: Unnatural inheritance, section forced into shared structure

---

## Related Rules

* Use a Base Layout for the Shared HTML Shell (05-rules.md)
* Consistent Yield and Stack Points Across All Layouts (05-rules.md)

---

## Related Skills

* Skill: Implement Multi-Layout Strategy for Application Sections

---

## Decision 3: Section-Specific Asset Loading Strategy

---

## Decision Context

Whether to load all CSS/JS in the base layout for all sections or push section-specific assets per layout.

---

## Decision Criteria

* Whether assets are shared or section-specific
* Page weight optimization requirements
* Whether sections have completely different CSS/JS bundles

---

## Decision Tree

Are the CSS and JS files shared across all sections?
↓
YES → Load in base layout (shared design system, reset)
NO → Do different sections have different asset bundles?
    YES → Push section-specific assets per layout using `@push('styles')`/`@push('scripts')`
    NO → Are some assets section-specific?
        YES → Push only section-specific assets per layout
        YES → Keep shared assets in base, push section-specific in section layouts
NO → Is unused CSS/JS a performance concern?
    YES → Section-specific loading is essential
    NO → May still benefit from section-specific loading even if not critical

---

## Rationale

Loading admin-specific CSS on public pages wastes bandwidth and may cause style conflicts. Section-specific asset loading via dedicated pushes ensures each page loads exactly the assets it needs. Shared assets (design system, reset) belong in the base layout.

---

## Recommended Default

**Default:** Shared assets (design system) in base layout; section-specific assets pushed per section layout
**Reason:** Eliminates unused CSS/JS on each page, prevents style conflicts, reduces page weight.

---

## Risks Of Wrong Choice

* All assets in base layout: Every page loads every asset, wasted bandwidth, style conflicts
* All assets per section layout: Duplicate shared CSS across layouts, inconsistent loading

---

## Related Rules

* Load Section-Specific Assets per Layout (05-rules.md)
* Consistent Yield and Stack Points Across All Layouts (05-rules.md)

---

## Related Skills

* Skill: Implement Multi-Layout Strategy for Application Sections
