## Rule: Cap Inheritance Depth at 3 Levels

---

## Category

Maintainability

---

## Rule

Limit Blade template inheritance to a maximum of 3 levels (Base → Section → Page). Use component composition for any additional structure beyond this.

---

## Reason

At 4+ levels, the deepest child's `@section` definitions override everything above, making it impossible to determine which file controls which part of the output without tracing through the entire chain. The compiled PHP becomes the only reliable source of truth. Three levels provide sufficient structure for layout organization while keeping the inheritance tree navigable.

---

## Bad Example

```
base.blade.php         {{-- Level 1 --}}
└── admin.blade.php    {{-- Level 2 --}}
    └── reports.blade.php        {{-- Level 3 --}}
        └── quarterly.blade.php  {{-- Level 4 --}}
            └── q1.blade.php     {{-- Level 5 — too deep --}}
```

---

## Good Example

```
base.blade.php         {{-- Level 1 — HTML shell --}}
└── admin.blade.php    {{-- Level 2 — admin structure --}}
    └── reports.blade.php  {{-- Level 3 — page --}}
```

---

## Exceptions

When using nested layout variants within a section (e.g., `admin/with-sidebar.blade.php` and `admin/full-width.blade.php`), keep the main chain at 3 levels and use component composition inside the page.

---

## Consequences Of Violation

Maintenance risks: Debugging inheritance requires tracing through 4+ files; section resolution is unpredictable. Reliability risks: Content appears in unexpected locations or disappears without obvious cause.

---

## Rule: Always Yield `title`, `content`, `styles`, and `scripts`

---

## Category

Design

---

## Rule

Every layout must define at minimum these four yield/stack points: `@yield('title')` (or `title`), `@yield('content')` (or `body`), `@stack('styles')`, and `@stack('scripts')`.

---

## Reason

These four points are the minimum contract that child pages need to work correctly. Without `@yield('title')`, pages cannot set their page title. Without `@stack('styles')`, pages cannot load page-specific CSS. Missing yields force ugly workarounds (injecting via `@section` into non-existent yields) and break the expected child-parent contract.

---

## Bad Example

```blade
{{-- Layout missing title and styles --}}
<body>
    <main>@yield('content')</main>
    @stack('scripts')
</body>
{{-- Pages cannot set <title> or load CSS --}}
```

---

## Good Example

```blade
<head>
    <meta charset="utf-8">
    <title>@yield('title', config('app.name'))</title>
    @stack('styles')
</head>
<body>
    @yield('content')
    @stack('scripts')
</body>
```

---

## Exceptions

Minimal layouts (e.g., a print layout or email template) may omit specific stacks if they are genuinely not needed, but `@yield('content')` should always exist.

---

## Consequences Of Violation

Reliability risks: Pages cannot set titles, load assets, or inject scripts. Maintenance risks: Every child page that needs a missing yield creates a workaround, scattering non-standard patterns across the codebase.

---

## Rule: Provide Default Values for All `@yield` Directives

---

## Category

Reliability

---

## Rule

Always pass a default value as the second parameter to `@yield()`. Use `@yield('title', config('app.name'))` rather than `@yield('title')`.

---

## Reason

Without a default value, a `@yield` that has no corresponding `@section` in the child template produces blank output. Blank titles, empty content areas, and missing page headers create a broken user experience. Defaults ensure graceful rendering even when a child omits a section entirely.

---

## Bad Example

```blade
<title>@yield('title')</title>
{{-- If child doesn't define @section('title'), <title> is empty --}}
```

---

## Good Example

```blade
<title>@yield('title', config('app.name'))</title>
{{-- If child doesn't define @section('title'), shows app name --}}
```

---

## Exceptions

Content areas that MUST be provided by every child (the main content section) may omit defaults to force the child to define content. Even then, a default like "Page not found" is more resilient.

---

## Consequences Of Violation

Reliability risks: Blank output in sections where child omitted the definition. Scalability risks: Every omitted section produces a broken UI element that may go unnoticed in testing.

---

## Rule: Keep Layouts to HTML Shell Only — No Business Logic

---

## Category

Architecture

---

## Rule

Layouts must contain only HTML structure, yield points, stack calls, and minimal navigation display logic. Never embed database queries, complex conditionals, or business operations in layout files.

---

## Reason

Layouts are the outermost template layer — they render on every page using that layout. Expensive operations in the layout execute on every request regardless of whether the page content needs them. Business logic belongs in controllers, services, or view composers. A layout with embedded `@php` blocks querying the database is an architectural violation.

---

## Bad Example

```blade
{{-- Layout with business logic --}}
@php
    $unreadCount = auth()->user()?->unreadNotifications()->count();
    $recentOrders = Order::recent()->limit(5)->get();
@endphp
<nav>
    <span>Notifications: {{ $unreadCount }}</span>
</nav>
```

---

## Good Example

```blade
{{-- Layout — HTML and structure only --}}
<nav>
    <x-notification-badge />
    <x-main-menu :items="$mainMenu ?? []" />
</nav>
{{-- Data provided by view composers or components --}}
```

---

## Exceptions

Simple checks like `auth()->check()` for showing/hiding login/logout links are acceptable in layouts. Complex queries, business rules, and data preparation are not.

---

## Consequences Of Violation

Performance risks: Expensive operations run on every page using the layout; hard to identify and optimize. Maintenance risks: Business logic scattered across layout files creates hidden dependencies and complicates refactoring.

---

## Rule: `@extends` Must Be the First Directive in the File

---

## Category

Framework Usage

---

## Rule

Place `@extends` as the very first Blade directive in a child template, before any HTML output, text content, or other Blade directives.

---

## Reason

Blade's compiler processes `@extends` by capturing all output into section storage instead of rendering inline. If any content (whitespace, HTML, text) appears before `@extends`, that content is output before the layout is applied — it appears above the DOCTYPE in the final HTML, breaking the page structure. Additionally, compiled view errors occur if the inheritance directive is not at the top.

---

## Bad Example

```blade
{{-- This whitespace/newline before @extends breaks output --}}

@extends('layouts.app')

@section('content')
    ...
@endsection
```

---

## Good Example

```blade
@extends('layouts.app')

@section('content')
    ...
@endsection
```

---

## Exceptions

Blade comments (`{{-- --}}`) before `@extends` are processed and ignored by the compiler — they are the only content allowed before the extends directive. No other content is safe.

---

## Consequences Of Violation

Reliability risks: Content rendered before the DOCTYPE; broken HTML structure; whitespace characters appearing as text above the page layout.

---

## Rule: Do Not Use Conditional `@extends` in Templates

---

## Category

Architecture

---

## Rule

Select the layout in the controller based on route, authentication, or user role. Never use `@if/@else` around `@extends` in a template file.

---

## Reason

Conditional `@extends` makes the layout choice invisible to anyone reading the route definitions, controllers, or middleware. You cannot determine which layout a page uses without rendering the template and tracing the conditional logic. This breaks automated testing, static analysis, and developer understanding of page structure.

---

## Bad Example

```blade
@if(auth()->user()?->isAdmin())
    @extends('layouts.admin')
@else
    @extends('layouts.public')
@endif
```

---

## Good Example

```php
abstract class BaseController extends Controller
{
    protected function resolveLayout(): string
    {
        if (auth()->user()?->isAdmin()) {
            return 'layouts.admin';
        }
        return auth()->check() ? 'layouts.dashboard' : 'layouts.public';
    }
}
```

---

## Exceptions

Simple starter kits where the entire application uses exactly one layout for guest users and one for authenticated users may use a conditional `@extends` in the base layout, but controller-based selection is always preferred.

---

## Consequences Of Violation

Maintenance risks: Cannot determine page structure from routing configuration. Testing risks: Layout cannot be mocked or verified independently. Scalability risks: Each new conditional branch adds complexity to every template.

---

## Rule: Use `@parent` Only When Parent Section Content Exists

---

## Category

Framework Usage

---

## Rule

Only use `@parent` inside a `@section` block when the parent layout actually defines content for that section. Do not assume the parent always provides content.

---

## Reason

`@parent` outputs the parent section's content at the point of use. If the parent layout does not define any content in that section, `@parent` produces nothing — it does not error, but the developer may expect content that does not exist. Misuse of `@parent` creates confusing situations where child templates appear to have missing content.

---

## Bad Example

```blade
{{-- Parent layout --}}
@yield('footer')

{{-- Child template --}}
@section('footer')
    @parent
    <p>Additional footer text</p>
@endsection
{{-- If parent has no @section('footer') content, @parent outputs nothing --}}
```

---

## Good Example

```blade
{{-- Parent layout --}}
@section('footer')
    <p>&copy; {{ date('Y') }} Company Name</p>
@show

{{-- Child template --}}
@section('footer')
    @parent
    <p>Additional footer text</p>
@endsection
{{-- @parent outputs the parent's copyright line --}}
```

---

## Exceptions

No common exceptions. Only use `@parent` when you have verified that the parent defines content in that section. When in doubt, omit `@parent` and copy the parent content explicitly.

---

## Consequences Of Violation

Maintenance risks: `@parent` silently produces nothing; developers assume inherited content is present when it is not. Reliability risks: Footer, header, or sidebar content missing because parent section was empty.
