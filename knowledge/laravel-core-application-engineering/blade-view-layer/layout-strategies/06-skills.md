# Skill: Implement Multi-Layout Strategy for Application Sections

## Purpose

Organize Blade layouts per application section (public, admin, auth, dashboard) to isolate navigation, sidebars, assets, and footer content, avoiding excessive conditionals in a single layout.

## When To Use

- SaaS, e-commerce, or enterprise apps with admin/public/auth sections
- Applications where different sections have different navigation structures
- Section-specific CSS/JS asset loading requirements
- Teams needing navigation isolation (admin changes don't affect public)

## When NOT To Use

- Simple blog or landing page with one user role (single layout suffices)
- A two-page application (component abstraction adds overhead)
- Layout per individual page (group by section, not page)
- Controller-less layout selection via conditional `@extends`

## Prerequisites

- Blade view directory with `layouts/` subdirectory
- Understanding of `@extends`, `@yield`, `@section`, `@stack`, `@push`
- Application sections identified (public, admin, auth, dashboard)

## Inputs

- Application section list (public, admin, auth, dashboard, etc.)
- Navigation structure per section
- Asset bundles per section
- Shared HTML shell (base layout)

## Workflow

1. Identify application sections that require different navigation, sidebar, footer, or asset bundles
2. Create a `layouts/base.blade.php` containing only the shared HTML shell (DOCTYPE, head, body tags, standard yield/stack points)
3. Create one section layout per identified section (e.g., `layouts/public.blade.php`, `layouts/admin.blade.php`), each extending `base.blade.php`
4. Define consistent yield and stack point names across all layouts: `@yield('title')`, `@yield('content')`, `@stack('styles')`, `@stack('scripts')`
5. Push section-specific assets in each layout's view using `@push('styles')` / `@push('scripts')` — never load all assets in the base layout
6. Select the layout in the controller based on auth status, route, or user role — never use conditional `@extends` in the template
7. Cap layout inheritance depth at 3 levels (Base → Section → Page), using component composition for additional structure

## Validation Checklist

- [ ] Each application section has its own layout with section-specific navigation
- [ ] Layout inheritance depth does not exceed 3 levels
- [ ] All layouts support consistent yield/stack points (title, content, styles, scripts)
- [ ] Each layout loads only its section-specific assets (no cross-contamination)
- [ ] Layout selection is done in the controller, not in the template
- [ ] Base layout contains only shared HTML shell (no section-specific logic)
- [ ] Navigation isolation verified: admin pages don't leak public nav and vice versa
- [ ] Adding a new section requires creating a new layout, not adding conditionals to an existing one

## Common Failures

- **Single layout with too many conditionals:** One layout with `@if(admin)/@elseif(user)/@else` for navigation, sidebar, and footer. Split into separate layouts per section.
- **Layout inheritance beyond 3 levels:** `base → section → sub-section → page → sub-page`. Debugging becomes impossible. Cap at 3 and use components.
- **Misplaced assets across layouts:** Admin CSS loaded on public pages. Push section-specific assets per layout, not in base layout.
- **Layout selection in template:** `@if(admin) @extends('layouts.admin') @else @extends('layouts.public') @endif`. Move layout selection to controller.
- **Inconsistent yield/stack names:** Admin uses `@stack('admin-scripts')` while public uses `@stack('scripts')`. Standardize names across all layouts.

## Decision Points

- When to add a new layout: When a section has different navigation, sidebar, asset bundles, or footer content. Not for single pages — group by section.
- Inherited base layout vs component-based: Use base layout for HTML shell sharing. Use component composition inside section layouts for reusable structure pieces.

## Performance Considerations

- Layout selection is a runtime string comparison — zero performance penalty for multiple layouts
- Each layout compiles to a single PHP file, cached in `storage/framework/views/`
- Asset bundles per layout improve performance — admin pages load only admin assets
- No additional database queries or computation cost for multi-layout strategies

## Security Considerations

- Different layouts expose different navigation — ensure admin layout doesn't leak admin UI to unauthorized users via layout misassignment
- Auth layout should not leak navigation that reveals application state
- Layout selection must respect authorization — non-admin must never receive admin layout
- Base layout should not include section-specific scripts or data

## Related Rules

- layout-strategies/05-rules.md: Create a New Layout for Each Application Section with Different Navigation
- layout-strategies/05-rules.md: Cap Layout Inheritance Depth at 3 Levels
- layout-strategies/05-rules.md: Select Layouts in Controllers, Not Templates
- layout-strategies/05-rules.md: Consistent Yield and Stack Points Across All Layouts
- layout-strategies/05-rules.md: Use a Base Layout for the Shared HTML Shell
- layout-strategies/05-rules.md: Load Section-Specific Assets per Layout

## Related Skills

- Template Inheritance: Implement Template Inheritance Hierarchy
- Slots and Stacks: Implement Content Injection with Slots and Stacks
- Component System: Create and Use Blade Components
- View Composers and Creators: Implement View Composers for Shared Data

## Success Criteria

- Each section has its own layout with dedicated navigation, sidebar, and assets
- Layout inheritance is capped at 3 levels with consistent yield/stack names
- Layout selection is explicit in the controller, not conditional in the template
- Section-specific assets are isolated per layout, never mixed
- Adding a new section creates a new layout without modifying existing ones
