# Blade Fragments

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Blade Fragments
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Blade Fragments (Laravel 12+) enable partial re-rendering of view sections without a full page reload. Using `@fragment` and `fragment()` on the response, a controller returns only a specific section of a Blade view — the surrounding layout, navigation, and other sections are omitted. This is primarily used with Turbo Drive, HTMX, and Livewire for smooth page transitions.

The engineering value is reducing response payload for navigation. When a user navigates within an app, only the content fragment changes — the layout doesn't need to be re-rendered. Fragments allow the server to return just the changed content, reducing bandwidth and enabling animated transitions.

---

## Core Concepts

### Fragment Definition in Blade

Mark a section of a view as a fragment:

```blade
{{-- users/index.blade.php --}}
@extends('layouts.app')

@section('content')
    <h1>Users</h1>
    @fragment('user-list')
        <div id="user-list">
            @foreach ($users as $user)
                <div>{{ $user->name }}</div>
            @endforeach
        </div>
    @endfragment
@endsection
```

### Fragment Response in Controller

Return only the fragment from the controller:

```php
class UserController
{
    public function index(Request $request): View
    {
        $users = User::paginate();

        // If the request is a fragment request (Turbo/HTMX header),
        // return only the 'user-list' fragment
        if ($request->fragment()) {
            return view('users.index', compact('users'))
                ->fragment('user-list');
        }

        return view('users.index', compact('users'));
    }
}
```

### Fragment Request Detection

The `X-Inertia-Partial-Data` or `Turbo-Frame` header triggers fragment handling. Laravel's `Request::fragment()` method detects whether the request expects a fragment:

```php
$request->fragment(); // Returns the fragment name or null
```

---

## Mental Models

### The Replaceable Panel

Think of a fragment as a replaceable panel on a dashboard. The full page has a frame (layout), a sidebar, and a content panel. A fragment request replaces JUST the content panel. The frame stays unchanged in the browser. This is like changing only the center panel of a triptych without touching the side panels.

### The Surgical Update

Full page navigation is like amputating and regrowing the entire body. Fragment navigation is like a targeted surgery — only the affected organ is replaced. The body (layout) remains intact.

---

## Internal Mechanics

### Fragment Rendering

When `$view->fragment('name')` is called on a view:

1. The view is rendered normally
2. The `@fragment('name')` content is extracted from the rendered output
3. Only the extracted content is returned as the response

The extraction happens at the string level on the fully rendered HTML.

### Fragment vs Section

A `@fragment` is not the same as `@section`:
- `@section` is a layout inheritance concept — content from child to parent
- `@fragment` is a rendering optimization concept — content to extract from the full response

A fragment may contain a section, but they are separate concerns.

### Header-Based Requests

The request typically includes a header indicating the fragment:

```
Turbo: Turbo-Frame: user-list
HTMX: HX-Request: true
```

Laravel's fragment detection works with standard HTTP headers that indicate partial rendering.

---

## Patterns

### Turbo Drive Integration

Use fragments with Turbo Drive for SPA-like navigation:

```blade
{{-- Layout --}}
<turbo-frame id="content">
    @yield('content')
</turbo-frame>

{{-- Controller --}}
public function index(Request $request): View
{
    return view('users.index', ['users' => User::paginate()])
        ->fragment('content');
}
```

### HTMX Integration

Fragments work with HTMX's `hx-target`:

```blade
<button hx-get="/users?page=2" hx-target="#user-list">
    Next Page
</button>

@fragment('user-list')
    <div id="user-list">
        @foreach ($users as $user)
            <div>{{ $user->name }}</div>
        @endforeach
    </div>
@endfragment
```

### Conditional Fragment

Only use fragment rendering when the request expects it:

```php
public function index(Request $request): View|Fragment
{
    $users = User::paginate();
    $view = view('users.index', compact('users'));

    return $request->header('Turbo-Frame')
        ? $view->fragment('content')
        : $view;
}
```

### Multiple Fragments

A single view can define multiple fragments:

```blade
@fragment('stats')
    <div id="stats">{{ $stats }}</div>
@endfragment

@fragment('user-list')
    <div id="user-list">
        @foreach ($users as $user)
            <div>{{ $user->name }}</div>
        @endforeach
    </div>
@endfragment
```

---

## Architectural Decisions

### Fragment vs Livewire

| Concern | Blade Fragment | Livewire |
|---|---|---|
| JavaScript requirement | Turbo/HTMX (optional) | Required (Livewire.js) |
| Server rendering | Full page, extract fragment | Component-level |
| State management | None (stateless) | Full (component state) |
| Interaction model | Navigation-driven | Event-driven |
| Complexity | Low | Medium |

Fragments are simpler for navigation-focused partial updates. Livewire is better for interactive components with state.

### Fragment vs Inertia Partial Reload

| Concern | Blade Fragment | Inertia Partial Reload |
|---|---|---|
| Frontend stack | Server-rendered HTML | Client-rendered JS |
| Data format | HTML fragment | JSON props |
| Payload size | Larger (HTML) | Smaller (JSON) |
| Animation | Turbo/HTMX handles transitions | Inertia handles transitions |

---

## Tradeoffs

| Concern | Full Page | Blade Fragment | Turbo/HTMX |
|---|---|---|---|
| Payload size | Full HTML (largest) | Fragment HTML (medium) | JSON (smallest) |
| JavaScript | None | Turbo/HTMX | Inertia/Livewire |
| Layout rendering | Full (server) | Partial (server) | Not rendered (separate endpoint) |
| SEO | Full HTML | Fragment-only (SEO concern) | Needs SSR |
| Complexity | Low | Medium | Medium-High |

---

## Performance Considerations

Fragment rendering still renders the entire view on the server — it just extracts a portion for the response. Server CPU cost is similar to full rendering. The bandwidth saving comes from sending only the fragment HTML over the network.

### Server Cost vs Bandwidth Saving

```
Full page:  CPU 10ms | Network 500KB | Total 510ms perceived
Fragment:  CPU 10ms | Network 50KB  | Total 60ms perceived
```

Server CPU is the same. Network is 10x smaller. Fragment optimization is a bandwidth optimization, not a server optimization.

---

## Production Considerations

### SEO Consideration

Fragment responses contain only partial HTML. Search engine crawlers may not index fragment-only content correctly. Ensure crawlers receive full-page responses by checking user-agent or fragment header:

```php
public function index(Request $request): View
{
    if ($request->fragment() && !$request->isBot()) {
        return view('users.index', ['users' => User::paginate()])
            ->fragment('user-list');
    }

    return view('users.index', ['users' => User::paginate()]);
}
```

### Cache Fragment Responses

Fragment responses can be cached separately from full responses:

```php
public function index(Request $request): View
{
    $cacheKey = 'users:index:' . ($request->fragment() ? 'fragment:' . $request->fragment() : 'full');

    return Cache::remember($cacheKey, 3600, function () use ($request) {
        $view = view('users.index', ['users' => User::paginate()]);

        return $request->fragment()
            ? $view->fragment($request->fragment())->render()
            : $view->render();
    });
}
```

---

## Common Mistakes

### Server-Side Layout Duplication

Rendering the full layout AND the fragment for each request wastes server CPU. Use fragment responses only when the client signals a fragment request (via header).

### Forgetting ID Attributes

Fragments rely on DOM ID matching (Turbo) or target selectors (HTMX). Ensure the fragment wrapper element has a consistent ID:

```blade
@fragment('user-list')
    <div id="user-list"> {{-- ID must match fragment name or target --}}
        {{-- content --}}
    </div>
@endfragment
```

### Nested Fragments

A fragment within a fragment may not resolve correctly. Keep fragments flat — one per content area.

---

## Failure Modes

### Layout Not Loaded for Initial Request

If the initial page load uses fragment rendering (no layout), the browser never receives the layout HTML. Ensure the first request returns the full page; subsequent navigation uses fragments.

### Fragment ID Conflicts

Two fragments with the same name on the same page cause extraction conflicts. Fragment names must be unique within a view.

---

## Ecosystem Usage

Blade Fragments are deeply integrated into Laravel's ecosystem through first-party support for hotwire/Turbo and HTMX patterns. Laravel's own starter kits (Breeze and Jetstream) have adapted fragment rendering for their Turbo Drive integrations, and the community has built specialized packages like `laravel-fragmentary` that extend fragment capabilities to support nested fragments, automatic fragment detection, and response timing.

In the broader PHP ecosystem, fragment rendering aligns with the HTML-over-the-wire pattern popularized by Ruby on Rails' Turbo. Laravel's implementation stays true to this philosophy—server-rendered HTML with minimal JavaScript—while making the developer experience feel native to Blade. The `@fragment` directive and `fragment()` response method were added directly to the framework core in Laravel 12, signaling the Laravel core team's commitment to this architecture as a first-class citizen, not an aftermarket addition.

## Related Knowledge Units

- **Template Inheritance** (this workspace) — section/yield vs fragment
- **Livewire / Inertia Basics** (this workspace) — Livewire vs fragment comparison
- **Rendering Performance** (this workspace) — view rendering optimization

---

## Research Notes

- Blade Fragments were introduced in Laravel 12 (late 2025)
- The `@fragment` directive and `View::fragment()` method were added to support Turbo Drive integration
- Implementation is in `Illuminate\View\View::fragment()` and `Illuminate\View\Compilers\BladeCompiler`
- Fragment extraction uses regex on the rendered HTML string — it is NOT a compile-time optimization
- Adoption is expected to grow with Turbo Drive and HTMX usage in Laravel applications
