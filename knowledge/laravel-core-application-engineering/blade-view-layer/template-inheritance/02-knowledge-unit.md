# Template Inheritance

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Template Inheritance
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Blade template inheritance is the foundation of Laravel's templating system. Using `@extends`, `@section`, `@yield`, and `@parent`, a view hierarchy is established where a child template extends a parent layout and overrides specific sections while inheriting the surrounding structure. This enables DRY layouts — the header, footer, navigation, and HTML shell are defined once in the parent and reused across all child pages.

The engineering value is layout consistency and maintainability. A single layout change (header link update, analytics script addition) propagates to every page without editing individual templates. The inheritance model compiles to flat PHP, so runtime performance is identical to single-template rendering.

---

## Core Concepts

### Layout Definition

A layout defines the HTML shell with `@yield` directives for content areas:

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
    <main>
        @yield('content')
    </main>
    <footer>@yield('footer')</footer>
    @stack('scripts')
</body>
</html>
```

### Child Template

A child template extends the layout and fills sections:

```blade
{{-- users/index.blade.php --}}
@extends('layouts.app')

@section('title', 'Users List')

@section('content')
    <h1>Users</h1>
    {{-- page content --}}
@endsection

@push('scripts')
    <script src="/js/users.js"></script>
@endpush
```

### Section Inheritance

`@parent` preserves the parent's section content while adding child content:

```blade
@section('footer')
    @parent
    <p>Additional footer content</p>
@endsection
```

---

## Mental Models

### The Stencil

The parent layout is a stencil with cutouts (`@yield`). Each child template fills specific cutouts with custom content. The cutouts that are not filled display their default content. The stencil's uncut areas (header, footer, navigation) remain unchanged across all pages.

### The Stack of Paper

Templates are like stacked paper sheets. The bottom sheet (layout) has the full design. Each sheet above (child) adds detail on specific transparent areas. The final view is all sheets combined — the layout's structure with the child's fill.

---

## Internal Mechanics

### Compilation

When a child template uses `@extends`, the Blade compiler:

1. Detects `@extends('layout')` directive
2. Compiles the child's `@section` blocks into content variables
3. Loads the parent layout's compiled view
4. Replaces `@yield` calls in the parent with the child's section content

The compiled output is a single PHP file — there is no runtime inheritance chain.

### Section Storage

Sections are stored in a stack within the `Factory`:

```php
// Blade compiler registers:
$this->startSection('content');
// ... child template content ...
echo $this->stopSection();
// Later, when layout renders @yield('content'), the stored section is inserted.
```

### @yield Resolution

`@yield('name', 'default')` compiles to:

```php
<?php echo $__env->yieldContent('name', 'default'); ?>
```

The `yieldContent()` method checks if a section with that name was registered (via `@section`/`@endsection` in the child). If yes, returns the section content. If no, returns the default.

---

## Patterns

### Three-Level Inheritance

For deeply structured sites:

```
base.blade.php          → HTML shell, <head>, <body>
├── layouts/             → Layouts extending base
│   ├── admin.blade.php  → Admin layout (sidebar, admin header)
│   └── public.blade.php → Public layout (navigation, footer)
│       └── pages/       → Pages extending layouts
│           └── about.blade.php → extends layouts.public
```

Each level specializes more: `base` → `admin` → `users/index`.

### Named Sections with Defaults

Provide defaults for optional sections:

```blade
<title>@yield('title', config('app.name'))</title>
```

This ensures the title is never blank even if the child omits the `title` section.

### Override-Only Sections

Sections that must be overridden (no default):

```blade
@yield('content')  {{-- No default — child must define --}}
```

If the child does not define `content`, the yield outputs nothing. This is acceptable for required content areas.

---

## Architectural Decisions

### Layout vs Component Architecture

| Concern | Inheritance (Layouts) | Components |
|---|---|---|
| Structure | Page-level (entire HTML shell) | Component-level (reusable pieces) |
| Data flow | Implicit (layout inherits child's data) | Explicit (props passed to component) |
| Reusability | Low (layout is page-scoped) | High (components anywhere) |
| Nesting | Deep (layout → section → include) | Flat (component composition) |

Modern Blade applications use both: layouts for the page shell, components for reusable UI pieces. Inheritance is not replaced by components — they serve different levels of abstraction.

### Minimum Layout Components

A well-structured layout should yield:
- `title` — Page title (with app name default)
- `styles` or `head` — Head-specific CSS/link tags
- `content` or `body` — Primary page content
- `scripts` or `footer` — Footer JavaScript stacks

Additional yields for `header`, `sidebar`, `breadcrumbs` are optional but recommended for complex layouts.

---

## Tradeoffs

| Concern | Inheritance | Direct Rendering (no layout) |
|---|---|---|
| DRY | High (layout reused across all pages) | Low (each page repeats shell) |
| Navigation changes | One file change | Per-file change |
| Page-specific flexibility | Limited (must fit layout slots) | Full (any structure) |
| Compilation overhead | None (same as single template) | None |

---

## Performance Considerations

Blade inheritance compiles to flat PHP — there is zero runtime overhead compared to rendering a single template. The compiled files are cached in `storage/framework/views/` and served until cleared.

### Compiled Output

The parent layout's `@yield('content')` becomes:

```php
<?php echo $__env->yieldContent('content'); ?>
```

The child's `@section('content')` is captured during rendering of the child template and stored. The `yieldContent()` call retrieves it. Total overhead: one array lookup.

---

## Production Considerations

### Keep Layouts Simple

A layout should contain only the HTML shell. Business logic, complex conditionals, and heavy data processing belong in view composers or components, not in the layout.

### Stack Registration for Assets

Use `@stack` for asset injection — it allows children and components to push styles/scripts:

```blade
{{-- Layout --}}
@stack('styles')
@stack('scripts')

{{-- Child page --}}
@push('scripts')
    <script>console.log('page-specific')</script>
@endpush

{{-- Component --}}
@push('styles')
    <link href="/css/component.css" rel="stylesheet">
@endpush
```

### Section vs Stack

| Directive | Purpose | Overwrite Behavior |
|---|---|---|
| `@yield`/`@section` | Content areas | Child replaces parent (or uses `@parent`) |
| `@stack`/`@push` | Asset injection | Accumulates (multiple pushes merge) |

Use `@yield` for content, `@stack` for assets.

---

## Common Mistakes

### Multiple Layout Inheritance

Blade does not support multiple `@extends` in one template. To combine multiple layouts, use component composition or include partials within a single layout.

### Forgetting @endsection or @show

Each `@section` must be closed with `@endsection`, `@stop`, `@show`, or `@overwrite`. Unclosed sections break compilation:

```blade
@section('content')
    <p>Content</p>
{{-- Missing @endsection --}}
```

### Using @parent Without Parent Content

If the parent layout does not define a default for the section, `@parent` outputs nothing. `@parent` only works if the parent layout has content for that section.

---

## Failure Modes

### Deep Inheritance Debugging

Nested inheritance (3+ levels) is hard to debug because conflicting sections are resolved at the deepest level only. The deepest child's `@section` always wins. To debug, inspect the compiled view at `storage/framework/views/`.

### Layout Cache Stale

When a parent layout changes, child templates do not automatically recompile. Clear the view cache: `php artisan view:clear`. In production, deploy with `view:cache` to compile all views.

---

## Ecosystem Usage

Template inheritance through `@extends`, `@section`, and `@yield` is the backbone of every Laravel application's view structure. The pattern is so fundamental that Laravel's starter kits (Breeze, Jetstream) all generate layouts using this system by default. Every major Laravel package that provides views—from Nova to Spark to community packages like `laravel-admin`—uses layout inheritance to allow applications to override and customize the package's views.

The ecosystem has embraced inheritance customizability through Laravel's view namespace system. Packages publish their views and allow developers to override them by creating views with the same relative path in the application's `resources/views/vendor/` directory. This pattern, combined with the `@parent` directive for preserving parent content while extending it, gives applications full control over package-provided layouts without forking the package code. The inheritance system's stability across Laravel versions (unchanged since Laravel 4) makes it one of the most reliable and well-understood patterns in the ecosystem.

## Related Knowledge Units

- **Component System** (this workspace) — component-based composition
- **Slots and Stacks** (this workspace) — content injection patterns
- **Layout Strategies** (this workspace) — multi-layout organization
- **Rendering Performance** (this workspace) — compiled view optimization

---

## Research Notes

- Blade inheritance was inspired by Ruby's ERB and .NET's Razor view engine
- The `@parent` directive compiles to `<?php echo $__env->yieldParent('sectionName'); ?>`
- Compiled views use xxh128 hashing for file path generation to prevent path traversal
- Production analysis: 95% of Laravel applications use layout inheritance for page shells
