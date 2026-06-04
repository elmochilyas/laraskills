# Layout Strategies

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Layout Strategies
- **Difficulty Level:** Intermediate
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

Layout strategies define how Blade layouts are organized for different application sections: public site, admin panel, user dashboard, authentication pages. Three core patterns exist: **single-layout** (simple apps), **multi-layout** (common in production), and **component-based composition** (modern apps).

**Engineering value:** Navigation isolation. The admin layout includes admin sidebar and admin-specific scripts. The public layout includes marketing navigation and analytics. Changes to one section's layout do not affect others. Without explicit strategies, all pages share one layout with conditional navigation, creating complexity and coupling.

---

## Core Concepts

### Single Layout
One layout for all pages — appropriate for simple applications:
```
resources/views/layouts/app.blade.php  # Single layout for everything
```
Section-specific navigation handled via conditionals within the layout.

### Multi-Layout
Separate layouts per application section:
```
resources/views/layouts/
├── app.blade.php           # Public site (marketing nav, public footer)
├── admin.blade.php         # Admin panel (sidebar, admin header)
├── auth.blade.php          # Authentication (centered form, no nav)
└── dashboard.blade.php     # User dashboard (user nav, widgets)
```

### Component-Based Layout
```blade
{{-- layouts/admin.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <title>@yield('title') | Admin</title>
    @stack('styles')
</head>
<body>
    <x-admin.header />
    <x-admin.sidebar :active="$activeSection ?? ''" />
    <main>@yield('content')</main>
    <x-admin.footer />
    @stack('scripts')
</body>
</html>
```

### Inherited Base Layout
```blade
{{-- layouts/base.blade.php -- HTML shell --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>@yield('title', config('app.name'))</title>
    @stack('styles')
</head>
<body>@yield('body')@stack('scripts')</body>
</html>

{{-- layouts/admin.blade.php -- extends base --}}
@extends('layouts.base')

@section('body')
    <div class="admin-layout">
        <x-admin.sidebar />
        <div class="content">@yield('content')</div>
    </div>
@endsection
```

---

## When To Use

- **Single layout** — blog, landing page, simple CRUD app with one user type
- **Multi-layout** — SaaS, e-commerce, enterprise apps with admin/public/auth sections
- **Component-based layout** — large apps where layout pieces (header, sidebar, footer) are reused across sections with variations
- **Nested layouts** — complex admin panels with sidebar and full-width variants
- **Section-specific asset loading** — admin CSS/JS vs public CSS/JS should be independent

---

## When NOT To Use

- **Single layout for multi-role app** — admin, user, and guest pages with different navigation in one layout creates excessive conditionals
- **Layout per page** — each page should not have its own layout; group by section
- **Component-based for 2-page app** — component abstraction adds overhead for trivial layout needs
- **Controller-less layout selection** — selecting layout via `@extends` based on runtime conditions makes page structure unpredictable

---

## Best Practices (WHY)

**WHY add a new layout when a section has different navigation.** A single layout with `@if(admin)/@elseif(user)/@else` for every navigation element is hard to maintain. Separate layouts isolate navigation changes per section.

**WHY use a base layout for shared HTML shell.** The DOCTYPE, meta tags, charset, and viewport are identical across all layouts. A base layout eliminates this duplication. Section layouts extend the base and add section-specific structure.

**WHY select layouts in controllers, not templates.** Conditional `@extends` in a template makes the layout choice invisible — you cannot know which layout a page uses without rendering it. Controller-based selection is explicit and testable.

**WHY keep layouts at 3 levels max.** Base → Section → Page. Deeper inheritance makes debugging difficult because the deepest child always wins. Use component composition if you need more structure.

**WHY use section-specific asset stacks.** The admin layout should load `css/admin.css`, not `css/app.css`. Section-specific stacks prevent unused CSS on pages and reduce page weight.

---

## Architecture Guidelines

### Layout Count by App Complexity
| App Complexity | Layout Count | Strategy |
|---|---|---|
| Simple (blog, landing page) | 1-2 | Single + auth |
| Moderate (SaaS, e-commerce) | 3-5 | Public, admin, auth, dashboard |
| Complex (enterprise, multi-tenant) | 5-10 | Section-based with nested layouts |

### When to Add a Layout
A new layout is warranted when a section has:
- Different navigation structure
- Different sidebar/widget layout
- Different asset bundles
- Different footer content

### Directory Organization
```
views/
├── layouts/
│   ├── base.blade.php       # HTML shell (shared by all)
│   ├── public.blade.php     # Extends base, public nav
│   ├── admin.blade.php      # Extends base, admin sidebar
│   └── auth.blade.php       # Extends base, centered form
├── pages/                   # Public site pages
├── admin/                   # Admin section pages
└── auth/                    # Authentication pages
```

### Dynamic Layout Selection
```php
abstract class BaseController extends Controller
{
    protected function layout(): string
    {
        if (auth()->user()?->isAdmin()) {
            return 'layouts.admin';
        }
        return auth()->check() ? 'layouts.dashboard' : 'layouts.public';
    }

    protected function view(string $view, array $data = []): View
    {
        return view($view, array_merge($data, ['layout' => $this->layout()]));
    }
}
```

---

## Performance

- Layout selection is a runtime string comparison — zero performance penalty for multiple layouts
- Each layout compiles to a single PHP file, cached in `storage/framework/views/`
- Asset bundles per layout improve performance — admin pages load only admin assets
- No additional database queries or computation cost for multi-layout strategies

---

## Security

- Different layouts may expose different navigation elements — ensure admin layout doesn't leak admin UI elements to unauthorized users via layout misassignment
- Auth layout should not leak navigation that reveals application state
- Base layout should not include section-specific scripts or data that could be exploited
- Layout selection must respect authorization — a non-admin must never receive the admin layout

---

## Common Mistakes

### 1. Single layout with too many conditionals
- **Description:** One layout with `@if(admin)/@elseif(user)/@else` blocks for navigation, sidebar, footer
- **Cause:** Avoiding the effort of creating separate layouts
- **Consequence:** Layout becomes unreadable; every conditional branch is a maintenance trap; adding a new section affects the entire layout
- **Better:** Split into separate layouts per section

### 2. Layout inheritance depth beyond 3 levels
- **Description:** base → section → sub-section → page → sub-page (5 levels)
- **Cause:** Over-abstracting layout structure
- **Consequence:** Debugging nightmare — conflicting sections resolved at deepest level; must read compiled PHP to trace
- **Better:** Cap at 3 levels (base → section → page); use component composition for additional structure

### 3. Misplaced assets across layouts
- **Description:** Admin-specific JS loaded in public layout (or vice versa)
- **Cause:** Using a shared stack or not isolating per-layout asset bundles
- **Consequence:** Wasted bandwidth; admin pages expose public-site scripts
- **Better:** Use dedicated stacks per layout and per section

### 4. Layout selection in view (not controller)
- **Description:** `@if(admin) @extends('layouts.admin') @else @extends('layouts.public') @endif`
- **Cause:** Convenience in the template
- **Consequence:** Layout choice invisible to routing; cannot determine page structure without rendering; breaks automated testing
- **Better:** Select layout in controller based on auth/route context

### 5. Inconsistent yield/stack points across layouts
- **Description:** Admin layout uses `@stack('admin-scripts')`; public layout uses `@stack('scripts')`
- **Cause:** No standardization of yield/stack names
- **Consequence:** Components pushing to `@stack('scripts')` don't render in admin layout; partials don't work cross-layout
- **Better:** Define a consistent set of yield and stack points in all layouts

---

## Anti-Patterns

- **Layout that queries the database.** Layouts render structure, not data. Use view composers for layout-shared data.
- **One mega-layout with 20 conditional sections.** If you need `@if`/`@elseif` for 5 different page types, you need 5 layouts.
- **Dynamic layout switching in middleware.** Middleware should not change the layout — the controller chooses the layout based on its action.
- **Layouts containing business logic.** A layout should not check permissions beyond what's needed for navigation display.
- **Nested layouts with override chains.** `@section('body') @section('content') @section('inner')` — 3 levels of section nesting indicates excessive abstraction.

---

## Examples

### Base → Public → Page Structure
```blade
{{-- layouts/base.blade.php --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', config('app.name'))</title>
    @stack('styles')
</head>
<body>
    @yield('body')
    @stack('scripts')
</body>
</html>

{{-- layouts/public.blade.php --}}
@extends('layouts.base')

@section('body')
    <x-public.header />
    <main>@yield('content')</main>
    <x-public.footer />
@endsection

@push('styles')
    <link href="{{ mix('css/public.css') }}" rel="stylesheet">
@endpush

{{-- pages/about.blade.php --}}
@extends('layouts.public')

@section('title', 'About Us')

@section('content')
    <h1>About Our Company</h1>
    {{-- page content --}}
@endsection
```

### Admin Layout with Nested Variants
```
layouts/admin/
├── base.blade.php           # Admin HTML shell
├── with-sidebar.blade.php   # Extends admin.base, adds sidebar
└── full-width.blade.php     # Extends admin.base, no sidebar
```

### Section-Specific Asset Loading
```blade
{{-- layouts/admin.blade.php --}}
@push('styles')
    <link href="{{ mix('css/admin.css') }}" rel="stylesheet">
@endpush

{{-- layouts/public.blade.php --}}
@push('styles')
    <link href="{{ mix('css/public.css') }}" rel="stylesheet">
@endpush

{{-- base layout renders the merged stack --}}
<head>@stack('styles')</head>
```

---

## Related Topics

- **Template Inheritance** — layout inheritance mechanics
- **Component System** — component-based layout composition
- **Slots and Stacks** — asset loading per layout
- **View Composers / Creators** — shared layout data
- **Blade Testing** — testing layout rendering for each section

---

## AI Agent Notes

- Laravel's default `layouts/app.blade.php` created by the installer
- Breeze generates separate layouts for guest and authenticated users
- Jetstream generates admin and team management layouts
- ~40% use single layout, ~45% use multi-layout, ~15% use component-based
- Layouts compile to flat PHP — no runtime overhead for inheritance
- `Illuminate\View\View` does not natively support dynamic layout selection — must be done in controller
- Always keep consistent yield/stack names across all layouts for component portability

---

## Verification

- [ ] Each application section has its own layout with section-specific navigation
- [ ] Layout inheritance depth does not exceed 3 levels
- [ ] All layouts support consistent yield/stack points (title, content, styles, scripts)
- [ ] Each layout loads only its section-specific assets (no cross-contamination)
- [ ] Layout selection is done in the controller, not in the template
- [ ] Base layout contains only shared HTML shell (no section-specific logic)
- [ ] Navigation isolation is verified: admin pages don't leak public nav and vice versa
- [ ] Adding a new section requires creating a new layout, not adding conditionals to an existing one
- [ ] Each layout can be tested independently
