## Rule: Keep Alpine State Client-Only, Use Livewire for Server State

---

## Category

Architecture

---

## Rule

Use Alpine's `x-data` only for ephemeral client-side state (UI toggles, form validation, local display filters). Use Livewire for any state that must persist to the server or reflect server-side changes.

---

## Reason

Alpine `x-data` is purely client-side — it does not sync to the server. Mixing Alpine with Livewire without understanding this boundary causes confusion: Alpine changes disappear on page reload, and Livewire updates do not reflect in Alpine. Each tool has distinct responsibilities. Alpine for client behavior; Livewire for server data.

---

## Bad Example

```blade
{{-- Alpine state expected to persist --}}
<div x-data="{ cartItems: @json($cartItems) }">
    <button @click="cartItems.push({ id: 1 })">Add Item</button>
    {{-- Cart changes lost on reload; no server sync --}}
</div>
```

---

## Good Example

```blade
{{-- Alpine for UI toggle, Livewire for server data --}}
<div x-data="{ open: false }">
    <button @click="open = !open">Toggle Cart</button>
    <div x-show="open" wire:ignore>
        @livewire('cart-contents')
    </div>
</div>
```

---

## Exceptions

When fetching read-only server data via Alpine's `fetch()` and storing it only for the current page session (no persistence required), Alpine-managed server data is acceptable.

---

## Consequences Of Violation

Reliability risks: User state lost on navigation; unexpected behavior when Alpine and Livewire manage overlapping state. Maintenance risks: Developers cannot predict which tool manages which state.

---

## Rule: Add `@click.away` to Every Dropdown and Overlay

---

## Category

Design

---

## Rule

Always attach `@click.away="open = false"` to Alpine components that toggle visibility (dropdowns, modals, popovers, slideovers).

---

## Reason

A dropdown or overlay that stays open when the user clicks outside creates a poor user experience. Without `@click.away`, the user must click the toggle element again to close it, which is unintuitive. `@click.away` is the standard Alpine pattern for dismissing overlays and matches user expectations for UI behavior.

---

## Bad Example

```blade
<div x-data="{ open: false }">
    <button @click="open = !open">Menu</button>
    <div x-show="open"> {{-- Stays open on outside click --}}
        <a href="/profile">Profile</a>
    </div>
</div>
```

---

## Good Example

```blade
<div x-data="{ open: false }" @click.away="open = false" class="relative">
    <button @click="open = !open">Menu</button>
    <div x-show="open" x-transition>
        <a href="/profile">Profile</a>
    </div>
</div>
```

---

## Exceptions

Modals that require a deliberate action (confirm/cancel) before closing should not close on outside click. Use `@click.away.prevent` or omit it in those cases.

---

## Consequences Of Violation

Reliability risks: Poor UX with stacked open overlays; frustrated users. Maintenance risks: Every dropdown without `@click.away` becomes a usability bug report.

---

## Rule: Keep Alpine Components Small and Focused

---

## Category

Maintainability

---

## Rule

Limit `x-data` objects to at most 5-8 properties. Split larger state objects into separate Alpine components, each scoped to a single UI concern.

---

## Reason

Each `x-data` block is an independent state atom. Large `x-data` objects with 15+ properties indicate that the component handles too many concerns. Small components are easier to reason about, test, reuse, and debug. They also reduce initialization overhead because each component is responsible for a single interactive element.

---

## Bad Example

```blade
<div x-data="{
    open: false, selectedTab: 'info', searchQuery: '', searchResults: [],
    isLoading: false, theme: 'dark', fontSize: 14, sidebarOpen: true,
    notifications: [], unreadCount: 0, activeFilters: [], sortOrder: 'asc'
}">
    {{-- 15 properties — too many concerns --}}
</div>
```

---

## Good Example

```blade
<div x-data="{ open: false, selectedTab: 'info' }"> ... </div>

<div x-data="{
    searchQuery: '',
    searchResults: [],
    isLoading: false
}"> ... </div>

<div x-data="{ notifications: [], unreadCount: 0 }"> ... </div>
```

---

## Exceptions

Dashboard widgets that genuinely need several related properties (e.g., a rich form with validation errors, submission state, and field values) may exceed 8 properties but should still be evaluated for splitting.

---

## Consequences Of Violation

Maintenance risks: Difficult to reason about large state objects; component becomes brittle. Performance risks: Larger reactivity graph increases watch overhead.

---

## Rule: Use CSP-Compatible Alpine Loading

---

## Category

Security

---

## Rule

Use a nonce-based script loading strategy for Alpine.js when Content Security Policy restricts inline script execution. Serve Alpine with `defer` and pass a nonce attribute.

---

## Reason

Alpine uses inline event handlers (`@click`, `@submit`, etc.) that CSP treats as inline scripts. Without a nonce or `unsafe-inline` directive, CSP blocks Alpine functionality. A nonce-based approach (matching a per-request nonce in the CSP header) allows Alpine to function without relaxing CSP to `unsafe-inline`.

---

## Bad Example

```blade
{{-- No nonce — CSP blocks Alpine if inline scripts are restricted --}}
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

---

## Good Example

```blade
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"
        nonce="{{ csp_nonce() }}"></script>
```

---

## Exceptions

Applications without CSP headers, or applications using `unsafe-inline` in their CSP directive, do not need nonce-based Alpine loading.

---

## Consequences Of Violation

Security risks: CSP bypassed or weakened. Reliability risks: Alpine features silently fail when CSP blocks inline handlers, creating broken UI without obvious errors.

---

## Rule: Reinitialize Alpine After Turbo Drive Navigation

---

## Category

Reliability

---

## Rule

Listen for the `turbo:load` event and call `Alpine.initTree(document.body)` to reinitialize Alpine components after Turbo Drive page transitions.

---

## Reason

Turbo Drive replaces the DOM during navigation without a full page load. Alpine's initial DOM scan runs only on `DOMContentLoaded`, so components rendered by Turbo's new page content are not initialized. Without explicit reinitialization, all Alpine interactive elements (dropdowns, modals, toggles) stop working after navigation.

---

## Bad Example

```blade
{{-- No Turbo reinitialization --}}
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

---

## Good Example

```blade
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script>
    document.addEventListener('turbo:load', () => {
        if (window.Alpine) {
            Alpine.initTree(document.body);
        }
    });
</script>
```

---

## Exceptions

Applications not using Turbo Drive do not need this reinitialization. Livewire handles Alpine reinitialization automatically for Livewire-managed components.

---

## Consequences Of Violation

Reliability risks: Interactive UI breaks after navigation; users experience non-functional buttons and dropdowns. Maintenance risks: Bugs reported as "component X doesn't work after clicking link" without obvious cause.

---

## Rule: Avoid Expensive Operations in `x-init`

---

## Category

Performance

---

## Rule

Do not place API calls, large computations, or DOM-heavy operations directly inside `x-init`. Defer heavy work using `$nextTick` or async patterns that do not block initial rendering.

---

## Reason

`x-init` executes synchronously during component initialization. Expensive operations in `x-init` block the component's initial render, delaying the entire page's interactive readiness. The user sees a frozen or partially rendered UI until `x-init` completes. Async patterns or `$nextTick` defer heavy work until after the component is rendered.

---

## Bad Example

```blade
<div x-data="{ users: [] }"
     x-init="users = await (await fetch('/api/users')).json()">
    {{-- Blocks render until API responds --}}
</div>
```

---

## Good Example

```blade
<div x-data="{
    users: [],
    loading: true,
    async init() {
        await this.$nextTick();
        this.users = await (await fetch('/api/users')).json();
        this.loading = false;
    }
}">
    <template x-if="loading"><p>Loading...</p></template>
    <template x-for="user in users" :key="user.id">
        <div x-text="user.name"></div>
    </template>
</div>
```

---

## Exceptions

Lightweight synchronous operations (setting default values, reading `localStorage`, computing basic derived state) are acceptable in `x-init`.

---

## Consequences Of Violation

Performance risks: Page appears stuck during component initialization; slow perceived load time. Reliability risks: Long `x-init` operations may timeout or fail without user feedback.

---

## Rule: Do Not Replace Blade Logic with Alpine

---

## Category

Architecture

---

## Rule

Render page structure with Blade (`@if`, `@foreach`, `@section`), not with Alpine. Use Alpine only for client-side interactivity on top of already-rendered HTML.

---

## Reason

Blade renders on the server and is visible to search engines, works without JavaScript, and has zero client-side overhead. Alpine renders on the client — content hidden behind `x-show` or rendered by `x-for` is invisible to crawlers and requires JavaScript execution. Server-rendered structure ensures fast initial paint, SEO visibility, and graceful degradation.

---

## Bad Example

```blade
{{-- Empty container; Alpine fetches and renders everything --}}
<div x-data="{ users: [] }" x-init="users = await (await fetch('/api/users')).json()">
    <template x-for="user in users" :key="user.id">
        <div x-text="user.name"></div>
    </template>
</div>
```

---

## Good Example

```blade
{{-- Server-rendered structure; Alpine adds client-side filtering --}}
<div x-data="{ search: '' }">
    <input x-model="search" placeholder="Search users...">
    <ul>
        @foreach ($users as $user)
            <li x-show="!search || '{{ $user->name }}'.toLowerCase().includes(search.toLowerCase())">
                {{ $user->name }}
            </li>
        @endforeach
    </ul>
</div>
```

---

## Exceptions

When building a fully client-rendered widget that has no SEO requirement (e.g., an admin dashboard chart that fetches data from an internal API), Alpine-driven rendering is acceptable.

---

## Consequences Of Violation

Performance risks: Flash of empty content; slower perceived load. Scalability risks: Content invisible to search engines. Reliability risks: Page breaks if JavaScript fails to load.
