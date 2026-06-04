## Rule: Create a New Layout for Each Application Section with Different Navigation

---

## Category

Architecture

---

## Rule

Add a new layout whenever an application section has a different navigation structure, sidebar, footer, or asset bundle. Do not handle section-specific navigation via conditionals in a single layout.

---

## Reason

A single layout with `@if(admin)/@elseif(user)/@else` blocks for navigation, sidebar, and footer becomes unreadable and unmaintainable as conditionals multiply. Each new section adds complexity to every layout file. Separate layouts isolate navigation changes per section — modifying the admin sidebar affects only the admin layout, not the public or auth layouts.

---

## Bad Example

```blade
{{-- Single layout handling all sections via conditionals --}}
<nav>
    @if(auth()->user()?->isAdmin())
        <a href="/admin/users">Users</a>
        <a href="/admin/settings">Settings</a>
    @elseif(auth()->check())
        <a href="/dashboard">Dashboard</a>
        <a href="/profile">Profile</a>
    @else
        <a href="/login">Login</a>
        <a href="/register">Register</a>
    @endif
</nav>
```

---

## Good Example

```blade
{{-- Separate layouts per section --}}
{{-- layouts/admin.blade.php — admin nav, admin sidebar --}}
{{-- layouts/dashboard.blade.php — user nav, dashboard widgets --}}
{{-- layouts/public.blade.php — public nav, marketing footer --}}
{{-- layouts/auth.blade.php — centered form, no nav --}}
```

---

## Exceptions

Simple applications with a single user role (blog, landing page) can use one layout. Add a new layout when the navigation differences require conditional branches.

---

## Consequences Of Violation

Maintenance risks: Single layout becomes a maintenance trap with 10+ conditional branches. Scalability risks: Adding a new section requires modifying the entire layout, increasing regression surface.

---

## Rule: Cap Layout Inheritance Depth at 3 Levels

---

## Category

Maintainability

---

## Rule

Limit layout inheritance to a maximum of 3 levels: Base → Section → Page. Use component composition instead of deeper inheritance chains.

---

## Reason

Beyond 3 levels, debugging becomes a nightmare. The deepest child's `@section` always wins, overriding everything above it. Tracing where a piece of content originates requires opening 4+ files following the inheritance chain. The compiled PHP is the only reliable source of truth — and nobody reads compiled PHP. Component composition provides flatter, debuggable structure without inheritance confusion.

---

## Bad Example

```
views/layouts/
├── base.blade.php          {{-- Level 1 --}}
    └── admin.blade.php     {{-- Level 2 --}}
        └── reports/        {{-- Level 3 --}}
            └── finance/    {{-- Level 4 — too deep --}}
                └── quarterly.blade.php  {{-- Level 5 --}}
```

---

## Good Example

```
views/layouts/
├── base.blade.php          {{-- Level 1 — HTML shell --}}
├── admin.blade.php         {{-- Level 2 — admin structure --}}
└── pages/
    └── reports/quarterly.blade.php  {{-- Level 3 — extends admin --}}
```

---

## Exceptions

Nested layout variants within a section (e.g., `admin/with-sidebar.blade.php` and `admin/full-width.blade.php` at level 3) are acceptable if they extend the section layout at level 2, keeping total depth at 3.

---

## Consequences Of Violation

Maintenance risks: Conflicting sections resolved at deepest level; debugging requires reading compiled PHP. Reliability risks: Content appears in unexpected locations or disappears entirely.

---

## Rule: Select Layouts in Controllers, Not Templates

---

## Category

Architecture

---

## Rule

Choose which layout a page uses in the controller based on request context (auth status, route, user role). Do not use conditional `@extends` directives in the template.

---

## Reason

Conditional `@extends` in a template makes the layout choice invisible to anyone reading the controller or route definitions. You cannot determine which layout a page renders without executing the template and tracing the conditional logic. Controller-based selection is explicit, testable, and gives a single source of truth for page structure.

---

## Bad Example

```blade
{{-- Layout selection hidden in template --}}
@if(auth()->user()?->isAdmin())
    @extends('layouts.admin')
@else
    @extends('layouts.public')
@endif
```

---

## Good Example

```php
class BaseController extends Controller
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

## Exceptions

When using a single layout for all pages (simple apps), the `@extends` directive is hardcoded in each page template — no conditionals, so no issue.

---

## Consequences Of Violation

Maintenance risks: Cannot determine page structure without rendering; automated tools cannot analyze layout selection. Testing risks: Layout cannot be mocked or verified independently.

---

## Rule: Consistent Yield and Stack Points Across All Layouts

---

## Category

Maintainability

---

## Rule

Define the same set of `@yield` and `@stack` point names across all layouts. Standardize names like `title`, `content`, `styles`, `scripts`, and `head`.

---

## Reason

Inconsistent yield/stack names break component portability. A component that pushes to `@stack('scripts')` in the public layout is silently ignored in the admin layout if it uses `@stack('admin-scripts')`. Standardized names ensure that child pages and components work identically regardless of which layout they extend.

---

## Bad Example

```blade
{{-- layouts/public.blade.php --}}
@stack('scripts')

{{-- layouts/admin.blade.php --}}
@stack('admin-scripts')

{{-- Child pushes to @stack('scripts') — works in public, silent no-op in admin --}}
```

---

## Good Example

```blade
{{-- All layouts use the same stack names --}}
{{-- layouts/base.blade.php --}}
<head>
    @stack('styles')
    @stack('head-scripts')
</head>
<body>
    @yield('content')
    @stack('modals')
    @stack('scripts')
</body>
```

---

## Exceptions

When a section-specific stack is intentionally isolated (e.g., an admin chart JS stack that should NOT be present in the public layout), document the exception explicitly with a comment.

---

## Consequences Of Violation

Reliability risks: Scripts and styles silently missing from pages using different layouts. Maintenance risks: Components cannot be reused across sections; each layout requires separate asset push strategies.

---

## Rule: Use a Base Layout for the Shared HTML Shell

---

## Category

Code Organization

---

## Rule

Create a `layouts/base.blade.php` containing only the DOCTYPE, `<html>`, `<head>`, and `<body>` shell with standard yield points. Have every section layout extend this base.

---

## Reason

The DOCTYPE, meta charset, viewport tag, and HTML structure are identical across all layouts. Without a base, these are duplicated in every section layout. A base layout eliminates duplication by providing the shared shell once, while section layouts add only their specific structure (navigation, sidebar, footer).

---

## Bad Example

```
layouts/
├── public.blade.php  {{-- Duplicates DOCTYPE, head, body --}}
├── admin.blade.php   {{-- Duplicates DOCTYPE, head, body --}}
└── auth.blade.php    {{-- Duplicates DOCTYPE, head, body --}}
```

---

## Good Example

```
layouts/
├── base.blade.php         {{-- DOCTYPE, head, body shell once --}}
├── public.blade.php       {{-- Extends base, adds public nav --}}
├── admin.blade.php        {{-- Extends base, adds admin sidebar --}}
└── auth.blade.php         {{-- Extends base, adds centered form --}}
```

---

## Exceptions

If a section layout has fundamentally different HTML structure (e.g., a landing page with no standard `<html>` structure or a full-page app shell), it may skip the base layout. This should be rare.

---

## Conclusions Of Violation

Maintenance risks: Duplicate markup across layouts — changing a meta tag requires editing every layout. Scalability risks: Adding a new section layout requires manually copying the HTML shell.

---

## Rule: Load Section-Specific Assets per Layout

---

## Category

Performance

---

## Rule

Each layout should push only its own section-specific CSS and JavaScript files to the standard stacks. Do not load admin assets in the public layout or vice versa.

---

## Reason

Loading admin-specific CSS on public pages wastes bandwidth and may cause style conflicts. Admin pages that load public marketing scripts expose unnecessary JavaScript. Section-specific asset loading via dedicated pushes to standardized stacks ensures each page loads exactly the assets it needs — no more, no less.

---

## Bad Example

```blade
{{-- layouts/base.blade.php — loads everything for every page --}}
<head>
    <link href="{{ mix('css/app.css') }}" rel="stylesheet">
    <link href="{{ mix('css/admin.css') }}" rel="stylesheet">
    <link href="{{ mix('css/dashboard.css') }}" rel="stylesheet">
</head>
```

---

## Good Example

```blade
{{-- layouts/admin.blade.php --}}
@push('styles')
    <link href="{{ mix('css/admin.css') }}" rel="stylesheet">
@endpush

{{-- layouts/public.blade.php --}}
@push('styles')
    <link href="{{ mix('css/public.css') }}" rel="stylesheet">
@endpush

{{-- layouts/base.blade.php --}}
<head>@stack('styles')</head>
```

---

## Exceptions

Shared CSS (a design system or reset) that every section uses should be in the base layout, not duplicated per section. The rule applies to section-specific assets.

---

## Consequences Of Violation

Performance risks: Unused CSS and JS loaded on every page — increased page weight and slower load times. Maintenance risks: CSS conflicts from incompatible section-specific styles loading on the wrong pages.
