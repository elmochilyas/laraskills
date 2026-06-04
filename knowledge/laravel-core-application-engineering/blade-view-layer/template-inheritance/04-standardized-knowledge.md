# Template Inheritance

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Template Inheritance
- **Difficulty Level:** Foundation
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

Blade template inheritance establishes a view hierarchy via `@extends`, `@section`, `@yield`, and `@parent`. A child template extends a parent layout and overrides specific sections while inheriting the surrounding HTML shell. This enables DRY layouts — header, footer, navigation are defined once in the parent and reused across all child pages.

**Engineering value:** Layout consistency and maintainability. A single layout change propagates to every page without editing individual templates. The inheritance model compiles to flat PHP, so runtime performance is identical to single-template rendering.

---

## Core Concepts

### Layout Definition
```blade
{{-- layouts/app.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <title>@yield('title', 'Default Title')</title>
    @stack('styles')
</head>
<body>
    <header>@yield('header')</header>
    <main>@yield('content')</main>
    <footer>@yield('footer')</footer>
    @stack('scripts')
</body>
</html>
```

### Child Template
```blade
{{-- users/index.blade.php --}}
@extends('layouts.app')

@section('title', 'Users List')

@section('content')
    <h1>Users</h1>
@endsection

@push('scripts')
    <script src="/js/users.js"></script>
@endpush
```

### Section Inheritance via @parent
```blade
@section('footer')
    @parent
    <p>Additional footer content</p>
@endsection
```

### Internal Compilation
When a child uses `@extends`, the Blade compiler:
1. Detects `@extends('layout')`
2. Compiles `@section` blocks into content variables
3. Loads the parent layout's compiled view
4. Replaces `@yield` calls with child's section content

Result: a single flat PHP file — no runtime inheritance chain.

---

## When To Use

- **Page-level layout structure** — HTML shell, head, body, navigation, footer
- **Consistent branding across sections** — same header/footer across all pages
- **Three-level site hierarchy** — base layout → section layout → page
- **Starter kit scaffolding** — Breeze, Jetstream layouts
- **Package view customization** — overriding vendor layouts via view namespace

---

## When NOT To Use

- **Reusable UI pieces** — use components (`<x-card>`) instead of `@extends` for reusable widgets
- **Content injection from multiple sources** — use `@stack`/`@push` for assets
- **Dynamic layout per user** — use controller-based layout selection, not conditional `@extends`
- **Micro-frontends** — each section should not extend a different layout on the same page
- **Overriding a single section from multiple children** — only the deepest child's `@section` wins

---

## Best Practices (WHY)

**WHY yield at least title, content, styles, scripts.** Every page needs a title, main content area, CSS injection point, and JS injection point. Missing yields force ugly workarounds.

**WHY provide defaults for optional yields.** `@yield('title', config('app.name'))` ensures no blank output if a child omits the section. This prevents silent failures.

**WHY use stacks for assets, sections for content.** Stacks accumulate (multiple pushes merge). Sections overwrite (last wins). Assets should accumulate; content areas should overwrite.

**WHY keep layouts to HTML shell only.** Business logic, complex conditionals, and heavy data processing belong in view composers or components. A layout with embedded `@php` blocks is a code smell.

**WHY cap inheritance at 3 levels.** Base → Section → Page. Deeper inheritance chains are hard to debug because the deepest child's section always wins, and tracing where content comes from requires opening multiple files.

---

## Architecture Guidelines

### Minimum Layout Components
- `title` — Page title (with app name default)
- `styles` or `head` — CSS/link tags
- `content` or `body` — Primary content area
- `scripts` — Footer JavaScript stacks

### Three-Level Inheritance Structure
```
base.blade.php          → HTML shell, <head>, <body>
├── layouts/
│   ├── admin.blade.php → Admin layout (sidebar, admin header)
│   └── public.blade.php → Public layout (nav, footer)
│       └── pages/
│           └── about.blade.php → extends layouts.public
```

### Layout vs Component Decision
| Concern | Inheritance (Layouts) | Components |
|---|---|---|
| Structure | Page-level (entire HTML shell) | Component-level (reusable pieces) |
| Data flow | Implicit (layout inherits child's data) | Explicit (props passed to component) |
| Reusability | Low (layout is page-scoped) | High (components anywhere) |
| Nesting | Deep (layout → section → include) | Flat (component composition) |

Use both: layouts for the page shell, components for reusable UI pieces.

---

## Performance

Blade inheritance compiles to flat PHP — zero runtime overhead compared to single-template rendering. Compiled files cached in `storage/framework/views/` until cleared.

- **`@yield('content')` compiles to:** `<?php echo $__env->yieldContent('content'); ?>`
- **Overhead:** one array lookup per yield
- **Section storage:** O(1) array push during child rendering, O(1) array access during yield resolution
- **Cache invalidation:** View file mtime triggers automatic recompilation

---

## Security

- **Output escaping:** `{{ }}` escapes HTML automatically. Use `{!! !!}` only for trusted content within sections
- **Section injection:** Section content is raw PHP output — ensure data passed to sections is properly escaped in the child template
- **XSS via yield defaults:** Default values in `@yield('title', $userInput)` are rendered — escape user-supplied defaults

---

## Common Mistakes

### 1. Multiple @extends in one template
- **Description:** Trying to use `@extends` twice in a single file
- **Cause:** Misunderstanding that Blade supports single-parent inheritance only
- **Consequence:** Compilation error
- **Better:** Use component composition or include partials within a single layout

### 2. Unclosed @section
- **Description:** `@section('content')` without `@endsection`, `@stop`, `@show`, or `@overwrite`
- **Cause:** Forgetting to close the section block
- **Consequence:** Compilation breaks; view fails to render
- **Better:** Always pair `@section` with a closing directive

### 3. @parent without parent content
- **Description:** Using `@parent` in a section where the parent doesn't define content
- **Cause:** Assuming the parent layout always has content for the section
- **Consequence:** `@parent` outputs nothing
- **Better:** Only use `@parent` when the parent layout has explicit content in that section

### 4. Deep inheritance (4+ levels)
- **Description:** base → section → sub-section → page → sub-page
- **Cause:** Over-abstracting layout structure
- **Consequence:** Debugging nightmare — conflicting sections resolved at deepest level only; must inspect compiled PHP to trace
- **Better:** Cap at 3 levels; use component composition for additional structure

### 5. Conditional @extends in view
- **Description:** `@if(admin) @extends('admin') @else @extends('public') @endif`
- **Cause:** Attempting dynamic layout selection in the template
- **Consequence:** Layout choice is invisible to controllers/routes; cannot determine page structure without rendering
- **Better:** Select layout in controller based on auth/route

---

## Anti-Patterns

- **Fat layouts with business logic.** A layout that queries the database or performs authorization is an architectural violation. Layouts render — they do not compute.
- **Single layout with 10+ conditional blocks.** One layout with `@if(admin)` / `@elseif(user)` / `@else` for every section indicates multi-layout is needed.
- **Layout inheritance for UI components.** Extending a layout for a reusable card or button misuses the inheritance system. Use components.
- **Overriding too many sections.** A child template that overrides 8 of 10 yield points defeats the purpose of inheritance — consider if this page needs its own layout.

---

## Examples

### Base Layout with Three Yield Points
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
    <div id="app">
        @yield('content')
    </div>
    @stack('scripts')
</body>
</html>
```

### Child Extending with Multiple Sections
```blade
@extends('layouts.base')

@section('title', 'Dashboard - ' . config('app.name'))

@section('content')
    <div class="dashboard">
        <x-dashboard.stats />
        <x-dashboard.recent-activity />
    </div>
@endsection

@push('styles')
    <link href="{{ mix('css/dashboard.css') }}" rel="stylesheet">
@endpush

@push('scripts')
    <script src="{{ mix('js/dashboard.js') }}" defer></script>
@endpush
```

---

## Related Topics

- **Component System** — component-based composition vs layout inheritance
- **Slots and Stacks** — @push/@stack for asset injection
- **Layout Strategies** — multi-layout organization (admin vs public)
- **Rendering Performance** — compiled view caching and optimization
- **View Composers / Creators** — shared data for layouts

---

## AI Agent Notes

- Template inheritance is **compile-time**, not runtime — there is no performance penalty
- `@extends` must be the **first** Blade directive in the file (before any HTML or text output)
- Compiled views are in `storage/framework/views/{hash}.php` — inspect for debugging inheritance issues
- Section names are case-sensitive: `@section('Content')` ≠ `@section('content')`
- `@show` closes a section AND yields it immediately (use in parent, not child)
- `@overwrite` replaces any existing section content (rarely needed)

---

## Verification

- [ ] Layout renders with child's content injected at @yield points
- [ ] `@parent` correctly preserves parent section content
- [ ] `@stack('scripts')` outputs pushed content from child and components
- [ ] Default yield values appear when child omits the section
- [ ] No unclosed @section or @push directives exist
- [ ] Layout inheritance depth does not exceed 3 levels
- [ ] Compiled view cache clears and regenerates on template change
- [ ] `php artisan view:cache` compiles all views without error
