## Rule: Choose Islands for Content Pages

Use the Islands pattern (individual Livewire components in plain Blade) for content-heavy pages. Use full-page Livewire components for interactive pages.

---

## Category

Architecture

---

## Rule

When a page is mostly static HTML with a few interactive elements (comment sections, share widgets, search bars), embed individual Livewire components in a standard Blade view. Reserve full-page Livewire for pages where more than 50% of the content is interactive.

---

## Reason

Full-page Livewire serializes the entire component state on every request, even for static content that never changes. For a blog post with a comment section, full-page Livewire serializes the post content, author bio, and sidebar — data that is read-only and never updated — adding unnecessary payload size and rendering overhead.

---

## Bad Example

```php
// Full-page Livewire for a static blog post with a comment section
class BlogPost extends Component
{
    public Post $post; // Serialized but never changes
    public string $comment = ''; // Only interactive part
}
```

---

## Good Example

```blade
{{-- Standard Blade view with Livewire island for comments only --}}
@extends('layouts.app')

@section('content')
    <article>
        <h1>{{ $post->title }}</h1>
        <div>{{ $post->body }}</div>
    </article>
    <livewire:comments :post="$post" :key="$post->id" />
@endsection
```

---

## Exceptions

Admin panels, dashboards, and CRUD interfaces where the entire page is interactive should always use full-page Livewire for simplicity.

---

## Consequences Of Violation

Performance risks: unnecessary serialization of static content. Payload bloat: full-page state includes read-only data.

---

## Rule: Keep Islands Self-Contained

Each island component must fetch its own data and manage its own state independently.

---

## Category

Architecture

---

## Rule

Do not share state between island components. Each island receives its required data through props or fetches it independently in its `mount()` method. Cross-island communication must use `$dispatch` events, not shared props or global state.

---

## Reason

Islands are designed as independent Livewire components with separate IDs, snapshots, and checksums. They share no internal state. Attempting to share state by passing it through Blade variables or relying on the parent view creates tight coupling that breaks when one island is moved or removed.

---

## Bad Example

```blade
{{-- Blade passes the same data to both islands — coupled --}}
<livewire:chart :all-data="$data" />
<livewire:table :all-data="$data" />
```

---

## Good Example

```blade
{{-- Each island fetches or receives only what it needs --}}
<livewire:chart :dataset="$data->chart" />
<livewire:table :rows="$data->table" />
```

---

## Exceptions

If two islands genuinely need to react to each other's state, use `$dispatch` for child-to-parent communication and re-fetch in the receiving island. Never share internal state directly.

---

## Consequences Of Violation

Maintenance risks: moving an island breaks other islands. Coupling: islands cannot be independently developed or tested.

---

## Rule: Always Use :key on Island Lists

Assign a unique `:key` attribute to every island component rendered inside a loop.

---

## Category

Reliability

---

## Rule

When rendering islands in a `@foreach` or similar loop, pass a unique, stable key via the `:key` attribute: `<livewire:item :key="$item->id" />`. Do not use the loop index.

---

## Reason

Livewire uses the key to track island identity across re-renders. Without a key, or with the loop index as a key, Livewire may reassign state between islands when the list order changes (sort, filter, insert). This causes form inputs to show values from the wrong item, or toggles to appear on the wrong row.

---

## Bad Example

```blade
@foreach ($items as $index => $item)
    <livewire:todo-item :todo="$item" :key="$index" />
@endforeach
{{-- Index-based key: state corrupts when list order changes --}}
```

---

## Good Example

```blade
@foreach ($items as $item)
    <livewire:todo-item :todo="$item" :key="$item->id" />
@endforeach
{{-- Stable key: state follows the correct item --}}
```

---

## Exceptions

If the items have no unique identifier, generate one (e.g., `uniqid()` or `str()->uuid()`) during data preparation. Never use the loop index.

---

## Consequences Of Violation

Reliability risks: component state assigned to wrong item. Data integrity: form inputs show values from unrelated records.

---

## Rule: Keep Island Templates Focused

Each island's Blade template should render only the interactive portion of the UI, not the full page layout.

---

## Category

Design

---

## Rule

An island's template should not include the page shell (header, footer, sidebar). Render only the widget, form, or component that needs interactivity. The page layout belongs in the parent Blade view.

---

## Reason

Islands are embedded in a Blade layout. If an island's template also includes the page shell, the shell is rendered both in the parent Blade and inside the island, causing duplicated HTML. This bloats the response, causes CSS styling conflicts, and violates separation of concerns.

---

## Bad Example

```blade
{{-- Island template that duplicates the page layout --}}
<div>
    <x-header />  {{-- Already in the parent layout --}}
    <div class="content">
        @foreach ($comments as $comment)
            <div>{{ $comment->body }}</div>
        @endforeach
    </div>
    <x-footer />  {{-- Already in the parent layout --}}
</div>
```

---

## Good Example

```blade
{{-- Island template renders only the interactive portion --}}
<div class="comments-section">
    @foreach ($comments as $comment)
        <div>{{ $comment->body }}</div>
    @endforeach
    <input wire:model="newComment" />
    <button wire:click="addComment">Post</button>
</div>
```

---

## Exceptions

Full-page Livewire components (not islands) are responsible for the full page layout. This rule applies only to island components embedded in Blade.

---

## Consequences Of Violation

Performance risks: duplicated HTML in response. Layout issues: CSS conflicts, broken page structure.

---

## Rule: Combine Islands with Lazy Loading

Use `#[Lazy]` on island components that are below the fold or behind user interaction.

---

## Category

Performance

---

## Rule

Add the `#[Lazy]` attribute to island components that render below the fold, in tabs, inside modals, or anywhere not immediately visible on page load. Provide a `placeholder()` method with matching dimensions.

---

## Reason

Every island on a page fires a hydration request on initial load, even if it is not visible. For a page with 10 below-the-fold islands, this means 10 AJAX requests on page load. Lazy loading defers these requests until the island enters the viewport, spreading server load and improving initial page performance.

---

## Bad Example

```blade
{{-- 8 below-the-fold islands all eager-loaded on page load --}}
<livewire:chart :dataset="$data1" />
<livewire:chart :dataset="$data2" />
{{-- ... 6 more ... --}}
```

---

## Good Example

```php
#[Lazy]
class Chart extends Component
{
    public function placeholder(): View
    {
        return view('livewire.placeholders.chart');
    }
}
```

---

## Exceptions

Islands above the fold that are immediately visible should not be lazy — the user would see a placeholder instead of content.

---

## Consequences Of Violation

Performance risks: many AJAX requests on page load. User experience: slow initial page interactivity.

---

## Rule: Never Mix Livewire and Inertia on the Same Page

Do not embed a Livewire component inside an Inertia page or an Inertia page inside a Livewire component.

---

## Category

Architecture

---

## Rule

Choose one stack per route. If a route is handled by Inertia, render all interactive content through Inertia components. If it is handled by Livewire (full-page or island), render all interactive content through Livewire. Never embed one inside the other.

---

## Reason

Livewire and Inertia use incompatible DOM management strategies. Livewire manages its own section of the DOM via Alpine.js morphing. Inertia manages the full page via client-side routing and component swapping. Embedding one inside the other causes conflicting DOM updates, broken interactivity, and unpredictable behavior.

---

## Bad Example

```jsx
// Inertia page component trying to embed Livewire
export default function Dashboard({ users }) {
    return (
        <div>
            <h1>Dashboard</h1>
            {{-- This does NOT work --}}
            <livewire:stats-widget />
        </div>
    );
}
```

---

## Good Example

```
// Inertia route: /app/dashboard — pure Inertia
// Livewire route: /admin/stats — pure Livewire
// They never share a page
```

---

## Exceptions

None. This is a hard architectural constraint. If you need functionality from the other stack on the same page, refactor to use the chosen stack's equivalent feature.

---

## Consequences Of Violation

Reliability risks: conflicting DOM updates, broken interactivity. Maintenance risks: unpredictable behavior, difficult debugging.
