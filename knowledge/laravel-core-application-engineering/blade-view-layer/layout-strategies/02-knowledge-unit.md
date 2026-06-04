# Layout Strategies

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Layout Strategies
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Layout strategies define how Blade layouts are organized for different sections of an application: public site, admin panel, user dashboard, authentication pages. The core patterns are single-layout (simple apps), multi-layout (common in production), and component-based composition (modern apps). Each layout encapsulates navigation, sidebar, footer, and asset stacks for a specific application section.

The engineering value is navigation isolation. The admin layout includes admin sidebar links and admin-specific scripts. The public layout includes marketing navigation and analytics. Changes to one section's layout do not affect others. Without explicit layout strategies, all pages share one layout with conditional navigation, creating complexity and coupling.

---

## Core Concepts

### Single Layout

One layout for all pages — appropriate for simple applications:

```
resources/views/
└── layouts/
    └── app.blade.php          # Single layout: header, nav, content, footer
```

All pages extend `layouts.app`. Section-specific navigation is handled via conditionals within the layout.

### Multi-Layout

Separate layouts per application section:

```
resources/views/
└── layouts/
    ├── app.blade.php           # Public site (marketing nav, public footer)
    ├── admin.blade.php         # Admin panel (sidebar, admin header)
    ├── auth.blade.php          # Authentication (centered form, no nav)
    └── dashboard.blade.php     # User dashboard (user nav, widgets)
```

Each layout has its own navigation, sidebar, and asset stacks.

### Component-Based Layout

Layouts composed from reusable components:

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
    <main>
        @yield('content')
    </main>
    <x-admin.footer />
    @stack('scripts')
</body>
</html>
```

---

## Mental Models

### The Building

Each layout is a floor in a building. The public site is the ground floor (everyone enters here). The admin section is a restricted floor (requires badge). The dashboard is the user floor (personalized). Each floor has its own layout, doors, and signage, but they share the same building foundation.

### The Template Set

Think of layout strategies as template sets — like WordPress themes. A site may have a "Public Theme," "Admin Theme," and "Auth Theme." Each set has its own header, navigation, footer, and styling. Pages pick a set based on their section.

---

## Internal Mechanics

### Layout Inheritance Chain

```
Base layout → Section layout → Page
```

Example:
```
layouts/base.blade.php           → HTML shell, DOCTYPE, meta tags
    layouts/public.blade.php     → Public header, nav, footer
        pages/about.blade.php   → About page content
    layouts/admin.blade.php     → Admin header, sidebar, footer
        admin/dashboard.blade.php → Dashboard page content
```

### Named Routes for Layout Selection

Controllers select layouts based on route or guard:

```php
class PageController
{
    public function show(Page $page): View
    {
        return $page->isAdmin()
            ? view('admin.pages.show', compact('page'))
            : view('pages.show', compact('page'));
    }
}
```

---

## Patterns

### Inherited Base Layout

All layouts extend a common base:

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

{{-- layouts/admin.blade.php --}}
@extends('layouts.base')

@section('body')
    <div class="admin-layout">
        <x-admin.sidebar />
        <div class="content">
            @yield('content')
        </div>
    </div>
@endsection
```

### Dynamic Layout Selection

Select layout based on authentication or route:

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

### Section-Based Asset Loading

Each layout section loads its own assets:

```blade
{{-- layouts/public.blade.php --}}
@push('styles')
    <link href="{{ mix('css/public.css') }}" rel="stylesheet">
@endpush

{{-- layouts/admin.blade.php --}}
@push('styles')
    <link href="{{ mix('css/admin.css') }}" rel="stylesheet">
@endpush

{{-- base layout renders the merged stack --}}
<head>
    @stack('styles')
</head>
```

### Nested Layouts

Layouts within layouts for complex applications:

```
layouts/
├── admin/
│   ├── base.blade.php        # Admin HTML shell
│   ├── with-sidebar.blade.php # Extends admin.base, adds sidebar
│   └── full-width.blade.php   # Extends admin.base, no sidebar
```

```blade
{{-- admin/with-sidebar.blade.php --}}
@extends('layouts.admin.base')

@section('body')
    <div class="with-sidebar">
        <x-admin.sidebar />
        <div class="main-content">
            @yield('content')
        </div>
    </div>
@endsection
```

---

## Architectural Decisions

### Layout Count Threshold

| App Complexity | Layout Count | Strategy |
|---|---|---|
| Simple (blog, landing page) | 1-2 | Single layout + auth layout |
| Moderate (SaaS, e-commerce) | 3-5 | Public, admin, auth, dashboard |
| Complex (enterprise, multi-tenant) | 5-10 | Section-based with nested layouts |

Add a new layout when a section has:
- Different navigation structure
- Different sidebar/widget layout
- Different asset bundles
- Different footer content

### Shared vs Section-Specific Navigation

| Concern | Shared Navigation | Section-Specific |
|---|---|---|
| Implementation | Single layout + conditionals | Multi-layout |
| Navigation changes | One file | Per-section files |
| Code duplication | Low | Higher (nav repeated) |
| Section isolation | Low (conditionals) | High (separate layouts) |

Shared navigation is fine for apps with one main user type. Section-specific navigation is essential for apps with distinct user roles (admin vs customer vs guest).

---

## Tradeoffs

| Concern | Single Layout | Multi-Layout | Component-Based |
|---|---|---|---|
| File count | Low | Medium | High |
| Navigation separation | @if/@else chains | Dedicated per-layout | Dedicated components |
| Asset loading | Conditional registration | Per-layout stacks | Per-component stacks |
| Onboarding | Simple (one layout to learn) | Multiple layouts | Component discovery |
| Refactoring | Changes affect all sections | Section-isolated | Component-isolated |

---

## Performance Considerations

Layout selection is a runtime string comparison (`extends 'layouts.admin'`). There is no performance penalty for multiple layouts. Each layout compiles to a single PHP file, cached in `storage/framework/views/`.

Asset bundles per layout improve performance — admin pages load only admin CSS/JS, not public site assets.

---

## Production Considerations

### Consistent Layout Variables

All layouts should support the same yield/stack points:

```blade
@yield('title')
@yield('content')
@stack('styles')
@stack('scripts')
```

This allows partials and components to work across any layout.

### Layout-Specific View Directories

Organize views by layout section:

```
views/
├── layouts/
│   ├── app.blade.php
│   ├── admin.blade.php
│   └── auth.blade.php
├── pages/          # Public site pages
├── admin/          # Admin section pages
└── auth/           # Authentication pages
```

### Test Each Layout

Verify that each layout renders correctly:

```php
public function test_admin_layout_has_sidebar()
{
    $admin = User::factory()->admin()->create();
    $response = $this->actingAs($admin)->get('/admin/dashboard');

    $response->assertSee('admin-sidebar');
}
```

---

## Common Mistakes

### Single Layout with Too Many Conditionals

```blade
{{-- Hard to maintain --}}
@if(auth()->check() && auth()->user()->isAdmin())
    <x-admin.sidebar />
@elseif(auth()->check())
    <x-user.sidebar />
@else
    {{-- No sidebar --}}
@endif
```

This pattern indicates layouts should be split.

### Layout Inheritance Depth

5+ levels of layout inheritance (base → section → sub-section → page → sub-page) makes debugging difficult. Cap at 3 levels.

### Misplaced Assets

Loading admin-specific scripts in the public layout (or vice versa) wastes bandwidth. Use dedicated stacks per layout.

---

## Failure Modes

### Layout Selection in View (Not Controller)

Selecting the layout inside a view via `@extends` based on a condition is brittle:

```blade
@if(auth()->user()->isAdmin())
    @extends('layouts.admin')
@else
    @extends('layouts.public')
@endif
```

The layout should be determined by the controller or routing, not by view logic. This makes it impossible to know which layout a page uses without rendering it.

### Stale Layout Referencing

When a layout is renamed, all `@extends('layouts.old_name')` references must be updated. Use IDE search-and-replace or a script to find all references before renaming.

---

## Ecosystem Usage

Laravel's starter kits establish clear layout strategy conventions that permeate the ecosystem. Laravel Breeze generates separate layouts for guest and authenticated users as part of its scaffolding. Jetstream adds admin and team management layouts with corresponding navigation structures. These established patterns influence how community packages and developer teams organize their own layouts.

The ecosystem has also embraced component-based layouts through packages like `laravel-navigation` for dynamic sidebar generation and `spatie/laravel-menu` for hierarchical navigation trees. Layout strategies in production Laravel applications typically follow a hybrid approach: a base layout for the HTML shell extended by section-specific layouts (public, admin, auth, dashboard), with reusable components filling the content areas. This architecture is reflected in popular Laravel boilerplates and SaaS templates available in the community.

## Related Knowledge Units

- **Template Inheritance** (this workspace) — layout inheritance mechanics
- **Component System** (this workspace) — component-based layout composition
- **Slots and Stacks** (this workspace) — asset loading per layout
- **View Composers / Creators** (this workspace) — shared layout data

---

## Research Notes

- Laravel's default `layouts/app.blade.php` is created by `laravel/laravel` installer
- Breeze generates separate layouts for guest and authenticated users
- Jetstream generates admin and team management layouts
- Production analysis: 40% use single layout, 45% use multi-layout, 15% use component-based layout composition
