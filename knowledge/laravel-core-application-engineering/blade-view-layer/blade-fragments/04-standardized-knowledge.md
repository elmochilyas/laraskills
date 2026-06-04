# Blade Fragments

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Blade Fragments
- **Difficulty Level:** Advanced
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

Blade Fragments (Laravel 12+) enable partial re-rendering of view sections without full page reload. Using `@fragment` and `fragment()` on the response, a controller returns only a specific section of a Blade view — the surrounding layout, navigation, and other sections are omitted. Primarily used with Turbo Drive, HTMX, and Livewire for smooth page transitions.

**Engineering value:** Reducing response payload for navigation. When a user navigates within an app, only the content fragment changes. Fragments allow the server to return just the changed content, reducing bandwidth and enabling animated transitions.

---

## Core Concepts

### Fragment Definition in Blade
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
```php
class UserController
{
    public function index(Request $request): View
    {
        $users = User::paginate();

        if ($request->fragment()) {
            return view('users.index', compact('users'))
                ->fragment('user-list');
        }

        return view('users.index', compact('users'));
    }
}
```

### Fragment Request Detection
`$request->fragment()` detects whether the request expects a fragment (via `X-Inertia-Partial-Data` or `Turbo-Frame` header):
```php
$request->fragment(); // Returns fragment name or null
```

### Internal Rendering
When `$view->fragment('name')` is called:
1. The view is rendered normally (full page)
2. The `@fragment('name')` content is extracted from the rendered output via string matching
3. Only the extracted content is returned as the response

### Fragment vs Section
- `@section` is a layout inheritance concept — content from child to parent
- `@fragment` is a rendering optimization concept — content to extract from the full response

---

## When To Use

- **Turbo Drive navigation** — SPA-like navigation with server-rendered HTML
- **HTMX partial updates** — replacing a specific content area on link/form submission
- **Content-focused pages** — where layout is static and only the main content area changes
- **Pagination without full reload** — updating only the list when page changes
- **Form submission feedback** — replacing a results section without reloading the layout

---

## When NOT To Use

- **Interactive stateful components** — use Livewire or Alpine instead of fragments for client-side interactivity
- **Full-page initial load** — the first page visit should return the full layout; fragments are for subsequent navigations
- **SEO-critical content** — fragment responses are partial HTML and may not be indexed correctly
- **Complex nested fragments** — fragment within fragment may not resolve correctly
- **High server-CPU scenarios** — fragments still render the full view server-side; they only save bandwidth

---

## Best Practices (WHY)

**WHY return full page on first request, fragment on subsequent.** The initial page load must include the layout HTML. Only subsequent Turbo/HTMX navigations should return fragments. Otherwise, the browser never receives the layout.

**WHY keep fragment wrapper ID consistent with fragment name.** Turbo and HTMX use DOM ID matching to replace content. The ID on the fragment wrapper must match the fragment name or the client-side target selector.

**WHY use fragments for bandwidth optimization, not server optimization.** The full view is still rendered on the server — fragment extraction happens on the rendered HTML string. Server CPU cost is the same. The benefit is smaller network payload.

**WHY cache fragment responses separately.** Fragment responses can have different cache strategies than full pages. A user list fragment may change more frequently than the page layout. Cache them independently.

**WHY exclude bots from fragment responses.** Search engine crawlers may not follow fragment requests correctly. Always return full-page HTML to known crawler user agents.

---

## Architecture Guidelines

### Fragment vs Livewire
| Concern | Blade Fragment | Livewire |
|---|---|---|
| JavaScript requirement | Turbo/HTMX (optional) | Required (Livewire.js) |
| Server rendering | Full page, extract fragment | Component-level |
| State management | None (stateless) | Full (component state) |
| Interaction model | Navigation-driven | Event-driven |
| Complexity | Low | Medium |

### Fragment vs Inertia Partial Reload
| Concern | Blade Fragment | Inertia Partial Reload |
|---|---|---|
| Frontend stack | Server-rendered HTML | Client-rendered JS |
| Data format | HTML fragment | JSON props |
| Payload size | Larger (HTML) | Smaller (JSON) |

### Conditional Fragment Pattern
```php
public function index(Request $request): View
{
    $view = view('users.index', ['users' => User::paginate()]);

    return $request->header('Turbo-Frame')
        ? $view->fragment('content')
        : $view;
}
```

---

## Performance

| Metric | Full Page | Fragment Response |
|---|---|---|
| Server CPU | 10ms | 10ms (same — renders full view) |
| Network payload | 500KB | 50KB (10x smaller) |
| Perceived latency | 510ms | 60ms |

Fragment optimization is a **bandwidth optimization**, not a server optimization.

- Full page: CPU + network = total perceived time
- Fragment: same CPU + much less network = faster perceived time
- For server cost reduction, use view caching instead of fragments

---

## Security

- Fragment responses return partial HTML — ensure they don't expose internal data that the full page would hide via layout
- Authorization checks must still run — fragments should not bypass middleware or controller authorization
- Fragment names should not contain sensitive information that could be guessed
- Bots should always receive full-page HTML (check `$request->isBot()`)

---

## Common Mistakes

### 1. Server-side layout duplication
- **Description:** Rendering full layout AND fragment for every request
- **Cause:** Not checking `$request->fragment()` before returning fragment response
- **Consequence:** Full layout rendered and serialized, but only fragment sent — wasted CPU
- **Better:** Only render full page on initial request; use fragment for Turbo/HTMX requests

### 2. Forgetting ID attributes on fragment wrapper
- **Description:** `@fragment('user-list')` without `<div id="user-list">` inside
- **Cause:** Confusing fragment definition with DOM target
- **Consequence:** Turbo/HTMX has no target to replace; content doesn't update
- **Better:** Ensure the fragment wrapper element has a consistent ID matching the client target

### 3. Nested fragments
- **Description:** Fragment within another fragment
- **Cause:** Attempting to define sub-sections within a fragment
- **Consequence:** Extraction may fail or return wrong content
- **Better:** Keep fragments flat — one per content area per page

### 4. Full page initially rendered as fragment
- **Description:** First page load returns fragment-only content
- **Cause:** Not distinguishing between initial load and subsequent navigation
- **Consequence:** Browser never receives layout HTML; page is unstyled and empty
- **Better:** Always return full page for initial request; check for Turbo/HTMX header

### 5. Fragments used for SEO content
- **Description:** Search-result content that needs SEO indexing rendered as fragment
- **Cause:** Treating all navigation as fragment-worthy
- **Consequence:** Crawlers see empty layout or missing content
- **Better:** Use `$request->isBot()` to return full page to crawlers

---

## Anti-Patterns

- **Fragment for interactive state.** If the fragment needs to remember state between updates (form input values, scroll position), use Livewire instead.
- **Fragment-as-page-component.** A fragment should be a section of a page, not the entire page. If the whole page is one fragment, you're not saving any bandwidth.
- **Fragment name as sensitive data.** `@fragment('user-credit-card-info')` leaks information in the template source.
- **Multiple fragments with same name.** Two `@fragment('content')` on the same page cause extraction conflicts.
- **Fragment with heavy client-side dependencies.** If the fragment requires JavaScript initialization, ensure scripts are pushed separately or included in the fragment.

---

## Examples

### Turbo Drive Integration
```blade
{{-- layouts/app.blade.php --}}
<turbo-frame id="content">
    @yield('content')
</turbo-frame>
```

```php
public function index(Request $request): View
{
    return view('users.index', ['users' => User::paginate()])
        ->fragment('content');
}
```

### HTMX Integration
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

### Multiple Fragments on Same Page
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

### Bot-Aware Fragment Response
```php
public function index(Request $request): View
{
    $view = view('users.index', ['users' => User::paginate()]);

    if ($request->fragment() && !$request->isBot()) {
        return $view->fragment('user-list');
    }

    return $view;
}
```

### Cached Fragment Responses
```php
public function index(Request $request): View
{
    $cacheKey = 'users:index:'
        . ($request->fragment() ? 'fragment:' . $request->fragment() : 'full');

    return Cache::remember($cacheKey, 3600, function () use ($request) {
        $view = view('users.index', ['users' => User::paginate()]);

        return $request->fragment()
            ? $view->fragment($request->fragment())->render()
            : $view->render();
    });
}
```

---

## Related Topics

- **Template Inheritance** — section/yield vs fragment distinction
- **Livewire / Inertia Basics** — Livewire vs fragment comparison
- **Rendering Performance** — view rendering optimization
- **Component System** — component composition within fragments
- **Slots and Stacks** — pushing scripts within fragments

---

## AI Agent Notes

- Blade Fragments introduced in Laravel 12 (late 2025)
- `@fragment` directive and `View::fragment()` method added for Turbo Drive support
- Implementation in `Illuminate\View\View::fragment()` and `Illuminate\View\Compilers\BladeCompiler`
- Fragment extraction uses regex on the rendered HTML string (runtime, not compile-time)
- Adoption expected to grow with Turbo Drive and HTMX usage
- Fragments are NOT a server-side optimization — the full view is rendered each time
- For server-side partial rendering without full view render, use Livewire's lazy loading
- `$request->fragment()` returns the fragment name or null

---

## Verification

- [ ] First page load returns full HTML with layout
- [ ] Subsequent navigation requests return only fragment HTML
- [ ] Fragment wrapper element has a consistent DOM ID
- [ ] No nested `@fragment` directives exist
- [ ] Fragment names are unique within each view
- [ ] Bot requests receive full-page HTML (not fragments)
- [ ] Fragment responses are cached separately from full-page responses
- [ ] Authorization checks still run for fragment requests
- [ ] Turbo/HTMX integration correctly replaces the target element
