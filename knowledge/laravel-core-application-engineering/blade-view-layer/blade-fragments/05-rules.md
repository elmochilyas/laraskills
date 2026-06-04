## Rule: Return Full Page on First Request, Fragment on Subsequent

---

## Category

Performance

---

## Rule

Always distinguish initial page loads from subsequent Turbo/HTMX navigations. Return full-page HTML including layout on first request; return only fragment content on subsequent fragment requests.

---

## Reason

The initial page load must deliver the complete layout HTML (head, navigation, footer, scripts) to the browser. Returning only fragment content on the first request leaves the browser with unstyled, incomplete HTML. Use `$request->fragment()` or the presence of a `Turbo-Frame` header to determine fragment mode.

---

## Bad Example

```php
public function index(Request $request): View
{
    return view('users.index', ['users' => User::paginate()])
        ->fragment('user-list'); // Always returns fragment — breaks initial load
}
```

---

## Good Example

```php
public function index(Request $request): View
{
    $view = view('users.index', ['users' => User::paginate()]);

    return $request->header('Turbo-Frame')
        ? $view->fragment('user-list')
        : $view;
}
```

---

## Exceptions

Server-side rendered apps that never serve initial HTML (e.g., API-driven SPAs) do not apply. For standard Laravel apps rendering Blade, no exceptions.

---

## Consequences Of Violation

Maintenance risks: Layout rendered but never sent — wasted CPU. Reliability risks: Browser receives broken HTML without layout; page appears unstyled.

---

## Rule: Match Fragment Wrapper ID to Fragment Name

---

## Category

Design

---

## Rule

Ensure the DOM element inside a `@fragment` block has an `id` attribute that matches the fragment name or the client-side target selector used by Turbo/HTMX.

---

## Reason

Turbo and HTMX use DOM ID matching to determine which element to replace after receiving a fragment response. If the wrapper `id` does not match the fragment name or the `hx-target`, the client has no target to replace, and content updates silently fail.

---

## Bad Example

```blade
@fragment('user-list')
    <div class="users-container"> {{-- Missing id="user-list" --}}
        @foreach ($users as $user)
            <div>{{ $user->name }}</div>
        @endforeach
    </div>
@endfragment
```

---

## Good Example

```blade
@fragment('user-list')
    <div id="user-list">
        @foreach ($users as $user)
            <div>{{ $user->name }}</div>
        @endforeach
    </div>
@endfragment
```

---

## Exceptions

When using a client-side selector that targets a parent or different element via `hx-target="#other-id"`, the wrapper ID only needs to match the client target, not the fragment name.

---

## Consequences Of Violation

Reliability risks: Turbo/HTMX content replacement silently fails; users see stale content. Maintenance risks: Debugging requires inspecting both server fragments and client selectors.

---

## Rule: Do Not Nest Fragments

---

## Category

Architecture

---

## Rule

Keep `@fragment` directives flat within a template. Do not place a `@fragment` block inside another `@fragment` block.

---

## Reason

Fragment extraction uses regex on the fully rendered HTML string. Nested fragments create ambiguous extraction boundaries — the outer fragment extraction may include or exclude inner fragments unpredictably, and extraction can fail entirely.

---

## Bad Example

```blade
@fragment('dashboard')
    <div id="dashboard">
        @fragment('stats') {{-- Nested fragment — unreliable extraction --}}
            <div id="stats">{{ $stats }}</div>
        @endfragment
    </div>
@endfragment
```

---

## Good Example

```blade
@fragment('stats')
    <div id="stats">{{ $stats }}</div>
@endfragment

@fragment('dashboard')
    <div id="dashboard">
        @include('partials.stats') {{-- Include, don't nest fragment --}}
    </div>
@endfragment
```

---

## Exceptions

No common exceptions. If a page needs multiple independently updatable regions, define sibling fragments, not nested ones.

---

## Consequences Of Violation

Maintenance risks: Fragment extraction produces unpredictable results. Reliability risks: Content may be truncated, duplicated, or missing in the response.

---

## Rule: Always Serve Full-Page HTML to Bots

---

## Category

Security

---

## Rule

Detect crawler user agents with `$request->isBot()` and skip fragment responses. Return full-page HTML to all known search engine crawlers.

---

## Reason

Search engine crawlers may not send fragment-request headers and may not execute JavaScript that handles fragment responses. If a crawler receives only fragment HTML, it indexes incomplete page content, damaging SEO. Additionally, fragment responses may lack the meta tags, structured data, and link elements that crawlers expect in the full page.

---

## Bad Example

```php
public function index(Request $request): View
{
    return view('users.index', ['users' => User::paginate()])
        ->fragment('user-list'); // Bots also get fragment — SEO damage
}
```

---

## Good Example

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

---

## Exceptions

Internal tools behind authentication (not indexed by search engines) may skip bot detection. Public-facing content must always implement it.

---

## Consequences Of Violation

Scalability risks: Lost search ranking and missing content in search results. Security risks: Bots may index partial content incorrectly, potentially exposing navigation structure out of context.

---

## Rule: Cache Fragment Responses Separately from Full-Page Responses

---

## Category

Performance

---

## Rule

Use distinct cache keys for fragment responses versus full-page responses so each can have independent TTLs and invalidation strategies.

---

## Reason

Fragment content (e.g., a user list) may change more frequently than the page layout. Sharing a single cache entry forces both to use the same TTL, either serving stale fragments or invalidating the layout unnecessarily. Independent keys allow fine-grained cache control.

---

## Bad Example

```php
return Cache::remember('users:index', 3600, function () use ($request) {
    $view = view('users.index', ['users' => User::paginate()]);
    return $request->fragment()
        ? $view->fragment('user-list')->render()
        : $view->render();
}); // Single key — fragment and full share same cache
```

---

## Good Example

```php
$cacheKey = 'users:index:' . ($request->fragment() ? 'fragment:user-list' : 'full');

return Cache::remember($cacheKey, $request->fragment() ? 300 : 3600, function () use ($request) {
    $view = view('users.index', ['users' => User::paginate()]);
    return $request->fragment()
        ? $view->fragment('user-list')->render()
        : $view->render();
}); // Separate keys, different TTLs
```

---

## Exceptions

When fragment content changes at the exact same rate as the full page, a single cache key is acceptable but still not recommended for clarity.

---

## Consequences Of Violation

Performance risks: Suboptimal cache hit rates. Scalability risks: More database/processing load than necessary due to premature cache invalidation.

---

## Rule: Do Not Use Fragments for Interactive Stateful Components

---

## Category

Architecture

---

## Rule

Use Livewire or Alpine.js for interactive UI that needs to maintain client-side state (form input values, scroll position, open/closed toggles) across updates. Do not use fragments for stateful interactivity.

---

## Reason

Blade fragments are stateless — they return only rendered HTML. They do not track client-side state, manage form input values, or preserve scroll position. Fragments are a bandwidth optimization for navigation, not a state management solution. Using them for interactive state leads to broken UX and complex workarounds.

---

## Bad Example

```blade
@fragment('search-results')
    <div id="search-results">
        @foreach ($results as $result)
            <div>{{ $result->title }}</div>
        @endforeach
    </div>
@endfragment
{{-- If the user has typed in a search input, fragment replacement destroys that state --}}
```

---

## Good Example

```blade
{{-- Use Livewire for search with server state --}}
<div wire:ignore>
    <input wire:model.live="searchQuery" type="text">
    <div wire:loading>Searching...</div>
    <div>
        @foreach ($results as $result)
            <div>{{ $result->title }}</div>
        @endforeach
    </div>
</div>
```

---

## Exceptions

When fragment replacement targets a container that does not contain interactive elements (e.g., a static stats panel that only displays text), fragments are acceptable.

---

## Consequences Of Violation

Reliability risks: Form input values lost on fragment update; scroll position reset; user frustration. Maintenance risks: Complex JavaScript workarounds to preserve state across fragment replacements.

---

## Rule: Use Unique Fragment Names Per View

---

## Category

Maintainability

---

## Rule

Ensure every `@fragment('name')` within a single view uses a unique name. Never reuse the same fragment name in two separate `@fragment` blocks on the same page.

---

## Reason

When `$view->fragment('name')` is called, the framework extracts content by matching the fragment name in the rendered HTML string. Duplicate fragment names cause the extraction to match the first occurrence, silently returning only one fragment's content and dropping the other.

---

## Bad Example

```blade
@fragment('content')
    <div id="active-users">{{ $activeCount }}</div>
@endfragment

@fragment('content') {{-- Duplicate name — first match wins --}}
    <div id="total-users">{{ $totalCount }}</div>
@endfragment
```

---

## Good Example

```blade
@fragment('active-users')
    <div id="active-users">{{ $activeCount }}</div>
@endfragment

@fragment('total-users')
    <div id="total-users">{{ $totalCount }}</div>
@endfragment
```

---

## Exceptions

No common exceptions. Fragment names are a defined contract between the server and client — they must be unique per view.

---

## Consequences Of Violation

Reliability risks: Content silently missing from responses; only one of the duplicated fragments renders. Maintenance risks: Hard to detect without inspecting the rendered HTML.

---

## Rule: Do Not Use Fragments for SEO-Critical Content

---

## Category

Architecture

---

## Rule

Ensure primary page content that requires search engine indexing is rendered as part of the full-page response, not exclusively inside a fragment.

---

## Reason

Fragment responses return partial HTML that lacks the full page's meta tags, structured data, canonical URLs, and link elements. Search engine crawlers may receive incomplete content, fail to index the page correctly, or interpret the fragment as the entire page. Fragments are for navigation optimization, not content delivery.

---

## Bad Example

```php
// All content served as fragment — crawlers see incomplete HTML
public function show(Product $product): View
{
    return view('products.show', compact('product'))
        ->fragment('product-details');
}
```

---

## Good Example

```php
public function show(Product $product, Request $request): View
{
    $view = view('products.show', compact('product'));

    if ($request->fragment() && !$request->isBot()) {
        return $view->fragment('product-details');
    }

    return $view;
}
```

---

## Exceptions

Pages behind authentication that are not meant to be indexed (admin panels, user dashboards) do not require bot detection or full-page delivery.

---

## Consequences Of Violation

Scalability risks: Lost search traffic and rankings. Reliability risks: Crawlers index broken or incomplete page content.
