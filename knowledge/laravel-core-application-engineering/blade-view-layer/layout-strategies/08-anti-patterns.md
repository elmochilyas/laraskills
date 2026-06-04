# ECC Anti-Patterns — Layout Strategies

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Layout Strategies |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Single Layout with Excessive Conditionals (Mega-Layout)
2. Layout Inheritance Beyond 3 Levels
3. Conditional `@extends` in Templates (Hidden Layout Selection)
4. All Assets Loaded in Base Layout (Cross-Contamination)
5. Inconsistent Yield/Stack Names Across Layouts

---

## Repository-Wide Anti-Patterns

- Layout That Queries the Database
- Layout Per Individual Page (No Reuse)
- Dynamic Layout Switching in Middleware
- Layouts Containing Business Logic
- Nested Layouts with Override Chains

---

## Anti-Pattern 1: Single Layout with Excessive Conditionals

### Category
Architecture | Maintainability

### Description
One layout file handling navigation, sidebar, footer, and assets for all sections via `@if(admin)/@elseif(user)/@else` conditionals, instead of creating separate layouts per section.

### Why It Happens
Developers avoid the perceived overhead of creating multiple layout files. The single layout grows incrementally with each new section.

### Warning Signs
- Layout file exceeds 150 lines with 5+ conditional blocks for navigation
- Each section's navigation is buried inside `@if`/`@elseif` chains
- Adding a new section requires modifying the single layout file and risk of breaking existing sections
- Admin-specific code and public-site code coexist in the same file

### Preferred Alternative
Create one layout per application section (admin, public, auth, dashboard). Each layout is self-contained and changes to one don't affect others.

### Related Rules
- Rule: Create a New Layout for Each Application Section with Different Navigation

---

## Anti-Pattern 2: Layout Inheritance Beyond 3 Levels

### Category
Maintainability

### Description
Creating layout inheritance chains deeper than 3 levels (e.g., Base → Section → Sub-Section → Sub-Sub-Section → Page), making debugging and tracing impossible.

### Why It Happens
Developers treat layout inheritance like class inheritance and keep extending instead of composing.

### Warning Signs
- Layout depth: `base → admin → reports → finance → quarterly` (5 levels)
- Debugging a missing section requires opening 4+ files
- Compiled PHP is the only reliable source of truth for what renders where
- Deeply nested `@section` overrides are unpredictable

### Preferred Alternative
Cap inheritance at 3 levels: Base → Section → Page. Use component composition for additional structure.

### Related Rules
- Rule: Cap Layout Inheritance Depth at 3 Levels

---

## Anti-Pattern 3: Conditional `@extends` in Templates

### Category
Architecture | Maintainability

### Description
Using `@if(admin) @extends('layouts.admin') @else @extends('layouts.public') @endif` inside the template instead of selecting the layout in the controller.

### Why It Happens
It seems convenient to put the layout decision "where the layout is used" — the template itself.

### Warning Signs
- Template begins with `@if`/`@extends` conditionals before any content
- Layout choice for a page is invisible from the controller or route definition
- Cannot determine which layout renders a page without executing the conditional
- Automated testing cannot mock the layout

### Preferred Alternative
Select the layout in the controller based on auth status, route, or user role. Pass the selected layout to the view explicitly.

### Related Rules
- Rule: Select Layouts in Controllers, Not Templates

---

## Anti-Pattern 4: All Assets Loaded in Base Layout

### Category
Performance

### Description
Loading all CSS and JavaScript files (admin, public, dashboard) in the base layout so every page loads every asset bundle regardless of section.

### Why It Happens
It's simpler to load everything once in the base layout than to organize section-specific pushes.

### Warning Signs
- Base layout contains `<link>` tags for admin.css, public.css, dashboard.css, auth.css
- Public pages load admin-specific JavaScript
- Page weight analysis shows 60%+ unused CSS/JS on most pages
- CSS conflicts from incompatible section styles loading together

### Preferred Alternative
Push section-specific assets in each section layout using `@push('styles')` / `@push('scripts')`. Keep only shared assets (design system, reset) in the base layout.

### Related Rules
- Rule: Load Section-Specific Assets per Layout

---

## Anti-Pattern 5: Inconsistent Yield/Stack Names Across Layouts

### Category
Maintainability

### Description
Using different yield and stack point names in different layouts (e.g., `@stack('scripts')` in public, `@stack('admin-scripts')` in admin), causing components to silently fail in some sections.

### Why It Happens
Developers create layouts independently without standardizing the interface.

### Warning Signs
- Public layout uses `@stack('scripts')`, admin uses `@stack('admin-scripts')`
- Components pushing to `@stack('scripts')` work in public but not in admin layouts
- No documented convention for yield/stack point names
- Cross-section component reuse is broken

### Preferred Alternative
Define a standard set of yield and stack points used by all layouts. Document the convention in the base layout.

### Related Rules
- Rule: Consistent Yield and Stack Points Across All Layouts
